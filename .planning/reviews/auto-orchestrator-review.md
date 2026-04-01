# Auto-Orchestrator Code Review

**File:** `/Users/konstantin/conductor/workspaces/fhhs-skills/davao-v1/.claude/skills/auto/auto-orchestrator.cjs`
**Lines:** 3157
**Date:** 2026-04-01

---

## A. Phase/Plan State Detection

### Fresh Start vs Resume (lines 2278-2307)

The fix at lines 2282-2293 is **correct and well-implemented**. On fresh start (no `--resume`), the code iterates all `phasesToRun` and calls `findLatestPlan()` to detect existing PLAN.md files on disk. If found, the phase is marked `'planned'` instead of `'pending'`. This prevents re-planning phases that already have plans from manual `/fh:plan-work` runs or prior incomplete auto runs.

Resume state (lines 2295-2307) correctly overrides disk-based detection, since saved state may be further along (e.g., `'reviewed'` or `'built'`).

### SUMMARY.md Detection (lines 2264-2276)

Correctly excludes fully-complete phases (PLAN.md + SUMMARY.md exist) from the pipeline entirely before state initialization.

### Potential State Transition Gap

**MEDIUM** (Confidence: 78) — **Lines 2583-2584**: The review wave filters for `phase_states[p.id] === 'planned' || phase_states[p.id] === 'reviewed'`, but phases that were detected as `'planned'` from disk (line 2288) and never went through the planning wave's cost tracking or step_history recording will enter the review wave without any planning metrics. This is functionally correct but means step_history will have gaps — no `plan-work` entry for pre-existing plans. **Impact:** Cost estimates and timing metrics will be understated.

---

## B. Timeout Numbers

| Constant | Value | Line | Assessment |
|---|---|---|---|
| `SOFT_TIMEOUT_MS` | 10 min | 193 | Reasonable for warning |
| `HARD_TIMEOUT_MS` | 45 min | 194 | Generous — appropriate for large builds |
| `STUCK_SILENCE_MS` | 5 min | 195 | Good (was 3 min, comment says it caused false alarms) |
| `STUCK_KILL_MS` | 8 min (default) | 196 | Reasonable default |
| `STUCK_KILL_BY_STEP['build']` | 15 min | 202 | Good — builds can go silent during compilation |
| `STUCK_KILL_BY_STEP['final-review']` | 10 min | 204 | Good — full reviews are longer |
| `API_HEALTH_TIMEOUT_MS` | 15s | 207 | Fine |
| `API_BACKOFF_BASE_MS` | 10s | 208 | Fine |
| `API_BACKOFF_MAX_MS` | 120s (2 min) | 209 | Fine |
| `API_MAX_HEALTH_RETRIES` | 5 | 210 | Fine — total ~5 min of backoff |
| `MAX_RETRIES` | 2 | 206 | **See finding below** |
| `HEALTH_CACHE_TTL_MS` | 60s | 594 | Fine |

### Finding: MAX_RETRIES semantics are confusing

**MEDIUM** (Confidence: 80) — **Line 206, 1835**: `MAX_RETRIES = 2` but the while loop is `while (attempts < MAX_RETRIES && !stepSucceeded)`. On first failure, `attempts` becomes 1; on second failure it becomes 2, which equals `MAX_RETRIES`, exiting the loop. The log at line 1855 says `attempt ${attempts}/${MAX_RETRIES}` which shows "1/2" and "2/2". So effectively there's 1 initial attempt + 1 retry = 2 total attempts. The constant name `MAX_RETRIES` is misleading — it's really `MAX_ATTEMPTS`. The log at line 1837 says "Retry 1/1" (since `MAX_RETRIES - 1 = 1`), which is correct but confusing alongside `MAX_RETRIES = 2`.

**Recommendation:** Rename to `MAX_ATTEMPTS` or change to `MAX_RETRIES = 1` with `attempts <= MAX_RETRIES`.

### What happens when a session is killed for being stuck (lines 876-881)

SIGTERM is sent first, then SIGKILL after 5s. The `close` handler (line 916) creates an error with `err.stuck = true` and `err.timeout = true`. The `isApiError()` function (line 648-649) correctly returns `false` for stuck/timeout errors, so no health check backoff is triggered for orchestrator-initiated kills. The error then flows through `runStepWithRetry`'s retry logic normally.

---

## C. Status/Data Emission

### .auto-state.json writes

Written via `_stateWriteQueue` (line 510) — a Promise chain that serializes all writes. Both `writeAutoStatus()` (line 78) and `saveAutoState()` (line 512) and `log()` (line 325) all chain onto this queue.

**Write uses atomic rename pattern** (line 84-85): write to `.tmp`, then `rename()`. Good for preventing partial reads by the tracker.

