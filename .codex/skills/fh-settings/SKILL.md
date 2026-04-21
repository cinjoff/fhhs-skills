---
name: fh-settings
description: "Configure GSD workflow preferences including model profiles and agent settings. Use when the user says 'settings', 'configure', 'change profile', or wants to adjust workflow parameters. (Codex adapter)"
---

# fh-settings

This is a Codex compatibility adapter for the original fhhs skill `fh:settings`.

- Codex skill name: `fh-settings`
- Original Claude Code command: `/fh:settings`
- Source skill file: `../../../.claude/skills/settings/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/settings/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
