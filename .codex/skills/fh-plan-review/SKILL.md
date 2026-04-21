---
name: fh-plan-review
description: "Stress-test a plan. Challenges business alignment AND engineering rigor — architecture, code quality, tests, performance — before you commit. (Codex adapter)"
---

# fh-plan-review

This is a Codex compatibility adapter for the original fhhs skill `fh:plan-review`.

- Codex skill name: `fh-plan-review`
- Original Claude Code command: `/fh:plan-review`
- Source skill file: `../../../.claude/skills/plan-review/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/plan-review/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
