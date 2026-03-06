---
description: "Execute an existing plan. Delegates task execution to subagents for optimal context usage."
---

Execute an existing plan. Delegates task execution to subagents for optimal context usage.

What to build or which plan to execute: $ARGUMENTS

You are a **lean orchestrator**. Stay under 15% context usage. Delegate all heavy work to subagents.

> **CRITICAL — Execution pipeline:**
> This skill uses its OWN execution pipeline. You MUST dispatch tasks using the **Task tool with `subagent_type: "general-purpose"`**.
> **DO NOT** use `gsd-executor`, `gsd-planner`, or any other GSD agent types. Even if a GSD project is active, `/build` runs the superpowers pipeline — not the GSD pipeline. The GSD pipeline is only used by `/gsd:execute-phase`.

> **GSD detection (do this FIRST):**
> Check if `.planning/PROJECT.md` exists → **GSD mode active**.
> If active: all state updates, roadmap updates, and commit helpers use `gsd-tools.cjs`.
> Hold this decision — it affects Steps 3 through 6.

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

For each wave, dispatch **one subagent per task** using the Task tool with **`subagent_type: "general-purpose"`** (follow `superpowers:dispatching-parallel-agents` for prompt quality when dispatching parallel tasks). Never use `gsd-executor` or other GSD agent types.

