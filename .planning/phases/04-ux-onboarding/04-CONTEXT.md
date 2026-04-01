# Phase 04: UX & Onboarding — Context

## Decisions

- [Log streaming via auto-state.json]: Add `log_lines[]` array (last 30 lines) to `.auto-state.json` instead of a separate log file or new SSE endpoint. The orchestrator's `log()` function already debounces state writes — append to a rolling buffer there. Leverages existing file-watch SSE refresh mechanism.
- [Phase states for all in-scope phases]: Populate `phase_states` for ALL phases at orchestrator start (not just current phase). Each phase gets its status updated as it progresses. Gives the UI a complete picture without client-side derivation.
- [Wave grouping conditional on parallel mode]: Show wave grouping only when `build_order.length > 0` (parallel mode active). Flat phase list for sequential mode. No artificial wave structure.
- [Completion persistence]: Persist last run result in auto-state with `active: false` + `completed_at` timestamp. UI shows completion summary until next auto run or navigation. No auto-dismiss timer.
- [Phase status override from task completion]: Fix `parsePhases` in parser.cjs — after enriching roadmap phases with tasks, if all tasks have status `complete` (all plans have SUMMARY.md), override `phase.status = 'complete'` regardless of what ROADMAP.md text says.
- [No new SSE event types]: All data flows through existing `event: refresh` + `/api/state` fetch pattern. No new endpoints or event types needed.

## Discretion Areas

- Log line formatting: executor may choose whether to strip ANSI codes or timestamps from log lines before buffering
- Phase row layout details: exact spacing, animation timing, and icon choices within the design token system
- Error display format: how much error detail to show inline vs behind an expand toggle

## Plan 02 Decisions (UX & Onboarding)

- [First-run detection via symlink]: Check `~/.claude/get-shit-done/bin/gsd-tools.cjs` existence to determine if setup was run. No new marker files. (alternatives: explicit marker file, no detection)
- [Error standardization scope]: Core pipeline skills only — build, fix, plan-work, review, refactor, progress. Covers 80%+ of user interactions. Niche skills follow later. (alternatives: all 47 skills, reference standard + core)
- [Progress new-user routing]: Add setup detection to progress non-GSD fallback. Symlink check → route to /fh:setup if missing, /fh:new-project if present. (alternatives: beginner/expert modes, no change)
- [Enhance /fh:help not new skill]: Add Getting Started section to existing /fh:help rather than creating /fh:getting-started. Single authoritative reference. (alternatives: new skill, both)
- [Error message format]: Standard format `→ Run /fh:{command} — {what it does}` for all next-step suggestions. Consistent across core skills.
- [No cross-skill error codes]: Health.md has E/W/I codes but extending this taxonomy to all skills is premature. Just ensure every error has a next-step suggestion.

## Plan 02 Review Decisions

- [review] [Review soft gate]: /fh:review dependency check is a soft tip, not a hard stop. Review operates on git diffs and must work without GSD tracking. Other pipeline skills (build, fix, refactor) remain hard gates.
- [review] [Plan-review check is new]: plan-review/SKILL.md had no existing dependency check. Task 3 adds one fresh rather than updating an existing one.
- [review] [Help dedup]: Getting Started consolidates with existing Common Workflows "First time:" line to avoid maintaining duplicate flow descriptions.
- [review] [Eval coverage]: Added Task 6 to create at least 2 evals for onboarding behaviors (progress routing, setup --check). Without this, the must_haves [review] truth on eval coverage would fail verification.
- [review] [Verify skill removed from Getting Started]: /fh:verify does not exist as a shipped skill in .claude/skills/. Getting Started reduced to 4 steps ending with /fh:build (which already includes verification). Common Workflows First-time line points to Getting Started.
- [review] [4-step vs 5-step flow]: Getting Started uses 4 steps (setup → new-project → plan → build) instead of 5. Build already includes test, review, and verification stages. Adding a non-existent step would break the onboarding goal.

## Plan 03 Decisions (Auto Job Observability)

- [Activity source: pull from auto-state.json]: Extract `activity_events` from `.auto-state.json` during `buildState()` and merge into `recentActivity`. No new SSE event types (consistent with locked decision). Orchestrator writes structured events at step/phase transitions. (alternatives: orchestrator POSTs to tracker API — rejected because adds coupling and failure modes; WebSocket pipe — rejected per locked decision)
- [Stale detection: dual-sided with last_activity_at]: Orchestrator writes `last_activity_at` ISO timestamp to auto-state on every stdout/stderr chunk. Tracker reads this and independently shows freshness. Defense in depth — if orchestrator crashes, tracker can still detect staleness from stale timestamp.
- [Per-step stuck thresholds]: Build steps get 15min stuck-kill threshold (agents go silent during long tool calls, compilation, testing). Plan/review steps keep 8min. Lookup table `STUCK_KILL_BY_STEP` in orchestrator. User noted "staleness timeout might vary per type of work."
- [Kill via sentinel file]: Tracker writes `.planning/.auto-kill` sentinel on POST `/api/kill`. Orchestrator checks every 30s in activity monitor interval. File-based approach avoids needing the orchestrator to listen on a port. Sentinel is unlinked after detection.
- [Activity granularity: structured events only]: Step transitions, phase completions, and errors become ActivityFeed items with type badges. Raw log lines stay in collapsible LogTail. No flooding the feed with every log line. (alternatives: all log lines as activities — rejected, too noisy; only phase-level events — rejected, too sparse)

## Deferred Ideas

- Real-time stdout piping via WebSocket: too complex for current architecture, would require new server infra
- Dependency graph visualization (DAG rendering): interesting but needs a canvas/SVG library, defer to future
- Log search/filter within the activity feed: nice-to-have, not needed for initial release
- Per-phase cost breakdown chart: data exists in step_history but chart would add visual complexity
- Full error taxonomy (E/W/I codes) across all 47 skills: wait for core pipeline standardization to prove the pattern
- [Expansion opportunity]: The ambitious version would add an interactive onboarding wizard that detects user experience level, adapts skill suggestions contextually, and provides in-skill tooltips when it detects unfamiliarity — essentially a "guided mode" overlay across all skills
- Interactive contextual tooltips in skills: would detect user unfamiliarity and offer help — defer to Phase 6 or later
- Progressive disclosure / beginner vs expert modes: interesting UX pattern but over-engineering for current user base
- Audit /fh:help command references against actual skill inventory: /fh:verify and /fh:verify-ui are referenced in Build Pipeline table and Common Workflows but no corresponding skills exist in .claude/skills/ — either create the skills or remove the references
- Add /fh:verify as a standalone verification skill: would allow the Getting Started flow to have a distinct verification step (currently collapsed into /fh:build)
