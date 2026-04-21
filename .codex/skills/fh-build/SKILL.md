---
name: fh-build
description: "Execute a plan — turns your PLAN.md into working code with tests and quality checks. (Codex adapter)"
---

# fh-build

This is a Codex compatibility adapter for the original fhhs skill `fh:build`.

- Codex skill name: `fh-build`
- Original Claude Code command: `/fh:build`
- Source skill file: `../../../.claude/skills/build/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/build/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
