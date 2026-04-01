---
phase: 13-skill-consolidation
plan: 01
status: complete
completed: "2026-03-31"
commit: 12bbc1f
files_modified:
  - .planning/codebase/SKILLS-GRAPH.md
  - .claude/skills/ui-branding/SKILL.md
  - .claude/skills/learnings/SKILL.md
  - .claude/skills/build/SKILL.md
  - .claude/skills/new-project/SKILL.md
  - .claude/skills/setup/SKILL.md
  - .claude/skills/help/SKILL.md
  - bin/global-reconcile.cjs
  - evals/evals.json
test_metrics:
  spec_tests_count: 0
---

# Plan 01 Summary: Skill Graph Cleanup & Removals

## What was done

1. **SKILLS-GRAPH mermaid colors fixed** — Non-invocable helper nodes (adapt, harden, normalize, polish, secure) changed from low-contrast `fill:#f5f5f5` to `fill:#64748b,color:#fff` (slate bg, white text). All nodes now meet WCAG AA contrast ratio.

2. **revise-claude-md removed** — Directory deleted. All references in shipped skills (build, help, new-project), bin/global-reconcile.cjs updated to point to `/fh:learnings --update-claude-md`.

3. **ui-redesign merged into ui-branding** — ui-redesign directory deleted. ui-branding now handles both first-run (create DESIGN.md) and update (review existing direction) flows. Auto-detects mode based on DESIGN.md existence.

4. **learnings enhanced with CLAUDE.md updates** — New Section 4.5 "CLAUDE.md Maintenance" surfaces high-signal patterns (recurring gotchas, convention violations, constraint discoveries) from claude-mem and proposes lean CLAUDE.md additions. Supports `--update-claude-md` flag. Graceful degradation when claude-mem unavailable.

5. **Setup simplified** — Removed simplify and secure invocations from setup flow. Secure remains mentioned as a standalone skill, not auto-configured as pre-PR hook.

6. **Evals updated** — Removed evals for deleted skills (todos prompts, revise-claude-md). Added evals for learnings CLAUDE.md update flow and ui-branding merged behavior.

## Must-haves verification

| Truth | Status |
|-------|--------|
| SKILLS-GRAPH readable colors | PASS — fill:#64748b,color:#fff on all helper nodes |
| revise-claude-md directory gone | PASS |
| ui-redesign directory gone | PASS |
| ui-branding handles both flows | PASS — "design direction" present |
| learnings has CLAUDE.md update step | PASS — 3 update-claude-md refs |
| No shipped refs to removed skills | PASS — 0 matches |
| new-project and global-reconcile updated | PASS — 0 stale refs |

## Issues Encountered

None.
