# Phase Completion Gates

Run after `gsd-tools verify phase-completeness` confirms all plans are complete.

## Regression Gate (before goal verification)

Run prior phases' test suites to catch cross-phase regressions BEFORE verification.

**Skip if:** This is the first phase (no prior phases), or no prior VERIFICATION.md files exist.

```bash
# Find all VERIFICATION.md files from prior phases
PRIOR_VERIFICATIONS=$(find .planning/phases/ -name "*-VERIFICATION.md" ! -path "*${PHASE_NUM}*" 2>/dev/null)
```

For each VERIFICATION.md found, look for test file references (lines containing `test`, `spec`, or `__tests__` paths). Collect unique test file paths. If any found, run:

```bash
if [ -f "package.json" ]; then
  npx jest ${REGRESSION_FILES} --passWithNoTests --no-coverage -q 2>&1 || npx vitest run ${REGRESSION_FILES} 2>&1
fi
```

If all tests pass: `✓ Regression gate: N prior-phase test files passed — no regressions detected` → proceed.

If any fail: present a table of failing tests with their origin phase. Offer: 1) Fix regressions before verification (recommended), 2) Continue to verification anyway, 3) Abort. Use AskUserQuestion if available, otherwise ask inline.

## Gate 0: Integration Check (runs before goal verification)

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

## Gate 1: Goal Verification

- For each `must_haves.truth` across all phase plans: find evidence (file exists, content matches, test passes)
- Run `gsd-tools verify artifacts` and `gsd-tools verify key-links` for each plan
- Requirements coverage: every requirement ID from ROADMAP in any plan's `requirements` must appear in at least one SUMMARY

## Gate 2: Final Verification

Uses Step 4's verification results if from the same session.

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

## PROJECT.md Evolution (after phase complete)

PROJECT.md tracks validated requirements, decisions, and current state. Without this step, it falls behind silently across phases.

1. Read `.planning/PROJECT.md`
2. If it has a `## Validated Requirements` or `## Requirements` section: move requirements validated by this phase from Active → Validated, add note: `Validated in Phase {X}: {Name}`
3. If it has a `## Current State` section: update to reflect this phase's completion
4. Update the `Last updated:` footer to today's date
5. Commit:
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(phase-${PHASE_NUM}): evolve PROJECT.md after phase completion" --files .planning/PROJECT.md
```

**Skip if** `.planning/PROJECT.md` does not exist.
