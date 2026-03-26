---
name: fh:build
description: Execute a plan — turns your PLAN.md into working code with tests and quality checks.
user-invocable: true
---

Execute an existing plan. Delegates task execution to subagents for optimal context usage.

What to build or which plan to execute: $ARGUMENTS

You are a **lean orchestrator**. Stay under 15% context usage. Delegate all heavy work to subagents.

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user to run `/fh:new-project` first). Engineering disciplines (TDD, verification, review) and design quality commands are built into this plugin.

> **Execution pipeline — fresh subagents for tasks, specialized agents for review:**
> Task execution: **`general-purpose`** subagents with structured prompt from `references/implementer-prompt.md` (co-located with this skill). Fresh context per task, no GSD state overhead.
> Review: `/fh:review --quick` runs in parallel with simplify after execution.
> Do not use `gsd-executor` or `gsd-planner` — their state management conflicts with this orchestrator.

> **GSD project context:**
> Read `STATE.md` and `ROADMAP.md` for current position. All state updates, roadmap updates, and commit helpers use `gsd-tools.cjs`.

---

## Step 1: Find the Plan

Locate the plan to execute:
- If the user specified a plan path, use that
- If a GSD project is active, check `.planning/phases/` for incomplete plans (PLAN without matching SUMMARY)
- If plans exist in `.planning/plans/`, use the most recent
- If no plan exists, tell the user to run `/fh:plan-work` first

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

If `CLAUDE_CODE_TASK_LIST_ID` is set, tasks persist across sessions — the same task list will be reused on resume.

Store the mapping of plan task index → native task ID for use in subsequent steps.

---

## Step 2: Analyze Waves

Group tasks by their `wave` number (or dependency order if no waves specified):
- Wave 1: tasks with no dependencies (can run in parallel)
- Wave 2+: tasks that depend on earlier waves

Test tasks marked `wave: same` as their implementation task run in the same wave when they test independent interfaces.

Report the execution plan to the user: "N tasks in M waves. Wave 1 has X parallel tasks."

Record start time and check auto-mode:
```bash
PLAN_START_EPOCH=$(date +%s)
WAVE_START_SHA=$(git rev-parse HEAD)
AUTO_MODE=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs config-get workflow.auto_advance 2>/dev/null || echo "false")
```

If `AUTO_MODE` is `"true"` AND `.planning/DECISIONS.md` exists, read it and filter entries where the Phase field matches the current phase directory name (e.g., `07-auto-mode` from `.planning/phases/07-auto-mode/`), or Phase is `"project"` for cross-phase decisions. Include at most the 20 most recent ACTIVE decisions for the current phase — if more exist, prepend a summary: `"{N} additional decisions omitted — see .planning/DECISIONS.md for full history."` Format the filtered decisions as a compact context block and store as `{DECISIONS_CONTEXT}` for subagent injection. If `DECISIONS.md` doesn't exist or has no entries for this phase, `{DECISIONS_CONTEXT}` is empty string.

Additionally, scan ALL decisions in DECISIONS.md (regardless of Phase) where the Affects field references any file in the current plan's `files_modified` list. Include these as a separate 'Cross-phase decisions' block in `{DECISIONS_CONTEXT}`. The combined total (phase-filtered + cross-phase) is capped at 20 entries — phase-specific decisions take priority, cross-phase fills remaining slots. This ensures decisions from earlier phases that constrain shared files are visible to downstream subagents.

---

## Step 3: Execute Waves

For each wave, dispatch **one subagent per task** using the Task tool with **`subagent_type: "general-purpose"`** and **`model: "sonnet"`**.

### Subagent prompt

Use the structured template at `references/implementer-prompt.md`. Fill its placeholders:

