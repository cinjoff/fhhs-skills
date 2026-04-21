---
name: fh-plan-work
description: "Plan before you build. Researches the problem and produces a step-by-step plan. (pi.dev adapter)"
---

# fh-plan-work

This is a pi.dev compatibility adapter for the original fhhs skill `fh:plan-work`.

- pi command: `/skill:fh-plan-work`
- Original Claude Code command: `/fh:plan-work`
- Source skill file: `../../../.claude/skills/plan-work/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/plan-work/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
