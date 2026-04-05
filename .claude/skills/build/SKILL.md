---
name: fh:build
description: Execute a plan — turns your PLAN.md into working code with tests and quality checks.
user-invocable: true
---

Execute an existing plan. Delegates task execution to subagents for optimal context usage.

What to build or which plan to execute: $ARGUMENTS

You are a **lean orchestrator**. Stay under 15% context usage. Delegate all heavy work to subagents.

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user: "No project found.

→ Run /fh:new-project — set up project tracking before building").
> If no unexecuted plan exists in the current phase, tell user: "No plan to execute.

→ Run /fh:plan-work — create a plan first".

> **Execution pipeline:**
> Task execution: **`general-purpose`** subagents using `references/implementer-prompt.md`. Model is resolved from config via `gsd-tools resolve-model gsd-executor --raw`. Fresh context per task.
> Subagents write code but do NOT commit. Orchestrator makes one commit per plan after all waves complete.
> Do not use `fh:gsd-executor` or `fh:gsd-planner` — their state management conflicts with this orchestrator.

> **GSD project context:**
> Read `STATE.md` and `ROADMAP.md` for current position. All state updates use `gsd-tools.cjs`.
> For context ordering in subagent prompts, see @.claude/skills/shared/context-api-contract.md.

---

## Step 0.5: Codebase Freshness Check

See @.claude/skills/shared/freshness-check.md

---

## Step 1: Find the Plan

Resolve artifacts per @.claude/skills/shared/artifact-resolution.md

- If the user specified a plan path, use that directly
- Otherwise follow the resolution chain (claude-mem → STATE.md → phase dir → plans/)
- If no plan exists, tell the user to run `/fh:plan-work` first

Read only the plan frontmatter and task list — don't load all context files yet.

**Resume detection:** If multiple plans exist with partial SUMMARY.md coverage, report: "Found N plans, M already completed. Continuing from plan X." Skip completed plans.

**Task-level resume:** After identifying the plan, check `.planning/build/` for `task-{plan}-*-state.md` files per @references/task-state-protocol.md (Resume Protocol). `completed` tasks are skipped; `in-progress` tasks revert to `pending`; `failed` tasks with 2+ attempts surface to user before proceeding.

**Previous phase check (GSD only):** If a previous SUMMARY exists, scan for unresolved "Issues Encountered". If found, ask user: "Previous plan had unresolved issues — proceed anyway, address first, or review?"

---

## Step 2: Analyze Waves

Group tasks by their `wave` number (or dependency order if no waves specified):
- Wave 1: tasks with no dependencies (can run in parallel)
- Wave 2+: tasks that depend on earlier waves

Test tasks marked `wave: same` as their implementation task run in the same wave when they test independent interfaces.

Report the execution plan to the user: "N tasks in M waves. Wave 1 has X parallel tasks."

Ensure GSD CLI symlink per @.claude/skills/shared/gsd-symlink-heal.md, then:

```bash
PLAN_START_EPOCH=$(date +%s)
WAVE_START_SHA=$(git rev-parse HEAD)
AUTO_MODE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
```

If `AUTO_MODE` is `"true"` AND `.planning/DECISIONS.md` exists, include the last 10 entries for this phase as `{DECISIONS_CONTEXT}`. Otherwise empty string.

See @references/wave-execution.md for Smart Context Loading, Reference Warm-Up, subagent prompt placeholders, token efficiency notes, post-wave triage, and pre-wave dependency checks.

---

## Step 2.5: Test-Spec Generation

Resolve the execution model (needed for both this step and Step 3):

```bash
EXEC_MODEL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-executor --raw)
```

Follow @references/test-spec-generation.md

---

## Step 3: Execute Waves

Use `$EXEC_MODEL` resolved in Step 2.5 (or resolve here if Step 2.5 was skipped):

```bash
[ -z "$EXEC_MODEL" ] && EXEC_MODEL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-executor --raw)
```

**Before dispatching each task:** Create a state file `.planning/build/task-{plan}-{task-id}-state.md` with `status: pending` per @references/task-state-protocol.md. Update to `in-progress` on dispatch, `completed` or `failed` on result.

