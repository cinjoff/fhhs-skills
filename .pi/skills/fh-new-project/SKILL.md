---
name: fh-new-project
description: "Bootstrap a new tracked project with design framework, conventions, and GSD roadmap. Use when the user says 'new project', 'start a project', 'bootstrap', 'set up a new app', or 'initialize'. Creates .planning/ structure and CLAUDE.md. Supports --auto flag for fully autonomous project creation. (pi.dev adapter)"
---

# fh-new-project

This is a pi.dev compatibility adapter for the original fhhs skill `fh:new-project`.

- pi command: `/skill:fh-new-project`
- Original Claude Code command: `/fh:new-project`
- Source skill file: `../../../.claude/skills/new-project/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/new-project/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
