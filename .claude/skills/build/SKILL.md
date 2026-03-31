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
> Do not use `gsd-executor` or `gsd-planner` — their state management conflicts with this orchestrator.

> **GSD project context:**
> Read `STATE.md` and `ROADMAP.md` for current position. All state updates use `gsd-tools.cjs`.

---

## Step 0.5: Codebase Freshness Check

If `.planning/codebase/.last-mapped` exists:
```bash
MAPPED_SHA=$(cat .planning/codebase/.last-mapped 2>/dev/null)
if [ -n "$MAPPED_SHA" ]; then
  CHANGED=$(git diff --stat "$MAPPED_SHA" HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.py' '*.go' '*.rs' 2>/dev/null | tail -1)
  [ -n "$CHANGED" ] && echo "STALE: $CHANGED" || echo "FRESH"
fi
```
If STALE, warn: "Codebase mapping is outdated ($CHANGED). Consider `/fh:map-codebase` for fresh context."
If `.planning/codebase/` doesn't exist, skip silently.
Advisory only — never block.

---

## Step 1: Find the Plan

Locate the plan to execute:
- If the user specified a plan path, use that
- If a GSD project is active, check `.planning/phases/` for incomplete plans (PLAN without matching SUMMARY)
- If plans exist in `.planning/plans/`, use the most recent
- If no plan exists, tell the user to run `/fh:plan-work` first

Read only the plan frontmatter and task list — don't load all context files yet.

**Resume detection:** If multiple plans exist with partial SUMMARY.md coverage, report: "Found N plans, M already completed. Continuing from plan X." Skip completed plans.

**Previous phase check (GSD only):** If a previous SUMMARY exists, scan for unresolved "Issues Encountered". If found, ask user: "Previous plan had unresolved issues — proceed anyway, address first, or review?"

---

## Step 2: Analyze Waves

Group tasks by their `wave` number (or dependency order if no waves specified):
- Wave 1: tasks with no dependencies (can run in parallel)
- Wave 2+: tasks that depend on earlier waves

Test tasks marked `wave: same` as their implementation task run in the same wave when they test independent interfaces.

Report the execution plan to the user: "N tasks in M waves. Wave 1 has X parallel tasks."

```bash
PLAN_START_EPOCH=$(date +%s)
WAVE_START_SHA=$(git rev-parse HEAD)
AUTO_MODE=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs config-get workflow.auto_advance 2>/dev/null || echo "false")
```

If `AUTO_MODE` is `"true"` AND `.planning/DECISIONS.md` exists, include the last 10 entries for this phase as `{DECISIONS_CONTEXT}`. Otherwise empty string.

### Smart Context Loading

If claude-mem is available (check tool list for `mcp__plugin_claude-mem_*`), use smart_search to find relevant patterns before reading files. Use smart_outline to understand file structure before editing. Don't read full files to find one function — use smart_outline then smart_unfold, then Read only when you need to Edit.

Specifically before wave execution:
1. `smart_search({query: "patterns in <primary module>"})` to find existing conventions
2. `smart_outline({path: "<plan target files>"})` to understand structure without full reads
3. `smart_search({query: "locked decisions for <phase>"})` to retrieve phase context compactly

If claude-mem is not available, fall back to Read/Grep/Glob directly — read the planning docs and source files as needed. Zero behavioral change for systems without claude-mem.

### Reference Warm-Up (once per build)

Shared references are static between updates — read them once here and inject into all subagent prompts. This eliminates N redundant reads per build (N = number of tasks).

**If context-mode is available** (`mcp__plugin_context-mode_context-mode__ctx_batch_execute`):
```
ctx_batch_execute({
  commands: [
    "cat .claude/skills/shared/testing-guide.md",
    "cat .claude/skills/shared/claude-mem-rules.md"
  ]
})
```
Then use `ctx_search({queries: ["TDD red-green-refactor", "Playwright E2E locator"]})` to extract task-relevant sections. Store results as `SHARED_REFERENCES_CACHE`.

**If context-mode is not available**: Read both files via the Read tool. Store full content as `SHARED_REFERENCES_CACHE`.

**If both fail**: Leave `SHARED_REFERENCES_CACHE` empty — subagents will read files directly (graceful degradation).

Inject `SHARED_REFERENCES_CACHE` into each subagent prompt via the `{SHARED_REFERENCES}` placeholder in the implementer-prompt. For task-specific filtering:
- Tasks with `tdd="true"`: include Part B (TDD Discipline) + Part C (Stack Defaults)
- Tasks with E2E/Playwright scope: include Part D (Playwright) + Part C
- All other tasks: include Part A (Philosophy) + Part C only

