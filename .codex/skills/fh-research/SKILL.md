---
name: fh-research
description: "Look into a topic. Searches the web and docs, then writes up what it found. (Codex adapter)"
---

# fh-research

This is a Codex compatibility adapter for the original fhhs skill `fh:research`.

- Codex skill name: `fh-research`
- Original Claude Code command: `/fh:research`
- Source skill file: `../../../.claude/skills/research/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/research/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
