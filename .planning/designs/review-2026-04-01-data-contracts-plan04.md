# Plan Review: 16-04 Validation & Conventions

**Date:** 2026-04-01
**Mode:** HOLD SCOPE
**Plan:** `.planning/phases/16-data-contracts/16-04-PLAN.md`

## System Audit

- Plans 01-03 exist but not yet executed (no SUMMARYs). Plan 04 dependencies are correctly declared (wave 3, depends_on: [1,2,3]).
- `saveAutoState()` still has ~10 call sites in auto-orchestrator.cjs — Plan 02 will eliminate these before Plan 04 runs.
- `references/schemas/` and `bin/lib/paths.cjs` don't exist yet — created by Plans 01 and 03 respectively.
- Branch `fix-orchestrator-tool-listening` has uncommitted changes to auto-orchestrator.cjs.
- CONTEXT.md has 6 locked decisions, all aligned with the plan.

## Architecture Diagram

```
  Plan 01 (schemas/)──┐
                       ├──▶ Plan 04 (validation + evals)
  Plan 02 (single     │        │
   writer merge) ─────┤        ├── bin/lib/schemas.cjs (NEW)
                       │        ├── references/skill-authoring-guide.md (EDIT)
  Plan 03 (paths.cjs)─┘        └── evals/schema-compliance-*.yml (NEW x3)
```

## Data Flow: validateAutoState at Write Boundary

```
  buildAutoStatus()
       │
       ▼
  validateAutoState(status)
       │
       ├── warnings? ──▶ stderr log (non-blocking)
       │
       ▼
  writeAutoStatus() ──▶ .auto-state.json
```

Shadow paths:
- nil input → return { warnings: ["input is null"] }, log, continue
- empty object → return { warnings: [...all missing fields] }, log, continue
- malformed types → return { warnings: ["field X: expected Y got Z"] }, log, continue
- All paths fail-open — never throw, never block

## Issues Found & Resolved

### 1. FIXED: Misleading `valid` boolean (Architecture)
**Problem:** Fail-open design means `valid` is always `true` — useless field.
**Fix:** Changed return type to `{ warnings: string[] }`. Callers check `warnings.length === 0`.

### 2. FIXED: Speculative validators (Code Quality)
**Problem:** `validateRegistryEntry()` and `validatePlanFrontmatter()` had no callers, no wiring, no eval coverage. Dead code on arrival.
**Fix:** Removed from Task 1 scope. Deferred to CONTEXT.md for when consumers exist.

### 3. FIXED: Confusing verify command (Tests)
**Problem:** `validateAutoState({active:true}).valid` — "should return true with warnings" is contradictory.
**Fix:** Updated to check `warnings.length > 0` and explain expected behavior.

## Error & Rescue Map

```
  METHOD/CODEPATH          | WHAT CAN GO WRONG           | ERROR TYPE
  -------------------------|-----------------------------|-----------------
  validateAutoState(obj)   | obj is null/undefined       | TypeError
                           | field has wrong type         | ValidationWarning
                           | required field missing       | ValidationWarning
  -------------------------|-----------------------------|-----------------

  ERROR TYPE               | RESCUED? | RESCUE ACTION          | USER SEES
  -------------------------|----------|------------------------|------------------
  TypeError (null input)   | Y        | Return warnings array  | stderr warning
  ValidationWarning        | Y        | Add to warnings, log   | stderr warning
```

No CRITICAL GAPS — fail-open design handles all paths by construction.

## Failure Modes Registry

```
  CODEPATH            | FAILURE MODE        | RESCUED? | TEST? | USER SEES? | LOGGED?
  --------------------|---------------------|----------|-------|------------|--------
  validateAutoState   | null input          | Y        | Y     | stderr     | Y
  validateAutoState   | wrong types         | Y        | Y     | stderr     | Y
  validateAutoState   | extra fields        | Y (pass) | N     | nothing    | N
  writeAutoStatus     | validation warning  | Y        | Y     | stderr     | Y
```

No CRITICAL GAPS.

## Test Coverage Diagram

```
  ┌──────────────────────────────────────────────────┐
  │           TEST COVERAGE DIAGRAM                  │
  ├──────────────────┬───────────┬───────────────────┤
  │ CODEPATH         │ TEST TYPE │ STATUS            │
  ├──────────────────┼───────────┼───────────────────┤
  │ validateAutoState│ Eval      │ ✓ schema-compliance-auto-state │
  │ schemas dir      │ Eval      │ ✓ schema-compliance-smoke      │
  │ paths.cjs import │ Eval      │ ✓ schema-compliance-paths      │
  │ Data Contracts   │ Eval      │ ✓ (checked via grep in evals)  │
  │ extra fields     │ Unit      │ ✗ Not specified — OK (pass-through) │
  └──────────────────┴───────────┴───────────────────┘
```

## What Already Exists
- `writeAutoStatus()` in auto-orchestrator.cjs — the target write boundary
- `buildAutoStatus()` — the state builder (Plan 02 will make this the single writer)
- `skill-authoring-guide.md` — 76 lines, well-structured for a new section

## Dream State Delta
```
  CURRENT STATE                  THIS PLAN                  12-MONTH IDEAL
  No validation,           →     Fail-open validation    →   Contract-tested
  no conventions,                at write boundaries,         producer/consumer
  implicit schemas               formal authoring rules,      pairs, CI enforcement,
                                 3 compliance evals           auto-generated types
```

## Completion Summary

```
  +====================================================================+
  |            PLAN REVIEW — COMPLETION SUMMARY                        |
  +====================================================================+
  | Mode selected        | HOLD SCOPE                                  |
  | System Audit         | Deps 01-03 unexecuted but correctly declared|
  | Step 0               | HOLD — scope is right for final wave        |
  | Section 1  (Arch)    | 1 issue found (valid boolean) — FIXED       |
  | Section 2  (Errors)  | 3 error paths mapped, 0 GAPS                |
  | Section 3  (Security)| 0 issues (no new attack surface)            |
  | Section 4  (Data/UX) | 3 shadow paths mapped, 0 unhandled          |
  | Section 5  (Tests)   | Diagram produced, 0 gaps                    |
  | Section 6  (Future)  | Reversibility: 5/5, debt items: 0           |
  +--------------------------------------------------------------------+
  | Section 7  (Eng Arch)| 0 issues (clean dependency chain)           |
  | Section 8  (Code Ql) | 1 DRY violation (speculative validators) — FIXED |
  | Section 9  (Eng Test)| Test diagram produced, 0 gaps               |
  | Section 10 (Perf)    | 0 issues (validation is O(1) field checks)  |
  +--------------------------------------------------------------------+
  | PLAN.md updated      | 2 truths added, 0 artifacts added           |
  | CONTEXT.md updated   | 3 decisions locked, 2 items deferred        |
  | Error/rescue registry| 2 methods, 0 CRITICAL GAPS                  |
  | Failure modes        | 4 total, 0 CRITICAL GAPS                    |
  | Diagrams produced    | 3 (architecture, data flow, test coverage)  |
  | Unresolved decisions | 0                                           |
  +====================================================================+
```
