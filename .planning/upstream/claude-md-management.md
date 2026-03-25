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

## Capability Flow Diagram

```
                CLAUDE-MD-MANAGEMENT WORKFLOW

  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
  │  READ EXISTING   │───▶│  ASSESS QUALITY  │───▶│  APPLY UPDATES  │
  │  CLAUDE.md       │    │  (quality-       │    │  (update-       │
  │                  │    │   criteria.md)   │    │   guidelines.md)│
  └─────────────────┘    └──────────────────┘    └────────┬────────┘
                                                          │
                                                 ┌────────▼────────┐
                                                 │ OUTPUT IMPROVED  │
                                                 │ CLAUDE.md        │
                                                 │ (templates.md)   │
                                                 └─────────────────┘
```

## Skills Table

| Skill | SDLC Phase | Quality | Status | fhhs Equivalent | Notes |
|-------|-----------|---------|--------|-----------------|-------|
| claude-md-improver | Knowledge | B | ✅ Forked | skills/claude-md-improver/ + /fh:revise-claude-md | Quality-driven CLAUDE.md revision |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| references/quality-criteria.md | Reference | claude-md-improver | ✅ Forked | Quality assessment rubric |
| references/templates.md | Reference | claude-md-improver | ✅ Forked | CLAUDE.md structure templates |
| references/update-guidelines.md | Reference | claude-md-improver | ✅ Forked | Revision methodology |
| commands/revise-claude-md.md | Command | Entry point | ✅ Forked | /fh:revise-claude-md |
| *.png (2 screenshots) | Images | Documentation | 🚫 N/A | Usage examples |

## Assessment

claude-md-management is small but fully integrated. The skill and all three reference documents are forked into fhhs as both an internal skill (skills/claude-md-improver/) and a user-facing command (/fh:revise-claude-md). The quality-criteria and update-guidelines references are the most valuable assets — they provide a structured framework for what is otherwise an unstructured task. No integration gaps exist; this upstream is 100% absorbed.
