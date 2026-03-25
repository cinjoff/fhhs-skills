---
phase: 02-upstream-sync
plan: 01
subsystem: sync-upstream
tags: [upstream-sync, validation, regression-detection, eval-infrastructure]
requires: []
provides:
  - "Pre-sync validation (Step 0.5) with 4-pattern path checking"
  - "Git checkpoint (Step 3.5) with --include-untracked stash"
  - "Post-sync regression detection (Step 4.5) with targeted eval runs"
  - "Registry eval_commands field for deterministic upstream-to-eval mapping"
  - "--commands filter in eval runner for targeted runs"
  - "4 new evals covering validation and regression flows"
affects: []
tech-stack:
  added: []
  patterns:
    - "Explicit eval_commands mapping per upstream (no runtime inference)"
    - "4-pattern path validation for forked skill types"
key-files:
  created: []
  modified:
    - ".claude/skills/sync-upstream/SKILL.md"
    - ".claude/skills/sync-upstream/references/upstream-registry.md"
    - "fhhs-skills-workspace/run_all_evals.py"
    - "evals/evals.json"
key-decisions:
  - "eval_commands are explicit in registry — no runtime inference from forked_to paths"
  - "4 path patterns for validation: PROMPT.md (internal), SKILL.md (shipped), .md (agents), .md (commands)"
  - "Git stash uses --include-untracked to capture new snapshot directories"
  - "Eval runner failure is non-blocking — warns but doesn't block sync"
requirements-completed:
  - REQ-08
  - REQ-09
  - REQ-10
duration: "7m"
completed: "2026-03-25T15:10:00.000Z"
---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Duration | ~7 minutes |
| Commits | 4 |
| Files modified | 4 |
| Evals added | 4 (IDs 194-197) |
| Total sync-upstream evals | 6 |

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Pre-validation + git checkpoint + regression check | `b8b92b5` feat(02-01) | .claude/skills/sync-upstream/SKILL.md |
| 2 | eval_commands in upstream registry | `a917ca8` feat(02-01) | .claude/skills/sync-upstream/references/upstream-registry.md |
| 3 | --commands filter for eval runner | `0848efd` feat(02-01) | fhhs-skills-workspace/run_all_evals.py |
| 4 | Sync-upstream validation and regression evals | `e12d75c` test(02-01) | evals/evals.json |

## What Was Done

- Added Step 0.5 (Pre-Sync Validation) to sync-upstream skill — validates forked paths exist using 4-pattern matching, checks snapshot directories, confirms PATCHES.md entries
- Added Step 3.5 (Git Checkpoint) — creates stash with --include-untracked before file modifications, warns on failure instead of silently proceeding
- Added Step 4.5 (Post-Sync Regression Check) — reads eval_commands from registry, runs targeted evals, offers rollback on failure with 3 options (fix, revert, commit anyway)
- Added eval_commands field to all 8 upstream entries in the registry
- Added --commands argument to eval runner for targeted eval runs
- Added 4 new evals covering pre-validation failures and post-sync regression detection

## Decisions Made

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Explicit eval_commands per upstream | Deterministic, no ambiguity from forked_to inference | Runtime path-to-command mapping (rejected: ambiguous for internal skills) |
| 4-pattern path validation | Each path type uses different file conventions | Single pattern for all (rejected: would miss agents and commands) |
| Non-blocking eval runner failure | User can run evals manually | Blocking on runner failure (rejected: too aggressive for script issues) |

## Deviations from Plan

None.

## Issues Encountered

None.

## Self-Check

PASSED — All verification checks confirmed:
- Step 0.5/3.5/4.5 present in SKILL.md (6 matches)
- eval_commands in registry (9 matches: 8 upstreams + legend)
- --commands in eval runner help output
- 6 total sync-upstream evals
- Valid JSON in evals.json
- All 4 key files exist on disk
- All 4 commits present in git log

## Next Phase Readiness

Phase 2 core goal achieved: upstream updates can be incorporated with pre-validation, git checkpoint safety, and post-sync regression detection. The sync-upstream workflow now prevents undetected breakage from upstream changes.

Note: 14 eval_commands reference commands not yet in COMMAND_MAP (design commands, nextjs-perf, playwright-testing, refactor). These will resolve as the COMMAND_MAP is extended in future work.
