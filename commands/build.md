---
description: "Execute an existing plan with fresh subagents, TDD, design gates, and verification. Use when the user says 'build', 'execute the plan', 'run the plan', 'implement this', or has a PLAN.md ready to execute. Always use this instead of /gsd:execute-phase."
---

Execute an existing plan. Delegates task execution to subagents for optimal context usage.

What to build or which plan to execute: $ARGUMENTS

You are a **lean orchestrator**. Stay under 15% context usage. Delegate all heavy work to subagents.

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user to run `/new-project` first). Engineering disciplines (TDD, verification, review) and design quality commands are built into this plugin. See the `references/dependency-check.md` file in the same plugin directory as this command for detection details.

> **Execution pipeline — use fresh subagents, not GSD agents:**
> Dispatch tasks using the **Task tool with `subagent_type: "general-purpose"`**. Do not use `gsd-executor`, `gsd-planner`, or other GSD agent types. Fresh subagents give each task clean context and enforce TDD, YAGNI, and verification disciplines that GSD agent types skip. The GSD pipeline is only for `/gsd:execute-phase`.

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

Record start time for duration tracking:
```bash
PLAN_START_EPOCH=$(date +%s)
```

---

## Step 3: Execute Waves

For each wave, dispatch **one subagent per task** using the Task tool with **`subagent_type: "general-purpose"`** (follow `skills/dispatching-parallel-agents/` for prompt quality when dispatching parallel tasks).

**Each subagent prompt must include:**
1. The specific task (files, action, verify, done) — copy the full text, don't reference the plan file
2. Only the source files that task needs (from the plan's file list)
3. Minimal project context: relevant sections from CLAUDE.md
4. **Implementation decisions** (if `.planning/phases/{phase}/{phase}-CONTEXT.md` exists): Include the "Design Decisions" section. These are locked — subagents must not contradict them.
5. The behavioral directives below (TDD, Frontend, Commits, Verification, YAGNI)

### Subagent directives

**TDD:** If task is marked `tdd="true"`: "Follow RED-GREEN-REFACTOR per `skills/test-driven-development/` — failing test first, then minimal implementation"

**Frontend:** If frontend work (`.tsx`, `.css`, component files): "Read `.planning/DESIGN.md` and apply `skills/frontend-design/` guidance. Add stable selectors for Playwright: `aria-label`, `id`, `role`, or `data-testid` on key interactive elements." Include `.planning/DESIGN.md` content in the prompt (it's small, ~30 lines).

**Commits:** Make atomic commits per task. Format: `type(phase-plan): description` — e.g., `feat(13-01): audit transaction module`. If no GSD phase: `type(plan): description`. Stage files individually (never `git add .`).

**Verification:** Run the verify step and report actual output (not claims).

**YAGNI:** Do not add features, abstractions, or error handling beyond what the task specifies. If in doubt, leave it out.

### Deviation rules

| Rule | Trigger | Action | Permission |
|------|---------|--------|------------|
| 1 | Bug: broken behavior, errors, wrong queries, type errors, security vulns | Auto-fix → test → verify → track `[Rule 1 - Bug]` | Auto |
| 2 | Missing critical: error handling, validation, auth, CSRF, rate limiting | Auto-fix → test → verify → track `[Rule 2 - Missing Critical]` | Auto |
| 3 | Blocking: missing deps, wrong types, broken imports, missing config | Auto-fix → verify → track `[Rule 3 - Blocking]` | Auto |
| 4 | Architectural: new DB table, schema change, new service, switching libs | **STOP** → report to orchestrator with: what found, proposed change, why needed, impact, alternatives | Ask user |

Rules 1-3: include fix in task commit. Rule 4: orchestrator asks user.

**Scope boundary:** Only auto-fix issues DIRECTLY caused by the current task's changes. Pre-existing warnings, linting errors, or failures in unrelated files are out of scope. Log out-of-scope discoveries as deviations but do NOT fix them.

**Fix attempt limit:** After 3 auto-fix attempts on a single issue, STOP fixing — document remaining issues and continue to the next task. Do NOT loop.

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

Orchestrator presents checkpoint to user, waits for response, then dispatches a **new subagent** for the next task (or remaining tasks in the wave). The continuation prompt must include:
- Completed tasks summary: task names + commit hashes (so it doesn't redo work)
- The user's checkpoint response (approval, decision choice, or confirmation of manual action)
- The next task's full content (files, action, verify, done) — same format as original dispatch
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
3. **Report** results to user before starting next wave

(GSD state updates happen once in Step 6, not per-wave. Don't edit STATE.md during execution.)

---

## Step 4: Design Gates (frontend only)

**Skip if no tasks touched `.tsx`, `.css`, or component files.**

After all tasks complete and BEFORE self-check, run the design quality pipeline:

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

## Step 8: Code Review

After all tasks complete, invoke `skills/requesting-code-review/` to dispatch reviewers.

Use the two-stage review pattern (spec compliance + code quality):
1. **Spec compliance reviewer** — did we build what was planned? Check each task's `done` criteria against the diff.
2. **Code quality reviewer** — is it well-built? Naming, structure, error handling, test quality, security.

Fix any Critical or Important issues from either review.

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
| Phase complete, more phases | "Phase complete." Suggest `/gsd:plan-phase {next}` or `/gsd:verify-work`. |
| Last phase in milestone | "Milestone complete." Suggest `/gsd:complete-milestone`. |

If user prefers to skip the branch finishing (more work planned), report what was built with links to key files.

---

## Context Budget Rules

- **Orchestrator (you):** Stay lean. Don't read source files. Don't load more than 2 `.planning/` files at a time. Delegate all file reading to subagents.
- **Task subagents:** Fresh context each. Load only what that task needs.
- **Review subagents:** Get the diff and objectives, not the full plan history.
- **`.planning/DESIGN.md`** is small (~30 lines) — safe to include in every frontend subagent prompt.
- **Don't load design reference files yourself.** The skills load them when invoked by subagents.
- **Codebase docs per task type:**
  - UI work -> CONVENTIONS.md + DESIGN.md
  - New files -> STRUCTURE.md
  - API work -> ARCHITECTURE.md
  - Tests -> TESTING.md
