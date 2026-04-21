---
name: startup-competitors
description: "Use when the user wants to analyze competitors or research the competitive landscape. Produces battle cards, pricing landscape, feature matrix, and strategic recommendations. Triggers: who are my competitors, competitive analysis, battle cards, market positioning. Works standalone; uses /fh:startup-design output if available. Does NOT handle code planning or development. (pi.dev adapter)"
---

# startup-competitors

This is a pi.dev compatibility adapter for the original fhhs skill `startup-competitors`.

- pi command: `/skill:startup-competitors`
- Original Claude Code command: `/fh:startup-competitors`
- Source skill file: `../../../.claude/skills/startup-competitors/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/startup-competitors/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
