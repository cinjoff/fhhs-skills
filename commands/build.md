---
description: "Execute an existing plan with fresh subagents, TDD, design gates, and verification. Use when the user says 'build', 'execute the plan', 'run the plan', 'implement this', or has a PLAN.md ready to execute."
---

Execute an existing plan. Delegates task execution to subagents for optimal context usage.

What to build or which plan to execute: $ARGUMENTS

You are a **lean orchestrator**. Stay under 15% context usage. Delegate all heavy work to subagents.

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user to run `/new-project` first). Engineering disciplines (TDD, verification, review) and design quality commands are built into this plugin. See the `references/dependency-check.md` file in the same plugin directory as this command for detection details.

> **Execution pipeline — fresh subagents for tasks, specialized agents for review:**
> Task execution: **`general-purpose`** subagents with structured prompt from `references/implementer-prompt.md`. Fresh context per task, no GSD state overhead.
> Spec gates: **`code-reviewer`** agent after each wave — adversarial spec verification using `references/spec-gate-prompt.md`.
> Quality review: **`code-reviewer`** agent at end — code quality, security, architecture.
> Simplify: `skills/simplify/` after quality review — code reuse, efficiency, hygiene.
> Integration check: **`gsd-integration-checker`** background agent for multi-phase wiring.
> Phase verification: **`gsd-verifier`** agent for goal-backward verification.
> Do not use `gsd-executor` or `gsd-planner` — their state management conflicts with this orchestrator.

> **GSD project context:**
> Read `.planning/PROJECT.md`, `STATE.md`, and `ROADMAP.md` for current position. All state updates, roadmap updates, and commit helpers use `gsd-tools.cjs`.

---

## Step 1: Find the Plan

Locate the plan to execute:
- If the user specified a plan path, use that
- If a GSD project is active, check `.planning/phases/` for incomplete plans (PLAN without matching SUMMARY)
- If plans exist in `.planning/plans/`, use the most recent
- If no plan exists, tell the user to run `/plan` first

Read only the plan frontmatter and task list — don't load all context files yet.

