---
name: fh-todos
description: "Track things to do. Add a todo with arguments, or review pending ones without. (pi.dev adapter)"
---

# fh-todos

This is a pi.dev compatibility adapter for the original fhhs skill `fh:todos`.

- pi command: `/skill:fh-todos`
- Original Claude Code command: `/fh:todos`
- Source skill file: `../../../.claude/skills/todos/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/todos/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
