# Phase 12: Eval Framework & Continuous Improvement - Research

**Researched:** 2026-03-29
**Domain:** Auto-skill architecture, eval infrastructure, fixture design, auto-improve loop
**Confidence:** HIGH

## Summary

The fhhs-skills project has a mature autonomous orchestration system (auto-orchestrator.cjs, 2833 lines) that drives a 4-step pipeline (plan-work, plan-review, build, review) via `claude -p` sessions. The eval infrastructure consists of 250 evals across 25 commands in a single `evals.json` file, with 44 auto-specific evals covering orchestration, parallelism, crash recovery, and state management. Three fixture projects exist (`minimal-gsd`, `broken-project`, `nextjs-app-deep`) but only `nextjs-app-deep` has comprehensive planning artifacts. The auto-improve loop (`/auto-improve`) iterates eval runs, classifies failures, and applies fixes -- already functional with 10+ iterations tracked.

Key gaps: no auto-specific fixture with `.auto-state.json` or rich pipeline state, eval coverage at ~51% of shipped skills (25 of 49 covered), and the auto-improve measurement workflow needs baseline integration.

**Primary recommendation:** Strengthen auto-eval coverage with fixture-backed scenario evals, add `--coverage` gap analysis to the eval runner, and formalize the baseline measurement workflow in auto-improve.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- [D-12-01] auto-improve stays as maintainer command at `.claude/commands/auto-improve.md` -- NOT promoted to shipped skill
- [D-12-02] Eval coverage gap analysis added as `--coverage` flag to `run_all_evals.py`
- [D-12-03] auto-improve reads baselines.json at start and updates on final iteration if pass rate improved
- [D-12-04] 3 fixture-backed auto evals: corrupt state recovery, milestone completion detection, walk-away from description
- [D-12-05] Measurement workflow documented in auto-improve command and CLAUDE.md
- [D-12-06] skill-creator deferred -- not locally available, upstream only

### Claude's Discretion
- Executor may adjust eval assertion text when broadening checks, as long as the behavioral intent is preserved
- Executor may add additional fixture scenarios beyond the 3 specified if they discover gaps during implementation
- Coverage gap report format (table vs list vs JSON) left to executor judgment
- [review] [D-12-07] Task 1 must add all 5 missing startup-* skills to COMMAND_MAP before implementing --coverage
- [review] [D-12-08] Coverage counts corrected: 49 shipped skills, 24 with evals, 25 without

### Deferred Ideas (OUT OF SCOPE)
- skill-creator integration
- LLM grader improvements
- Comprehensive coverage for all 25 uncovered skills
- Auto-improve for user projects
- Auto-generate eval stubs for uncovered skills
</user_constraints>

## Auto-Orchestrator Architecture

### Orchestration Loop

The orchestrator (`auto-orchestrator.cjs`) supports two execution modes:

**Sequential mode** (`--no-speculative`): For each phase, runs 4 steps in order:
1. `plan-work` -- creates PLAN.md via `/fh:plan-work`
2. `plan-review` -- reviews plan via `/fh:plan-review --mode hold`
3. `build` -- executes plan via `/fh:build`
4. `review` -- quick review via `/fh:review --quick`

**Speculative pipeline mode** (default): Three macro-waves:
1. **Planning wave** -- all phases plan concurrently via ConcurrencyPool
2. **Review wave** -- all plans reviewed concurrently
3. **Build wave** -- dependency-ordered builds with speculative validation

### Key Subsystems

| Subsystem | Purpose | Implementation |
|-----------|---------|----------------|
| ConcurrencyPool | Bounded parallel execution | Class with configurable max (1-4), queue overflow protection |
| Dependency graph | File-overlap detection | `buildDependencyGraph()` + `assignWaves()` topological sort |
| Speculative validation | Pre-build plan validation | `validateSpeculativePlan()` -- VALID/ADJUSTED/REPLAN |
| Crash recovery | `.auto-state.json` persistence | Atomic writes via tmp+rename, per-wave state checkpoints |
| Stuck detection | Silent session killing | Per-step thresholds (8min default, 15min for builds) |
| Cost tracking | Budget enforcement | `estimateSessionCost()` with heuristic token estimation |
| Session metrics | Performance tracking | `parseSessionMetrics()` from JSON-lines output |
| Decision logging | Autonomous decision trail | `appendDecision()` to DECISIONS.md with categories |
| JSONL event log | Structured event streaming | `.auto-log.jsonl` for tracker dashboard consumption |
| Session history | Cross-run analytics | `~/.claude/tracker/history.jsonl` with step averages |

