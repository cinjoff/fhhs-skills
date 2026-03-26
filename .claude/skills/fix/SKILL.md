---
name: fh:fix
description: Fix a bug. Finds the root cause, writes a test, and patches it.
user-invocable: true
---

Auto-triage and fix bugs with TDD discipline.

The issue: $ARGUMENTS

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user to run `/fh:new-project` first). Engineering disciplines (TDD, verification) and design quality commands are built into this plugin.

This command runs in a single context by default. Escalates to parallel agents when needed.

---

## Step 0: Check Runtime Errors

Before triaging from code alone, check if the local error store has runtime context.

1. Check if `.sentry-local/events.db` exists:
```bash
[ -f ".sentry-local/events.db" ] && echo "STORE_EXISTS" || echo "NO_STORE"
```

2. If `STORE_EXISTS`, query recent errors:
```bash
node lib/sentry-local-query.mjs recent --minutes 60
```

3. Use the results to inform triage:
   - If errors match the reported bug → use the stack trace, breadcrumbs, and request context as starting evidence
   - If errors show a pattern (same error repeating) → note the frequency
   - If no recent errors → proceed to Step 1 with code-only analysis

4. If `NO_STORE`: skip this step silently. The project may not have observability set up.

This step should consume <2% context. Don't deep-dive the errors yet — just surface them as input to triage.

---

## Step 0½: Fallow Static Analysis (if available)

Before triaging, gather deterministic findings from Fallow to augment investigation.

```bash
if command -v fallow &>/dev/null; then
  FALLOW_CHECK=$(fallow check --format json --quiet 2>/dev/null) || FALLOW_CHECK=""
  FALLOW_HEALTH=$(fallow health --format json --quiet 2>/dev/null) || FALLOW_HEALTH=""
fi
```

If Fallow ran and produced output:
- **`fallow check`** — unused exports, circular dependencies. If the bug involves an import or wiring issue, these findings are definitive ground truth.
- **`fallow health`** — complexity metrics. High-complexity functions near the bug site are more likely to harbor subtle issues.

**Cap:** Keep under 1% context. Filter to files mentioned in the bug report or error trace. Skip if Fallow is not installed — no mention in output.

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

**Anti-drift rule:** Once a triage strategy is selected (SIMPLE/MODERATE/PARALLEL/COMPLEX), commit fully. Do not escalate to a higher strategy mid-fix unless new evidence proves the initial assessment wrong. Do not fix adjacent issues — log them to `.planning/todos/` instead.

Execute the chosen path:
- **SIMPLE:** Skip to Step 2 — cause is clear from triage.
- **MODERATE:** Read `skills/systematic-debugging/PROMPT.md` and follow it completely. Then Step 2.
- **PARALLEL:** Dispatch one **`gsd-debugger`** agent per subsystem (specialized — scientific debugging with hypothesis tracking). Each agent gets: the specific failure, relevant files, and instruction to produce root cause + proposed fix. Collect results. Then Step 2 for each fix.
- **COMPLEX:** Write triage findings to `.planning/debug/{issue-slug}.md` with: error message, files investigated, hypotheses formed, test results observed. Slug convention: `YYYY-MM-DD-{first-3-words-kebab}` (e.g., `2026-03-06-payment-timeout-error`). If slug exists, append `-2`. Then dispatch a `gsd-debugger` agent with the session file for sustained scientific investigation. If user says try anyway → MODERATE path.

**Todo integration:** After triage, scan `.planning/todos/` for items matching the bug (same file, same subsystem, or same error). If a todo matches, note its ID — mark it resolved after the fix lands in Step 2.

---

## Step 2: TDD Fix

Read `skills/test-driven-development/PROMPT.md` and follow it completely:
- **RED:** Write failing test proving the bug
- **GREEN:** Minimal fix
- **REFACTOR:** Cleanup

If the bug is in frontend code and the project uses Playwright (check for `playwright.config.*`), write the failing test using Playwright patterns from `.claude/skills/playwright-testing/PROMPT.md`. Follow the Page Object Model pattern for test structure and use role-based locators (`getByRole`, `getByLabel`) over CSS selectors. See `.claude/skills/playwright-testing/PROMPT.md` for the full locator priority and assertion patterns.

**Breakpoint-specific verification:** If the fix targets a CSS/layout bug at a specific viewport or breakpoint, verify at that exact breakpoint. Resize to the target width (e.g., 768px for tablet, 375px for mobile) and confirm the layout is correct. If Playwright is available, use `page.setViewportSize()` in the test.

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
- Check against `skills/frontend-design/PROMPT.md` anti-patterns — no generic cards, cyan-on-dark, purple gradients, or other AI slop introduced by the fix
- If significant UI change, suggest `/fh:ui-test`

---

## Step 4: Post-Fix Review

### Verification gate

Before claiming the fix is complete, read `skills/verification-before-completion/PROMPT.md`
and follow its gate function:

1. **IDENTIFY** the verification command that proves the fix works:
   - The test written in Step 2 must pass
   - The original reproduction must no longer occur
   - Related test suites must still pass (no regressions)
2. **RUN** each command fresh
3. **READ** full output — check exit code, count failures
4. **VERIFY** the fix is confirmed before proceeding

If verification fails: return to Step 2 and iterate. Do NOT proceed to review
or summary if the fix isn't verified.

**For MODERATE+ fixes:** Read `skills/simplify/PROMPT.md` and follow it on the fix diff. Then suggest `/fh:review` for comprehensive analysis.

**For SIMPLE fixes:** Suggest `/fh:review --quick` for a fast quality check.

Do NOT auto-invoke /fh:review. The user decides when to run analysis.

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
