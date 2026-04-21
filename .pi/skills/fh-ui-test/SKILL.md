---
name: fh-ui-test
description: "Take screenshots and check if the UI looks right. Use --qa for thorough functional testing. (pi.dev adapter)"
---

# fh-ui-test

This is a pi.dev compatibility adapter for the original fhhs skill `fh:ui-test`.

- pi command: `/skill:fh-ui-test`
- Original Claude Code command: `/fh:ui-test`
- Source skill file: `../../../.claude/skills/ui-test/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/ui-test/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
