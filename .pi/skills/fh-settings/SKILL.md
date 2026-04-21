---
name: fh-settings
description: "Configure GSD workflow preferences including model profiles and agent settings. Use when the user says 'settings', 'configure', 'change profile', or wants to adjust workflow parameters. (pi.dev adapter)"
---

# fh-settings

This is a pi.dev compatibility adapter for the original fhhs skill `fh:settings`.

- pi command: `/skill:fh-settings`
- Original Claude Code command: `/fh:settings`
- Source skill file: `../../../.claude/skills/settings/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/settings/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