**Resume detection:** If multiple plans exist with partial SUMMARY.md coverage (some plans have a SUMMARY.md, others don't), report: "Found N plans, M already completed. Continuing from plan X." Skip completed plans.

**Previous phase check (GSD only):** If a previous SUMMARY exists, scan for unresolved "Issues Encountered". If found, ask user: "Previous plan had unresolved issues — proceed anyway, address first, or review?"

---

## Step 2: Analyze Waves

Group tasks by their `wave` number (or dependency order if no waves specified):
- Wave 1: tasks with no dependencies (can run in parallel)
- Wave 2+: tasks that depend on earlier waves

Report the execution plan to the user: "N tasks in M waves. Wave 1 has X parallel tasks."

Record start time and check auto-mode:
```bash
PLAN_START_EPOCH=$(date +%s)
WAVE_START_SHA=$(git rev-parse HEAD)
AUTO_MODE=$(node ./.claude/get-shit-done/bin/gsd-tools.cjs config-get workflow.auto_advance 2>/dev/null || echo "false")
```

---

## Step 3: Execute Waves

For each wave, dispatch **one subagent per task** using the Task tool with **`subagent_type: "general-purpose"`** (follow `skills/dispatching-parallel-agents/` for prompt quality when dispatching parallel tasks).

### Subagent prompt

Use the structured template at `references/implementer-prompt.md`. Fill its placeholders:

- `{TASK_TEXT}` — Full task content (files, action, verify, done). Copy the text, don't reference the plan file.
- `{CLAUDE_MD_SECTIONS}` — Relevant sections from CLAUDE.md for this task type (UI work → CONVENTIONS.md + DESIGN.md; new files → STRUCTURE.md; API work → ARCHITECTURE.md; tests → TESTING.md).
- `{DESIGN_DECISIONS}` — If `.planning/phases/{phase}/{phase}-CONTEXT.md` exists, include the "Design Decisions" section. These are locked — subagents must not contradict them.
- `{DESIGN_MD_CONTENT}` — For frontend tasks only: include `.planning/DESIGN.md` content (small, ~30 lines).
- `{PHASE_DIR}` — Path to `.planning/phases/{phase}/` for deferred items logging.
- `{TASK_NAME}` — Task identifier for deferred items format.

The template includes all behavioral directives (TDD, frontend, commits, YAGNI), deviation rules 1-4, guardrails (analysis paralysis, scope boundary, deferred items), self-review checklist, and structured report format.

### Checkpoint protocol

If a task has `type="checkpoint:*"`, the subagent must STOP and return structured state:

**checkpoint:human-verify (90%)** — Visual/functional verification needed.
Return: what was built, verification steps (URLs, commands, expected behavior).

**checkpoint:decision (9%)** — Implementation choice needed.
Return: decision context, options with pros/cons.

**checkpoint:human-action (1%)** — Unavoidable manual step (auth, 2FA, email link).
Return: what was automated, single manual step needed, verification command.

Subagent return format for checkpoints:
```
CHECKPOINT REACHED
Type: [human-verify | decision | human-action]
Progress: {completed}/{total} tasks
Completed Tasks: [task | commit hash | key files] per task
Current Task: [name, status, blocker]
Checkpoint Details: [type-specific content]
Awaiting: [what user needs to do]
```

**Auto-mode** (when `AUTO_MODE` is `"true"`):
- `checkpoint:human-verify` → Auto-approve. Log `Auto-approved: [description]`. Continue.
- `checkpoint:decision` → Auto-select first option (planners front-load recommended). Log `Auto-selected: [option]`. Continue.
- `checkpoint:human-action` → Stop normally. Auth gates cannot be automated.

**Standard mode:** Present checkpoint to user, wait for response, then dispatch a **new subagent** for the next task. The continuation prompt must include:
- Completed tasks summary: task names + commit hashes (so it doesn't redo work)
- The user's checkpoint response (approval, decision choice, or confirmation of manual action)
- The next task's full content — same template format as original dispatch
- For `checkpoint:decision`: which option the user selected and why

### Authentication gates

Auth errors (401, 403, "Not authenticated", "Please run X login") are gates, not failures. Subagent must:
1. Recognize it's an auth gate
2. STOP and return as `checkpoint:human-action`
3. Provide exact auth steps (CLI commands, where to get keys)
4. Specify verification command

**For independent tasks in the same wave:** dispatch subagents in parallel.
**For sequential waves:** wait for all tasks in current wave before starting next.

### After each wave completes

1. **Spot-check:** verify key files from subagent reports exist on disk (`[ -f path ]`), check `git log` for expected commits
2. **Done criteria check:** compare each task's `done` criteria against subagent output — flag mismatches
3. **Record wave SHA:** `WAVE_END_SHA=$(git rev-parse HEAD)` — needed for spec gate
4. **Report** results to user before spec gate

(GSD state updates happen once in Step 6, not per-wave. Don't edit STATE.md during execution.)

---

## Step 3b: Per-Wave Spec Gate

**After each wave completes and passes spot-check, run a spec gate before starting the next wave.**

This catches spec deviations before dependent waves build on wrong foundations. Skip this step for the final wave (Step 8's quality review covers it).

### Dispatch spec reviewer

Use the template at `references/spec-gate-prompt.md` with **`subagent_type: "code-reviewer"`** (specialized agent). Fill placeholders:

- `{WAVE_NUMBER}` — Current wave number
- `{TASK_SPECS}` — Done criteria and key requirements for each task in the wave
- `{SUBAGENT_REPORTS}` — What each task subagent reported (from their structured reports)
- `{WAVE_START_SHA}` — SHA before wave started
- Wave diff: `git diff {WAVE_START_SHA}..{WAVE_END_SHA}`

**If wave had multiple tasks:** dispatch one spec reviewer for the entire wave (reviews the combined diff). This is faster than per-task reviewers and catches cross-task issues within the wave.

### Handle results

**PASS:** Update `WAVE_START_SHA=$WAVE_END_SHA`. Continue to next wave.

**BLOCKING:** For each blocking issue:
1. Dispatch a fix agent (`general-purpose`) with: the spec reviewer's finding + original task spec + current code
2. Fix agents for independent issues run in parallel
3. After fixes: quick re-verify (file exists, test passes, `git diff` shows the fix)
4. Do NOT re-run the full spec gate — the fix is targeted
5. Update `WAVE_START_SHA=$(git rev-parse HEAD)`. Continue to next wave.

**Report** spec gate result to user: "Wave N spec gate: PASS" or "Wave N spec gate: N issues fixed"

---

## Step 4: Design Gates + Background Integration Check

### Background integration check (multi-phase projects)

**If previous phases exist** (completed phases in `.planning/phases/`), dispatch `gsd-integration-checker` as a **background agent** before starting design gates:

- **Agent type:** `gsd-integration-checker` (specialized), `run_in_background: true`
- **Prompt:** "Check cross-phase wiring between completed phases and the current phase. Focus on: exports used, APIs called, auth protection, data flows. Provide structured report."
- **Input:** Phase SUMMARYs from completed phases + current wave commits
- Results collected after design gates complete (Step 4b)

**Skip if:** This is the first phase, or no previous phases have SUMMARYs.

### Design gates (frontend only)

**Skip if no tasks touched `.tsx`, `.css`, or component files.**

After all waves complete (including spec gates) and BEFORE self-check, run the design quality pipeline:

**Context for all design gate subagents:** If `.planning/phases/{phase}/{phase}-CONTEXT.md` exists, include its "Design Decisions" section. These are locked design choices that critique/polish/normalize must respect.

### Critique
Dispatch subagent to invoke `/critique` on modified frontend files.
Input: file list + `.planning/DESIGN.md` + anti-pattern reference from `skills/frontend-design/`.
Fix Critical and High issues. Commit: `style({phase}-{plan}): address design critique`

### Polish
Dispatch subagent to invoke `/polish` on modified files (excluding areas fixed by critique).
Commit: `style({phase}-{plan}): polish pass`

### Normalize (if design system exists)
If `.planning/DESIGN.md` defines design tokens or a component system:
Dispatch subagent to invoke `/normalize` against the design system.
Commit: `style({phase}-{plan}): normalize to design system`
Skip if no design system defined.

### Consider Harden and Animate (optional)
Suggest (don't auto-run) based on the work:
- `/harden` — if forms, user input, error states, or i18n concerns
- `/animate` — if transitions, state changes, or interaction-heavy elements
Ask user before proceeding.

Uses design quality commands (`/critique`, `/polish`, `/normalize`) and `skills/frontend-design/` — all built into this plugin.

### Step 4b: Collect integration check results

**If a background integration check was dispatched:** collect its results now. Integration findings feed into Step 8 (quality review). If critical wiring issues found (orphaned exports, broken data flows), flag to user before proceeding.

---

## Step 5: Self-Check + Generate SUMMARY.md

### Self-check

Before writing SUMMARY, verify all claims:

1. **Check created files exist:**
```bash
[ -f "path/to/file" ] && echo "FOUND" || echo "MISSING"
```

2. **Check commits exist:**
```bash
git log --oneline --all --grep="{phase}-{plan}" | head -10
```

If any checks fail, flag in SUMMARY under "Issues Encountered".

### Generate SUMMARY.md

Read `references/summary-template.md` from the fhhs-skills plugin directory for the full template (frontmatter schema, gsd-tools scaffold command, body sections).

**Commit:** `docs({phase}-{plan}): complete {description}`

---

## Step 6: GSD State Updates

**Skip this step if not in GSD mode.**

After SUMMARY.md is committed, read `references/gsd-state-updates.md` from the fhhs-skills plugin directory and run all state update commands. This covers: advance-plan, update-progress, record-metric, add-decision, record-session, and roadmap update.

---

## Step 7: Phase Completion Detection + Dual Verification

**GSD mode — use gsd-tools for completeness check:**

```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs verify phase-completeness "${PHASE_NUM}"
```

**If NOT all plans complete:** Report "Plan X of Y complete, Z remaining." Continue to Step 8.

**If ALL plans complete (phase done):** Run dual verification before proceeding.

### Goal-backward verification

**GSD mode — use gsd-tools verification suite:**

```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs verify artifacts "${PLAN_PATH}"
node ./.claude/get-shit-done/bin/gsd-tools.cjs verify key-links "${PLAN_PATH}"
```

Then manually verify:
1. For each `must_haves.truth` — find evidence (file exists, content matches, test passes)
2. Requirements coverage — every requirement ID from ROADMAP appears in at least one SUMMARY's `requirements-completed`

### Evidence-based verification

- Run fresh test suites, check exit codes
- Verify all expected artifacts exist
- Build check if applicable
- No claims without proof

### Output

Write `{phase}-VERIFICATION.md` with truth table, artifacts, key links, requirements coverage, and anti-patterns. Use `gsd-tools.cjs template fill verification` if available.

### Phase completion (GSD mode)

**If PASSED:** `gsd-tools.cjs phase complete "${PHASE_NUM}"` — atomically updates STATE.md and ROADMAP.md. "Phase verified. Ready for next phase."

**If FAILED:** Report gaps. Suggest `/plan` for closure or `/fix` for bugs.

---

## Step 8: Quality Review

After all tasks complete, dispatch a quality review. Spec compliance was already verified per-wave (Step 3b), so this review focuses on code quality and cross-task consistency.

### Dispatch quality reviewer

Use `skills/requesting-code-review/` with **`subagent_type: "code-reviewer"`** (specialized agent).

**Scope:** Full implementation diff from plan start to now.
**Skip:** Spec compliance checks (already done per-wave in spec gates).
**Focus areas:**
- Code quality: naming, structure, error handling, DRY
- Security: injection, auth bypass, data exposure
- Architecture: separation of concerns, scalability
- Test quality: tests verify behavior not mocks, edge cases covered
- Cross-task consistency: shared patterns, naming conventions, type alignment

**Integration findings:** If Step 4b produced integration check results, include them in the reviewer prompt. The quality reviewer should verify that flagged wiring issues were addressed or explain why they're acceptable.

### Handle results

Fix any Critical or Important issues from the review. Minor issues are noted but don't block.

---

## Step 8b: Simplify

After quality review fixes are applied, invoke `skills/simplify/` on the implementation diff. This catches complementary issues the quality reviewer doesn't focus on:

- **Code reuse**: newly written code that duplicates existing utilities or helpers
- **Efficiency**: redundant computations, missed concurrency, N+1 patterns, hot-path bloat
- **Code hygiene**: parameter sprawl, copy-paste with variation, stringly-typed code, unnecessary nesting

It runs 3 parallel review agents (reuse, quality, efficiency) on the git diff, then fixes issues directly. Let it run and apply fixes. Skip false positives without debate.

**Commit:** `refactor({phase}-{plan}): simplify pass`

---

## Step 9: Verify

Invoke `skills/verification-before-completion/` — follow it completely. This means:
- Run all verification commands fresh (tests, types, linter)
- Read full output, check exit codes
- Only claim completion with evidence

If this was frontend work, suggest running `/verify-ui` for visual verification.

---

## Step 10: Complete

Invoke `skills/finishing-a-development-branch/` — it handles merge/PR/keep/discard options and worktree cleanup.

**GSD completion (if GSD active):**

Update STATE.md with final session info. Keep STATE.md under 150 lines.

Route based on phase status:

| Condition | Action |
|-----------|--------|
| More plans in phase | "Plan X of Y complete." Suggest `/build` for next plan. |
| Phase complete, more phases | "Phase complete." Suggest `/plan {next}` or `/verify`. Also suggest `/revise-claude-md` to capture learnings from this phase. |
| Last phase in milestone | "Milestone complete." Run milestone completion: archive phase directories, update STATE.md and ROADMAP.md via `gsd-tools.cjs milestone complete`, and suggest `/revise-claude-md` — milestone boundaries are natural points to update project conventions. |

If user prefers to skip the branch finishing (more work planned), report what was built with links to key files.

---

## Context Budget Rules

- **Orchestrator (you):** Stay lean. Don't read source files. Don't load more than 2 `.planning/` files at a time. Delegate all file reading to subagents.
- **Task subagents:** Fresh context each. Load only what that task needs. Use `references/implementer-prompt.md` template.
- **Spec gate agents:** Get the wave diff and task specs only. Don't load full plan history.
- **Quality review agent:** Get the full implementation diff and objectives. Include integration findings if available.
- **Integration checker:** Runs in background. Gets phase SUMMARYs and source directory structure.
- **Simplify agents:** Run on the git diff only. 3 parallel agents (reuse, quality, efficiency) — lightweight, no plan context needed.
- **`.planning/DESIGN.md`** is small (~30 lines) — safe to include in every frontend subagent prompt.
- **Don't load design reference files yourself.** The skills load them when invoked by subagents.
- **Codebase docs per task type:**
  - UI work -> CONVENTIONS.md + DESIGN.md
  - New files -> STRUCTURE.md
  - API work -> ARCHITECTURE.md
  - Tests -> TESTING.md
