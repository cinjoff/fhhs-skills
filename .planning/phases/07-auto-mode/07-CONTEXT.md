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

## Discretion Areas

- [Decision ID format]: Agent decides the specific format for decision IDs (D-001, D-002, etc.) as long as they are unique, sequential, and parseable.
- [Stuck detection thresholds]: Agent decides specific timeout values and retry counts, within bounds: soft timeout 5-15min, hard timeout 30-60min, max retries 1-3.
- [Cost tracking granularity]: Agent decides how to track costs (per-session, per-phase, or per-step) as long as total cost is visible and budget ceiling is configurable.
- [Orchestrator script structure]: Agent decides internal structure of `bin/auto-orchestrator.cjs` as long as it uses `claude -p`, handles crashes gracefully, and persists state to `.planning/`.

## Deferred Ideas

- [Slack/Discord integration for remote questions]: GSD-2 routes questions to Slack/Discord. Interesting but out of scope for v1 of auto mode.
- [Web dashboard for auto mode monitoring]: Real-time progress UI. Out of scope — use `/fh:tracker` and terminal output for now.
- [Multi-worker coordination]: Parallel `claude -p` sessions working on different phases simultaneously. Complex IPC needed. Defer to v2.
- [Conductor API integration]: When Conductor exposes a programmatic API for tab/workspace creation, integrate. Not available today.