### Context-Mode Integration

- DB isolation is per-project-directory via SHA256(projectDir)[:16]
- Context bootstrapping delegated to plan-work Step -0.5 (not orchestrator)
- All 4 pipeline steps share one context-mode DB automatically
- Build agents (subagents via Agent tool) share parent session's DB
- Post-wave re-indexing ensures Wave 2 sees Wave 1's changes

### Claude-Mem Integration

- CLAUDE_MEM_PROJECT env var injected into all `claude -p` sessions
- Project name resolved via: env var > Conductor workspace path > git common-dir > basename
- All pipeline steps observe to and query from the global claude-mem DB
- Sessions use `smart_search` for cross-session learnings

### Error Recovery

- API health check with exponential backoff (10s-120s, 5 retries)
- Health check result cached for 60s to avoid excessive polling
- Error classification: API/infra vs logic errors (different retry strategies)
- Orchestrator-initiated kills (stuck/timeout) NOT classified as API errors
- Per-step error logs written to phase directories
- PARTIAL-SUMMARY.md for killed build sessions
- Kill sentinel file (`.auto-kill`) for graceful user-initiated stop

### Parallel Wave Execution

- Phase-local decisions (`.decisions-pending.md`) avoid DECISIONS.md write races
- Merged into shared DECISIONS.md after planning wave completes
- Dependency graph from `files_modified` frontmatter in PLAN.md
- Conservative fallback: no `files_modified` = depends on all predecessors
- Cycle detection with fully-sequential fallback
- Failed phase dependents rescheduled to sequential execution

## Eval Infrastructure

### Architecture

| Component | Path | Purpose |
|-----------|------|---------|
| Eval definitions | `evals/evals.json` | 250 evals, ~10400 lines |
| Eval runner | `fhhs-skills-workspace/run_all_evals.py` | ThreadPoolExecutor, 6 workers, 3min timeout |
| LLM grader | `fhhs-skills-workspace/llm_grader.py` | Haiku-based semantic grading with keyword fallback |
| Auto-improve | `.claude/commands/auto-improve.md` | Iterative eval improvement loop |
| Baselines | `fhhs-skills-workspace/baselines.json` | Before/after measurement |
| Fixtures | `evals/fixtures/` | 3 fixture projects |

### Eval Distribution by Command

| Command | Count | Command | Count |
|---------|-------|---------|-------|
| auto | 44 | build | 33 |
| plan-work | 22 | new-project | 21 |
| review | 18 | update | 17 |
| plan-review | 12 | fix | 11 |
| map-codebase | 9 | refactor | 8 |
| secure | 7 | research | 5 |
| observability | 5 | tracker | 5 |
| startup-design | 5 | startup-advisor | 4 |
| learnings | 4 | setup | 4 |
| startup-pitch | 4 | startup-competitors | 3 |
| startup-positioning | 3 | ui-critique | 3 |
| ui-test | 2 | progress | 1 |

**25 skills with 0 evals:** adapt, audit, bolder, clarify, colorize, delight, distill, extract, harden, health, help, nextjs-perf, normalize, onboard, optimize, playwright-testing, polish, quick, quieter, revise-claude-md, settings, simplify, todos, ui-animate, ui-branding, ui-redesign

### Grading System

**Deterministic checks** (in evals.json per-eval):
- `required_terms` -- all terms must appear in output (case-insensitive)
- `forbidden_terms` -- none of the terms may appear
- `regex` -- pattern match against output

**Keyword grader** (fallback in llm_grader.py):
- Guard assertions: looks for negation patterns + concept keywords
- Ordering assertions: checks positional ordering of terms
- Behavioral/output assertions: keyword presence heuristics

**LLM grader** (primary in llm_grader.py):
- Uses Haiku model for assertion classification
- Pass/fail with evidence per assertion
- 6 concurrent workers, 90s timeout, 2 retries

### Eval Execution Model

1. Skill content loaded from COMMAND_MAP path
2. Full prompt constructed: skill instructions + project context + user request + task directive
3. Prompt asks for "behavioral trace, not actual tool execution"
4. Run via `claude -p` in fixture directory (default: `nextjs-app-deep`)
5. Output graded against assertions + deterministic checks
6. Results aggregated into `raw_results.json` and `graded_results.json`

