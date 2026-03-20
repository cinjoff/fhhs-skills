---
name: build
description: Execute an existing plan with fresh subagents, TDD, design gates, and verification. Use when the user says 'build', 'execute the plan', 'run the plan', 'implement this', or has a PLAN.md ready to execute.
user-invokable: true
---

Execute an existing plan. Delegates task execution to subagents for optimal context usage.

What to build or which plan to execute: $ARGUMENTS

You are a **lean orchestrator**. Stay under 15% context usage. Delegate all heavy work to subagents.

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user to run `/fh:new-project` first). Engineering disciplines (TDD, verification, review) and design quality commands are built into this plugin.

> **Execution pipeline — fresh subagents for tasks, specialized agents for review:**
> Task execution: **`general-purpose`** subagents with structured prompt from `references/implementer-prompt.md` (co-located with this skill). Fresh context per task, no GSD state overhead.
> Spec gates: **`code-reviewer`** agent after each wave — adversarial spec verification using `references/spec-gate-prompt.md` (co-located with this skill).
> Simplify: `skills/simplify/` after all waves — code reuse, efficiency, hygiene.
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
- If no plan exists, tell the user to run `/plan-work` first

Read only the plan frontmatter and task list — don't load all context files yet.

**Resume detection:** If multiple plans exist with partial SUMMARY.md coverage (some plans have a SUMMARY.md, others don't), report: "Found N plans, M already completed. Continuing from plan X." Skip completed plans.

**Previous phase check (GSD only):** If a previous SUMMARY exists, scan for unresolved "Issues Encountered". If found, ask user: "Previous plan had unresolved issues — proceed anyway, address first, or review?"

---

## Step 1b: Initialize Task Tracking

After finding the plan, set up native task tracking for visibility into build progress.

### Graceful degradation

Try creating the first task below. If TaskCreate fails or is unavailable, set `TASKS_AVAILABLE=false`, log "Task tracking unavailable, continuing with GSD tracking", and skip the rest of this step. All subsequent TaskUpdate calls throughout the build should be skipped when `TASKS_AVAILABLE=false`.

### Create tasks from plan

Parse the plan's `<tasks>` block and create a native task for each plan task using TaskCreate:
- **subject:** task name from `<name>`
- **description:** task's `<done>` criteria
- **metadata:** `{wave: N, phase: "XX-name", plan: NN, taskIndex: N}`
- **activeForm:** derived from task name (e.g., "Implementing auth middleware")

### Create pipeline stage tasks

Also create tasks for pipeline stages that run after wave execution:
- "Spec gate Wave N" — one per wave
- "Design gates" (if applicable based on visual change expectations)
- "Self-check + SUMMARY"
- "GSD state updates"

### Set up wave dependencies

Use `addBlockedBy` to express wave ordering:
- Wave 2 tasks are blocked by all Wave 1 tasks
- Spec gate for Wave N is blocked by all Wave N tasks
- Wave N+1 tasks are blocked by Spec gate Wave N

Store the mapping of plan task index → native task ID for use in subsequent steps.

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
AUTO_MODE=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs config-get workflow.auto_advance 2>/dev/null || echo "false")
```

---

## Step 3: Execute Waves

For each wave, dispatch **one subagent per task** using the Task tool with **`subagent_type: "general-purpose"`** (follow `skills/dispatching-parallel-agents/` for prompt quality when dispatching parallel tasks).

### Subagent prompt

Use the structured template at `references/implementer-prompt.md`. Fill its placeholders:

- `{TASK_TEXT}` — Full task content (files, action, verify, done). Copy the text, don't reference the plan file.
- `{CLAUDE_MD_SECTIONS}` — Relevant sections from CLAUDE.md for this task type (UI work → CONVENTIONS.md + DESIGN.md; new files → STRUCTURE.md; API work → ARCHITECTURE.md; tests → TESTING.md).
- `{DESIGN_DECISIONS}` — If `.planning/phases/{phase}/{phase}-CONTEXT.md` exists, include the "Design Decisions" and "Review Decisions" sections. These are locked — subagents must not contradict them. Also include the "NOT in scope" section as a scope boundary — subagents must not implement deferred items listed there.
- `{DESIGN_MD_CONTENT}` — For frontend tasks only: include `.planning/DESIGN.md` content (small, ~30 lines).
- `{PHASE_DIR}` — Path to `.planning/phases/{phase}/` for deferred items logging.
- `{TASK_NAME}` — Task identifier for deferred items format.
- `{TASK_ID}` — The native task ID for this task (from Step 1b). Subagents can use this ID for sub-task tracking via TaskCreate/TaskUpdate. Pass empty string if `TASKS_AVAILABLE=false`.

The template includes all behavioral directives (TDD, frontend, commits, YAGNI), deviation rules 1-4, guardrails (analysis paralysis, scope boundary, deferred items), self-review checklist, and structured report format.

**Conditional context injection — verify the template activates these for each task:**
- **Playwright:** If task `<files>` contain `*.spec.*`, `*.test.*`, `e2e/`, or `playwright.config.*`, the template directs subagents to read `skills/playwright-testing/` (POM, role-based locators, auto-waiting). Verify this context is relevant before dispatch — don't include Playwright weight for non-test tasks.
- **Next.js perf:** If `next.config.*` exists in the project root, the template directs subagents to read `skills/nextjs-perf/` (waterfall avoidance, Suspense boundaries, barrel import awareness, caching). No action needed if the project doesn't use Next.js.
- **TypeScript strictness:** The template includes inline TS rules for all TypeScript projects. These are enforced at the spec gate (Step 3b) — subagents should follow them during implementation.

### Skill context for subagents

Before dispatching the first wave, collect skill metadata for subagent prompts:

If `.claude/skills/` exists:
1. List all skill directories
2. Read each SKILL.md's frontmatter only (name + description, ~2 lines each)
3. Format as a compact skill index block:
   ```
   Available project skills (read SKILL.md in full if relevant to your task):
   - adapt: Adapt designs to different screen sizes and devices
   - playwright-testing: Playwright testing patterns and best practices
   - nextjs-perf: Next.js and React performance patterns
   ...
   ```
4. Store as `{SKILL_INDEX}` — injected into every subagent prompt via the implementer template

This replaces per-subagent skill directory scanning. Each subagent sees the full menu but only deep-reads what's relevant.

### Checkpoint protocol

If a task has `type="checkpoint:*"`, read `references/checkpoint-protocol.md` (co-located with this skill) for the full protocol. It covers checkpoint types (human-verify, decision, human-action), return format, auto-mode behavior, standard mode continuation, and authentication gate handling.

### Task status updates (if TASKS_AVAILABLE)

**Before dispatching** each subagent: `TaskUpdate(taskId, status: "in_progress", activeForm: "Implementing {task name}")`.

**After subagent returns successfully:** `TaskUpdate(taskId, status: "completed")`.

**If subagent reports BLOCKED:** `TaskUpdate(taskId, status: "in_progress", metadata: {blocked: true, blocker: "reason"})`. Then propagate: for all tasks in subsequent waves that depend on this task (via the wave dependency chain from Step 1b), call `TaskUpdate(dependentTaskId, addBlockedBy: [taskId])`.

**For independent tasks in the same wave:** dispatch subagents in parallel.
**For sequential waves:** wait for all tasks in current wave before starting next.

### After each wave completes

First, triage subagent outcomes before doing anything else:

**BLOCKED report:** Surface immediately to the user:
```
⚠ Task "{task}" is BLOCKED: {blocker}
What's needed: {what the subagent reported}
Options:
  A) Fix the blocker (describe how) and retry this task
  B) Skip this task and note it as deferred
  C) Adjust the plan — this changes the approach
