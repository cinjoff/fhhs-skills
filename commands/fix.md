---
description: "Auto-triage and fix bugs with TDD discipline. Use when the user reports a bug, error, test failure, broken behavior, or says 'fix', 'debug', 'something is wrong', 'this broke', or 'not working'. Handles simple single-file fixes through complex multi-subsystem failures."
---

Auto-triage and fix bugs with TDD discipline.

The issue: $ARGUMENTS

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required). Engineering disciplines (TDD, verification) and design quality commands are built into this plugin. See the `references/dependency-check.md` file in the same plugin directory as this command for detection details.

This command runs in a single context by default. Escalates to parallel agents when needed.

---

## Step 1: Triage

Quickly assess bug depth before choosing strategy. Spend <5% context.

1. **Search** for error message or symptom in codebase. Use LSP `findReferences` on the error site and `hover` for type mismatches
2. **Run** the most relevant test suite if identifiable
3. **Assess** and announce:

| Signal | Depth | Path | Announcement |
|--------|-------|------|-------------|
| 1 file, cause visible | **SIMPLE** | TDD fix directly | "Single-file fix, straightforward." |
| 2-4 files, one subsystem | **MODERATE** | Full debug → TDD | "Multi-file issue in [subsystem]. Full investigation." |
| 3+ independent failures | **PARALLEL** | Debugger agent per subsystem | "Multiple independent failures. Dispatching parallel debug agents." |
| Unclear cause, needs hypotheses | **COMPLEX** | Persistent debug session | "Sustained investigation needed. Starting persistent debug session." |

Execute the chosen path:
- **SIMPLE:** Skip to Step 2 — cause is clear from triage.
- **MODERATE:** Invoke `skills/systematic-debugging/`. Follow completely. Then Step 2.
- **PARALLEL:** Dispatch one **`gsd-debugger`** agent per subsystem (specialized — scientific debugging with hypothesis tracking). Each agent gets: the specific failure, relevant files, and instruction to produce root cause + proposed fix. Collect results. Then Step 2 for each fix.
- **COMPLEX:** Write triage findings to `.planning/debug/{issue-slug}.md` with: error message, files investigated, hypotheses formed, test results observed. Slug convention: `YYYY-MM-DD-{first-3-words-kebab}` (e.g., `2026-03-06-payment-timeout-error`). If slug exists, append `-2`. Then dispatch a `gsd-debugger` agent with the session file for sustained scientific investigation. If user says try anyway → MODERATE path.

---

## Step 2: TDD Fix

Invoke `skills/test-driven-development/`. Follow completely:
- **RED:** Write failing test proving the bug
- **GREEN:** Minimal fix
- **REFACTOR:** Cleanup

For SIMPLE triage: the failing test captures the bug directly (cause already known).

**Deferred items:** During investigation and fixing, you will often discover adjacent issues (pre-existing warnings, unrelated bugs, improvement opportunities). Do NOT fix them — log to `{phase_dir}/deferred-items.md`:
```
- [fix-{YYYYMMDD}] {description} (found in {file}:{line})
```

Commit: `fix: [root cause and what was wrong]`

---

## Step 3: Frontend Check (if applicable)

If the fix touches `.tsx`, `.css`, components, or styles:
- Read `.planning/DESIGN.md` for design context
- Quick check: does the fix maintain visual consistency?
- Check against `skills/frontend-design/` anti-patterns — no generic cards, cyan-on-dark, purple gradients, or other AI slop introduced by the fix
- If significant UI change, suggest `/verify-ui`

---

## Step 4: Quick Spec Review

Verify the fix addresses the right problem:

**For ALL depths (including SIMPLE):**
1. Does the fix address the **root cause**, not just the symptom?

**For MODERATE and PARALLEL, also check:**
2. Does the failing test from Step 2 actually reproduce the **reported** bug (not a different one)?
3. Are there other callers/consumers of the changed code that could be affected?

If any answer is "no" or "unsure", investigate before proceeding to verification.

---

## Step 4b: Simplify (MODERATE+ only)

**Skip for SIMPLE fixes** — they're typically single-file and don't benefit from a reuse/efficiency pass.

For MODERATE and PARALLEL fixes that touched multiple files, invoke `skills/simplify/` on the fix diff. Multi-file fixes often introduce duplicated patterns or miss existing utilities. Fix issues, then commit: `refactor(fix): simplify pass`

---

## Step 5: Verify

Invoke `skills/verification-before-completion/`. Follow completely:
- Run all verification commands fresh
- Read full output, check exit codes
- Only claim fixed with evidence

---

## Step 6: Complete

If on a feature branch and fix is standalone, invoke `skills/finishing-a-development-branch/`.

Generate lightweight SUMMARY.md in the phase directory:

```yaml
---
phase: {phase}
plan: fix-{YYYYMMDD-HHMM}
subsystem: {affected subsystem}
key-files:
  modified: [files changed]
key-decisions:
  - "Root cause: {description}"
duration: {elapsed}
completed: {ISO timestamp}
---
```

Body: root cause, fix applied, test added, commit hash.
Commit: `docs({phase}): fix summary for {description}`

Update STATE.md: note the fix, update position.
If known issue in CONCERNS.md, note resolution with commit hash.

Report: root cause, fix applied, test coverage added, related concerns.
