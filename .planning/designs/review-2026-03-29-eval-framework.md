# Plan Review: Phase 12 Eval Framework (12-01)

**Date:** 2026-03-29
**Mode:** HOLD SCOPE
**Plan:** `.planning/phases/12-eval-framework/12-01-PLAN.md`

## What Already Exists

The eval infrastructure is mature:
- `run_all_evals.py`: 262 evals, token tracking, baselines, regression detection, fixture support, LLM grader
- `baselines.json`: per-command metrics (currently 4 commands)
- `auto-improve.md`: iterative eval improvement loop
- Deterministic checks (required_terms, forbidden_terms, regex) already in runner
- Per-eval fixture selection via `fixture` field

## Findings Applied to Plan

### CRITICAL: COMMAND_MAP gap (5 startup skills)
- `startup-advisor`, `startup-competitors`, `startup-design`, `startup-pitch`, `startup-positioning` are shipped but not in COMMAND_MAP
- Without mapping, `--coverage` misreports them and they can't be eval'd
- **Fixed:** Task 1 step 4 now requires adding all 5 missing startup skills to COMMAND_MAP

### Count correction
- Plan said "23 uncovered" — actual is 25 (49 shipped - 24 with evals)
- **Fixed:** Verification step corrected

### Review truth added
- `[review] All shipped skills (including startup-*) have COMMAND_MAP entries so --coverage reporting is accurate`

## Architecture

```
  SHIPPED SKILLS (49)
       │
       ▼
  COMMAND_MAP (44 → 49 after fix)
       │
       ▼
  --coverage scan ──► Gap Report
       │
  EVALS.JSON (262 evals, 24 commands)
       │
       ▼
  BASELINES.JSON ◄── --update-baselines
       │
       ▼
  auto-improve loop
    ├── Run evals
    ├── Read baselines (NEW: Step 0)
    ├── Analyze failures
    ├── Apply fixes
    └── Update baselines on improvement
```

## Error Paths

| Codepath | Failure | Handled? |
|---|---|---|
| --coverage scan finds skill dir without SKILL.md | Skip gracefully | YES (glob pattern ensures SKILL.md) |
| baselines.json missing when auto-improve reads | "No baselines found" message | YES (planned in Task 2) |
| baselines.json malformed JSON | Python json.load raises | NO — but pre-existing risk, not introduced by plan |
| Fixture directory referenced in eval doesn't exist | Falls back to default with WARNING | YES (existing code at line 126) |

## Test Coverage

```
  ┌──────────────────────────────────────────────────────┐
  │           TEST COVERAGE DIAGRAM                      │
  ├──────────────────────┬───────────┬───────────────────┤
  │ CODEPATH             │ TEST TYPE │ STATUS            │
  ├──────────────────────┼───────────┼───────────────────┤
  │ --coverage flag      │ Manual    │ Verify step only  │
  │ auto-corrupt-state   │ Eval      │ NEW (Task 4)      │
  │ auto-milestone-done  │ Eval      │ NEW (Task 4)      │
  │ auto-walk-away       │ Eval      │ NEW (Task 4)      │
  │ baseline reading     │ Manual    │ Verify step only  │
  │ COMMAND_MAP complete │ --coverage │ Self-verifying   │
  └──────────────────────┴───────────┴───────────────────┘
```

## Dream State Delta

```
  CURRENT STATE                  THIS PLAN                    12-MONTH IDEAL
  262 evals, 24/49 skills  →    262+ evals, 24/49 skills  →  All 49 skills covered
  No coverage visibility         --coverage shows gaps         Coverage gates in CI
  Manual baseline comparison     auto-improve reads baselines  Auto-regression alerts
  3 auto evals                   6 auto evals (fixture-backed) Fixture-backed evals for all composite skills
```

## Completion Summary

```
  +====================================================================+
  | Mode selected        | HOLD SCOPE                                  |
  | System Audit         | 5 startup skills missing from COMMAND_MAP   |
  | Step 0               | HOLD — scope correct, 1 critical gap fixed  |
  | Section 1  (Arch)    | 1 issue (COMMAND_MAP gap)                   |
  | Section 2  (Errors)  | 4 error paths mapped, 0 GAPS               |
  | Section 3  (Security)| 0 issues (no new attack surface)            |
  | Section 4  (Data/UX) | 0 unhandled edge cases                     |
  | Section 5  (Tests)   | Diagram produced, 0 critical gaps           |
  | Section 6  (Future)  | Reversibility: 5/5, debt items: 0          |
  +--------------------------------------------------------------------+
  | Section 7  (Eng Arch)| 1 issue (COMMAND_MAP completeness)          |
  | Section 8  (Code Ql) | 0 DRY violations, 0 over/under-eng         |
  | Section 9  (Eng Test)| Test diagram produced, 0 gaps               |
  | Section 10 (Perf)    | 0 issues                                    |
  +--------------------------------------------------------------------+
  | PLAN.md updated      | 1 truth added, 0 artifacts added            |
  | CONTEXT.md updated   | 2 decisions added, 1 item deferred          |
  | Error/rescue registry| 4 paths, 0 CRITICAL GAPS                   |
  | Failure modes        | 4 total, 0 CRITICAL GAPS                    |
  | Diagrams produced    | 2 (architecture, test coverage)             |
  | Unresolved decisions | 0                                           |
  +====================================================================+
```