### Race condition assessment

**LOW** (Confidence: 65) — The `_stateWriteQueue` prevents file-level races between the three write sources (`writeAutoStatus`, `saveAutoState`, `log`). However, in the parallel pipeline path, `totalCostEstimate` (line 2433) is modified by concurrent planning sessions without synchronization. Since JS is single-threaded and `+=` on a number is atomic in V8's event loop, this is safe in practice — each `await` yields and the `+=` happens in a microtask. **No actual race condition.**

### Tracker integration

- Registers project in `~/.claude/tracker/projects.json` (SKILL.md lines 56-77)
- Writes `.auto-state.json` to `.planning/` for tracker polling
- Appends session history to `~/.claude/tracker/history.jsonl` (line 1621-1648)
- JSONL event log at `.planning/.auto-log.jsonl` (line 1720)

---

## D. Sequential Fallback Path

### Trigger conditions

1. `--no-speculative` flag (line 1942) — enters fully sequential loop
2. Pipeline failures — phases marked `'rescheduled-sequential'` or `'blocked'` get processed in the rescheduled phases section (lines 2874-3000)

### Handling of already-planned/reviewed phases (sequential fallback for rescheduled)

**Lines 2906-2909**: Correctly skips `plan-work` if a valid plan already exists from the planning wave. **Lines 2896**: Correctly initializes `currentPlanPath` from `phasePlanPaths`.

### claude-mem context in sequential fallback

**The sequential fallback path uses `runStepWithRetry` which calls `executeStep` which calls `runClaudeSession`** — same session runner as the parallel path. `CLAUDE_MEM_PROJECT` is set in the env (line 824), so claude-mem context is preserved across all paths.

However, the **rescheduled sequential path** (lines 2886-2999) duplicates significant logic from the main sequential loop (lines 1946-2253). This violates DRY but is functionally correct.

---

## E. claude-mem Integration

### CLAUDE_MEM_PROJECT

Set at **line 824** in `runClaudeSession()`, which is the single session runner used by ALL paths (plan, review, build, validation, correction cascade, final review, batch review). Every session type gets it.

### Resolution

`resolveProjectName()` (lines 741-774) has a 3-tier resolution:
1. `process.env.CLAUDE_MEM_PROJECT` (already set, e.g., via `.claude/settings.json`)
2. GitHub `nameWithOwner` via `gh repo view`
3. Git toplevel basename

**No session path can lose claude-mem context** — the env var is always injected.

### CLAUDE_MEM_SKIP_TOOLS

**Line 826**: A long list of tools is passed via `CLAUDE_MEM_SKIP_TOOLS` env var. This is a performance optimization to prevent claude-mem from instrumenting irrelevant tools.

---

## F. Error Handling

### API errors (lines 647-657)

Pattern-based classification. Distinguishes API/infra errors from logic errors. API errors trigger health check + backoff before retry.

### Retry logic (lines 1814-1938)

- Budget check before each step
- API health check before spawn
- Up to `MAX_RETRIES` (2) attempts per step
- On final failure: logs decision with stdout/stderr tail, writes error log file, writes PARTIAL-SUMMARY.md for killed builds
- API-down: saves state and exits with code 1

### Error log persistence

Written to `{phaseDir}/{step}-error.log` (lines 2875-2896). Contains exit code, reason, stderr, and last 3000 chars of stdout. Good for post-mortem.

### Finding: Unhandled rejection in main catch handler

**HIGH** (Confidence: 85) — **Lines 3148-3155**: The `main().catch()` handler calls `writeAutoStatus()` which chains onto `_stateWriteQueue` (a Promise). But then immediately calls `fatal()` which calls `process.exit(1)`. The `process.exit(1)` may fire before the queued write completes, losing the final error state. The tracker would show the last-written state instead of the error.

**Fix:** Await the write queue drain before exiting, or use `writeFileSync` directly in the fatal error handler instead of going through the async queue.

---

## G. Build Wave

### Dependency graph construction (lines 1375-1440)

- Phases with no `files_modified` frontmatter: **conservative fallback** — treated as depending on ALL predecessors (line 1386-1394). This is safe but pessimistic.
- Cycle detection via DFS (lines 1416-1437). On cycle: falls back to fully sequential. Good defensive behavior.
- Wave assignment via topological sort (lines 1544-1587).

### Missing files_modified

Handled at line 1386: `if (!laterPlan || !laterPlan.files_modified || laterPlan.files_modified.length === 0)` — depends on all predecessors. Logs a warning. **This is correct and conservative.**

### Speculative plan validation (lines 1448-1536)

Computes file overlap with predecessors. If overlap exists, spawns a validation session. Results: VALID (proceed), ADJUSTED (plan updated), REPLAN (re-run planning).

