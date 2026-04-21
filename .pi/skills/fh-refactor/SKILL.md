---
name: fh-refactor
description: "Reorganize code without changing what it does. Keeps tests passing at every step. (pi.dev adapter)"
---

# fh-refactor

This is a pi.dev compatibility adapter for the original fhhs skill `fh:refactor`.

- pi command: `/skill:fh-refactor`
- Original Claude Code command: `/fh:refactor`
- Source skill file: `../../../.claude/skills/refactor/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/refactor/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
