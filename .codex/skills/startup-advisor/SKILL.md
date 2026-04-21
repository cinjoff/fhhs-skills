---
name: startup-advisor
description: "Get startup advice grounded in YC wisdom, proven frameworks, and real-time market data. Ask any founder question — fundraising, hiring, product-market fit, pivoting, pricing, scaling, co-founder dynamics, or startup strategy. Uses a three-tier knowledge system: curated startup frameworks, web research for current data, and your project's startup artifacts for personalized advice. Use when the user asks startup questions like 'should I raise funding', 'how to find product-market fit', 'when should I pivot', 'how to price my product', 'co-founder equity split', 'YC advice on...', or any strategic startup question. Does NOT handle code planning, code review, competitive analysis reports, or pitch deck creation — those have dedicated skills. (Codex adapter)"
---

# startup-advisor

This is a Codex compatibility adapter for the original fhhs skill `startup-advisor`.

- Codex skill name: `startup-advisor`
- Original Claude Code command: `/fh:startup-advisor`
- Source skill file: `../../../.claude/skills/startup-advisor/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/startup-advisor/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.
4. If the source skill requests Claude Agent-tool dispatch and your Codex runtime lacks equivalent subagent support, execute the delegated work inline while preserving the original intent and checks.
5. Preserve quality intent with Codex model tiers: use `openai-codex/gpt-5.3-codex` for planning/review/critical reasoning and `openai-codex/gpt-5.4-mini` for fast exploratory or mechanical tasks.