```
Do not proceed to the next wave until blocked tasks are resolved or explicitly skipped.

**AskUserQuestion discipline:** When presenting findings that need user decisions, present one issue per question with 2-3 lettered options. Lead with recommendation and WHY.

**"interrupted — what should I do next" (or similar stuck state):** The subagent paused waiting for input it can't receive. Read its last output to understand what confused it. Options:
- Re-dispatch with a revised prompt that removes the ambiguity or provides the missing context
- If the task spec itself is ambiguous, clarify with the user and re-dispatch
- Never treat an interrupted agent as "done" — it produced no output

**Silent failure (no commit, no files changed):** Spot-check found nothing. Treat as BLOCKED — report to user and do not continue.

Once all tasks are accounted for (completed, or explicitly skipped with user sign-off):

1. **Spot-check:** verify key files from subagent reports exist on disk (`[ -f path ]`), check `git log` for expected commits
2. **Done criteria check:** compare each task's `done` criteria against subagent output — flag mismatches
3. **Record wave SHA:** `WAVE_END_SHA=$(git rev-parse HEAD)` — needed for spec gate
4. **Report** results to user before spec gate

(GSD state updates happen once in Step 6, not per-wave. Don't edit STATE.md during execution.)

### After-wave error check

If `.sentry-local/events.db` exists, check for errors that appeared during wave execution:

```bash
node lib/sentry-local-query.mjs recent --minutes 5
```

If new errors appeared:
- **Runtime errors during build** — these may indicate the just-built code has issues
- Surface the errors to the orchestrator: "N new runtime errors detected during Wave X execution"
- Include in the wave report alongside spot-check results
- These errors inform the spec gate — if the code runs but produces errors, that's a spec concern

If the query script or db doesn't exist, skip silently.

---

## Step 3b: Per-Wave Spec Gate

**After each wave completes and passes spot-check, run a spec gate before starting the next wave.**

This catches spec deviations before dependent waves build on wrong foundations. Run for ALL waves including the final wave.

### Dispatch spec reviewer

If `TASKS_AVAILABLE`, update the spec gate task: `TaskUpdate(specGateTaskId, status: "in_progress", activeForm: "Running spec gate Wave N")`.

Use the template at `references/spec-gate-prompt.md` with **`subagent_type: "code-reviewer"`** (specialized agent). Fill placeholders:

- `{WAVE_NUMBER}` — Current wave number
- `{TASK_SPECS}` — Done criteria and key requirements for each task in the wave
- `{SUBAGENT_REPORTS}` — What each task subagent reported (from their structured reports)
- `{WAVE_START_SHA}` — SHA before wave started
- Wave diff: `git diff {WAVE_START_SHA}..{WAVE_END_SHA}`

**If wave had multiple tasks:** dispatch one spec reviewer for the entire wave (reviews the combined diff). This is faster than per-task reviewers and catches cross-task issues within the wave.

### Inline TypeScript strictness — BLOCKING criteria

The spec gate template checks TypeScript strictness. These are the BLOCKING rules the gate enforces on every wave diff:

| Pattern | Verdict | Required fix |
|---------|---------|-------------|
| `any` type usage (explicit or implicit via missing annotations) | **BLOCK** | Replace with `unknown` + type guard, generic, or concrete type |
| `as any` or `as unknown as X` type assertions | **BLOCK** | Use type guard (`is` keyword), `satisfies`, or fix the type mismatch |
| Non-exhaustive `switch` on union/enum without `default: { const _: never = val; }` | **BLOCK** | Add exhaustive default or `satisfies never` check |
| Type assertion (`as T`) where a type guard would work | **WARN** | Suggest type guard — not blocking but flag it |

These rules are also in the implementer-prompt template so subagents should catch most issues during implementation. The spec gate is the backstop.

### Handle results

**PASS:** Update `WAVE_START_SHA=$WAVE_END_SHA`. If `TASKS_AVAILABLE`, update the spec gate task: `TaskUpdate(specGateTaskId, status: "completed")`. Continue to next wave.

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

### Design gates (visual-heavy changes only)

Calculate visual change ratio:
- Count files changed that are visual (`.tsx`, `.css`, `.scss`, component files)
- Count total files changed
- Visual ratio = visual files / total files

**Trigger design gates when:** visual ratio > 40% AND visual file count >= 3
**Skip when:** ratio is low (backend-heavy build) or only 1-2 visual files touched (minor tweaks)

If `TASKS_AVAILABLE` and a "Design gates" task was created, update it: `TaskUpdate(designGateTaskId, status: "in_progress", activeForm: "Running design gates")` when triggered, or `TaskUpdate(designGateTaskId, status: "completed", metadata: {skipped: true})` when skipped.

When triggered, run the design pipeline (critique → polish → normalize) below.
When skipped, note: "Design gates skipped (N/M files visual). Run /critique or /polish manually if needed."

After all waves complete (including spec gates) and BEFORE self-check, run the design quality pipeline:

**Context for all design gate subagents:** If `.planning/phases/{phase}/{phase}-CONTEXT.md` exists, include its "Design Decisions" and "Review Decisions" sections. These are locked design choices that critique/polish/normalize must respect.

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

After all design gate sub-steps complete, if `TASKS_AVAILABLE`: `TaskUpdate(designGateTaskId, status: "completed")`.

### Consider Harden and Animate (optional)
Suggest (don't auto-run) based on the work:
- `/harden` — if forms, user input, error states, or i18n concerns
- `/animate` — if transitions, state changes, or interaction-heavy elements
Ask user before proceeding.

Uses design quality commands (`/critique`, `/polish`, `/normalize`) and `skills/frontend-design/` — all built into this plugin.

### Step 4b: Collect integration check results

**If a background integration check was dispatched:** collect its results now. If critical wiring issues found (orphaned exports, broken data flows), flag to user before proceeding. Integration findings feed into Step 9 (post-build review).

---

## Step 5: Self-Check + Generate SUMMARY.md

If `TASKS_AVAILABLE`, update the "Self-check + SUMMARY" pipeline task: `TaskUpdate(selfCheckTaskId, status: "in_progress", activeForm: "Running self-check and generating SUMMARY")`.

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

Read `references/summary-template.md` (co-located with this skill) for the full template (frontmatter schema, gsd-tools scaffold command, body sections).

**Commit:** `docs({phase}-{plan}): complete {description}`

If `TASKS_AVAILABLE`: `TaskUpdate(selfCheckTaskId, status: "completed")`.

---

## Step 6: GSD State Updates

**Skip this step if not in GSD mode.**

If `TASKS_AVAILABLE`, update the "GSD state updates" pipeline task: `TaskUpdate(gsdStateTaskId, status: "in_progress", activeForm: "Updating GSD state")`.

After SUMMARY.md is committed, read `references/gsd-state-updates.md` (co-located with this skill) and run all state update commands. This covers: advance-plan, update-progress, record-metric, add-decision, record-session, and roadmap update.

If `TASKS_AVAILABLE`: `TaskUpdate(gsdStateTaskId, status: "completed")`. If GSD mode was skipped: `TaskUpdate(gsdStateTaskId, status: "completed", metadata: {skipped: true})`.

---

## Step 7: Phase Completion Detection + Dual Verification

**GSD mode — use gsd-tools for completeness check:**

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs verify phase-completeness "${PHASE_NUM}"
```

