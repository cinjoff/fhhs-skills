# 07-16 Summary: Pipeline Efficiency Fixes

## What was done

Seven fixes applied to `.claude/skills/auto/auto-orchestrator.cjs` eliminating ~$0.24 and ~35 minutes of waste per auto run:

1. **Complete phases excluded from pipeline** -- Phases with SUMMARY.md are now filtered out of `phasesToRun` before the pipeline starts (not just marked as 'built'). Changed `const` to `let` for `phasesToRun`. Removed the old pre-scan block that marked phases as 'built' but left them in the pipeline.

2. **Sequential fallback reuses existing plans** -- When `phasePlanPaths[phase.id]` already has a valid plan from the planning wave, the `plan-work` step is skipped in the sequential fallback loop, saving ~$0.17 + ~8 min.

3. **Cascade handler respects built/reviewed states** -- Extracted `cascadePlanFailures()` as a standalone exported function. It never overwrites 'built' or 'reviewed' phase states with 'rescheduled-sequential'. Also added a guard in the sequential fallback loop to skip already-built phases.

4. **Silence detection threshold raised** -- `STUCK_SILENCE_MS` changed from 3 minutes to 5 minutes to reduce false alarms during long tool calls.

5. **step_history populated in all execution paths** -- Added `_autoStatus.stepHistory.push(...)` calls in:
   - Planning wave (after `phase_states[phase.id] = 'planned'`)
   - Review wave (after `phase_states[phase.id] = 'reviewed'`)
   - Build wave (after `phase_states[phase.id] = 'built'`)
   - Sequential fallback (after `completedSteps.push(step)`)
   - Final status write now includes `step_history: _autoStatus.stepHistory`

6. **Concurrency reporting fixed** -- `buildAutoStatus` now reads `overrides.concurrency_max` for the `concurrency.max` field. Planning wave status write passes `concurrency_max: opts.concurrency`.

7. **Unit tests added** -- 6 new tests for `cascadePlanFailures` covering: basic cascade, built-state preservation, reviewed-state preservation, no-failure passthrough, missing depGraph entries, and optional logger.

## Verification

- `node -c .claude/skills/auto/auto-orchestrator.cjs` -- syntax valid
- `node --test .claude/skills/auto/auto-orchestrator.test.cjs` -- 41 tests pass, 0 failures
- `node -e "const m = require('./.claude/skills/auto/auto-orchestrator.cjs'); console.log(typeof m.cascadePlanFailures)"` -- returns 'function'

## Files modified

- `.claude/skills/auto/auto-orchestrator.cjs` -- all 7 fixes
- `.claude/skills/auto/auto-orchestrator.test.cjs` -- 6 new cascadePlanFailures tests
