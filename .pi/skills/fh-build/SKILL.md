---
name: fh-build
description: "Execute a plan — turns your PLAN.md into working code with tests and quality checks. (pi.dev adapter)"
---

# fh-build

This is a pi.dev compatibility adapter for the original fhhs skill `fh:build`.

- pi command: `/skill:fh-build`
- Original Claude Code command: `/fh:build`
- Source skill file: `../../../.claude/skills/build/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/build/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
