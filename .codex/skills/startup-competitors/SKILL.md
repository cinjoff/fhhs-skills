---
name: startup-competitors
description: "Use when the user wants to analyze competitors or research the competitive landscape. Produces battle cards, pricing landscape, feature matrix, and strategic recommendations. Triggers: who are my competitors, competitive analysis, battle cards, market positioning. Works standalone; uses /fh:startup-design output if available. Does NOT handle code planning or development. (Codex adapter)"
---

# startup-competitors

This is a Codex compatibility adapter for the original fhhs skill `startup-competitors`.

- Codex skill name: `startup-competitors`
- Original Claude Code command: `/fh:startup-competitors`
- Source skill file: `../../../.claude/skills/startup-competitors/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/startup-competitors/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
4. If the source skill requests Claude Agent-tool dispatch and your Codex runtime lacks equivalent subagent support, execute the delegated work inline while preserving the original intent and checks.
5. Preserve quality intent with Codex model tiers: use `openai-codex/gpt-5.3-codex` for planning/review/critical reasoning and `openai-codex/gpt-5.4-mini` for fast exploratory or mechanical tasks.
