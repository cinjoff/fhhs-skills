---
phase: 12-eval-framework
plan: 01
subsystem: eval-infrastructure
tags: [eval, measurement, auto-improve]
requires: []
provides:
  - "--coverage flag for eval gap analysis"
  - "Baseline comparison in auto-improve"
  - "3 fixture-backed auto evals (corrupt state, milestone done, walk-away)"
  - "Measurement workflow documentation"
affects: []
tech-stack:
  added: []
  patterns: ["fixture-backed evals", "coverage gap analysis"]
key-files:
  created:
    - evals/fixtures/auto-corrupt-state/.planning/.auto-state.json
    - evals/fixtures/auto-corrupt-state/.planning/PROJECT.md
    - evals/fixtures/auto-corrupt-state/.planning/ROADMAP.md
    - evals/fixtures/auto-corrupt-state/.planning/STATE.md
    - evals/fixtures/auto-milestone-done/.planning/PROJECT.md
    - evals/fixtures/auto-milestone-done/.planning/ROADMAP.md
    - evals/fixtures/auto-milestone-done/.planning/STATE.md
    - evals/fixtures/auto-walk-away/.planning/PROJECT.md
    - evals/fixtures/auto-walk-away/.planning/ROADMAP.md
    - evals/fixtures/auto-walk-away/.planning/STATE.md
  modified:
    - fhhs-skills-workspace/run_all_evals.py
    - .claude/commands/auto-improve.md
    - evals/evals.json
    - CLAUDE.md
key-decisions:
  - "Force-added fixture .planning/ dirs past gitignore — eval fixtures must be tracked"
  - "49 shipped skills detected, 24 covered (48%) — baseline for coverage improvement"
  - "5 startup-* skills added to COMMAND_MAP for accurate coverage reporting"
requirements-completed: [REQ-54, REQ-55, REQ-56, REQ-57]
test_metrics:
  tests_passed: 0
  tests_failed: 0
  tests_total: 0
  coverage_line: null
  coverage_branch: null
  test_files_created: []
  spec_tests_count: 0
duration: "3m"
completed: "2026-03-29T19:30:00Z"
---

# Phase 12 Plan 01: Eval Framework & Measurement Loop

Coverage gap analysis, baseline comparison, fixture-backed auto evals, and measurement workflow documentation.

## What Was Done

- **--coverage flag:** Added to `run_all_evals.py` — scans `.claude/skills/*/SKILL.md`, compares against COMMAND_MAP and evals.json, prints coverage table (49 skills, 24 covered = 48%)
- **COMMAND_MAP gaps:** Added 5 missing startup-* skills (advisor, competitors, design, pitch, positioning) so coverage reporting is accurate
- **Baseline integration:** auto-improve now reads `baselines.json` at Step 0, shows "vs baseline" delta in trend table, auto-saves baselines after successful improvement
- **Fixture directories:** 3 auto eval fixtures — corrupt `.auto-state.json` (truncated JSON), all-phases-complete milestone, bare walk-away project
- **New evals:** IDs 325-327 in evals.json — corrupt state recovery, milestone completion detection, walk-away from description (all tier: smoke)
- **CLAUDE.md:** Added Measurement Workflow section with 3-step before/change/after process

## Task Commits

| Task | Name | Key Files |
|------|------|-----------|
| 1 | --coverage flag + COMMAND_MAP | run_all_evals.py |
| 2 | Baseline comparison in auto-improve | auto-improve.md |
| 3 | Fixture directories | evals/fixtures/auto-{corrupt-state,milestone-done,walk-away}/ |
| 4 | Fixture-backed evals | evals.json |
| 5 | Measurement workflow docs | CLAUDE.md |

## Deviations from Plan

- **[Rule 3 - Blocking]** Fixture `.planning/` dirs blocked by top-level `.gitignore` pattern — force-added with `git add -f`

## Issues Encountered

None.

## Verification

- `python3 run_all_evals.py --coverage` — prints 49 skills, 24 covered (48%), 25 uncovered
- `python3 -c "import json; json.load(open('evals/evals.json'))"` — valid, 265 evals
- Corrupt fixture JSON fails parse as expected
- All 10 fixture files exist on disk
- `baselines.json` referenced 3 times in auto-improve.md
- Measurement Workflow section present in CLAUDE.md

## Test Results

- **Tests:** N/A — no test runner for Python eval scripts or Markdown skills
- **Coverage:** not configured
- **Test files created:** none
- **Spec-generated tests:** no

## Next Phase Readiness

Phase 12 plan 01 is complete. The eval infrastructure now supports:
- Gap analysis via `--coverage`
- Before/after measurement via baselines
- Fixture-backed scenario testing for auto skill
