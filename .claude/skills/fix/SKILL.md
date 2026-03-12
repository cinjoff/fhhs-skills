---
name: fix
description: Auto-triage and fix bugs with TDD discipline. Use when the user reports a bug, error, test failure, broken behavior, or says 'fix', 'debug', 'something is wrong', 'this broke', or 'not working'. Handles simple single-file fixes through complex multi-subsystem failures.
user-invokable: true
---

Auto-triage and fix bugs with TDD discipline.

The issue: $ARGUMENTS

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user to run `/fh:new-project` first). Engineering disciplines (TDD, verification) and design quality commands are built into this plugin.

This command runs in a single context by default. Escalates to parallel agents when needed.

---

## Step 1: Triage

Quickly assess bug depth before choosing strategy. Spend <5% context.

1. **Search** for error message or symptom in codebase. **Use LSP first:**
   - `findReferences` on the error site to see all callers
   - `hover` on expressions for type mismatches
   - `goToDefinition` to trace imports to their source
   - `diagnostics` to surface type errors and linting issues without running code
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

If the bug is in frontend code and the project uses Playwright (check for `playwright.config.*`), write the failing test using Playwright patterns from `skills/playwright-testing/`. Use proper locators (`getByRole`, `getByLabel`, `getByTestId`) over CSS selectors.

When writing tests or fixes in TypeScript, follow TypeScript strictness rules: no `any`, use proper type guards, exhaustive switches.

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

## Step 4: Pre-Promotion Review

**For MODERATE+ fixes:** Invoke `skills/simplify/` first on the fix diff (multi-file fixes often introduce duplicated patterns or miss existing utilities), then invoke `skills/review/`.

**For SIMPLE fixes:** Invoke `skills/review/` directly (skip simplify — single-file fixes don't benefit from a reuse/efficiency pass).

`skills/review/` handles:
- Quality check (verifies fix addresses root cause, not just symptom)
- Security scan on changed files
- Evidence verification (tests, build, lint — fresh output with exit codes)
- TypeScript strictness check
- Promotion (PR/merge/keep/discard with conventional commit title)

**Context for /review:** Root cause, fix applied, test added, triage depth.

If /review reports BLOCKED findings: fix them, then re-invoke /review.

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
