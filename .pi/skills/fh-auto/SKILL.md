---
name: fh-auto
description: "Run autonomous execution — plans, reviews, builds, and reviews each phase without human intervention. Use when the user says 'auto', 'run autonomously', 'hands-off', or 'walk away'. (pi.dev adapter)"
---

# fh-auto

This is a pi.dev compatibility adapter for the original fhhs skill `fh:auto`.

- pi command: `/skill:fh-auto`
- Original Claude Code command: `/fh:auto`
- Source skill file: `../../../.claude/skills/auto/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/auto/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