**Finding: REPLAN re-runs plan-work but doesn't re-parse frontmatter**

**HIGH** (Confidence: 82) — **Lines 2728-2736**: When REPLAN is triggered, `runStepWithRetry(phase, 'plan-work', null)` re-runs planning and updates `phasePlanPaths`. However, `planMap[phase.id]` (used by the dependency graph) is NOT updated with the new plan's frontmatter. The old `files_modified` from the original plan remains in `planMap`. If a subsequent phase's validation checks overlap against this phase, it will use stale data.

**Fix:** After REPLAN, re-parse the new plan's frontmatter: `planMap[phase.id] = parsePlanFrontmatter(phasePlanPaths[phase.id]);`

---

## H. Other Issues

### Finding: elapsed_ms always 0 in parallel path step_history

**MEDIUM** (Confidence: 90) — **Lines 2453, 2604, 2817**: In the parallel pipeline path, `elapsed_ms` is hardcoded to `0` for all step_history entries. The sequential path correctly computes it from `_autoStatus.stepStartedAt` (line 2097), but the parallel path never sets `_autoStatus.stepStartedAt`. This means all timing data in the parallel pipeline's step_history is lost.

**Fix:** Track per-session start time locally (e.g., `const stepStart = Date.now()`) before the `runClaudeSession` call, and compute elapsed as `Date.now() - stepStart`.

### Finding: started_at/completed_at timestamps in parallel path are identical

**MEDIUM** (Confidence: 88) — **Lines 2455-2456, 2605-2606**: Both `started_at` and `completed_at` are set to `new Date().toISOString()` at recording time (after the session completes). They should capture the actual start time before the session runs.

### Finding: Resource cleanup — timer leak on process kill

**LOW** (Confidence: 70) — **Lines 861-903**: The `activityCheck` interval and `softTimer`/`hardTimer` timeouts are cleaned up in the `cleanup()` function called from `close` and `error` events. If the Node.js process itself is killed (SIGINT/SIGTERM to the orchestrator), these timers keep child processes alive briefly. This is mitigated by the OS cleaning up child processes, but could cause brief zombie sessions.

### Finding: Sequential fallback doesn't skip already-reviewed plans

**MEDIUM** (Confidence: 80) — **Lines 2905-2909**: The rescheduled sequential path skips `plan-work` if a plan exists, but does NOT skip `plan-review` even if the phase was already reviewed (state was `'reviewed'` before being downgraded to `'rescheduled-sequential'`). This wastes an API session re-reviewing an already-reviewed plan.

**Fix:** Add similar skip logic for `plan-review` when the phase previously reached `'reviewed'` state.

### Finding: `totalCostEstimate` concurrent modification in parallel sessions

**LOW** (Confidence: 60) — **Line 2433**: `totalCostEstimate += sessionCost` is called from concurrent pool tasks. As noted in Section C, this is safe in single-threaded JS because each `await` yields. No actual bug.

### Finding: stableRun flag shared across parallel builds

**MEDIUM** (Confidence: 78) — **Line 2785**: `stableRun = false` is set when any build fails. Since builds in a wave run concurrently, one failure sets `stableRun = false` affecting state write behavior for other concurrent builds in the same wave. This could cause slightly inconsistent write patterns but is not a correctness issue — it just means some builds get per-step writes and others get phase-boundary writes within the same wave.

### Edge case: Single-phase runs

Single-phase runs work correctly. The code handles `phasesToRun.length === 1` naturally — no special casing needed. The dependency graph has no edges, wave assignment puts it in wave 1, and it builds sequentially as a single-element wave.

---

## Summary Table

| # | Severity | Confidence | Lines | Description |
|---|----------|------------|-------|-------------|
| 1 | HIGH | 85 | 3148-3155 | `process.exit(1)` in main catch races with async state write — error state may be lost |
| 2 | HIGH | 82 | 2728-2736 | REPLAN doesn't update `planMap` — stale `files_modified` used by subsequent validations |
| 3 | MEDIUM | 90 | 2453,2604,2817 | `elapsed_ms` always 0 in parallel path step_history — timing data lost |
| 4 | MEDIUM | 88 | 2455-2456 | `started_at`/`completed_at` both set after completion — incorrect timestamps |
| 5 | MEDIUM | 80 | 2905-2909 | Sequential fallback re-reviews already-reviewed plans — wasted API session |
| 6 | MEDIUM | 80 | 206,1835 | `MAX_RETRIES` naming is misleading — actually `MAX_ATTEMPTS` |
| 7 | MEDIUM | 78 | 2583-2584 | Pre-existing plans enter review wave without planning metrics in step_history |
| 8 | MEDIUM | 78 | 2785 | `stableRun` shared across parallel builds — inconsistent write patterns |