**If NOT all plans complete:** Report "Plan X of Y complete, Z remaining." Continue to Step 8.

**If ALL plans complete (phase done):** Run dual verification before proceeding.

### Goal-backward verification

**GSD mode — use gsd-tools verification suite:**

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs verify artifacts "${PLAN_PATH}"
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs verify key-links "${PLAN_PATH}"
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

**If FAILED:** Report gaps. Suggest `/plan-work` for closure or `/fix` for bugs.

---

## Step 8: Simplify

After all tasks complete (including spec gates and design gates), invoke `skills/simplify/` on the implementation diff. This catches:

- **Code reuse**: newly written code that duplicates existing utilities or helpers
- **Efficiency**: redundant computations, missed concurrency, N+1 patterns, hot-path bloat
- **Code hygiene**: parameter sprawl, copy-paste with variation, stringly-typed code, unnecessary nesting

It runs 3 parallel review agents (reuse, quality, efficiency) on the git diff, then fixes issues directly. Let it run and apply fixes. Skip false positives without debate.

**Commit:** `refactor({phase}-{plan}): simplify pass`

---

## Step 9: Post-Build Review

Auto-invoke `/review --quick` — this runs code quality + architecture analysis without the full security scan. It catches naming issues, structural problems, test quality gaps, and cross-file inconsistencies before they accumulate.

