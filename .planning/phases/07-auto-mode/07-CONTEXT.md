## Decisions

- [CLAUDE_MEM_PROJECT env var override]: Orchestrator sets `CLAUDE_MEM_PROJECT` in the env passed to `claude -p` spawn calls. A unified patch adds three-tier detection to gp(): env var → worktree → basename. Env var takes highest priority, bypassing all other detection logic.
- [review] [Git rev-parse for project name]: Orchestrator derives project name via `git rev-parse --show-toplevel` (5s timeout, falls back to path.basename). Critical for Conductor workspaces where `path.basename(cwd)` returns the workspace name ("quito") not the project name ("nerve-os"). [revised in review — was: "Use path.basename(projectDir)"]
- [review] [Unified patch subsumes worktree]: Single patch script (`patch-claude-mem-project-env.cjs`) handles all four input states of gp() (original, worktree-patched, env-patched, both). The worktree-only patch becomes redundant after this is applied.
- [review] [Task grouping dropped — maximize parallelism]: With ctx_search pre-indexing solving redundant reads, grouping tasks into combined agents provides marginal benefit while REDUCING parallelism. Agents run in parallel (one per task) and access pre-cached files via ctx_search. [revised in review — was: "Task grouping by file overlap"]
- [ctx_search-first in implementer-prompt]: Agents use ctx_search for ALL context reading (conventions, decisions, source patterns, test patterns). Read reserved for files being edited. When pre-indexing succeeds, orchestrator leaves {CLAUDE_MD_SECTIONS} and {DESIGN_DECISIONS} empty — agents fetch on-demand via ctx_search.
- [Comprehensive pre-indexing]: Build Step 2 pre-indexes source files + per-task files + test file discovery (convention-based) + Step 2.5 test-spec skeletons. Deduplicates across tasks. Post-wave re-index serves as cache invalidation.
- [review] [Conditional context injection]: When pre-indexing succeeds, orchestrator skips populating {CLAUDE_MD_SECTIONS} and {DESIGN_DECISIONS} — agents fetch via ctx_search (smaller prompts). When context-mode unavailable, populates as today (backward compatible).
- [review] [Per-session metrics]: Orchestrator captures tokens_in, tokens_out, read_calls, ctx_search_hits per session in .auto-state.json stepHistory. PHASE_METRICS log line emitted for claude-mem cross-session comparison. Enables data-driven optimization.

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
- [review] [Parallel pipeline architecture]: Orchestrator uses 3-wave pipeline (concurrent planning → concurrent review → dependency-ordered build) with speculative planning and file-overlap validation. Max concurrency configurable via --concurrency (default 2, max 4). Builds remain sequential in v1.
- [review] [Phase-local decisions]: Concurrent planning sessions write to .decisions-pending.md per phase, merged by orchestrator after planning wave. Prevents DECISIONS.md write races.
- [review] [Context-mode pre-indexing]: Orchestrator indexes shared docs (PROJECT, ROADMAP, research, codebase mapping) once before planning wave. Sessions use ctx_search (read-only) for shared docs, only index phase-local files. Prevents SQLite write contention.
- [review] [No git SHA tracking for validation]: Validation uses plan frontmatter files_modified instead of git diff. Simpler — plan-check already validates files_modified completeness.
- [review] [Partial failure handling]: If planning fails for Phase X, dependent phases (from dep graph) rescheduled to sequential; independent phases continue normally.
- [review] [Conditional build failure handling]: If Phase N build fails and no file overlap with Phase N+1's speculative plan, retain the plan. If overlap, discard and replan.
- [review] [Design system foundation]: Dashboard uses shared animation primitives (animations.js + CSS keyframes) — AnimatedNumber, PHASE_COLORS palette, stagger-item, skeleton shimmer, valueFlash. All components import from this shared layer, no ad-hoc styling.
- [review] [ease-out-expo as standard timing]: All dashboard animations use cubic-bezier(0.16, 1, 0.3, 1) — the industry standard for entry/exit (Linear, Vercel, Raycast pattern).
- [review] [100ms activity batching]: SSE activity events from Claude session watcher batched at 100ms (human perception threshold), not 1s debounce. Gives real-time feel without re-render storms.
- [review] [Skeleton loading over text loading]: Dashboard uses shimmer skeleton matching layout shape instead of "loading_" text. More polished, communicates structure before data arrives.
- [review] [memo() on PhasePill]: PhasePill wrapped in Preact memo() — with 10 concurrent pills receiving frequent updates, only the changed pill re-renders.
- [review] [useRef for animations not useState]: AnimatedNumber and all rAF-driven animations use useRef for current value, never useState. Preact fires rAF same-tick as render — use setTimeout(fn, 0) to ensure DOM committed before animating.
- [Quick review batching]: Reviews batched every 3 phases instead of per-phase. Reduces review overhead by ~66%. Batches split if >20 files.
- [Speculative plan validation]: File-overlap check between plan frontmatter files_modified arrays. On overlap, lightweight validation session checks semantic conflicts. REPLAN fallback for fundamental conflicts.

