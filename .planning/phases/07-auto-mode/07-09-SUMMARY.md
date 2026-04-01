---
phase: 07-auto-mode
plan: 09
completed_at: "2026-03-29"
status: complete
test_metrics:
  syntax_check: pass
  build: pass
---

## What Was Done

Redesigned the AutoPipeline component and supporting infrastructure to provide rich, per-phase auto job reporting:

1. **Phase status parsing** — Added `stripStatusSuffix()` to parser.cjs that strips trailing status text like "(COMPLETE)" from phase names and uses it as a fallback status source. Fixes projects using heading-based ROADMAP format.

2. **ProjectDetail header fix** — Fixed "Phase 0 of 7" bug. Now correctly shows the active phase number, falls back to first incomplete phase, and displays "Complete" when all phases are done.

3. **Rolling log buffer** — Auto-orchestrator now maintains a 20-line rolling log buffer (`log_buffer` in auto-state.json) that captures both orchestrator log lines and stdout from headless Claude sessions, giving the tracker live visibility into what's happening.

4. **AutoPipeline redesign** — New per-phase breakdown with `PhaseStepRow` showing individual plan→review→build→verify step status per phase. `LogTail` component shows scrollable log output from the orchestrator. Parallel execution badge when concurrency > 1. Fallback single pipeline for backward compatibility.

5. **Server worktree resolution** — `readAutoState()` now checks worktree `project_dir` references and uses whichever auto-state is newer. Server watches worktree `.planning/` directories for SSE refresh triggers. `buildProjectSummary()` cross-references auto-state with parsed phase data.

## Key Decisions

- LogTail defaults to collapsed to keep the UI clean
- PhaseStepRow uses progressive status derivation from phase state strings (planning→reviewing→building→verifying)
- Backward compatible: single-phase auto jobs fall back to the original flat pipeline view
