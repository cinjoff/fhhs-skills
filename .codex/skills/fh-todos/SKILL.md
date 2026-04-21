---
name: fh-todos
description: "Track things to do. Add a todo with arguments, or review pending ones without. (Codex adapter)"
---

# fh-todos

This is a Codex compatibility adapter for the original fhhs skill `fh:todos`.

- Codex skill name: `fh-todos`
- Original Claude Code command: `/fh:todos`
- Source skill file: `../../../.claude/skills/todos/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/todos/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
