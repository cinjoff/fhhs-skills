---
name: fh-research
description: "Look into a topic. Searches the web and docs, then writes up what it found. (pi.dev adapter)"
---

# fh-research

This is a pi.dev compatibility adapter for the original fhhs skill `fh:research`.

- pi command: `/skill:fh-research`
- Original Claude Code command: `/fh:research`
- Source skill file: `../../../.claude/skills/research/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/research/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
