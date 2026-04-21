---
name: fh-ui-branding
description: "Establish or update the design direction for your project. First run gathers design context and creates DESIGN.md. Use --update (or run again when DESIGN.md exists) to review and update existing design direction. (pi.dev adapter)"
---

# fh-ui-branding

This is a pi.dev compatibility adapter for the original fhhs skill `fh:ui-branding`.

- pi command: `/skill:fh-ui-branding`
- Original Claude Code command: `/fh:ui-branding`
- Source skill file: `../../../.claude/skills/ui-branding/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/ui-branding/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
