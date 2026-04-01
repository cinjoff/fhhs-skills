# Plan Review: Sync-Upstream Validation & Regression Detection

**Date:** 2026-03-25
**Plan:** `.planning/phases/02-upstream-sync/02-01-PLAN.md`
**Mode:** HOLD SCOPE

## Completion Summary

```
+====================================================================+
|            PLAN REVIEW — COMPLETION SUMMARY                        |
+====================================================================+
| Mode selected        | HOLD SCOPE                                  |
| System Audit         | Clean baseline, no prior review cycles       |
| Step 0               | HOLD — well-scoped infrastructure fix        |
| Section 1  (Arch)    | 1 issue: git stash missing --include-untrack |
| Section 2  (Errors)  | 8 error paths mapped, 3 CRITICAL GAPS fixed  |
| Section 3  (Security)| 0 issues — internal tooling, low surface     |
| Section 4  (Data/UX) | 1 issue: forked_to → eval mapping ambiguity  |
| Section 5  (Tests)   | 4 evals planned, 1 gap noted (stash failure) |
| Section 6  (Future)  | Reversibility: 5/5, debt items: 0            |
+--------------------------------------------------------------------+
| PLAN.md updated      | 5 truths added, 2 artifacts added            |
| CONTEXT.md updated   | 6 decisions locked, 2 items deferred         |
| Error/rescue registry| 8 methods, 3 CRITICAL GAPS → PLAN.md         |
| Failure modes        | 8 total, 0 remaining CRITICAL GAPS           |
| Diagrams produced    | 1 (sync flow architecture)                   |
| Unresolved decisions | 0                                            |
+====================================================================+
```

## What Already Exists

- Sync skill (Steps 0-7): complete workflow for checking, fetching, diffing, patching, documenting
- Upstream registry: 8 entries with forked_to mappings
- PATCHES.md + COMPATIBILITY.md: well-maintained
- Eval runner: `fhhs-skills-workspace/run_all_evals.py` with LLM grading
- 1 existing sync-upstream eval

## Key Review Findings

1. **git stash --include-untracked** — plain stash misses new snapshot directories
2. **4 path patterns** — validation must handle PROMPT.md, SKILL.md, bare .md, and command paths
3. **Missing eval runner filter** — no `--commands` flag existed, added as Task 3
4. **Explicit eval_commands** — registry needs explicit mapping instead of runtime inference
5. **Stash failure handling** — must warn user, not silently proceed

## Architecture Diagram

```
Step 0: Load Registry
    │
    ▼
*Step 0.5: Pre-Sync Validation ◄── registry.forked_to paths
    │                                  upstream/ snapshots
    │                                  PATCHES.md sections
    ▼
Step 1: Check for Updates (gh API)
    │
    ▼
Step 2: Fetch & Summarize Changes
    │
    ▼
Step 3: Cross-Reference Patches
    │
    ▼
*Step 3.5: Git Checkpoint ◄── git stash push --include-untracked
    │
    ▼
Step 4: Apply Updates (snapshot swap + patch reapply)
    │
    ▼
*Step 4.5: Post-Sync Regression ◄── registry.eval_commands
    │                                  run_all_evals.py --commands
    ├── PASS → Step 5
    └── FAIL → offer rollback (git stash pop)
    │
    ▼
Step 5-7: Opportunities, Docs, Summary
```

## Dream State Delta

```
CURRENT STATE                    THIS PLAN                      12-MONTH IDEAL
Manual sync, no validation  →  Validated sync with             →  CI alerts on new
No regression detection        regression check + rollback        upstream versions,
Silent failures possible       Targeted eval runs                 auto-PR with sync
                               Explicit eval_commands mapping     + eval results
```
