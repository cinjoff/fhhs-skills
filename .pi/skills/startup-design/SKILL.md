---
name: startup-design
description: "Use when the user has a startup idea to explore or validate. Takes a raw concept through market research, competitive analysis, business model, brand identity, product definition, financial projections, and validation experiments. Triggers: 'I have an idea for...', 'is this idea worth pursuing', business plan, lean canvas, market sizing, go-to-market. Supports --refresh to update existing artifacts and --fast-track for quick validation. Does NOT handle code planning, development, or deployment. (pi.dev adapter)"
---

# startup-design

This is a pi.dev compatibility adapter for the original fhhs skill `startup-design`.

- pi command: `/skill:startup-design`
- Original Claude Code command: `/fh:startup-design`
- Source skill file: `../../../.claude/skills/startup-design/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/startup-design/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