For each wave, dispatch **one subagent per task** using the Agent tool with **`subagent_type: "general-purpose"`** and **`model: "$EXEC_MODEL"`** (use the resolved value, e.g. `"sonnet"` or `"opus"`).

### Subagent prompt

Use the structured template at `references/implementer-prompt.md`. Fill placeholders per @references/wave-execution.md (Subagent Prompt Placeholders section).

**SPEC.md enrichment (before dispatching each task):**

1. Check if the plan frontmatter has a `spec:` field pointing to a SPEC.md path.
2. If SPEC.md exists: use `smart_unfold` (if claude-mem available) to extract sections relevant to the task domain — Architecture, Failure Modes, Quality Rubrics, Data Flow. Map to placeholders: `{SPEC_ARCHITECTURE}`, `{SPEC_FAILURE_MODES}`, `{SPEC_QUALITY_RUBRICS}`, `{SPEC_DATA_FLOW}`.
3. Query claude-mem for past mistakes in the task domain: `smart_search({query: "past mistakes {task_domain} build-learning"})`. Populate `{PAST_LEARNINGS}`.
4. If `.planning/DECISIONS.md` exists, extract entries affecting this task's files. Populate `{DECISION_RATIONALE}`.
5. If no SPEC.md exists or claude-mem is unavailable: leave these placeholders empty — the implementer-prompt guards ("If empty, skip this section") ensure graceful degradation.

### Checkpoint protocol

If a task has `type="checkpoint:*"`, handle inline:

- `checkpoint:human-verify` — Show the subagent's output (screenshot/command output), await user approval. In auto-mode: auto-approve (confidence=MEDIUM).
- `checkpoint:decision` — Present options with pros/cons, await user choice. In auto-mode: auto-select first option (confidence=MEDIUM).
- `checkpoint:human-action` — Describe the manual step needed, await confirmation. In auto-mode: STOP (auth gates cannot be automated).

When auto-approving checkpoints, log as a decision in `.planning/DECISIONS.md` with `confidence=MEDIUM`, `step='build checkpoint'`. Follow format from `references/decisions-template.md`.

### After each wave completes

**Quality gate:** Run structural checks per @references/quality-gate.md.
- PASS → proceed to next wave
- WARN → proceed, note in SUMMARY.md "Quality Warnings"
- FAIL → adaptive response per quality-gate.md (retry single task, stop for architectural or multiple failures)

Follow post-wave triage and pre-wave dependency check from @references/wave-execution.md

---

## Step 4: Commit + Verify + SUMMARY

### Single commit

After all waves complete, stage all changed files and make **one commit** for the entire plan:

```
{type}({phase}-{plan}): {description}
```

Stage files individually — never `git add .`. The commit type is usually `feat` or `refactor` based on the plan's objective.

### Verification

Run verification commands directly:

