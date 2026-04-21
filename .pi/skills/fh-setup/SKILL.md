---
name: fh-setup
description: "Welcome to fhhs-skills. Run once after installing for an overview. Use --check to verify setup status. (pi.dev adapter)"
---

# fh-setup

This is a pi.dev compatibility adapter for the original fhhs skill `fh:setup`.

- pi command: `/skill:fh-setup`
- Original Claude Code command: `/fh:setup`
- Source skill file: `../../../.claude/skills/setup/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/setup/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
