---
name: startup-pitch
description: "Use when the user wants to create an investor pitch, prepare for fundraising meetings, or practice their pitch. Produces pitch scripts in multiple formats (10-min, 5-min, 2-min, elevator, email), Q&A prep, and optional roleplay. Triggers: pitch deck, investor pitch, fundraising deck, demo day, pitch practice. Works standalone; uses /fh:startup-design and /fh:startup-positioning output if available. Does NOT handle code planning or development. (Codex adapter)"
---

# startup-pitch

This is a Codex compatibility adapter for the original fhhs skill `startup-pitch`.

- Codex skill name: `startup-pitch`
- Original Claude Code command: `/fh:startup-pitch`
- Source skill file: `../../../.claude/skills/startup-pitch/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/startup-pitch/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
4. If the source skill requests Claude Agent-tool dispatch and your Codex runtime lacks equivalent subagent support, execute the delegated work inline while preserving the original intent and checks.
5. Preserve quality intent with Codex model tiers: use `openai-codex/gpt-5.3-codex` for planning/review/critical reasoning and `openai-codex/gpt-5.4-mini` for fast exploratory or mechanical tasks.
