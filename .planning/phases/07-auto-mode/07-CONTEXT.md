## Decisions

- [review] [Co-locate decisions template]: `decisions-template.md` lives at `.claude/skills/build/references/` (not `references/`), so it ships with plugin installs and is readable at runtime by plan-work and build subagents.
- [review] [DECISIONS.md file creation]: First auto-decision creates DECISIONS.md with frontmatter if it doesn't exist. Corrupt files get renamed to `.bak` with recovery note.
- [review] [Phase filtering for injection]: Build filters DECISIONS.md entries by Phase field matching current phase, plus all "project"-scoped decisions.
- [review] [Auto-decision heuristics]: Template includes explicit heuristics — prefer existing patterns, reversible choices, simplicity, documented libraries, fewer dependencies.
- [review] [Regression safety]: When AUTO_MODE=false (default), zero behavioral change — no DECISIONS.md creation, no auto-decisions, no new file reads.
- [Auto mode never stops]: Agent always decides and continues. Only exception: truly irreversible operations (auth gates, destructive ops like database drops). All decisions logged to DECISIONS.md. LOW confidence decisions flagged with `⚠ NEEDS REVIEW`.
- [Scope expansion only at inception]: `/fh:new-project --auto` uses SCOPE EXPANSION thinking during initial roadmap creation to dream big. All subsequent `/fh:plan-review` calls use HOLD SCOPE mode to prevent runaway scope creep.
- [DECISIONS.md is top-level audit trail]: `.planning/DECISIONS.md` is the single append-only decision journal. Each decision identifies its related phase. CONTEXT.md per-phase gets the relevant subset injected for subagent consumption. Agents never edit DECISIONS.md entries — only append new ones.
- [Hybrid orchestrator architecture]: `/fh:auto` is a Claude Code skill that validates inputs and configuration, then shells out to a Node.js orchestrator script (`bin/auto-orchestrator.cjs`) that uses `claude -p` for process-isolated agent sessions. Each phase step (plan-work, plan-review, build, review) is a separate `claude -p` session with fresh context.
- [Decision correction cascade]: When a user marks a decision as CORRECTED in DECISIONS.md, the system reads the `Affects` field to identify impacted artifacts and creates a correction plan. Mechanical changes auto-apply; architectural changes produce a new plan for the affected phase.
- [claude -p is safe]: `claude -p` is an officially supported Claude Code feature for headless/programmatic use. No TOS risk running on own machine with own subscription.
- [Auto requirements workshop]: `/fh:auto` begins with a research-driven strategic workshop BEFORE autonomous execution. First does domain research (competitor analysis, community pain points, landscape, user sentiment via firecrawl). Then reads existing PROJECT.md, REQUIREMENTS.md, ROADMAP.md and only probes gaps. Uses research findings to drive informed conversations — concrete competitor references and market gaps rather than abstract open questions. Operates at VC/strategic level — pushes for ambitious scope, USPs, differentiation, north star clarity. Offers concrete directions and suggestions based on research findings. Updates planning artifacts with refined vision, then hands off to the autonomous loop.
- [Research files consumed downstream]: `.planning/research/*.md` (project-level research from new-project) must be indexed in context-mode bootstrap alongside phase-level and milestone-level research, so plan-work, plan-review, and build sessions can search them.
- [Firecrawl preferred for researchers]: Researcher agents use firecrawl as primary web tool with WebSearch/WebFetch as fallback. Firecrawl provides higher quality, LLM-optimized results.
- [Researcher MCP integration]: Both gsd-phase-researcher and gsd-project-researcher agents get context-mode and claude-mem in their tools list and usage instructions in their prompts, so they can search indexed project docs and recall cross-session history.
- [Unified dashboard]: The existing `/fh:tracker` dashboard is extended with auto-mode monitoring panels rather than creating a separate dashboard. Auto-mode panels show/hide based on `.auto-state.json` presence.
- [Preact + compat for shadcn-style]: Dashboard uses Preact with `@preact/compat` shim so Recharts (React library) works. React aliased via npm `"react": "npm:@preact/compat"` and esbuild `alias` config. No switch to full React.
- [Recharts for charts]: Recharts chosen for time-series cost charts and step timeline. Works via preact-compat. Adds ~150KB to bundle but provides full-featured animated charts matching shadcn's chart component.
- [Enriched auto-state JSON]: Orchestrator writes enriched `.auto-state.json` with `step_history` array (timing + cost per step), `errors` array, and `last_log_line`. This is the single data source for all dashboard auto-mode panels.
- [Auto-open browser]: Orchestrator opens `http://127.0.0.1:3847` via macOS `open` command at startup. Non-blocking, no error if tracker isn't running.

## Discretion Areas

- [Decision ID format]: Agent decides the specific format for decision IDs (D-001, D-002, etc.) as long as they are unique, sequential, and parseable.
- [Stuck detection thresholds]: Agent decides specific timeout values and retry counts, within bounds: soft timeout 5-15min, hard timeout 30-60min, max retries 1-3.
- [Cost tracking granularity]: Agent decides how to track costs (per-session, per-phase, or per-step) as long as total cost is visible and budget ceiling is configurable.
- [Orchestrator script structure]: Agent decides internal structure of `bin/auto-orchestrator.cjs` as long as it uses `claude -p`, handles crashes gracefully, and persists state to `.planning/`.
- [Workshop question depth]: Agent decides specific questions to ask during the strategic workshop, as long as it covers: vision/north star, success criteria, differentiation/USPs, scope ambition, and doesn't re-ask what's already in planning artifacts.

## Deferred Ideas

- [Slack/Discord integration for remote questions]: GSD-2 routes questions to Slack/Discord. Interesting but out of scope for v1 of auto mode.
- [Web dashboard for auto mode monitoring]: ~~Out of scope~~ → Now in scope as Plan 07-05. Consolidated into `/fh:tracker`.
- [Multi-worker coordination]: Parallel `claude -p` sessions working on different phases simultaneously. Complex IPC needed. Defer to v2.
- [Conductor API integration]: When Conductor exposes a programmatic API for tab/workspace creation, integrate. Not available today.
