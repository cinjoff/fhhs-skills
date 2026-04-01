# 07-10 Summary: Auto Pipeline Lifecycle Hardening

## What was done

### Task 1: Harden resume state validation
- Added `validateAutoState(state)` function to `auto-orchestrator.cjs` that validates: state is an object, `phase` is string/null, `phase_states` is an object, `total_cost_estimate` is non-negative number, `retry_count` is valid, `phase_plan_paths` is an object
- On validation failure: logs warning with reason, renames corrupt file to `.auto-state.json.corrupt`, returns null (triggers fresh start)
- On JSON parse failure: same rename-to-corrupt behavior instead of silent null return
- Added SUMMARY.md existence check on resume: iterates `phase_states`, downgrades any `'built'` phase to `'planned'` if its SUMMARY.md is missing on disk

### Task 2: Milestone completion awareness
- After main loop, computes `milestoneComplete = phasesCompleted === phasesToRun.length && phasesFailed === 0`
- Sets `milestone_complete: true/false` in final `writeAutoStatus()` call
- On complete: logs banner with `ALL PHASES COMPLETE` and suggests `gsd-tools milestone complete <version>`
- On partial: logs `Milestone: PARTIAL` with completed/failed counts
- Does NOT auto-run `gsd-tools milestone complete` (manual decision)

### Task 3: Walk-Away Guide in SKILL.md
- Added "The Walk-Away Experience" section between description and Step 1
- Documents three entry paths: existing project, from-scratch with description, resume after interruption
- Lists system outputs: working codebase, DECISIONS.md, per-phase SUMMARY.md, live dashboard
- Updated Step 1 "no `.planning/`" message to suggest providing a project description via `/fh:auto 'description'`
- Verified new-project SKILL.md already has correct `--auto` chain path (no edit needed)

### Task 4: Lifecycle evals
- Added 5 new evals (IDs 312-316) covering:
  - **312** `auto-pipeline-lifecycle`: no .planning/ directory, suggests walk-away flow (smoke, tags: auto/lifecycle/guard)
  - **313** `auto-resume-corrupt-state`: malformed .auto-state.json detection and .corrupt rename (micro, tags: auto/resume/edge-case)
  - **314** `auto-milestone-complete`: milestone completion message and gsd-tools suggestion (micro, tags: auto/milestone/lifecycle)
  - **315** `auto-walk-away-from-description`: project description chains to new-project --auto (smoke, tags: auto/lifecycle/new-project)
  - **316** `auto-resume-built-no-summary`: built phase with missing SUMMARY.md downgraded to planned (micro, tags: auto/resume/edge-case)
- Total auto evals: 49 (was 44)

## Verification
- `node -c auto-orchestrator.cjs` — PASS
- `JSON.parse(evals.json)` — PASS (255 evals, IDs through 316)
- `validateAutoState` present in orchestrator
- `.corrupt` rename path present in orchestrator
- `milestone_complete` field present in orchestrator
- `Walk-Away` section present in SKILL.md

## Files modified
- `.claude/skills/auto/auto-orchestrator.cjs` — validateAutoState(), corrupt rename, SUMMARY.md check, milestone completion
- `.claude/skills/auto/SKILL.md` — Walk-Away Experience section, project description suggestion in Step 1
- `evals/evals.json` — 5 new evals (312-316)
