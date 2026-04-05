---
name: fh:fix
description: Fix a bug. Finds the root cause, writes a test, and patches it.
user-invocable: true
---

Auto-triage and fix bugs with TDD discipline.

The issue: $ARGUMENTS

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user: "No project found.

→ Run /fh:new-project — set up project tracking before fixing bugs"). Engineering disciplines (TDD, verification) and design quality commands are built into this plugin.

This command runs in a single context by default. Escalates to parallel agents when needed.

---

## Codebase Freshness Check

See @.claude/skills/shared/freshness-check.md

---

### Past Learnings Check

Follow **Pattern A** (Past Learnings Check) from `shared/claude-mem-rules.md`. Keywords: error message fragment, file name, subsystem name, "bug fix root cause regression". Feed findings into triage context so past root causes inform the current investigation.

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

## Step 0.5: Static Analysis (if available)

If `fallow` is installed, run a targeted static analysis pass before deep debugging.

```bash
if command -v fallow &>/dev/null; then
  FALLOW_CHECK=$(fallow check --format json --quiet 2>/dev/null) || FALLOW_CHECK=""
  FALLOW_HEALTH=$(fallow health --format json --quiet 2>/dev/null) || FALLOW_HEALTH=""
fi
```

If Fallow ran and produced non-empty output, scan results for entries related to the reported symptom (matching filename, module, or error type). Surface any matching findings as starting evidence for triage — dead code, circular deps, or complexity spikes near the bug site often reveal the root cause faster than reading source.

If fallow is NOT installed: skip this step silently. Do not mention Fallow.

Budget: less than 1% context.

---

## Step 1: Triage

Quickly assess bug depth before choosing strategy. Spend <5% context.

**Token-efficient code navigation:** Use **Pattern B** (Code Structure Exploration) from `shared/claude-mem-rules.md` — smart_outline/smart_unfold before full Read.

**SPEC.md failure mode check (if applicable):** Resolve artifacts per @.claude/skills/shared/artifact-resolution.md. Check for SPEC.md via the resolution chain. If found, use **Pattern G** (`smart_unfold` Failure Modes section) from `shared/claude-mem-rules.md`. Cross-reference the reported bug against listed failure modes:
- If the bug matches a listed failure mode: annotate triage as **"Predicted failure"** — the spec anticipated this. This often reveals the intended fix strategy.
- If no match: annotate as **"Unpredicted failure"** — may indicate a spec gap or an unanticipated edge case.
- If no SPEC.md or claude-mem unavailable: skip silently, proceed with standard triage.

If Fallow findings were collected in Step 0.5, cross-reference them here first — matching entries may immediately classify depth and point to root cause.

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
- **PARALLEL:** Dispatch one **`fh:gsd-debugger`** agent per subsystem (specialized — scientific debugging with hypothesis tracking). Each agent gets: the specific failure, relevant files, and instruction to produce root cause + proposed fix. Collect results. Then Step 2 for each fix.
- **COMPLEX:** Write triage findings to `.planning/debug/{issue-slug}.md` with: error message, files investigated, hypotheses formed, test results observed. Slug convention: `YYYY-MM-DD-{first-3-words-kebab}` (e.g., `2026-03-06-payment-timeout-error`). If slug exists, append `-2`. Then dispatch a `fh:gsd-debugger` agent with the session file for sustained scientific investigation. If user says try anyway → MODERATE path.

**Todo integration:** After triage, scan `.planning/todos/` for items matching the bug (same file, same subsystem, or same error). If a todo matches, note its ID — mark it resolved after the fix lands in Step 2.

---

## Step 2: TDD Fix

If claude-mem is available, try `smart_search({query: "TDD red-green-refactor testing discipline"})` first — shared testing rules are often cached from prior sessions. If no results or claude-mem unavailable, read `.claude/skills/shared/testing-guide.md`. Follow Part B (TDD Discipline) completely:
- **RED:** Write failing test proving the bug
- **GREEN:** Minimal fix
- **REFACTOR:** Cleanup

If the bug is in frontend code and the project uses Playwright (check for `playwright.config.*`), follow Part D (E2E with Playwright) from the testing guide, and read `.claude/skills/playwright-testing/PROMPT.md` for the full decision tree. Use Page Object Model, role-based locators (`getByRole`, `getByLabel`), and web-first assertions.

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

Use **Pattern B** from `shared/claude-mem-rules.md` for reading DECISIONS.md and DESIGN.md context. Check against `skills/frontend-design/PROMPT.md` anti-patterns — no generic cards, cyan-on-dark, purple gradients, or other AI slop introduced by the fix.
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

### Pattern search (prevent recurrence)

After the fix is verified, search the codebase for similar vulnerable patterns:

1. Identify the root cause pattern (e.g., missing null check, unvalidated input, race condition)
2. **If ast-grep MCP tools are in the tool list** (see `@.claude/skills/shared/tool-availability.md`), use `find_code_by_rule` to structurally find all instances of the bug pattern across source files. This is more precise than text search for structural patterns. Do NOT use ast-grep on Markdown files.
3. If ast-grep MCP is unavailable: use `mcp__plugin_claude-mem_mcp-search__smart_search` if claude-mem available (check tool list for `mcp__plugin_claude-mem_*`), then fall back to Grep/Glob directly.
4. If similar vulnerabilities found: fix them now if trivial (<5 lines each), or note them in the summary as "Related patterns found in: {files}" for follow-up

This step prevents the same class of bug from recurring elsewhere. Skip only if the root cause is truly unique to this one location.

**For MODERATE+ fixes:** Dispatch the `fh:design-simplify` agent on the fix diff. Then suggest `/fh:review` for comprehensive analysis.

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
If known issue in `.planning/codebase/CONCERNS.md`, note resolution with commit hash.
For bug investigation context: use `.planning/codebase/ARCHITECTURE.md` to understand system layers, `.planning/codebase/CONVENTIONS.md` for coding patterns, and `.planning/codebase/CONCERNS.md` for other known issues related to the fix.

### DECISIONS.md Correction (if applicable)

If `.planning/DECISIONS.md` exists, scan active decisions for entries whose Affects field references any file modified by this fix. If the root cause of the bug relates to an active decision (the decision's Selected option caused or contributed to the bug), log a `[CORRECTED]` entry to DECISIONS.md using the correction format from `.claude/skills/build/references/decisions-template.md`. Use `step='fix Step 4'` and `corrected_by='agent'`. If no decisions relate to the fix, skip silently.

### Persist Findings

Follow **Pattern D** (Persist Findings) from `shared/claude-mem-rules.md`. Use tag `[fix-learning]`. Skip trivial fixes (typo, missing import, config change).

---

Report: root cause, fix applied, test coverage added, related concerns.
