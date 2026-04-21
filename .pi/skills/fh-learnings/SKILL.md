---
name: fh-learnings
description: "Analyze claude-mem observations to surface project improvement insights and, for plugin maintainers, auto-file GitHub issues for skill improvements. (pi.dev adapter)"
---

# fh-learnings

This is a pi.dev compatibility adapter for the original fhhs skill `fh:learnings`.

- pi command: `/skill:fh-learnings`
- Original Claude Code command: `/fh:learnings`
- Source skill file: `../../../.claude/skills/learnings/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/learnings/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
