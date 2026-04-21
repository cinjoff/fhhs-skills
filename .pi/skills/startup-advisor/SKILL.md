---
name: startup-advisor
description: "Get startup advice grounded in YC wisdom, proven frameworks, and real-time market data. Ask any founder question — fundraising, hiring, product-market fit, pivoting, pricing, scaling, co-founder dynamics, or startup strategy. Uses a three-tier knowledge system: curated startup frameworks, web research for current data, and your project's startup artifacts for personalized advice. Use when the user asks startup questions like 'should I raise funding', 'how to find product-market fit', 'when should I pivot', 'how to price my product', 'co-founder equity split', 'YC advice on...', or any strategic startup question. Does NOT handle code planning, code review, competitive analysis reports, or pitch deck creation — those have dedicated skills. (pi.dev adapter)"
---

# startup-advisor

This is a pi.dev compatibility adapter for the original fhhs skill `startup-advisor`.

- pi command: `/skill:startup-advisor`
- Original Claude Code command: `/fh:startup-advisor`
- Source skill file: `../../../.claude/skills/startup-advisor/SKILL.md`

## Instructions

1. Read and follow `../../../.claude/skills/startup-advisor/SKILL.md`.
2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).
3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.
4. Translate Claude Agent-tool dispatches into pi subagent calls: use `agent: "fh:..."` for `subagent_type: "fh:..."`, and map `subagent_type: "general-purpose"` to a worker agent (for example `agent: "worker"` or your preferred implementation agent). Carry over model intent when the source specifies one, and set `agentScope` to `"project"` or `"both"` so `.pi/agents/*.md` adapters are discoverable.
5. Preserve quality intent using Codex model tiers: strong reasoning/review/planning tasks should use `openai-codex/gpt-5.3-codex` (high thinking), while broad scanning or lightweight formatting can use `openai-codex/gpt-5.4-mini`.