- `{TASK_TEXT}` — Full task content (files, action, verify, done). Copy the text, don't reference the plan file.
- `{CLAUDE_MD_SECTIONS}` — Relevant sections from CLAUDE.md for this task type (UI work → CONVENTIONS.md + DESIGN.md; new files → STRUCTURE.md; API work → ARCHITECTURE.md; tests → TESTING.md).
- `{DESIGN_DECISIONS}` — If `.planning/phases/{phase}/{phase}-CONTEXT.md` exists, include the "Decisions" and "Discretion Areas" sections. These are locked — subagents must not contradict them. Also include the "Deferred Ideas" section as a scope boundary — subagents must not implement deferred items listed there.
- `{DESIGN_MD_CONTENT}` — For frontend tasks only: include `.planning/DESIGN.md` content (small, ~30 lines).
- `{PHASE_DIR}` — Path to `.planning/phases/{phase}/` for deferred items logging.
- `{TASK_NAME}` — Task identifier for deferred items format.
- `{TASK_ID}` — The native task ID for this task (from Step 1b). Subagents can use this ID for sub-task tracking via TaskCreate/TaskUpdate. Pass empty string if `TASKS_AVAILABLE=false`.
- `{DECISIONS_CONTEXT}` — If prepared in Step 2 (AUTO_MODE=true with matching decisions), inject here. Otherwise empty string.

The template includes all behavioral directives (TDD, frontend, commits, YAGNI), deviation rules 1-4, guardrails (analysis paralysis, scope boundary, deferred items), self-review checklist, and structured report format.

**Conditional context injection — verify the template activates these for each task:**
- **Playwright:** If task `<files>` contain `*.spec.*`, `*.test.*`, `e2e/`, or `playwright.config.*`, the template directs subagents to read `.claude/skills/playwright-testing/PROMPT.md` (POM, role-based locators, auto-waiting). Verify this context is relevant before dispatch — don't include Playwright weight for non-test tasks.
- **Next.js perf:** If `next.config.*` exists in the project root, the template directs subagents to read `.claude/skills/nextjs-perf/PROMPT.md` (waterfall avoidance, Suspense boundaries, barrel import awareness, caching). No action needed if the project doesn't use Next.js.
- **TypeScript strictness:** The template includes inline TS rules for all TypeScript projects. Subagents should follow them during implementation.

### Checkpoint protocol

If a task has `type="checkpoint:*"`, handle inline:

- `checkpoint:human-verify` — Show the subagent's output (screenshot/command output), await user approval. In auto-mode: auto-approve (confidence=MEDIUM).
- `checkpoint:decision` — Present options with pros/cons, await user choice. In auto-mode: auto-select first option (confidence=MEDIUM).
- `checkpoint:human-action` — Describe the manual step needed, await confirmation. In auto-mode: STOP (auth gates cannot be automated).

**Return format when a checkpoint is reached:**
```
CHECKPOINT REACHED
Type: [human-verify | decision | human-action]
Progress: {completed}/{total} tasks
Completed Tasks: [task | commit hash | key files] per task
Current Task: [name, status, blocker]
Checkpoint Details: [type-specific content]
Awaiting: [what user needs to do]
```

