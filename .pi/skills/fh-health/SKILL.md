---
name: fh-health
description: "Validate .planning/ directory integrity and diagnose issues. Use when the user says 'health', 'health check', 'check planning', 'is my project ok', or suspects corrupted planning state. Supports --repair flag. (pi.dev adapter)"
---

# fh-health

This is a pi.dev compatibility adapter for the original fhhs skill `fh:health`.

- pi command: `/skill:fh-health`
- Original Claude Code command: `/fh:health`
- Source skill file: `../../../.claude/skills/health/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/health/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
