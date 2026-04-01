# Phase 17: GSD State Efficiency & Tool Restoration — CONTEXT

## Decisions

- [Session-scoped queries]: Replace global "current phase" singleton with session-scoped queries. Each session knows its scope via env vars (GSD_PHASE, GSD_PLAN, GSD_MILESTONE). Queries are phase-specific (phase-info, plan-info) not global. Solves parallel execution race conditions.
- [Deterministic scripts over LLM parsing]: Anything that's "read markdown, extract structured data" becomes a gsd-tools command, not an LLM task. phase-info, plan-info, phase-next-plan, milestone-info are all deterministic Node.js scripts.
- [Env var fallback chain]: Skills check env vars first → gsd-tools commands second → file reads last. This eliminates double-reads in auto mode and makes skills work correctly in parallel.
- [--compact flag on state-snapshot]: Add flag to existing command instead of creating new `state summary` command. Reuses existing parser, no API surface bloat.
- [Named milestones with sequential number]: Canonical notation is `M{N}: v{X.Y} {Topic Name}` (e.g., "M3: v3.0 Ecosystem & Sync"). Three fields in STATE.md frontmatter: milestone (version), milestone_name (topic), milestone_number (sequential integer for sorting). Number auto-increments on new-milestone.
- [Milestone awareness principle]: Skills/agents should never re-read STATE.md for milestone info when GSD_MILESTONE env var or init context provides it. One lookup, passed forward through the entire pipeline.
- [Milestone as workflow boundary]: Milestones are natural archiving points. Auto detects milestone completion. complete-milestone archives phases to milestones/ and optionally scaffolds next milestone.
- [Milestone archiving]: Wire existing `milestone complete --archive-phases` — moves completed phase dirs to `milestones/vX.Y-phases/`. No new archiving code needed, just wiring.
- [Agent restoration approach]: Restored agents (plan-checker, verifier, integration-checker) are fhhs forks adapted to fhhs conventions (claude-mem integration, fh: prefixes), not raw upstream copies.
- [Checkpoint protocol]: Adopt GSD's 3 checkpoint types for interactive `/fh:build` only. Auto mode continues skipping all checkpoints (current behavior).
- [Auto skill stays]: fhhs auto is fundamentally different from GSD auto (multi-phase parallel pipeline vs single-phase execution). No replacement, only cherry-pick useful patterns (transition requirements evolution).
- [review] Skills should NOT be overloaded with milestone/state logic — keep it in gsd-tools scripts. Skills just call one command or check one env var.
- [review] All new gsd-tools commands return {error: ...} JSON on invalid input — never crash or return empty output
- [review] phase-info should reuse existing ROADMAP heading parser from roadmap analyze, not create a new regex
- [review] Milestone name stored in STATE.md frontmatter only — ROADMAP.md references by version, not duplicating name
- [review] Legacy STATE.md without milestone_name handled gracefully — defaults to "unnamed"

## Discretion Areas

- [Env var naming]: Convention for state env vars (GSD_PHASE, GSD_PLAN, GSD_MILESTONE) — implementer picks exact names but must be consistent across orchestrator and skills
- [Agent adaptation depth]: How much to customize restored agents vs keeping close to upstream — balance maintainability with fhhs conventions
- [Milestone name format]: Whether milestone names are free-text or follow a convention — implementer decides, but must support spaces and be display-friendly

- [review] (17-06) Test truth wording corrected: "unknown commands don't load lib modules" → "unknown commands exit non-zero + static analysis confirms no eager loads" — matches actual test behavior
- [review] (17-06) The `head -155` verification step in the plan is line-count-fragile; the test file's content-based approach is the canonical guard

## Deferred Ideas

- [State caching layer]: In-memory cache of parsed state across gsd-tools invocations — only matters if gsd-tools becomes long-running
- [ROADMAP.md machine-readable index]: Frontmatter with phase→line-range mappings — complex, smart_outline achieves similar benefit
- [gsd-executor restoration]: Build skill handles execution adequately
- [gsd-roadmapper restoration]: new-project handles this already
- [gsd-planner restoration]: plan-work handles this already
- [Retroactive milestone assignment]: Command to group existing phases into named milestones for existing projects — useful but not blocking
- [Expansion opportunity]: The ambitious version would be milestone-scoped auto execution with automatic milestone transitions, cross-milestone dependency tracking, and a milestone planning skill that helps decompose big goals into milestone-sized chunks
