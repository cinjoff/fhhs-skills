---
phase: 04-ux-onboarding
plan: 03
status: complete
completed_at: "2026-03-29"
---

# Summary: Auto Job Observability (04-03)

## What was done

### Task 1: Orchestrator — structured activity events, freshness, per-step timeouts, kill sentinel
- Added `_activityEvents` rolling array (max 30) with `pushActivityEvent()` helper
- Added `last_activity_at` ISO timestamp to `_autoStatus`, updated on every stdout/stderr chunk
- Both fields included in `buildAutoStatus()` output → written to `.auto-state.json`
- Added `STUCK_KILL_BY_STEP` lookup: build gets 15min stuck-kill threshold, plan/review keep 8min
- Added `.auto-kill` sentinel check in the 30s activity monitor interval — graceful SIGTERM on detection
- Passed `stepName` through `executeStep()` → `runClaudeSession()` opts for per-step threshold selection
- Activity events pushed at: phase start, step start, step complete, step error, phase complete

### Task 2: Server — wire auto activities into API, add kill endpoint
- `buildState()` now reads `activity_events` from auto-state and merges into `recentActivity`
- `recentActivity.splice()` limit increased from 10 to 20 for auto events headroom
- `serveActivity()` returns real `lastState.recentActivity` instead of empty `[]`
- Added `POST /api/kill` endpoint — writes `.auto-kill` sentinel to active project's `.planning/`
- Avoided duplicate `readAutoState()` call by hoisting it before activity merge

### Task 3: AutoPipeline UI — freshness indicator and kill button
- Added `FreshnessIndicator` component: color-coded dot + relative time (green <1m, yellow 1-3m, amber 3-8m, red >8m)
- Added `KillButton` component: appears after 3min silence, POSTs to `/api/kill`
- Both wired into the header row alongside elapsed time and cost
- `LogTail` defaults to expanded when `autoExpand={true}` (always on for auto pipeline)

### Task 4: App — merge auto activities into ActivityFeed
- `ActivityFeed` now receives merged activities: existing + `autoState.activity_events`
- Deduplication by timestamp+text prevents double-rendering
- Sorted newest-first, capped at 20 items

## Verification

All plan verification commands pass:
- `node -c` syntax checks pass for orchestrator and server
- `grep` verifications confirm all new fields, thresholds, endpoints, and components exist
- 6 new evals (IDs 306-311) with deterministic_checks all pass

## Files Modified
- `.claude/skills/auto/auto-orchestrator.cjs` — activity events, freshness, per-step thresholds, kill sentinel
- `templates/project-tracker/server.cjs` — activity merging, real activity endpoint, kill endpoint
- `templates/project-tracker/src/components/AutoPipeline.jsx` — FreshnessIndicator, KillButton, auto-expand log
- `templates/project-tracker/src/app.jsx` — auto activity merging into ActivityFeed
- `evals/evals.json` — 6 new micro-tier evals (306-311)

## Test Metrics
- deterministic_checks: 8/8 passing
- syntax_checks: 2/2 passing
- new_evals: 6 added (all deterministic checks pass)