1. **Test suite:** `npm test` (or the project's test command from package.json or CLAUDE.md)
2. **Build check:** `npm run build` (if the project has a build step)
3. **Lint:** `npm run lint` (if the project has a linter)
4. **Coverage report** (if Vitest/Jest config exists): `pnpm test --run --coverage 2>/dev/null || npx vitest run --coverage 2>/dev/null`
   Parse output for line/branch percentages. Include in SUMMARY.md `test_metrics` frontmatter.
   If coverage isn't configured or command fails, skip with note "Coverage not configured — consider adding vitest coverage."
5. **Spec test count:** If Step 2.5 ran, capture the test-spec subagent's reported test count as `spec_tests_count` in `test_metrics`. If Step 2.5 was skipped, set to 0.
6. **Test creation check:** If the plan included tasks with `tdd="true"` or companion test tasks, verify at least one `*.test.*` or `*.spec.*` file was created or modified in this build (check via `git diff --name-only $WAVE_START_SHA HEAD`). If none found: WARN "Plan required tests but no test files were created — check subagent reports for UNTESTED flags."

If any fail: flag in SUMMARY under "Issues Encountered". Do NOT claim success if verification failed.

### Post-Build Reflection

Run complexity-gated reflection per @references/reflection-protocol.md.

Evaluate complexity after all waves complete (before generating SUMMARY.md):
- **Simple** (≤3 tasks, no cross-cutting concerns): skip reflection entirely.
- **Medium** (4-7 tasks): light reflection — answer 3 questions, write 1-2 `[reflection-learning]` observations.
- **Complex** (8+ tasks, OR architectural, OR cross-phase): dispatch the reflector agent per `@references/reflector-agent.md` with SUMMARY path, SPEC path, diff range, and task list.

Append the `## Reflection` section to SUMMARY.md (medium/complex tiers only).

### Generate SUMMARY.md

Read `references/summary-template.md` for the template. Write SUMMARY.md (include `## Reflection` if produced above). Commit: `docs({phase}-{plan}): complete {description}`

**Archive task state files** (after SUMMARY.md commit) per @references/task-state-protocol.md (Cleanup):
```bash
mkdir -p .planning/build/archive && mv .planning/build/task-{plan}-*-state.md .planning/build/archive/ 2>/dev/null || true
```

### Concerns Review (after SUMMARY.md)

If `.planning/codebase/CONCERNS.md` exists, do a quick scan:
1. Read CONCERNS.md categories and items
2. Check if this build addressed any listed concerns (compare files modified against concern file paths)
3. If a concern was addressed: add a note to SUMMARY.md under "Concerns Addressed" with the concern title and what was done
4. If this build introduced patterns matching known concern categories (new tech debt, missing tests, security gaps): note in SUMMARY.md under "New Concerns" as advisory
5. If CONCERNS.md is stale (`.last-mapped` > 50 commits behind HEAD): note in SUMMARY.md: "Codebase concerns may be outdated — consider `/fh:map-codebase`"

This is advisory only — never block completion. Budget: <1% context.

### Post-build drift check (advisory)

If claude-mem is available and `.planning/codebase/` exists:
1. `smart_search({query: "new pattern convention not documented"})` across recent observations
2. If 3+ drift signals found since last mapping:
   - Log: "⚠️ Codebase mapping may be stale — {N} convention changes detected since last map. Consider `/fh:map-codebase --refresh-stale`"
3. Never auto-run mapping — just advise. User decides when to spend the tokens.

### Persist Findings (after SUMMARY.md)

Follow **Pattern D** (Persist Findings) from `shared/claude-mem-rules.md`. Use tag `[build-learning]`. Focus on: architectural decisions made during implementation, trade-offs chosen, patterns that worked or didn't.

---

## Step 5: GSD State Updates

**Skip if not in GSD mode.**

Read `references/gsd-state-updates.md` and run the batch state update command. This covers: advance-plan, update-progress, record-metric, add-decision, record-session, and roadmap update.

These run once at plan completion. No state writes during wave execution. Use `gsd-codebase-mapper` model for mechanical state updates.

---

## Step 6: Phase Completion Detection

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify phase-completeness "${PHASE_NUM}"
```

**If NOT all plans complete:** Report "Plan X of Y complete, Z remaining." Suggest `/fh:build` for next plan. Done.

**If ALL plans complete (phase done):** Run phase completion gates per @references/phase-completion-gates.md

---

## Step 7: Report + Route

Report what was built:
- Tasks completed, key files created/modified
- Verification results

Route based on phase status:

| Condition | Action |
|-----------|--------|
| More plans in phase | "Plan X of Y complete." Suggest `/fh:build` for next plan. |
| Phase complete, more phases | "Phase complete." Suggest `/fh:plan-work {next}` or `/fh:review`. Also suggest `/fh:learnings`. |
| Last phase in milestone | "Milestone complete." Run `gsd-tools.cjs milestone complete`. Suggest `/fh:learnings`. |

Run `/fh:review` for quality refinement. If claude-mem available and phase/milestone just completed, suggest `/fh:learnings`.

---

## Context Budget Rules

- **Orchestrator (you):** Stay lean. Don't read source files. Don't load more than 2 `.planning/` files at a time. Delegate all file reading to subagents.
- **Task subagents (Sonnet):** Fresh context each. Load only what that task needs.
- **GSD state updates (Haiku):** Mechanical commands only.

---

## Context Pressure Priority

If context is running low: Step 3 > Step 4 > Step 6 > Step 5. Never skip Step 3 or Step 4.
