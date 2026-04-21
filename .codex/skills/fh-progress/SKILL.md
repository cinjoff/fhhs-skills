---
name: fh-progress
description: "Where am I? Shows project status and what to do next. Also resumes previous sessions. (Codex adapter)"
---

# fh-progress

This is a Codex compatibility adapter for the original fhhs skill `fh:progress`.

- Codex skill name: `fh-progress`
- Original Claude Code command: `/fh:progress`
- Source skill file: `../../../.claude/skills/progress/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/progress/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