### Per-eval Fixture Support

- `fixture` field in eval selects specific fixture directory
- `scenario_requires: ["no_gsd_project"]` creates temp dir without `.planning/`
- Default fixture: `nextjs-app-deep` (comprehensive planning artifacts)

## Fixture Analysis

### nextjs-app-deep (primary fixture)
**Complete planning artifacts:**
- `.planning/PROJECT.md`, `ROADMAP.md`, `STATE.md`, `DESIGN.md`
- `.planning/config.json`
- `.planning/codebase/` -- STACK.md, ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, INTEGRATIONS.md, TESTING.md, CONCERNS.md, CODEBASE.md
- `.planning/phases/01-auth/01-01-PLAN.md`, `01-01-SUMMARY.md`
- `.planning/phases/02-dashboard/02-01-PLAN.md`
- `.planning/todos/todo-001.md` through `todo-003.md`
- Rich source tree: API routes, components, tests, hooks, lib

**Missing for auto evals:**
- No `.auto-state.json` (needed for crash recovery evals)
- No `DECISIONS.md` (needed for correction cascade evals)
- No `.decisions-pending.md` files (needed for parallel merge evals)
- No `.auto-log.jsonl` (needed for observability evals)
- No `PARTIAL-SUMMARY.md` (needed for stuck session evals)
- No multi-phase completed state (only phase 01 has SUMMARY)

### broken-project (error handling fixture)
- `.planning/PROJECT.md`, `ROADMAP.md`, `STATE.md` (minimal)
- `src/app.ts`, `src/broken-api.ts` (intentionally broken code)
- `package.json`, `tsconfig.json`
- No CLAUDE.md content (43 bytes = essentially empty)

### minimal-gsd (baseline fixture)
- `.planning/PROJECT.md`, `ROADMAP.md`, `STATE.md` only
- No source code beyond structure
- Designed for "minimal but realistic" GSD skill testing

### Gap: Missing Auto-Pipeline Fixture
For D-12-04 (3 fixture-backed auto evals), need a new fixture or extensions to `nextjs-app-deep` with:
- `.auto-state.json` with various states (in-progress, crashed, completed)
- Multi-phase completed state (phases 01-03 done, 04+ pending)
- DECISIONS.md with entries including CORRECTED status
- Realistic `phase_states` map for pipeline resume testing

## Auto-Improve Loop

### Current Implementation

The `/auto-improve` command (`.claude/commands/auto-improve.md`) runs an iterative loop:

1. **Run evals** via `run_all_evals.py` with tier filter
2. **Check target** (default 0.98 pass rate) -- stop if met
3. **Analyze failures** -- classify as:
   - A) Assertion too strict (keyword mismatch)
   - B) Check too literal (regex/terms too narrow)
   - C) Skill gap (skill text missing instruction)
   - D) Eval prompt ambiguous
4. **Apply fixes** -- prefer eval fixes (A/B/D) over skill changes (C)
5. **Log iteration** to `changes.md`

**Iteration history:** 10+ iterations tracked in `fhhs-skills-workspace/auto-improve/`

### Measurement Workflow (D-12-03, D-12-05)

Per CONTEXT.md decisions, auto-improve must:
- Read `baselines.json` at start of improvement run
- Update baselines on final iteration if pass rate improved
- Document 3-step process: baseline before, change, baseline after

### Skill-Creator Status (D-12-06)

Deferred. Not locally available -- exists only as upstream plugin. Focus on auto-improve which is locally owned.

## Common Pitfalls

### Pitfall 1: Eval Assertions Too Tightly Coupled to Phrasing
**What goes wrong:** Model rephrases correctly but keyword checks fail
**How to avoid:** Use regex patterns with alternatives, prefer LLM grading for behavioral assertions
**Warning signs:** High pass rate with LLM grader but low with keyword grader

### Pitfall 2: Fixture State Drift
**What goes wrong:** Fixture `.planning/` state doesn't match what evals assume
**How to avoid:** Fixture state should be version-controlled and match eval prompts exactly
**Warning signs:** Evals pass locally but fail after fixture changes

