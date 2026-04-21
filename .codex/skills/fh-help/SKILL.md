---
name: fh-help
description: "Display the fhhs-skills command reference and architecture guide. Use when the user says 'help', 'what commands', 'show commands', 'how do composites work', 'skills guide', or needs an overview of available commands and how they fit together. (Codex adapter)"
---

# fh-help

This is a Codex compatibility adapter for the original fhhs skill `fh:help`.

- Codex skill name: `fh-help`
- Original Claude Code command: `/fh:help`
- Source skill file: `../../../.claude/skills/help/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/help/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
