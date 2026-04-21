---
name: fh-update
description: "Check for updates and install the latest version. Use when the user says 'update', 'upgrade', 'check for updates', or 'get latest version'. Supports --global to update all projects at once. (pi.dev adapter)"
---

# fh-update

This is a pi.dev compatibility adapter for the original fhhs skill `fh:update`.

- pi command: `/skill:fh-update`
- Original Claude Code command: `/fh:update`
- Source skill file: `../../../.claude/skills/update/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/update/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
4. Translate Claude Agent-tool dispatches into pi subagent calls: use `agent: "fh:..."` for `subagent_type: "fh:..."`, and map `subagent_type: "general-purpose"` to a worker agent (for example `agent: "worker"` or your preferred implementation agent). Carry over model intent when the source specifies one, and set `agentScope` to `"project"` or `"both"` so `.pi/agents/*.md` adapters are discoverable.
5. Preserve quality intent using Codex model tiers: strong reasoning/review/planning tasks should use `openai-codex/gpt-5.3-codex` (high thinking), while broad scanning or lightweight formatting can use `openai-codex/gpt-5.4-mini`.
