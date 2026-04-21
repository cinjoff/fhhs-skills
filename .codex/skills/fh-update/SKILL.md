---
name: fh-update
description: "Check for updates and install the latest version. Use when the user says 'update', 'upgrade', 'check for updates', or 'get latest version'. Supports --global to update all projects at once. (Codex adapter)"
---

# fh-update

This is a Codex compatibility adapter for the original fhhs skill `fh:update`.

- Codex skill name: `fh-update`
- Original Claude Code command: `/fh:update`
- Source skill file: `../../../.claude/skills/update/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/update/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
4. If the source skill requests Claude Agent-tool dispatch and your Codex runtime lacks equivalent subagent support, execute the delegated work inline while preserving the original intent and checks.
5. Preserve quality intent with Codex model tiers: use `openai-codex/gpt-5.3-codex` for planning/review/critical reasoning and `openai-codex/gpt-5.4-mini` for fast exploratory or mechanical tasks.
