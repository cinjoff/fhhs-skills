---
name: fh-plan-review
description: "Stress-test a plan. Challenges business alignment AND engineering rigor — architecture, code quality, tests, performance — before you commit. (pi.dev adapter)"
---

# fh-plan-review

This is a pi.dev compatibility adapter for the original fhhs skill `fh:plan-review`.

- pi command: `/skill:fh-plan-review`
- Original Claude Code command: `/fh:plan-review`
- Source skill file: `../../../.claude/skills/plan-review/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/plan-review/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
