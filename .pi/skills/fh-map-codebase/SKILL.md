---
name: fh-map-codebase
description: "Explore and document how your codebase is structured. (pi.dev adapter)"
---

# fh-map-codebase

This is a pi.dev compatibility adapter for the original fhhs skill `fh:map-codebase`.

- pi command: `/skill:fh-map-codebase`
- Original Claude Code command: `/fh:map-codebase`
- Source skill file: `../../../.claude/skills/map-codebase/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/map-codebase/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
