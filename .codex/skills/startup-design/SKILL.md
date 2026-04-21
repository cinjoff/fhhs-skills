---
name: startup-design
description: "Use when the user has a startup idea to explore or validate. Takes a raw concept through market research, competitive analysis, business model, brand identity, product definition, financial projections, and validation experiments. Triggers: 'I have an idea for...', 'is this idea worth pursuing', business plan, lean canvas, market sizing, go-to-market. Supports --refresh to update existing artifacts and --fast-track for quick validation. Does NOT handle code planning, development, or deployment. (Codex adapter)"
---

# startup-design

This is a Codex compatibility adapter for the original fhhs skill `startup-design`.

- Codex skill name: `startup-design`
- Original Claude Code command: `/fh:startup-design`
- Source skill file: `../../../.claude/skills/startup-design/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/startup-design/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
