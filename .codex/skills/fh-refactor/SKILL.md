---
name: fh-refactor
description: "Reorganize code without changing what it does. Keeps tests passing at every step. (Codex adapter)"
---

# fh-refactor

This is a Codex compatibility adapter for the original fhhs skill `fh:refactor`.

- Codex skill name: `fh-refactor`
- Original Claude Code command: `/fh:refactor`
- Source skill file: `../../../.claude/skills/refactor/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/refactor/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
