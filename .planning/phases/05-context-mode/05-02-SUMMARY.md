---
phase: 05-context-mode
plan: 02
subsystem: skills
tags: [context-optimization, setup, map-codebase, compact-instructions]
requires: []
provides:
  - "context-mode auto-install in /fh:setup with fallback"
  - "Compact Instructions in CLAUDE.md template and project root"
  - ".claude/rules/ creation + FTS5 indexing + SHA freshness in /fh:map-codebase"
affects: ["05-03"]
tech-stack:
  added: []
  patterns: [path-scoped rules, ctx_index integration, git SHA freshness]
key-files:
  created: []
  modified:
    - .claude/skills/setup/SKILL.md
    - .claude/skills/revise-claude-md/templates.md
    - .claude/skills/map-codebase/SKILL.md
    - CLAUDE.md
key-decisions:
  - "Compact Instructions added to revise-claude-md/templates.md (not new-project/SKILL.md directly) since new-project delegates CLAUDE.md generation to revise-claude-md"
requirements-completed: []
duration: ~2min
completed: "2026-03-26T22:30:00Z"
---

# Plan 02 Summary: Wire context optimization into core skill pipelines

## What Was Done

- Fixed /fh:setup Step 6b: automatic 2-command context-mode plugin install with bash, fallback instructions on failure, expanded capability description
- Added Compact Instructions to fhhs-skills CLAUDE.md (project root) and to revise-claude-md/templates.md (CLAUDE.md template used by /fh:new-project)
- Added finalize_context step to /fh:map-codebase: creates .claude/rules/ with 2 path-scoped rule files, indexes codebase docs into FTS5 via ctx_index when available, records git SHA for freshness detection

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Fix context-mode install in setup | 2a3dcd4 | setup/SKILL.md |
| 2 | Compact Instructions | 2a3dcd4 | CLAUDE.md, revise-claude-md/templates.md |
| 3 | Rules + FTS5 + SHA in map-codebase | 2a3dcd4 | map-codebase/SKILL.md |

## Deviations from Plan

- Task 2: Compact Instructions for new-project added to `revise-claude-md/templates.md` instead of `new-project/SKILL.md` because new-project delegates CLAUDE.md generation to revise-claude-md. Functionally equivalent — generated CLAUDE.md will contain the section.

## Issues Encountered

None.

## Next Phase Readiness

Plan 03 (ctx_search in build/plan-work) can now proceed — freshness SHA infrastructure is in place.