---

## Step 2.5: Test-Spec Generation

Resolve the execution model (needed for both this step and Step 3):

```bash
EXEC_MODEL=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs resolve-model gsd-executor --raw)
```

If the plan has `must_haves.truths` and at least one task modifies `.ts`, `.tsx`, `.js`, `.jsx` files (excluding config-only, types-only, or constants-only files):

Dispatch a **test-spec subagent** (`general-purpose`, model `$EXEC_MODEL`) **before Wave 1 begins**. This agent writes test skeletons from the plan specification — it has NOT seen the implementation code. Wave 1 subagents will find these test files already on disk and can implement code to make them pass.

**Subagent prompt:**
```
You are writing test skeletons from a plan specification. You have NOT seen the implementation.

Read `.claude/skills/shared/testing-guide.md` for testing rules.

## Spec
Must-haves: {PLAN_MUST_HAVES}
Task acceptance criteria: {PLAN_DONE_CRITERIA}
Error cases: {ERROR_RESCUE_MAP_IF_AVAILABLE}

## Instructions
1. For each must_haves.truth → write 1-3 behavioral test cases
2. For each task's done criteria → write the test proving it
3. For error/rescue entries → write failure-path tests
4. Write to `__tests__/` or `tests/` matching project convention
5. Use Vitest + @testing-library/react for components. Playwright for E2E.
6. Use `getByRole` > `getByLabel` > `getByTestId` for selectors
7. Mark tests needing implementation with `it.todo()` if API is unclear
8. DO NOT import from files that don't exist yet — use expected paths from the plan

Report: test files created, test count, which must_haves.truths are covered.
```

Wait for this subagent to complete before dispatching Wave 1. This ensures implementation subagents see pre-existing test skeletons and can implement to pass them — orchestration-level TDD.

Skip if: no `must_haves.truths`, all tasks are config/docs only, or plan has fewer than 2 tasks.

---

## Step 3: Execute Waves

Use `$EXEC_MODEL` resolved in Step 2.5 (or resolve here if Step 2.5 was skipped):

```bash
[ -z "$EXEC_MODEL" ] && EXEC_MODEL=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs resolve-model gsd-executor --raw)
```

For each wave, dispatch **one subagent per task** using the Agent tool with **`subagent_type: "general-purpose"`** and **`model: "$EXEC_MODEL"`** (use the resolved value, e.g. `"sonnet"` or `"opus"`).

**Task tracking (optional):** On first dispatch, try `TaskCreate` for the task. If it works, update status on dispatch (`in_progress`) and completion (`completed`). If TaskCreate fails, skip all tracking silently.

### Subagent prompt

Use the structured template at `references/implementer-prompt.md`. Fill its placeholders:

