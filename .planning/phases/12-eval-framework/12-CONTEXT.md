# Phase 12: Eval Framework & Continuous Improvement — CONTEXT

## Decisions

- [D-12-01] auto-improve stays as maintainer command at `.claude/commands/auto-improve.md` — NOT promoted to shipped skill. Users don't maintain eval suites; promoting would create broken UX. (alternatives: ship as skill with generic eval support, add to skill-creator workflow)
- [D-12-02] Eval coverage gap analysis added as `--coverage` flag to `run_all_evals.py` — compares COMMAND_MAP keys against shipped skills on disk. (alternatives: separate script, auto-improve pre-step only)
- [D-12-03] auto-improve reads baselines.json at start and updates on final iteration if pass rate improved — enables before/after measurement per REQ-56.
- [D-12-04] 3 fixture-backed auto evals: corrupt state recovery, milestone completion detection, walk-away from description — covers REQ-42, REQ-43, REQ-44.
- [D-12-05] Measurement workflow documented in auto-improve command and CLAUDE.md — 3-step process: baseline before, change, baseline after.
- [D-12-06] skill-creator deferred — not locally available, upstream only. Focus on auto-improve which we own.

## Discretion Areas

- Executor may adjust eval assertion text when broadening checks, as long as the behavioral intent is preserved
- Executor may add additional fixture scenarios beyond the 3 specified if they discover gaps during implementation
- Coverage gap report format (table vs list vs JSON) left to executor judgment

- [review] [D-12-07] Task 1 must add all 5 missing startup-* skills to COMMAND_MAP before implementing --coverage — otherwise gap report is inaccurate. Verified: startup-advisor, startup-competitors, startup-design, startup-pitch, startup-positioning are shipped but unmapped.
- [review] [D-12-08] Coverage counts corrected: 49 shipped skills, 24 with evals, 25 without (plan originally said 23).

- [D-12-09] Realistic `auto-pipeline` fixture with full .planning/ structure, .auto-state.json, .auto-log.jsonl, CODEBASE.md. Used selectively by ~5 e2e-style evals, not all new evals. (alternatives: minimal fixture with just state file, bolted-on copy of nextjs-app-deep)
- [D-12-10] Keyword-only grading for all new evals in plan 02. No LLM grading. Add `context_discipline` assertion type that falls through to keyword matching. (alternatives: hybrid LLM+keyword, full LLM grading)
- [D-12-11] ~15 new evals across 5 categories: orchestration (4), context-mode (3), observability (3), error recovery (3), performance (2). ~$0.50/run additional cost.
- [D-12-12] Upgrade `nextjs-app-deep` fixture with CODEBASE.md for improved realism.
- [D-12-13] Auto-improve integration deferred to follow-up plan 03. Plan 02 creates evals and fixtures only.

- [review] [D-12-14] .auto-state.json and .auto-log.jsonl must be placed at .planning/ subdirectory in fixture, matching orchestrator's getStatePath() at line 453 of auto-orchestrator.cjs.
- [review] [D-12-15] Eval schema must use actual evals.json format: {id, command, prompt, expected_output, files, assertions: [{text, type}], tier, tags, checks: [{type, pattern}]} — NOT the invented required_terms/forbidden_terms/skill/fixture schema.
- [review] [D-12-16] Regex checks use pipe syntax for OR matching (e.g. "wave|depend") — no OR-logic in assertion text.

## Deferred Ideas

- skill-creator integration — revisit when upstream makes it available or installable
- LLM grader improvements — already functional, refine based on auto-improve iteration results
- Comprehensive coverage for all 23 uncovered skills — separate effort, Phase 12 identifies gaps but doesn't fill them all
- Auto-improve for user projects — would require generic eval framework beyond fhhs-skills specific infrastructure
- [Expansion opportunity]: Auto-generate eval stubs for all 25 uncovered skills using LLM analysis of skill prompts, going from 49% to 90%+ coverage in one phase — deferred, separate effort
- LLM grading adoption — wait for cost/benefit data from keyword-only baseline before investing
- `--coverage` flag in eval runner — useful but separate infrastructure work (covered in plan 01)
- Token usage tracking per eval — measurement infrastructure, separate plan
- A/B comparison framework for skill changes — nice to have, not blocking
- [Expansion opportunity]: Add 30+ evals covering all 10 auto-orchestrator subsystems (ConcurrencyPool, dependency graph, speculative validation, etc.), plus --benchmark N variance analysis mode — deferred, separate effort
