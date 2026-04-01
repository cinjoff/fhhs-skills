# Gap Analysis: fix-orchestrator-tool-listening

Branch: `fix-orchestrator-tool-listening` vs `main` (base: 0c229887)
Generated: 2026-04-01

## Gap Analysis

### Untested Paths (7)

1. **auto-orchestrator.cjs:1434-1510** — `ConcurrencyPool` class has zero test coverage. Not exported, not tested. It manages concurrent claude sessions — bugs here cause silent data loss or deadlocks.

2. **auto-orchestrator.cjs:1634-1723** — `validateSpeculativePlan()` not tested. It spawns validation sessions and parses stdout for VALID/ADJUSTED/REPLAN keywords — regex parsing on unstructured LLM output has high false-positive risk.

3. **auto-orchestrator.cjs:1246-1277** — `parseCorrectedDecisions()` not tested. Regex-based markdown parser splitting on `### D-` boundaries. Malformed DECISIONS.md could silently return empty results.

4. **auto-orchestrator.cjs:1283-1300** — `classifyCorrection()` not tested. Hard-coded keyword matching for architectural vs mechanical classification. Edge cases around partial matches (e.g., "refactored" matching "refactor") untested.

5. **auto-orchestrator.cjs:1782-1802** — `computeStepAverages()` not tested. Division-by-zero guard exists implicitly (count > 0 from the loop) but no explicit test for empty groups or missing metrics fields.

6. **auto-orchestrator.cjs:1808-1835** — `appendSessionHistory()` not tested. Writes to `~/.claude/tracker/history.jsonl` — file I/O with `mkdirSync({recursive: true})` and `appendFileSync`.

7. **auto-orchestrator.cjs:254-312** — `parseArgs()` not tested. Argument parsing with edge cases: missing values, unknown args, NaN from parseInt, negative concurrency.

### Unhandled Errors (4)

1. **auto-orchestrator.cjs:99** — `writeAutoStatus` catches ALL errors silently (empty `catch {}`). If the `.planning/` directory is removed mid-run, every status write silently fails and the dashboard goes dark with no diagnostic.

2. **auto-orchestrator.cjs:1919-1922** — Dashboard auto-open uses `exec()` with no error callback. On headless Linux (no display server), `xdg-open` fails silently. Not critical but produces confusing behavior.

3. **auto-orchestrator.cjs:3326** — `printMilestoneCostSummary` accesses `pc.cost_estimate.toFixed(2)` without null check. If any phase entry lacks `cost_estimate`, this throws `TypeError: Cannot read properties of undefined`. The test only checks null/undefined/empty input, not entries with missing fields.

4. **auto-orchestrator.cjs:80-85** — `getClaudeTmpBase` calls `process.getuid()` which may not exist on Windows. The fallback `process.env.UID || 501` hard-codes a macOS-specific UID. Low impact (Windows is unlikely target) but technically broken.

### Incomplete Features (2)

1. **auto-orchestrator.cjs:898** — `CLAUDE_MEM_SKIP_TOOLS` is a massive hardcoded comma-separated string. Adding/removing MCP tools requires editing this literal. Should be derived from a constant array.

2. **templates/project-tracker/server.cjs:173-211** — `buildProjectSummary` merges auto-state `phase_states` into roadmap phases by matching `parseInt(phaseKey)` to `p.number`. Phase IDs like "3A" or "3.1" will fail `parseInt` and never match, causing the dashboard to show stale status for sub-phases.

### Missing Edge Cases (3)

1. **auto-orchestrator.cjs:1694** — `validateSpeculativePlan` matches `REPLAN`/`ADJUSTED` via regex on raw stdout which includes JSON stream lines. A tool name or file path containing "REPLAN" in the stream output would cause false classification.

2. **auto-orchestrator.cjs:2022** — `runStepWithRetry` while loop condition `attempts < MAX_RETRIES` starts at 0 and MAX_RETRIES=2, so it runs at most 2 attempts (1 original + 1 retry), not 2 retries. The log says "Retry 1/1" which is correct but the constant name is misleading.

3. **templates/project-tracker/server.cjs:131-147** — `readAutoState` worktree comparison uses `started_at` timestamps to pick the "latest" state. If the orchestrator writes a state with `started_at: null` (which `buildAutoStatus` can produce when `_autoStatus.startedAt` is null), `new Date(null).getTime()` returns 0, so the worktree state always loses the comparison.

### Unwired Code (3)

1. **bin/lib/core.cjs** — Exports `MODEL_PROFILES`, `output`, `error` that are unused by any other file in the diff. These are CLI utilities likely invoked from command line, so this is expected.

2. **bin/global-reconcile.cjs** — Standalone CLI, not imported anywhere. Expected for CLI tools.

3. **bin/lib/schemas.cjs** — New file with `validateAutoState()`. Only imported by the test file (line 442). The orchestrator has its own inline `validateAutoState()` at line 488. Two competing implementations with different schemas — the schemas.cjs version requires `active`, `started_at`, `phases_total`, etc. while the orchestrator's version only checks `phase`, `phase_states`, `total_cost_estimate`, `retry_count`. These will diverge.

### Eval Coverage Gaps (3)

1. **No eval for tool-aware graduated timeouts** — The branch's headline feature (TOOL_TIMEOUT_EXTENSIONS, graduated stuck detection based on last tool name) has unit tests but no eval in evals.json testing the skill-level behavior. The existing eval at line 6231 references old STUCK_SILENCE_MS=3min which is now 5min.

2. **No eval for ConcurrencyPool behavior** — Concurrent phase execution, queue overflow, drain semantics are not covered by any eval.

3. **No eval for createJsonLineParser** — Real-time streaming JSON parser (the core of "tool listening") has unit tests but no eval verifying the skill describes this behavior to users.
