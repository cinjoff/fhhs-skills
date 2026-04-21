---
name: fh-observability
description: "Check for runtime errors in your local Sentry store. Useful when something broke in the app. (pi.dev adapter)"
---

# fh-observability

This is a pi.dev compatibility adapter for the original fhhs skill `fh:observability`.

- pi command: `/skill:fh-observability`
- Original Claude Code command: `/fh:observability`
- Source skill file: `../../../.claude/skills/observability/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/observability/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
