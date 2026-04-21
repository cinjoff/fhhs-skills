---
name: fh-fix
description: "Fix a bug. Finds the root cause, writes a test, and patches it. (pi.dev adapter)"
---

# fh-fix

This is a pi.dev compatibility adapter for the original fhhs skill `fh:fix`.

- pi command: `/skill:fh-fix`
- Original Claude Code command: `/fh:fix`
- Source skill file: `../../../.claude/skills/fix/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/fix/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
