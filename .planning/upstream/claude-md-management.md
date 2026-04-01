# Upstream: claude-md-management (v1.0.0)

**Overall Quality: B**

## Overview

claude-md-management provides a single focused capability: intelligent improvement of CLAUDE.md project instruction files. Its philosophy is that project memory (CLAUDE.md) is a high-leverage artifact that deserves structured revision rather than ad-hoc editing. What makes it distinctive is its quality criteria framework and update guidelines that transform CLAUDE.md maintenance from guesswork into a repeatable process with clear templates.

## File Tree

```
upstream/claude-md-management-1.0.0/
├── README.md                                     ← project documentation
├── claude-md-improver-example.png                ← usage screenshot
├── revise-claude-md-example.png                  ← revision screenshot
├── commands/
│   └── revise-claude-md.md                       ← /revise-claude-md command
└── skills/
    └── claude-md-improver/
        ├── UPSTREAM-SKILL.md                     ← claude-md improvement skill
        └── references/
            ├── quality-criteria.md               ← what makes good CLAUDE.md
            ├── templates.md                      ← CLAUDE.md templates
            └── update-guidelines.md              ← revision methodology
```

## Deep Capability Description

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **claude-md-improver** | Audits CLAUDE.md files against quality criteria: commands/workflows documented?, architecture clarity?, non-obvious patterns captured?, conciseness?, currency?, actionability?. Scores A-F with targeted improvement recommendations. Uses templates by project type (library, app, monorepo, etc.) and structured update guidelines for revision methodology. | Transforms CLAUDE.md maintenance from guesswork into a repeatable, quality-scored process. Prevents knowledge staleness. | **ACTIVE** — forked as internal skill + exposed as `/fh:revise-claude-md`. Quality criteria and templates actively used. |

## Skills Table

| Skill | SDLC Phase | Quality | Pipeline Status | fhhs Equivalent | Notes |
|-------|-----------|---------|----------------|-----------------|-------|
| claude-md-improver | Knowledge | B | ✅ **Active** | skills/claude-md-improver/ + /fh:revise-claude-md | Quality-driven revision |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| references/quality-criteria.md | Reference | claude-md-improver | ✅ Active | Quality assessment rubric |
| references/templates.md | Reference | claude-md-improver | ✅ Active | CLAUDE.md structure templates |
| references/update-guidelines.md | Reference | claude-md-improver | ✅ Active | Revision methodology |
| commands/revise-claude-md.md | Command | Entry point | ✅ Active | /fh:revise-claude-md |

## Assessment

Fully integrated, no gaps. The skill and all three reference documents are forked and actively used. The quality-criteria and update-guidelines references are the most valuable assets — they provide structured framework for what is otherwise an unstructured task.

### Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| **None** | No changes needed | 100% integrated |
