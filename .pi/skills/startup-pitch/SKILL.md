---
name: startup-pitch
description: "Use when the user wants to create an investor pitch, prepare for fundraising meetings, or practice their pitch. Produces pitch scripts in multiple formats (10-min, 5-min, 2-min, elevator, email), Q&A prep, and optional roleplay. Triggers: pitch deck, investor pitch, fundraising deck, demo day, pitch practice. Works standalone; uses /fh:startup-design and /fh:startup-positioning output if available. Does NOT handle code planning or development. (pi.dev adapter)"
---

# startup-pitch

This is a pi.dev compatibility adapter for the original fhhs skill `startup-pitch`.

- pi command: `/skill:startup-pitch`
- Original Claude Code command: `/fh:startup-pitch`
- Source skill file: `../../../.claude/skills/startup-pitch/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/startup-pitch/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
4. Translate Claude Agent-tool dispatches into pi subagent calls: use `agent: "fh:..."` for `subagent_type: "fh:..."`, and map `subagent_type: "general-purpose"` to a worker agent (for example `agent: "worker"` or your preferred implementation agent). Carry over model intent when the source specifies one, and set `agentScope` to `"project"` or `"both"` so `.pi/agents/*.md` adapters are discoverable.
5. Preserve quality intent using Codex model tiers: strong reasoning/review/planning tasks should use `openai-codex/gpt-5.3-codex` (high thinking), while broad scanning or lightweight formatting can use `openai-codex/gpt-5.4-mini`.