When auto-approving checkpoints in auto mode, log each auto-approval as a decision in `.planning/DECISIONS.md`:
- For `checkpoint:human-verify` auto-approvals: `confidence=MEDIUM`
- For `checkpoint:decision` auto-selections: `confidence=MEDIUM`
Use `step='build checkpoint'` in the decision entry. Follow the decision entry format from `references/decisions-template.md` (co-located in this skill's references directory).

### Task status updates (if TASKS_AVAILABLE)

**Before dispatching** each subagent: `TaskUpdate(taskId, status: "in_progress", activeForm: "Implementing {task name}")`.

**After subagent returns successfully:** `TaskUpdate(taskId, status: "completed")`.

**If subagent reports BLOCKED:** `TaskUpdate(taskId, status: "in_progress", metadata: {blocked: true, blocker: "reason"})`.

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
3. **Record wave SHA:** `WAVE_END_SHA=$(git rev-parse HEAD)`
4. **Report** results to user

(GSD state updates happen once in Step 5, not per-wave. Don't edit STATE.md during execution.)

### After-wave error check

If `.sentry-local/events.db` exists, check for errors that appeared during wave execution:

```bash
node lib/sentry-local-query.mjs recent --minutes 5
```

If new errors appeared:
- **Runtime errors during build** — these may indicate the just-built code has issues
- Surface the errors to the orchestrator: "N new runtime errors detected during Wave X execution"
- Include in the wave report alongside spot-check results
- These errors inform the next wave — if the code runs but produces errors, that's a quality concern

If the query script or db doesn't exist, skip silently.

---

## Step 4: Verification + SUMMARY

Run verification commands directly:

1. **Test suite:** `npm test` (or the project's test command from package.json or CLAUDE.md)
2. **Build check:** `npm run build` (if the project has a build step)
3. **Lint:** `npm run lint` (if the project has a linter)

Run each command fresh and complete. Check exit codes and count failures.

If any verification fails: flag in SUMMARY under "Issues Encountered" with the actual output. Do NOT claim the build succeeded if verification failed.

### Generate SUMMARY.md

Read `references/summary-template.md` (co-located with this skill) for the full template (frontmatter schema, gsd-tools scaffold command, body sections).

**Commit:** `docs({phase}-{plan}): complete {description}`

If `TASKS_AVAILABLE`: update the summary task to `status: "completed"`.

---

## Step 5: GSD State Updates

**Skip this step if not in GSD mode.**

After SUMMARY.md is committed, read `references/gsd-state-updates.md` (co-located with this skill) and run all state update commands. This covers: advance-plan, update-progress, record-metric, add-decision, record-session, and roadmap update.

These run once at plan completion. No state writes during wave execution.

Use **`model: "haiku"`** for this step — mechanical state updates don't require deep reasoning.

---

## Step 6: Phase Completion Detection

**GSD mode — use gsd-tools for completeness check:**

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs verify phase-completeness "${PHASE_NUM}"
```

**If NOT all plans complete:** Report "Plan X of Y complete, Z remaining." Continue to Step 7.

**If ALL plans complete (phase done):**

Before marking the phase done, run the following gates in order:

### Gate 1: Goal Verification

For each plan in the phase:
- For each `must_haves.truth` across all phase plans: find evidence the truth holds (file exists, content matches, test passes).
- Run `gsd-tools verify artifacts` and `gsd-tools verify key-links` for each plan.
- Requirements coverage: every requirement ID from ROADMAP that appears in any plan's `requirements` field must appear in at least one SUMMARY.md for the phase.

Report any failures. If failures exist, stop and report to user — do not proceed to Gate 2 or phase completion.

### Gate 2: Design Quality Gates (visual work only)

Read `.planning/DESIGN.MD` and `.planning/PROJECT.MD` for design context (skip silently if either doesn't exist).

Calculate the visual file ratio across ALL plans in the phase: count files ending in `.tsx`, `.css`, `.html`, `.svg` in `files_modified` across all phase plans, divided by total files.

If visual ratio > 30% OR the phase explicitly targets UI (phase name or ROADMAP goal references UI/design/frontend):

- **Round 1 (parallel):** Dispatch `/fh:ui-critique` + `/fh:harden` simultaneously. Fix Critical and High issues. Commit with phase scope: `fix({phase}): ui-critique + harden pass`.
- **Round 2 (parallel):** Dispatch `/fh:polish` + `/fh:adapt` simultaneously. Fix Critical and High issues. Commit: `fix({phase}): polish + adapt pass`.
- **Round 3:** If a design system is defined (`.planning/DESIGN.MD` exists with a design system section), dispatch `/fh:normalize`. Fix Critical and High issues. Commit: `fix({phase}): normalize pass`.

If visual ratio ≤ 30% and phase does not target UI, skip Gate 2.

### Gate 3: Verification-Before-Completion

Run fresh:
1. Test suite: `npm test` (or project test command)
2. Build: `npm run build` (if project has a build step)
3. Lint: `npm run lint` (if project has a linter)

Compare each exit code against must_haves truths for all phase plans. Write `VERIFICATION.md` in the phase directory:

```markdown
# Phase {PHASE_NUM} Verification

## Test Suite
[pass/fail + output summary]

## Build
[pass/fail + output summary]

## Lint
[pass/fail + output summary]

## Must-Haves Coverage
[list each truth with: verified / failed + evidence]
```

If any gate fails, stop and report to user before proceeding.

**Only after all gates pass:**

Run: `gsd-tools.cjs phase complete "${PHASE_NUM}"` — atomically updates STATE.md and ROADMAP.md. "Phase verified. Ready for next phase."

If gaps remain, report them. Suggest `/fh:plan-work` for closure or `/fh:fix` for bugs.

---

## Step 7: Simplify + Review (parallel)

Dispatch both in parallel:

**Simplify** — Dispatch 1 subagent that reads `skills/simplify/PROMPT.md` and runs all three lenses (reuse, efficiency, hygiene) sequentially on the implementation diff. Let it apply fixes.

**Commit:** `refactor({phase}-{plan}): simplify pass`

**Review** — Auto-invoke `/fh:review --quick` — this runs code quality + architecture analysis. It catches naming issues, structural problems, test quality gaps, and cross-file inconsistencies.

Collect both results. If either surfaces BLOCK findings → fix before continuing.

**Frontend QA routing:** If the build involved frontend changes (`.tsx`, `.css`, `.html` files), suggest:
"Frontend changes detected. Run `/fh:ui-test` for visual verification, or `/fh:ui-test --qa` for diff-aware functional testing."

After both complete, report what was built:
- Tasks completed, commits made, key files created/modified
- Review findings summary

For deeper scrutiny, suggest `/fh:review` (adds spec verification + gap analysis).

**GSD completion (if GSD active):**

Update STATE.md with final session info. Keep STATE.md under 150 lines.

Route based on phase status:

| Condition | Action |
|-----------|--------|
| More plans in phase | "Plan X of Y complete." Suggest `/fh:build` for next plan. |
| Phase complete, more phases | "Phase complete." Suggest `/fh:plan-work {next}` or `/fh:review`. Also suggest `/fh:revise-claude-md` to capture learnings from this phase. |
| Last phase in milestone | "Milestone complete." Run milestone completion: archive phase directories, update STATE.md and ROADMAP.md via `gsd-tools.cjs milestone complete`, and suggest `/fh:revise-claude-md` — milestone boundaries are natural points to update project conventions. |

If user prefers to skip the branch finishing (more work planned), report what was built with links to key files.

---

## Context Budget Rules

- **Orchestrator (you):** Stay lean. Don't read source files. Don't load more than 2 `.planning/` files at a time. Delegate all file reading to subagents.
- **Task subagents (Sonnet):** Fresh context each. Load only what that task needs. Use `references/implementer-prompt.md` template.
- **Simplify agent:** Runs on the git diff only. Single agent, 3 lenses sequentially — lightweight, no plan context needed.
- **Post-build review:** `/fh:review --quick` dispatches 1 code-reviewer agent on the diff. Adds ~1 subagent turn.
- **GSD state updates (Haiku):** Mechanical commands — advance-plan, update-progress, record-metric.
- **`.planning/DESIGN.md`** is small (~30 lines) — safe to include in every frontend subagent prompt.
- **Codebase docs per task type:**
  - UI work -> CONVENTIONS.md + DESIGN.md
  - New files -> STRUCTURE.md
  - API work -> ARCHITECTURE.md
  - Tests -> TESTING.md

---

## Context Pressure Priority

If context is running low, prioritize in this order:

Step 3 (execute waves) > Step 4 (verification + SUMMARY) > Step 6 (phase completion) > Step 7 (simplify + review) > Step 5 (GSD state).

Never skip Step 3 or Step 4.
