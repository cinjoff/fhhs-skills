## Code Review Report

### Summary
- Files reviewed: ~30 substantive files (14 JS/CJS/JSX, ~16 key SKILL.md files)
- Severity breakdown: 1 critical, 4 important, 3 minor, 2 nitpick
- Overall quality: 7/10

### Critical Issues

1. **[auto-orchestrator.cjs:708-717] Token double-counting in `parseSessionMetrics`** (Confidence: 85)
   - When a stream-json line is `{ type: 'assistant', message: { usage: {...} }, usage: {...} }`, both the root `obj.usage` block (line 710-712) AND the nested `obj.message.usage` block (line 715-717) are accumulated. If Claude's stream-json format includes usage at both levels for the same event, tokens are counted twice.
   - The same pattern exists in the real-time parser `feedJsonLine` (lines 971-979) for `liveTokensIn`/`liveTokensOut`.
   - Impact: Inflated cost estimates, misleading `context_window_pct`, and wrong per-phase cost breakdowns throughout the dashboard.
   - Fix: Add an `else` so nested usage is only counted when root usage is absent: `if (obj.usage) { ... } else if (obj.type === 'assistant' && obj.message?.usage) { ... }`.

### Important Issues

1. **[bin/lib/schemas.cjs vs auto-orchestrator.cjs:488] Duplicate `validateAutoState` implementations** (Confidence: 90)
   - `validateAutoState` exists in both `bin/lib/schemas.cjs` (line 16) and `auto-orchestrator.cjs` (line 488) with different validation logic. The schemas version checks for `active`, `phase`, `started_at`, `phases_total` etc. The orchestrator version checks `phase`, `phase_states`, `total_cost_estimate`, `retry_count`. Tests import from both.
   - Fallow flags `bin/lib/schemas.cjs` as unused (only imported by the test file). The two implementations will drift.
   - Fix: Remove `bin/lib/schemas.cjs`, merge any missing checks into the orchestrator's version, update the test import.

2. **[bin/global-reconcile.cjs:396] `npx -y` auto-install during reconciliation** (Confidence: 78)
   - `execFileSync('npx', ['-y', 'skills', 'add', '-g', '-y', '--all', 'shadcn/ui'])` runs during global reconcile's env gap remediation. The `-y` flag auto-confirms package installation. Running `npx -y` with network-fetched packages in an automated remediation context is a supply-chain risk.
   - Fix: Gate behind a `--auto-install` flag or require explicit user confirmation for package installations.

3. **[auto-orchestrator.cjs:898] Hardcoded 250+ char CLAUDE_MEM_SKIP_TOOLS env var** (Confidence: 76)
   - This massive comma-separated string is fragile and will break silently if tool names change upstream. It includes MCP-specific tool names that couple tightly to plugin internals.
   - Fix: Extract to a constant array at module top, join at spawn time. Add a comment documenting why each tool is skipped.

4. **[Fallow-flagged files in diff] Unused files shipped with the branch** (Confidence: 85)
   - `bin/global-reconcile.cjs` (673 lines, new file) and `bin/lib/schemas.cjs` are flagged unused by Fallow.
   - `global-reconcile.cjs` is called by the update skill via shell, so Fallow may not trace it. Confirm it has a caller; if only skill markdown references it, that's fine.
   - `bin/lib/schemas.cjs` is genuinely dead code (only test import, duplicated in orchestrator).

### Minor Issues

1. **[auto-orchestrator.cjs:3415 lines] File size approaching maintenance threshold** (Confidence: 80)
   - At 3,415 lines, the orchestrator is a single-file monolith containing: state management, cost estimation, dependency graphs, session running, metrics parsing, JSONL logging, graceful shutdown, and the main loop. The test file only covers pure functions.
   - Consider extracting `parseSessionMetrics`, `aggregatePhaseMetrics`, `createJsonLineParser`, and cost utilities into a shared `lib/` module.

2. **[server.cjs:768-856] `/api/logs` endpoint reads entire JSONL file on every request** (Confidence: 77)
   - Even with the 10MB tail-read optimization, parsing every line on each poll request is O(n) per request. With the dashboard polling every few seconds during active auto runs, this could cause latency spikes.
   - Fix: Add `If-Modified-Since` / mtime check to short-circuit when file hasn't changed, or cache parsed entries.

3. **[auto-orchestrator.cjs:78] `getClaudeTmpBase` UID fallback chain** (Confidence: 75)
   - `process.getuid ? process.getuid() : (process.env.UID || 501)` - falling back to hardcoded `501` (macOS default UID) could collide with another user on shared machines.
   - Low impact since this is for temp file paths, but `os.userInfo().uid` would be more robust.

### Nitpicks

1. **[auto-orchestrator.cjs:3190] Corrupted Unicode character in log output**
   - Line contains `log('���══ Phase ${phase.id}...')` — appears to be a corrupted emoji/box-drawing character in the diff.

2. **[server.cjs] `deduplicateEntries` placement**
   - Function is defined at line 275 but conceptually belongs near `cleanRegistry` (line 195). Minor organizational note.

### Positive Observations

- **Excellent test coverage for pure functions**: 601-line test file covering `parseSessionMetrics`, `aggregatePhaseMetrics`, `cascadePlanFailures`, `buildDependencyGraph`, `assignWaves`, `comparePhaseNum`, `parsePlanFrontmatter`, and `createJsonLineParser` with edge cases. Tests use real assertions, not mock-heavy patterns.
- **Security improvement**: Systematic migration from `execSync` to `execFileSync` across the codebase prevents shell injection. Applied consistently in orchestrator, global-reconcile, and bin utilities.
- **Atomic state writes with unified queue**: The `_stateWriteQueue` promise chain (replacing the old `_saveQueue`) prevents race conditions between `writeAutoStatus()`, `saveAutoState()`, and `log()`. Write-through tmp+rename pattern is correct for POSIX atomicity.
- **Graceful shutdown handling**: `SIGTERM`/`SIGINT` handlers properly kill child processes, write interrupted state, and flush JSONL logs. The `require.main === module` guard enables clean testability.
- **Tool-aware stuck detection**: Per-step timeout thresholds (`STUCK_KILL_BY_STEP`) with additive tool extensions and a `MAX_TIMEOUT_CAP` is a well-designed approach to avoiding false-positive kills during legitimate long operations.
- **Kill sentinel pattern**: The `.auto-kill` file-based signal between dashboard and orchestrator is a clean IPC mechanism that doesn't require shared process state.
- **Robust corrupt-state handling**: `loadAutoState` renames corrupt files to `.corrupt` instead of silently returning null, aiding debugging.

### Quality Refinement Signals
- simplify: YES -- orchestrator.cjs at 3,415 lines should extract utility modules
- harden: YES -- token double-counting affects cost accuracy across the system
- adapt: NO
- normalize: YES -- duplicate validateAutoState implementations should be consolidated
- ui-critique: NO
