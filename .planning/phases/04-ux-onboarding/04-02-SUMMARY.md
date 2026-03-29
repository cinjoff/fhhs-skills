---
phase: 04-ux-onboarding
plan: 02
status: complete
completed_at: "2026-03-29"
tasks_completed: 6
tasks_total: 6
commit: 26d228a
requirements:
  - REQ-17
  - REQ-18
  - REQ-19
  - REQ-20
---

# Plan 02 Summary: UX & Onboarding

## Objective
Make the plugin self-guiding for new users with setup detection, standardized error messages, and a Getting Started flow.

## What Was Built

### Task 1: Setup detection in /fh:progress
- Added `### Setup Detection` block that checks for `gsd-tools.cjs` symlink
- Updated pre-GSD routing table with two distinct paths: setup-needed → `/fh:setup`, no-project → `/fh:new-project`
- Updated non-GSD fallback report with same setup-aware messages

### Task 2: Getting Started section in /fh:help
- Inserted `## Getting Started` section before Build Pipeline with 4-step first-time flow
- Updated Common Workflows `First time:` line to reference Getting Started (avoids duplication)

### Task 3: Dependency checks for review and plan-review
- `review/SKILL.md`: Soft "Project context check" — tip only, never blocks review
- `plan-review/SKILL.md`: Hard "Dependency check" requiring PROJECT.md and a plan

### Task 4: Standardized error messages
- Updated build, fix, refactor, plan-work with `→ Run /fh:{command} — {description}` format
- Added "no plan" check to build skill

### Task 5: Setup --check mode
- Added `## Quick Check Mode` section to setup/SKILL.md
- Shows status table for all 11 components (required + optional)
- Reports missing required components with next-step suggestion
- Updated frontmatter description to mention --check

### Task 6: Onboarding evals
- Eval 300: Progress routes new users to /fh:setup (smoke tier)
- Eval 301: Setup --check validates without installing (smoke tier)
- Both tagged `["onboarding", "phase-04"]`

## Files Modified
- `.claude/skills/progress/SKILL.md` — setup detection + routing
- `.claude/skills/help/SKILL.md` — Getting Started section
- `.claude/skills/review/SKILL.md` — soft dependency check
- `.claude/skills/plan-review/SKILL.md` — hard dependency check
- `.claude/skills/build/SKILL.md` — standardized error messages
- `.claude/skills/fix/SKILL.md` — standardized error messages
- `.claude/skills/refactor/SKILL.md` — standardized error messages
- `.claude/skills/plan-work/SKILL.md` — standardized error messages
- `.claude/skills/setup/SKILL.md` — --check mode
- `evals/evals.json` — 2 new onboarding evals

## Must-Haves Verification
| Truth | Status |
|-------|--------|
| Progress routes new installs to /fh:setup | PASS — setup_complete check + routing table |
| Every core pipeline skill shows next-step suggestion | PASS — 6 skills updated |
| /fh:help starts with Getting Started | PASS — section before Build Pipeline |
| Error messages use standard format | PASS — → Run format in all core skills |
| /fh:setup --check validates without installing | PASS — Quick Check Mode section |
| At least 2 evals verify onboarding behaviors | PASS — evals 300, 301 |
| review dependency check is soft warning | PASS — "Project context check" tip |
| plan-review dependency check added fresh | PASS — new "Dependency check" block |
| Getting Started consolidates with Common Workflows | PASS — First time line updated |
| Getting Started references only existing skills | PASS — 4-step flow, no /fh:verify |
| Common Workflows First time points to Getting Started | PASS — updated |

## Issues Encountered
None.
