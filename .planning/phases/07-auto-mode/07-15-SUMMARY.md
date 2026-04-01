---
phase: 07-auto-mode
plan: 15
subsystem: auto, cli
tags: [bugfix, migration, verification]
requires: []
provides:
  - "gsd-tools resolves via os.homedir() globally — works in all Conductor workspaces"
  - "smart_search fully migrated to search with project parameter"
  - "verify path-consistency subcommand catches future path drift"
affects: []
tech-stack:
  added: []
  patterns: [global-path-resolution, verify-subcommand]
key-files:
  created: []
  modified:
    - .claude/skills/auto/auto-orchestrator.cjs
    - .claude/skills/auto/SKILL.md
    - .claude/skills/auto/CONTEXT-SHARING.md
    - .claude/skills/learnings/SKILL.md
    - .claude/skills/optimize/SKILL.md
    - .claude/skills/audit/SKILL.md
    - bin/lib/core.cjs
    - bin/lib/verify.cjs
    - bin/gsd-tools.cjs
key-decisions:
  - "Global $HOME only for gsd-tools — no repo-local probe, no dual-probe from upstream"
  - "JSONL dedup via logEvent() delegation — single write path"
  - "Path-consistency verify scans both .claude/skills/ and bin/ directories"
requirements-completed: []
test_metrics:
  tests_passed: 5
  tests_failed: 0
  tests_total: 5
  coverage_line: null
  coverage_branch: null
  test_files_created: []
  spec_tests_count: 0
duration: "3m"
completed: "2026-03-29T19:35:00Z"
---

# Plan 07-15 Summary: gsd-tools path resolution + smart_search migration

## What Was Done

- **Path fix:** `updateStateViaGsd()` in auto-orchestrator now resolves gsd-tools via `os.homedir()` instead of `projectDir` — fixes broken state updates in Conductor workspaces
- **JSONL dedup:** `log()` function delegates to `logEvent()` — eliminates duplicate JSONL writes (appendFileSync to _jsonlLogPath appears exactly once)
- **smart_search migration:** All 5 remaining `smart_search` references across 4 shipped skills migrated to `search` with `project` parameter
- **gsdToolsPath() helper:** Added to `bin/lib/core.cjs` for bin/ consumers (skills use `os.homedir()` inline due to shipping boundary)
- **verify path-consistency:** New subcommand scans .cjs files for `path.join(projectDir...get-shit-done)` violations — catches future drift
- **Documentation:** SKILL.md and 07-CONTEXT.md updated to reflect global-only design decision

## Verification Results

| Check | Result |
|-------|--------|
| `gsdToolsPath()` returns $HOME path | PASS |
| No `projectDir+get-shit-done` in .claude/skills/ | PASS (0 matches) |
| No `smart_search` in .claude/skills/ | PASS (0 matches) |
| `appendFileSync.*_jsonlLogPath` count = 1 | PASS |
| `verify path-consistency` | PASS (0 violations, 17 files checked) |

## Decisions Made

| Decision | Rationale | Alternatives |
|----------|-----------|-------------|
| Global $HOME only | fhhs uses /fh:setup symlinks (always global) — dual-probe unnecessary | Upstream's resolveGsdToolsPath with repo-local fallback |
| logEvent() delegation | Single JSONL write path prevents duplicate log entries | Inline appendFileSync with dedup guard |
| Self-match prevention in verify | Scan patterns split via concatenation to avoid flagging own implementation | Exclude list, regex lookahead |

## Deviations from Plan

None.

## Issues Encountered

None.

## Test Results

- **Tests:** 5/5 verification checks passing
- **Coverage:** not configured (CLI tooling, no test runner)
- **Test files created:** none
- **Spec-generated tests:** no — 0 test skeletons (config/CLI tasks only)