### Pitfall 3: Auto-Orchestrator Evals Testing Skill Text Not Runtime
**What goes wrong:** Evals test whether the model can describe orchestrator behavior from SKILL.md, not whether the orchestrator actually works
**How to avoid:** Acknowledge this is behavioral eval (not integration test). For runtime testing, use actual `claude -p` sessions with orchestrator.
**Warning signs:** All evals pass but production auto runs fail

### Pitfall 4: Missing COMMAND_MAP Entries
**What goes wrong:** `--coverage` flag reports incorrect gaps if skills are shipped but not mapped
**How to avoid:** D-12-07 requires adding startup-* skills to COMMAND_MAP first
**Warning signs:** Coverage report shows 0 evals for skills that actually have them

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Eval grading | Custom NLP | LLM grader (llm_grader.py) | Semantic understanding beats keyword matching |
| Fixture management | In-memory mocks | File-based fixtures in evals/fixtures/ | Evals run via `claude -p` which needs real files |
| Concurrent eval execution | Manual threading | ThreadPoolExecutor in run_all_evals.py | Already handles progress tracking and timeouts |
| Baseline tracking | Manual comparison | baselines.json + auto-improve integration | D-12-03 decision |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Custom eval runner (Python 3) + LLM grader |
| Config file | `fhhs-skills-workspace/run_all_evals.py` |
| Quick run command | `python3 fhhs-skills-workspace/run_all_evals.py --tier micro --commands auto` |
| Full suite command | `python3 fhhs-skills-workspace/run_all_evals.py --tier smoke` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-12-01 | auto-improve stays as command | manual-only | Verify file exists at .claude/commands/auto-improve.md | yes |
| D-12-02 | --coverage flag | smoke | `python3 fhhs-skills-workspace/run_all_evals.py --coverage` | pending |
| D-12-03 | baselines.json integration | smoke | `python3 fhhs-skills-workspace/run_all_evals.py --tier micro --commands auto` + verify baselines.json updated | pending |
| D-12-04 | 3 fixture-backed auto evals | smoke | `python3 fhhs-skills-workspace/run_all_evals.py --tier smoke --commands auto` | pending |
| D-12-05 | Measurement workflow docs | manual-only | Read CLAUDE.md and auto-improve.md for workflow | pending |
| D-12-07 | startup-* in COMMAND_MAP | unit | `python3 fhhs-skills-workspace/verify_command_map.py` | yes |

### Sampling Rate
- **Per task commit:** `python3 fhhs-skills-workspace/run_all_evals.py --tier micro --commands auto`
- **Per wave merge:** `python3 fhhs-skills-workspace/run_all_evals.py --tier smoke`
- **Phase gate:** Full suite green before verify-work

### Wave 0 Gaps
- [ ] New fixture state files for auto-pipeline scenarios (`.auto-state.json`, DECISIONS.md)
- [ ] `--coverage` flag implementation in run_all_evals.py
- [ ] baselines.json read/write integration in auto-improve.md
- [ ] 5 missing startup-* entries in COMMAND_MAP

## Sources

### Primary (HIGH confidence)
- `.claude/skills/auto/SKILL.md` -- 450 lines, full orchestration specification
- `.claude/skills/auto/auto-orchestrator.cjs` -- 2833 lines, complete runtime implementation
- `.claude/skills/auto/CONTEXT-SHARING.md` -- context-mode and claude-mem data flow
- `evals/evals.json` -- 250 evals, 44 auto-specific
- `fhhs-skills-workspace/run_all_evals.py` -- eval runner source
- `fhhs-skills-workspace/llm_grader.py` -- grading system source
- `.claude/commands/auto-improve.md` -- auto-improve loop specification
- `evals/fixtures/` -- 3 fixture projects analyzed on disk
- `.planning/phases/12-eval-framework/12-CONTEXT.md` -- locked decisions

### Secondary (MEDIUM confidence)
- `.planning/config.json` -- workflow configuration (nyquist_validation: true)

## Metadata

**Confidence breakdown:**
- Auto-orchestrator architecture: HIGH -- read full 2833-line source
- Eval infrastructure: HIGH -- read runner, grader, and all 250 eval definitions
- Fixture analysis: HIGH -- enumerated all files in all 3 fixtures
- Auto-improve loop: HIGH -- read complete command specification
- Gaps and recommendations: MEDIUM -- inferred from cross-referencing CONTEXT.md decisions against current state

**Research date:** 2026-03-29
**Valid until:** 2026-04-15 (stable internal codebase, changes only via own PRs)
