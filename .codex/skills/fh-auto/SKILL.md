---
name: fh-auto
description: "Run autonomous execution — plans, reviews, builds, and reviews each phase without human intervention. Use when the user says 'auto', 'run autonomously', 'hands-off', or 'walk away'. (Codex adapter)"
---

# fh-auto

This is a Codex compatibility adapter for the original fhhs skill `fh:auto`.

- Codex skill name: `fh-auto`
- Original Claude Code command: `/fh:auto`
- Source skill file: `../../../.claude/skills/auto/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/auto/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
4. If the source skill requests Claude Agent-tool dispatch and your Codex runtime lacks equivalent subagent support, execute the delegated work inline while preserving the original intent and checks.
5. Preserve quality intent with Codex model tiers: use `openai-codex/gpt-5.3-codex` for planning/review/critical reasoning and `openai-codex/gpt-5.4-mini` for fast exploratory or mechanical tasks.