## Discretion Areas

- [Decision ID format]: Agent decides the specific format for decision IDs (D-001, D-002, etc.) as long as they are unique, sequential, and parseable.
- [Stuck detection thresholds]: Agent decides specific timeout values and retry counts, within bounds: soft timeout 5-15min, hard timeout 30-60min, max retries 1-3.
- [Cost tracking granularity]: Agent decides how to track costs (per-session, per-phase, or per-step) as long as total cost is visible and budget ceiling is configurable.
- [Orchestrator script structure]: Agent decides internal structure of `bin/auto-orchestrator.cjs` as long as it uses `claude -p`, handles crashes gracefully, and persists state to `.planning/`.
- [Workshop question depth]: Agent decides specific questions to ask during the strategic workshop, as long as it covers: vision/north star, success criteria, differentiation/USPs, scope ambition, and doesn't re-ask what's already in planning artifacts.

## Deferred Ideas

- [Context-mode in plan-work/review/plan-review]: Build skill now uses ctx_search-first (plan 07-08). Extending the same pattern to plan-work, review, and plan-review skills is a separate effort — those skills also use Read directly for context. Lower priority since build is the biggest time consumer.
- [Cross-session file sharing via context-mode]: The 4 steps (plan→review→build→review) share a context-mode DB via CLAUDE_SESSION_ID, but only build pre-indexes source files. plan-work could pre-index during research, making subsequent steps faster. Depends on context-mode working reliably in headless sessions first.
- [Soft timeout tuning]: Every build hit 10-min soft timeout. Since no builds actually failed, raise to 20-25 min. Simple config change but needs production validation first.

- [Slack/Discord integration for remote questions]: GSD-2 routes questions to Slack/Discord. Interesting but out of scope for v1 of auto mode.
- [Web dashboard for auto mode monitoring]: ~~Out of scope~~ → Now in scope as Plan 07-05. Consolidated into `/fh:tracker`.
- [Multi-worker coordination]: ~~Deferred to v2~~ → Now in scope as Plan 07-06. Parallel pipeline with concurrent planning + review, sequential builds.
- [Parallel builds via git worktrees]: Wave structure from 07-06 supports this but v1 builds sequentially. Revisit when build-phase parallelism becomes the bottleneck after planning parallelism is proven.
- [Cross-machine distribution]: Multiple machines running phases in parallel via shared git remote. Far future.
- [Conductor API integration]: When Conductor exposes a programmatic API for tab/workspace creation, integrate. Not available today.
- [review] [Geist font upgrade]: Research recommends Geist/Geist Mono (Vercel's typeface) for modern monosans aesthetic. Currently using JetBrains Mono which is fine. Consider switching if user wants more Linear-like feel.
- [review] [OKLCH color system migration]: Research recommends OKLCH over hex/HSL for perceptual uniformity. Current tokens use hex. Full migration deferred — would touch all components.
- [review] [Keyboard navigation]: Linear pattern — j/k to navigate phase pills, Enter to expand. Deferred — dashboard is primarily view-only during auto runs.