If the review surfaces issues:
- **BLOCK** findings → fix before continuing
- **WARN** findings → report to user, continue if they approve

**Frontend QA routing:** If the build involved frontend changes (`.tsx`, `.css`, `.html` files), suggest:
"Frontend changes detected. Run `/fh:qa` for diff-aware browser testing, or `/fh:verify-ui` for design critique."

After the review, report what was built:
- Tasks completed, commits made, key files created/modified
- Design gates: ran / skipped (with reason)
- Integration check results (if ran)
- Review findings summary

For deeper scrutiny, suggest `/review` (adds security scan + gap analysis).

**GSD completion (if GSD active):**

Update STATE.md with final session info. Keep STATE.md under 150 lines.

Route based on phase status:

| Condition | Action |
|-----------|--------|
| More plans in phase | "Plan X of Y complete." Suggest `/build` for next plan. |
| Phase complete, more phases | "Phase complete." Suggest `/plan-work {next}` or `/verify`. Also suggest `/fh:revise-claude-md` to capture learnings from this phase. |
| Last phase in milestone | "Milestone complete." Run milestone completion: archive phase directories, update STATE.md and ROADMAP.md via `gsd-tools.cjs milestone complete`, and suggest `/fh:revise-claude-md` — milestone boundaries are natural points to update project conventions. |

