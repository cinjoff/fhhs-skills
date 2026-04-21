---
name: fh-ui-test
description: "Take screenshots and check if the UI looks right. Use --qa for thorough functional testing. (Codex adapter)"
---

# fh-ui-test

This is a Codex compatibility adapter for the original fhhs skill `fh:ui-test`.

- Codex skill name: `fh-ui-test`
- Original Claude Code command: `/fh:ui-test`
- Source skill file: `../../../.claude/skills/ui-test/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/ui-test/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
