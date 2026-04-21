---
name: fh-learnings
description: "Analyze claude-mem observations to surface project improvement insights and, for plugin maintainers, auto-file GitHub issues for skill improvements. (Codex adapter)"
---

# fh-learnings

This is a Codex compatibility adapter for the original fhhs skill `fh:learnings`.

- Codex skill name: `fh-learnings`
- Original Claude Code command: `/fh:learnings`
- Source skill file: `../../../.claude/skills/learnings/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/learnings/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