- `{TASK_TEXT}` — Full task content (files, action, verify, done). Copy the text, don't reference the plan file.
- `{CLAUDE_MD_SECTIONS}` — Relevant sections from CLAUDE.md for this task type, plus `.planning/codebase/CODEBASE.md` sections (fall back to individual files in `.planning/codebase/` if CODEBASE.md doesn't exist) (UI work → Conventions + Design; new files → Structure guidance; API work → Architecture patterns).
- `{DESIGN_DECISIONS}` — If `.planning/phases/{phase}/{phase}-CONTEXT.md` exists, include the "Decisions", "Discretion Areas", and "Deferred Ideas" sections.
- `{PHASE_DIR}` — Path to `.planning/phases/{phase}/` for deferred items logging.
- `{PHASE_NAME}` — Phase directory name for smart_search queries (e.g. "13-pending-payments-invoicing").
- `{FILE_TYPES}` — Comma-separated file type descriptions for convention queries (e.g. "tsx components", "test files").
- `{TASK_NAME}` — Task identifier for deferred items format.
- `{TASK_ID}` — Native task ID if tracking is active. Empty string otherwise.
- `{PROJECT_CONSTRAINTS}` — See population rule below.
- `{SHARED_REFERENCES}` — Pre-loaded testing/TDD rules from `SHARED_REFERENCES_CACHE` (populated in Reference Warm-Up). Task-filtered: TDD tasks get Part B, E2E tasks get Part D, all get Part A + C. If empty, subagent reads files directly.

**{PROJECT_CONSTRAINTS} population:**
Read the `## Gotchas` section from `./CLAUDE.md`. Extract each gotcha as an imperative constraint:
- Convert "X renamed Y to Z" → "Use Z, not Y"
- Convert "X are async" → "Always await X"
- Convert "X uses TEXT IDs" → "All FKs to X tables must be TEXT, never UUID"
Inject as `{PROJECT_CONSTRAINTS}`. Max 15 lines.
If no Gotchas section exists, leave {PROJECT_CONSTRAINTS} empty (do not error).

### claude-mem Context Acceleration

Before reading CONTEXT.md and DECISIONS.md files directly, check if claude-mem is available (tool list contains `mcp__plugin_claude-mem_*`):
- If available: use `smart_search({query: "locked decisions for phase {phase}"})` and `smart_search({query: "decisions affecting {files}"})` to find relevant entries. Use `smart_outline` to understand file structure before editing. Don't read full files to find one function — use `smart_outline` → `smart_unfold`, then Read only when you need to Edit.
- If not available: fall back to Read/Grep/Glob directly — skills work identically without claude-mem.

The template tells subagents to self-discover relevant skill context (Playwright, Next.js, frontend design) by reading skill files when their task involves those domains. No orchestrator pre-processing needed.

### Token Efficiency Notes

When executing tasks, be aware of tool call efficiency:
- **Default to Smart Explore** (smart_search/smart_outline/smart_unfold) for targeted lookups; escalate to Explore Agent only for open-ended synthesis
- **Avoid re-reading** files already in context from earlier steps (freshness check, plan read, CONTEXT.md injection)
- **Fallow output is authoritative** — do not re-derive dead code, complexity, or duplication findings that Fallow already provided
- **Note tool call patterns:** If you find yourself reading the same file multiple times across tasks, flag it as a context optimization opportunity in the SUMMARY.md

### Checkpoint protocol

If a task has `type="checkpoint:*"`, handle inline:

- `checkpoint:human-verify` — Show the subagent's output (screenshot/command output), await user approval. In auto-mode: auto-approve (confidence=MEDIUM).
- `checkpoint:decision` — Present options with pros/cons, await user choice. In auto-mode: auto-select first option (confidence=MEDIUM).
- `checkpoint:human-action` — Describe the manual step needed, await confirmation. In auto-mode: STOP (auth gates cannot be automated).

When auto-approving checkpoints, log as a decision in `.planning/DECISIONS.md` with `confidence=MEDIUM`, `step='build checkpoint'`. Follow format from `references/decisions-template.md`.

### After each wave completes

### Post-Wave Context

claude-mem's PostToolUse hook automatically observes all file reads and edits from each wave's agents. Subsequent waves can query these observations via `search` or `timeline` — no explicit re-indexing needed.

Triage subagent outcomes:

**BLOCKED:** Surface immediately:
```
⚠ Task "{task}" is BLOCKED: {blocker}
Options:
  A) Fix the blocker and retry
  B) Skip and defer
  C) Adjust the plan
```
Do not proceed to the next wave until resolved or skipped.

**Interrupted/stuck:** Re-dispatch with revised prompt or clarify with user.

**Silent failure (no files changed):** Treat as BLOCKED.

Once all tasks are accounted for:
1. **Spot-check:** verify key files from subagent reports exist on disk (`[ -f path ]`)
2. **Done criteria check:** compare each task's `done` criteria against subagent output — flag mismatches
3. **Report** results to user

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

### Generate SUMMARY.md

Read `references/summary-template.md` for the template. Write SUMMARY.md. Commit: `docs({phase}-{plan}): complete {description}`

### Concerns Review (after SUMMARY.md)

If `.planning/codebase/CONCERNS.md` exists, do a quick scan:
1. Read CONCERNS.md categories and items
2. Check if this build addressed any listed concerns (compare files modified against concern file paths)
3. If a concern was addressed: add a note to SUMMARY.md under "Concerns Addressed" with the concern title and what was done
4. If this build introduced patterns matching known concern categories (new tech debt, missing tests, security gaps): note in SUMMARY.md under "New Concerns" as advisory
5. If CONCERNS.md is stale (`.last-mapped` > 50 commits behind HEAD): note in SUMMARY.md: "Codebase concerns may be outdated — consider `/fh:map-codebase`"

This is advisory only — never block completion. Budget: <1% context.

### Learnings Digest (after SUMMARY.md)

If claude-mem is available, generate a learnings digest:
1. Derive project name from `.planning/PROJECT.md` name field (fall back to basename of cwd). Use this as the `project` parameter for all claude-mem calls.
2. Call `mcp__plugin_claude-mem_mcp-search__timeline` with query=current phase name, depth_before=5, project=<project-name>
3. Call `mcp__plugin_claude-mem_mcp-search__search` with query=current phase name, project=<project-name>, limit=10
4. From the search results, identify observation IDs matching improvement themes. For the top 3-5 relevant IDs, call `mcp__plugin_claude-mem_mcp-search__get_observations` with ids=[ID1, ID2, ...] to fetch full details before merging into the digest.
5. Read existing `~/.claude/cache/learnings-digest.json` if present
6. Merge observations into digest using this deterministic algorithm:
   a. Load existing digest items (empty array if no file or corrupt)
   b. For each new observation, check if it matches improvement themes (keywords: mistake, pitfall, learning, retro, regression, "should have", "next time", bug, broke, failed):
      - If no theme match → skip
      - If an existing item's summary shares 2+ significant words (excluding stopwords) → bump that item's times_seen
      - Else → create new item with id="imp-{timestamp}", times_seen=1, priority="low", first_seen=today
   c. Priority escalation: times_seen >= 3 → "medium", times_seen >= 5 → "high" (never downgrade)
   d. Items addressed by this build session (if the build's work matches an item's suggested_action) → mark addressed=true, addressed_at=ISO timestamp
   e. Compute stats: scanned = total observations checked, pending = items where addressed is falsy, addressed_since_last = items addressed in this merge
7. Write updated digest to `~/.claude/cache/learnings-digest.json`
8. Skip silently if claude-mem not installed or any MCP call fails

Digest schema: `{ generated: ISO string, generated_by: "build"|"context-critical", project: cwd path, phase: current phase name, items: [{ id: string, priority: "low"|"medium"|"high", category: "retro"|"pattern"|"theme", summary: string, detail: string, suggested_action: string, times_seen: number, first_seen: ISO string, addressed: boolean, addressed_at?: ISO string }], stats: { scanned: number, pending: number, addressed_since_last: number } }`

Budget: <2% context for this substep.

---

## Step 5: GSD State Updates

**Skip if not in GSD mode.**

Read `references/gsd-state-updates.md` and run the batch state update command. This covers: advance-plan, update-progress, record-metric, add-decision, record-session, and roadmap update.

These run once at plan completion. No state writes during wave execution.

Resolve via `node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs resolve-model gsd-codebase-mapper --raw` — mechanical state updates don't require deep reasoning.

---

## Step 6: Phase Completion Detection

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs verify phase-completeness "${PHASE_NUM}"
```

**If NOT all plans complete:** Report "Plan X of Y complete, Z remaining." Suggest `/fh:build` for next plan. Done.

**If ALL plans complete (phase done):** Run completion gates.

### Gate 0: Integration Check (runs before goal verification)

Run fallow-based impact analysis on all files modified across the phase:

1. Collect all files from `files_modified` across all phase plans
2. Run `timeout 30 fallow dead-code --format json --quiet` and `timeout 30 fallow health --file-scores --format json --quiet`
3. Classify blast radius per file using fan_in thresholds:
   - fan_in >= 10 → CRITICAL (deep analysis)
   - fan_in >= 5 → HIGH (review)
   - fan_in >= 2 → MEDIUM (note)
   - fan_in < 2 → LOW (skip)
   For each CRITICAL/HIGH file:
   - Extract all downstream files from fallow's referenced_by
   - Check: are downstream files tested? (grep for test files importing them)
   - If `.planning/codebase/FLOWS.md` exists and does not contain `empty: true`, grep for affected flows
4. If any CRITICAL file has untested downstream consumers, WARN (do not block)

If fallow is not installed or times out (30s), skip Gate 0 with warning: "fallow unavailable, skipping integration check".
If fallow JSON is malformed, skip with warning: "fallow output unparseable, skipping integration check".

### Gate 1 + Gate 2 (parallel)

Dispatch in parallel:

**Gate 1: Goal Verification**
- For each `must_haves.truth` across all phase plans: find evidence (file exists, content matches, test passes)
- Run `gsd-tools verify artifacts` and `gsd-tools verify key-links` for each plan
- Requirements coverage: every requirement ID from ROADMAP in any plan's `requirements` must appear in at least one SUMMARY

**Gate 1.5: Security Review (phase completion only)**

Dispatch a `code-reviewer` agent with:
- The production-safety-checklist from `.claude/skills/review/references/production-safety-checklist.md`
- The full phase diff: `git diff $(git log --oneline --reverse --since="$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs config-get state.phase_started_at 2>/dev/null || echo '30 days ago')" | head -1 | cut -d' ' -f1)..HEAD`
- Focus: OWASP top 10, input validation, auth bypass, XSS, SQL injection, secrets exposure
- Severity: CRITICAL findings block. HIGH findings warn. MEDIUM/LOW pass with notes.

This gate runs ONLY at phase completion (when all plans in the phase are done), not per-plan.
If production-safety-checklist is not found, skip with warning.

**Gate 2: Design Quality Gates (visual work only)**
- Read `.planning/DESIGN.MD` and `.planning/PROJECT.MD` for design context (skip if missing)
- Calculate visual file ratio across ALL phase plans (`.tsx`, `.css`, `.html`, `.svg` files / total files)
- If visual ratio > 30% OR phase targets UI:
  - **Round 1 (parallel):** `/fh:ui-critique` + `/fh:harden`. Fix Critical/High. Commit: `fix({phase}): critique + harden`
  - **Round 2 (parallel):** `/fh:polish` + `/fh:adapt`. Fix Critical/High. Commit: `fix({phase}): polish + adapt`
  - **Round 3:** `/fh:normalize` if design system defined. Commit: `fix({phase}): normalize`
- If visual ratio ≤ 30% and phase doesn't target UI, skip.

### Gate 3: Final Verification

Uses Step 4's verification results if from the same session. Only re-runs if Gate 2 made changes (design fixes could break tests).

**Architecture artifact refresh:**
If `.planning/codebase/FLOWS.md` exists:
- Collect all `files:` entries from flow-meta YAML comments
- Intersect with files modified in this phase (from all plan files_modified)
- If intersection is non-empty: invoke `/fh:map-codebase` scoped to the affected flow sections only. Preserve unaffected sections.
- Validate all flow-meta file references still exist via `stat`
- If a referenced file was deleted, remove it from the flow and flag in report
- If flow-meta YAML is unparseable, regenerate that section from scratch with warning

If any plan in the phase included migration files (supabase/migrations/ or discovered migration path):
- Regenerate `.planning/codebase/ERD.md` from current migration SQL

If fallow is not available, skip fallow-dependent operations (import graph analysis) with warning but continue with:
- FLOWS.md file-reference validation via `stat` (no fallow needed)
- ERD.md regeneration from migration SQL (no fallow needed)
If FLOWS.md contains `empty: true`, skip flow cross-reference entirely.
Timeout: 30s per fallow operation.

Write `VERIFICATION.md` in the phase directory with test/build/lint results and must-haves coverage.

If any gate fails, stop and report to user.

**Only after all gates pass:**

`gsd-tools.cjs phase complete "${PHASE_NUM}"` — atomically updates STATE.md and ROADMAP.md.

---

## Step 7: Report + Route

Report what was built:
- Tasks completed, key files created/modified
- Verification results

Route based on phase status:

| Condition | Action |
|-----------|--------|
| More plans in phase | "Plan X of Y complete." Suggest `/fh:build` for next plan. |
| Phase complete, more phases | "Phase complete." Suggest `/fh:plan-work {next}` or `/fh:review`. Also suggest `/fh:learnings --update-claude-md`. |
| Last phase in milestone | "Milestone complete." Run `gsd-tools.cjs milestone complete`. Suggest `/fh:learnings --update-claude-md`. |

Suggest `/fh:review` for deeper scrutiny (adds spec verification + gap analysis).
If frontend changes: suggest `/fh:ui-test` for visual verification.

If claude-mem is installed (check: the Learnings Digest substep in Step 4 ran successfully), add to the phase-complete and milestone-complete routes:

> Run `/fh:learnings` to surface patterns from your recent work and find improvement opportunities.

This nudge only appears when:
1. A phase or milestone just completed (not per-plan completions)
2. claude-mem is available

---

## Context Budget Rules

- **Orchestrator (you):** Stay lean. Don't read source files. Don't load more than 2 `.planning/` files at a time. Delegate all file reading to subagents.
- **Task subagents (Sonnet):** Fresh context each. Load only what that task needs.
- **GSD state updates (Haiku):** Mechanical commands only.

---

## Context Pressure Priority

If context is running low, prioritize in this order:

Step 3 (execute waves) > Step 4 (commit + verify + SUMMARY) > Step 6 (phase completion) > Step 5 (GSD state).

Never skip Step 3 or Step 4.