If user prefers to skip the branch finishing (more work planned), report what was built with links to key files.

---

## Context Budget Rules

- **Orchestrator (you):** Stay lean. Don't read source files. Don't load more than 2 `.planning/` files at a time. Delegate all file reading to subagents.
- **Task subagents:** Fresh context each. Load only what that task needs. Use `references/implementer-prompt.md` template.
- **Spec gate agents:** Get the wave diff and task specs only. Don't load full plan history.
- **Integration checker:** Runs in background. Gets phase SUMMARYs and source directory structure.
- **Simplify agents:** Run on the git diff only. 3 parallel agents (reuse, quality, efficiency) — lightweight, no plan context needed.
- **Post-build review:** `/review --quick` dispatches 1 code-reviewer agent on the diff. Adds ~1 subagent turn, no security scan overhead.
- **`.planning/DESIGN.md`** is small (~30 lines) — safe to include in every frontend subagent prompt.
- **Skill index:** Collect once (Step 3), inject into every subagent prompt as `{SKILL_INDEX}`. Subagents deep-read only what's relevant.
- **Codebase docs per task type:**
  - UI work -> CONVENTIONS.md + DESIGN.md
  - New files -> STRUCTURE.md
  - API work -> ARCHITECTURE.md
  - Tests -> TESTING.md

---

## Context Pressure Priority

If context is running low, prioritize in this order:

Step 3 (execute waves) > Step 3b (spec gate) > Step 7 (phase completion) > Step 5 (self-check) > Step 8 (simplify) > Step 9 (post-build review) > Step 4 (design gates) > Step 6 (GSD state).

Never skip Step 3 or Step 3b.
