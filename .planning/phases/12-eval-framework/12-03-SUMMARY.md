---
phase: 12-eval-framework
plan: 03
subsystem: evals
tags: [evals, quality, authoring]
requires: []
provides:
  - "Deterministic checks on 25 evals (5 smoke-tier + 20 full-tier)"
  - "Playwright path resolution aligned across skill files"
  - "Skill authoring guide codifying non-interactive guards, eval standards, path rules"
  - "CLAUDE.md Skill Authoring Rules section"
affects: []
tech-stack:
  added: []
  patterns: []
key-files:
  created:
    - references/skill-authoring-guide.md
  modified:
    - evals/evals.json
    - .claude/skills/build/references/testing-manifesto.md
    - CLAUDE.md
key-decisions:
  - "Smoke-tier evals get 2-3 checks; full-tier evals get 2 checks minimum"
  - "Authoring rules placed in both a detailed guide (references/) and concise CLAUDE.md section"
requirements-completed:
  - REQ-56
test_metrics:
  tests_passed: 0
  tests_failed: 0
  tests_total: 0
  coverage_line: null
  coverage_branch: null
  test_files_created: []
  spec_tests_count: 0
duration: ~5min
completed: "2026-03-30T01:15:00.000Z"
---

Deterministic eval checks added to 25 evals and skill authoring standards codified into guide and CLAUDE.md.

## Performance Metrics

- 25 evals upgraded with deterministic regex checks
- 4 files modified, 1 file created
- No test suite (evals are the test suite)

## Task Commits

| Task | Name | Key Files |
|------|------|-----------|
| 1 | Add checks to 5 smoke-tier evals | evals/evals.json |
| 2 | Add checks to 20 full-tier evals | evals/evals.json |
| 3 | Standardize Playwright path resolution | testing-manifesto.md |
| 4 | Skill authoring guide + CLAUDE.md | skill-authoring-guide.md, CLAUDE.md |

## What Was Done

- Added `checks` arrays (2-3 regex patterns each) to all 5 smoke-tier evals (312, 315, 329, 330, 331) — evals 312 and 315 already had checks, 329/330/331 received new ones
- Added `checks` arrays (2 regex patterns each) to 20 targeted full-tier evals across auto (258, 306, 307, 308, 313, 314), new-project (9, 26, 86, 87, 118, 137, 138, 257), and plan-review (64, 65, 66, 82, 83, 96, 97, 110) skill groups
- Updated `testing-manifesto.md` to use the `find ... | sort -V | tail -1` Playwright path resolution pattern, matching `plan-work/SKILL.md`
- Created `references/skill-authoring-guide.md` with 5 sections: Non-Interactive Guard Pattern, Eval-Alongside-Feature Rule, Path Consistency Rules, Dead-Code Check for Reverts, Eval Checks Quality Bar
- Added `## Skill Authoring Rules` section to `CLAUDE.md` (after Key Constraints) with 5 concise rules referencing the guide

## Decisions Made

| Decision | Rationale | Alternatives |
|----------|-----------|--------------|
| Skill-specific technical terms for checks | Generic terms ("the", "a") would match any output; domain terms ensure real skill behavior | LLM grading (slower, non-deterministic) |
| Separate detailed guide + concise CLAUDE.md | Guide for depth, CLAUDE.md for quick reference during build | Only CLAUDE.md (loses detail) |

## Deviations from Plan

None — all 4 tasks completed as specified.

## Issues Encountered

- Verification script initially used wrong traversal (`Array.isArray(a)` check without nested `a.evals`), showing 0 checks for all IDs. Fixed by using correct `a.evals` array access. Actual checks were present.

## Next Phase Readiness

Phase 12 is now complete. All 3 plans (12-01, 12-02, 12-03) have SUMMARYs:
- 12-01: auto-pipeline fixture + deterministic checks for evals 312-319
- 12-02: (existing)
- 12-03: checks for 25 more evals + authoring guide

## Test Results

- **Tests:** N/A — eval suite is the test artifact
- **Coverage:** not configured
- **Test files created:** none
- **Spec-generated tests:** no — 0 test skeletons
