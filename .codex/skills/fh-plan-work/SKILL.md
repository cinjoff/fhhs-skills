---
name: fh-plan-work
description: "Plan before you build. Researches the problem and produces a step-by-step plan. (Codex adapter)"
---

# fh-plan-work

This is a Codex compatibility adapter for the original fhhs skill `fh:plan-work`.

- Codex skill name: `fh-plan-work`
- Original Claude Code command: `/fh:plan-work`
- Source skill file: `../../../.claude/skills/plan-work/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/plan-work/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
4. If the source skill requests Claude Agent-tool dispatch and your Codex runtime lacks equivalent subagent support, execute the delegated work inline while preserving the original intent and checks.
5. Preserve quality intent with Codex model tiers: use `openai-codex/gpt-5.3-codex` for planning/review/critical reasoning and `openai-codex/gpt-5.4-mini` for fast exploratory or mechanical tasks.
