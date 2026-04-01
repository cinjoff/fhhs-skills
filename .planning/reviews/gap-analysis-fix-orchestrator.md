# Gap Analysis Report -- fix-orchestrator-tool-listening (v2)

**Base:** 0c229887 | **Head:** b4a81db0 (e9613e3b on main sync)
**Files changed:** 145 | **Lines:** +18,283 / -2,890

## Strengths

- **Graceful shutdown** (`handleShutdown`) kills child processes and writes interrupted state atomically -- solid crash recovery.
- **Unified write queue** (`_stateWriteQueue`) eliminates race conditions between `writeAutoStatus()`, `saveAutoState()`, and `log()`.
- **Tool-aware stuck detection** with per-step thresholds (`STUCK_KILL_BY_STEP`, `TOOL_TIMEOUT_EXTENSIONS`) -- builds get 15min vs 8min for planning. Well-calibrated.
- **Lazy require in gsd-tools.cjs** with static-analysis regression test preventing top-level imports from creeping back.
- **Step history + per-phase cost aggregation** gives genuine observability.
- **`require.main === module` guard** makes orchestrator testable as a module.
- **`cascadePlanFailures` safeguards** already-built/reviewed phases from being rescheduled.
- **Atomic file writes** via tmp+rename pattern used consistently throughout.

---

## Critical Gaps

1. **server.cjs:824 -- `since` filter uses wrong field name** (Confidence: 95)
   - `serveLogs()` filters on `entry.timestamp` but `logEvent()` writes `entry.ts`. Incremental log fetching via SSE silently breaks -- dashboard accumulates unbounded entries or shows stale data.
   - Fix: Change `entry.timestamp` to `entry.ts`.

---

## Important Gaps

2. **`bin/lib/schemas.cjs` is dead production code; dual `validateAutoState` diverges** (Confidence: 90)
   - File: `bin/lib/schemas.cjs` (90 lines) + `auto-orchestrator.cjs:~488`
   - `schemas.cjs` requires `active`, `started_at`, `phases_total`, `phases_completed`, `activity_events`, `session_activity`, `log_buffer`. The orchestrator's inline version does NOT require any of these -- it only checks `phase`, `phase_states`, `total_cost_estimate`, `retry_count`, `phase_plan_paths`.
   - Only consumer: `auto-orchestrator.test.cjs:442`. Production never loads `schemas.cjs`.
   - Fix: Pick one source of truth. Either import `schemas.cjs` from orchestrator, or delete it and test the orchestrator's own export.

3. **`_stateWriteQueue` never awaited before process exit** (Confidence: 85)
   - `handleShutdown()` calls `fs.writeFileSync` directly (bypassing the queue), which is correct for signal handlers. But `main()` calls `writeAutoStatus` (async-queued) then immediately exits via `process.exit(0)`. Pending queued writes are silently dropped.
   - Fix: `await _stateWriteQueue` before `process.exit(0)` in the `.then()` handler.

4. **New evals 285-288 have only 1 check each -- below 2-check minimum** (Confidence: 95)
   - CLAUDE.md: "every eval must have `checks` with 2+ regex patterns; smoke-tier needs 3+."
   - All 4 newly added evals have `checks` length of 1.
   - Fix: Add at least one more regex check per eval.

5. **170 of 315 evals violate check-count rules; 17 have empty `checks: []`** (Confidence: 85)
   - Many may be pre-existing, but the diff adds new violating evals. At minimum, the 4 new ones must be fixed.

6. **`aggregatePhaseMetrics` returns inconsistent shapes per overload** (Confidence: 80)
   - With `phaseId`: returns `{ tokens_in, tokens_out, elapsed_ms, step_count }`.
   - Without `phaseId`: returns `{ [id]: { tokens_in, tokens_out, cost_estimate, elapsed_ms, steps, read_calls } }`.
   - Field names differ (`step_count` vs `steps`), single-phase variant lacks `cost_estimate` and `read_calls`.
   - Fix: Unify field names or split into two named functions.

7. **`runClaudeSession` does not validate required `opts.sessionId` / `opts.stepName`** (Confidence: 78)
   - INVARIANT comment mandates both, but no runtime guard. If `sessionId` is undefined, `_sessionActivity[undefined]` silently becomes a phantom entry.
   - Fix: Add a guard at function entry: `if (!opts.sessionId) throw new Error(...)`.

8. **`cascadePlanFailures` and `createJsonLineParser` are exported but untested** (Confidence: 80)
   - Both functions are in the module.exports but have no test coverage in `auto-orchestrator.test.cjs`.
   - `cascadePlanFailures` has nuanced edge cases (already-built phases, self-rescheduling).
   - Fix: Add test cases for both.

---

## Minor Gaps

9. **`CLAUDE_MEM_SKIP_TOOLS` is a 500+ char hardcoded string** (Confidence: 75)
   - File: `auto-orchestrator.cjs:~895`
   - If upstream adds/renames tools, this silently becomes stale.
   - Suggestion: Extract to a constant array, `.join(',')` at usage.

10. **`resolveProjectName` calls `gh repo view` with 5s timeout on every session** (Confidence: 75)
    - Adds latency; consider caching after first resolution.

11. **`createJsonLineParser` buffer cap silently drops data at 1MB** (Confidence: 75)
    - No warning logged when cap is hit.

12. **`_toolLogThrottles` Map can grow unboundedly if sessions crash without `close` event** (Confidence: 78)
    - Minor memory leak over very long orchestrator runs.

13. **`parser.cjs` `stripStatusSuffix` -- new function with no test coverage** (Confidence: 80)

14. **`LogTail` `apiEntries` accumulates without bound in browser memory** (Confidence: 80)

---

## Assessment

**Ready to merge: With fixes**

**Reasoning:** The orchestrator rewrite is substantial and well-architected. The critical gap (#1, timestamp field mismatch) is a one-line fix. The important gaps are: dual `validateAutoState` divergence (#2), unawaited write queue on exit (#3), and eval check-count violations (#4). All are straightforward to address. No data-loss risks or security issues identified.
