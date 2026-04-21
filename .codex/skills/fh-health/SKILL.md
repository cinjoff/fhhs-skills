---
name: fh-health
description: "Validate .planning/ directory integrity and diagnose issues. Use when the user says 'health', 'health check', 'check planning', 'is my project ok', or suspects corrupted planning state. Supports --repair flag. (Codex adapter)"
---

# fh-health

This is a Codex compatibility adapter for the original fhhs skill `fh:health`.

- Codex skill name: `fh-health`
- Original Claude Code command: `/fh:health`
- Source skill file: `../../../.claude/skills/health/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/health/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
