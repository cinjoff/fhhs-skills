---
phase: 07-auto-mode
plan: 19
status: complete
started: 2026-04-01T02:50:00Z
completed: 2026-04-01T03:15:00Z
test_metrics:
  pass: 57
  fail: 4
  new_tests: 13
  pre_existing_failures: 4
---

## Summary

Implemented real-time tool event parsing and activity-aware stuck detection for the auto-orchestrator.

### What Was Built

**Task 1 — JSON line parser:**
- `createJsonLineParser(onLine)` function that buffers stdout chunks and emits complete JSON objects
- Handles chunk-splitting across `data` events
- 1MB buffer cap prevents OOM on non-newline output
- Wired into `runClaudeSession`'s stdout handler (additive layer — existing accumulation preserved)

**Task 2 — Graduated timeouts:**
- `TOOL_TIMEOUT_EXTENSIONS`: Bash +5min, Agent +3min, Edit/Write +1min
- `MAX_TIMEOUT_CAP`: 25min absolute max
- Extensions compose additively with existing `STUCK_KILL_BY_STEP` per-step thresholds
- Null toolName guard in onToolCall

**Task 3 — State emission:**
- `_sessionActivity` module-level map with per-session activity (last_tool, tool_count, tools, elapsed_s)
- State updates throttled to 5s, JSONL tool events throttled to 10s per tool
- Session lifecycle events: session-end, session-killed
- Staleness reaper prunes entries older than MAX_TIMEOUT_CAP + 5min
- Memory leak prevention: _toolLogThrottles cleaned up on session close

**Task 4 — Path verification:**
- Confirmed `runClaudeSession` is single spawn point (INVARIANT comment added)
- Fixed 4 callers missing sessionId/stepName: correction cascade, phase validation, parallel planning, batch review

### Files Changed
- `.claude/skills/auto/auto-orchestrator.cjs` — +320 lines (parser, tracking, emission, wiring)
- `.claude/skills/auto/auto-orchestrator.test.cjs` — +24 lines (13 new tests)

### Tests
57/61 passing | 13 new tests | 4 pre-existing failures (unrelated parseSessionMetrics edge cases)
