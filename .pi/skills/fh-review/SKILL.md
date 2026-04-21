---
name: fh-review
description: "Code review. Checks quality, architecture, and whether the code actually achieves the goal. Use --quick for a fast check. (pi.dev adapter)"
---

# fh-review

This is a pi.dev compatibility adapter for the original fhhs skill `fh:review`.

- pi command: `/skill:fh-review`
- Original Claude Code command: `/fh:review`
- Source skill file: `../../../.claude/skills/review/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/review/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
