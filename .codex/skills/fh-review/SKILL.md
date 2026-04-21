---
name: fh-review
description: "Code review. Checks quality, architecture, and whether the code actually achieves the goal. Use --quick for a fast check. (Codex adapter)"
---

# fh-review

This is a Codex compatibility adapter for the original fhhs skill `fh:review`.

- Codex skill name: `fh-review`
- Original Claude Code command: `/fh:review`
- Source skill file: `../../../.claude/skills/review/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/review/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
4. If the source skill requests Claude Agent-tool dispatch and your Codex runtime lacks equivalent subagent support, execute the delegated work inline while preserving the original intent and checks.
5. Preserve quality intent with Codex model tiers: use `openai-codex/gpt-5.3-codex` for planning/review/critical reasoning and `openai-codex/gpt-5.4-mini` for fast exploratory or mechanical tasks.