**Each subagent prompt must include:**
1. The specific task (files, action, verify, done) — copy the full text, don't reference the plan file
2. Only the source files that task needs (from the plan's file list)
3. Minimal project context: relevant sections from CLAUDE.md
4. These behavioral directives:
5. **Implementation decisions** (if `.planning/phases/{phase}/{phase}-CONTEXT.md` exists): Include the "Design Decisions" section. These are locked — subagents must not contradict them.

### Subagent directives

**TDD:** If task is marked `tdd="true"`: "Follow RED-GREEN-REFACTOR per `superpowers:test-driven-development` — failing test first, then minimal implementation"

**Frontend:** If frontend work (`.tsx`, `.css`, component files): "Read `.planning/DESIGN.md` and apply `impeccable:frontend-design` guidance. Add stable selectors for Playwright: `aria-label`, `id`, `role`, or `data-testid` on key interactive elements." Include `.planning/DESIGN.md` content in the prompt (it's small, ~30 lines).

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

(GSD state updates happen once in Step 3.6, not per-wave. Don't edit STATE.md during execution.)

---

## Step 3.45: Impeccable Design Gates (frontend only)

**Skip if no tasks touched `.tsx`, `.css`, or component files.**

After all tasks complete and BEFORE self-check, run the design quality pipeline:

**Context for all design gate subagents:** If `.planning/phases/{phase}/{phase}-CONTEXT.md` exists, include its "Design Decisions" section. These are locked design choices that critique/polish/normalize must respect.

### Critique
Dispatch subagent to invoke `impeccable:critique` on modified frontend files.
Input: file list + `.planning/DESIGN.md` + anti-pattern reference from `impeccable:frontend-design`.
Fix Critical and High issues. Commit: `style({phase}-{plan}): address design critique`

### Polish
Dispatch subagent to invoke `impeccable:polish` on modified files (excluding areas fixed by critique).
Commit: `style({phase}-{plan}): polish pass`

### Normalize (if design system exists)
If `.planning/DESIGN.md` defines design tokens or a component system:
Dispatch subagent to invoke `impeccable:normalize` against the design system.
Commit: `style({phase}-{plan}): normalize to design system`
Skip if no design system defined.

### Consider Harden and Animate (optional)
Suggest (don't auto-run) based on the work:
- `impeccable:harden` — if forms, user input, error states, or i18n concerns
- `impeccable:animate` — if transitions, state changes, or interaction-heavy elements
Ask user before proceeding.

Uses Impeccable skills (`impeccable:critique`, `impeccable:polish`, `impeccable:normalize`, `impeccable:frontend-design`). If Impeccable is not installed, skip design gates and suggest manual design review.

---

## Step 3.5: Self-Check + Generate SUMMARY.md

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

**Location:**
- GSD project: `{phase}-{plan}-SUMMARY.md` in the same directory as PLAN.md

**GSD mode — scaffold with gsd-tools (preferred):**

```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs template fill summary \
  --phase "${PHASE_NUM}" --plan "${PLAN_NUM}" \
  --name "${PLAN_DESCRIPTION}" \
  --fields '{"subsystem":"...", "duration":"...", "requirements-completed": [...]}'
```

This creates a pre-filled SUMMARY.md with correct frontmatter schema. Then fill in the body sections with execution-specific data.

**Non-GSD or if gsd-tools unavailable**, construct manually with this YAML frontmatter:

```yaml
---
phase: {from PLAN.md}
plan: {from PLAN.md}
subsystem: {inferred: auth, payments, ui, etc.}
tags: []
requires:
  - phase: {dep phase}
    provides: "what it provided"
provides:
  - "what this plan delivered"
affects: [downstream IDs]
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified: []
key-decisions:
  - "decision and why"
requirements-completed: [copy requirements array from PLAN.md verbatim]
duration: {elapsed}
completed: {ISO timestamp}
---
```

**Body sections (both modes):**

| Section | Content |
|---------|---------|
| Performance Metrics | Build time, test count, coverage delta |
| Task Commits | Table: Task \| Name \| Commit \| Key Files |
| What Was Done | Bullet summary of deliverables |
| Decisions Made | Table: Decision \| Rationale \| Alternatives Considered |
| Deviations from Plan | All deviation entries with rule number, description, fix, commit |
| Issues Encountered | Problems hit and how resolved (or "None") |
| Self-Check | PASSED or FAILED with details |
| Next Phase Readiness | What downstream plans can now proceed |

**If design gates ran (frontend):** Also capture critique fixes, polish commit, normalize commit in Task Commits table and design deviations in Deviations section.

**One-liner must be substantive:** "JWT auth with refresh rotation using jose library" not "Authentication implemented"

**Commit:** `docs({phase}-{plan}): complete {description}`

---

## Step 3.6: GSD State Updates

**Skip this step if not in GSD mode.**

After SUMMARY.md is committed, update GSD state:

```bash
# Advance plan counter
node ./.claude/get-shit-done/bin/gsd-tools.cjs state advance-plan

# Recalculate progress bar from disk state
node ./.claude/get-shit-done/bin/gsd-tools.cjs state update-progress

# Record execution metrics
node ./.claude/get-shit-done/bin/gsd-tools.cjs state record-metric \
  --phase "${PHASE}" --plan "${PLAN}" --duration "${DURATION}" \
  --tasks "${TASK_COUNT}" --files "${FILE_COUNT}"

# Add decisions from SUMMARY key-decisions
node ./.claude/get-shit-done/bin/gsd-tools.cjs state add-decision \
  --phase "${PHASE}" --summary "${DECISION_TEXT}"

# Update session info
node ./.claude/get-shit-done/bin/gsd-tools.cjs state record-session \
  --stopped-at "Completed ${PHASE}-${PLAN}-PLAN.md"

# Update ROADMAP progress
node ./.claude/get-shit-done/bin/gsd-tools.cjs roadmap update-plan-progress "${PHASE}"
```

Commit state updates:
```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs commit "docs(${PHASE}-${PLAN}): update state and roadmap" --files .planning/STATE.md .planning/ROADMAP.md
```

---

## Step 3.7: Phase Completion Detection + Dual Verification

**GSD mode — use gsd-tools for completeness check:**

```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs verify phase-completeness "${PHASE_NUM}"
```

This checks that every PLAN.md in the phase directory has a matching SUMMARY.md and reports status.

**Non-GSD:** Manually check if every PLAN.md has a matching SUMMARY.md.

**If NOT all plans complete:** Report "Plan X of Y complete, Z remaining." Continue to Step 4.

**If ALL plans complete (phase done):** Run dual verification before proceeding.

### Goal-backward verification

**GSD mode — use gsd-tools verification suite for artifact and link checks:**

```bash
# For each PLAN.md in the phase:
node ./.claude/get-shit-done/bin/gsd-tools.cjs verify artifacts "${PLAN_PATH}"
node ./.claude/get-shit-done/bin/gsd-tools.cjs verify key-links "${PLAN_PATH}"
```

Then manually verify the remaining checks:
1. For each `must_haves.truth` — find evidence (file exists, content matches, test passes)
2. Requirements coverage — every requirement ID from ROADMAP appears in at least one SUMMARY's `requirements-completed`

### Evidence-based verification (Superpowers)

- Run fresh test suites, check exit codes
- Verify all expected artifacts exist (gsd-tools `verify artifacts` handles this in GSD mode)
- Build check if applicable
- No claims without proof

### Output

**GSD mode — scaffold with gsd-tools:**

```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs template fill verification \
  --phase "${PHASE_NUM}" \
  --fields '{"status":"passed|failed", "score":"N/M"}'
```

Then fill in the body tables. If gsd-tools unavailable, write `{phase}-VERIFICATION.md` manually with:

```yaml
---
phase: {phase}
verified: {ISO timestamp}
status: passed|failed
score: N/total must-haves verified
---
```

**Body tables:**

| Section | Format |
|---------|--------|
| Truth table | # \| Truth \| Status \| Evidence |
| Artifacts | File \| Expected \| Found |
| Key link verification | Source \| Target \| Status |
| Requirements coverage | Req ID \| Plan \| Status |
| Anti-patterns | Pattern \| Location \| Severity |

### Phase completion (GSD mode)

**If PASSED**, mark the phase complete using gsd-tools:

```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs phase complete "${PHASE_NUM}"
```

This atomically updates STATE.md and ROADMAP.md progress table. Then commit:

```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs commit "docs(${PHASE}): phase verified and complete" --files .planning/STATE.md .planning/ROADMAP.md
```

- **PASSED:** "Phase verified. Ready for next phase."
- **FAILED:** Report gaps. Suggest `/plan` for closure or `/fix` for bugs.

---

## Step 4: Code Review

After all tasks complete, invoke `superpowers:requesting-code-review` to dispatch reviewers.

Use the two-stage pattern from `superpowers:subagent-driven-development`:
1. **Spec compliance reviewer** — did we build what was planned? Check each task's `done` criteria against the diff.
2. **Code quality reviewer** — is it well-built? Naming, structure, error handling, test quality, security.

Fix any Critical or Important issues from either review.

---

## Step 5: Verify

Invoke `superpowers:verification-before-completion` — follow it completely. This means:
- Run all verification commands fresh (tests, types, linter)
- Read full output, check exit codes
- Only claim completion with evidence

If this was frontend work, suggest running `/verify-ui` for visual verification.

---

## Step 6: Complete

Invoke `superpowers:finishing-a-development-branch` — it handles merge/PR/keep/discard options and worktree cleanup.

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
- **Don't load Impeccable reference files yourself.** The skills load them when invoked by subagents.
- **Codebase docs per task type:**
  - UI work -> CONVENTIONS.md + DESIGN.md
  - New files -> STRUCTURE.md
  - API work -> ARCHITECTURE.md
  - Tests -> TESTING.md
