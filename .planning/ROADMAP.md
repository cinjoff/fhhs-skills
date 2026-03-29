---
type: roadmap
project: fhhs-skills
version: v2
created: "2026-03-25"
revised: "2026-03-29"
phases: 12
---

# Roadmap

> **v2 revision (2026-03-29):** Reconciled phase statuses with implementation reality. Absorbed orphan Phase 08 (pipeline optimization). Reprioritized remaining work around three goals: (1) auto skill optimization with observability, (2) Serena-driven context/memory workflow rework, (3) eval framework strengthening via /auto-improve and /skill-creator.

---

## Completed Phases

### Phase 1: Skill Quality & Eval Coverage
**Goal:** Every shipped skill works correctly and has eval coverage proving it.
**Status:** Complete

- 210+ evals covering all shipped skills
- Happy paths, edge cases, misrouting, failure recovery, state corruption
- Fixture-backed evals with real project structures

### Phase 2: Upstream Sync & Patch Stability
**Goal:** Upstream updates can be incorporated without breaking patched skills.
**Status:** Complete

- `/fh:sync-upstream` workflow with pre-sync validation, git checkpoints, post-sync regression detection
- PATCHES.md and COMPATIBILITY.md stay accurate after syncs
- 6 sync-upstream evals

### Phase 3: Upstream Capability Audit & Integration Planning
**Goal:** All upstream capabilities are cataloged, quality-assessed, and gaps identified.
**Status:** Complete

- UPSTREAM-INDEX.md with 8 upstream sources, per-skill quality ratings
- Gap Registry (G1-G11), SDLC coverage matrix
- 13 audit-upstream evals

### Phase 3.5: Pipeline Depth & Intelligence
**Goal:** Pipelines intelligently assess task complexity and suggest appropriate depth.
**Status:** Complete

- Decision-locking (CONTEXT.md locked/discretion/deferred) prevents cross-session drift
- Engineering review mode in plan-review
- Verification-before-completion in build
- 3 plans executed with SUMMARYs

### Phase 4: User Experience & Onboarding
**Goal:** Non-technical users can install and use the plugin without assistance.
**Status:** Complete (core)

- `/fh:setup` with platform detection, first-run detection, Getting Started flow
- Standardized error messages with next-step suggestions
- `/fh:progress` routes new users to setup
- Onboarding evals added
- _Note: tracker UI redesign (plan 01/03) partially done, continued in Phase 8_

### Phase 6: Ecosystem & Distribution
**Goal:** Plugin is discoverable, installable, and maintainable at scale.
**Status:** Complete

- Marketplace listing, automated release process
- `/fh:update` and `/fh:release` working
- Community docs and contributor guide
- Health check integrated into release flow

### Phase 8: Pipeline Optimization
**Goal:** Build and review pipelines are fast, cheap, and well-structured.
**Status:** Complete

- Build pipeline slimmed (9 to 7 steps): removed spec gate, Fallow gates, self-check
- Model tiering: Sonnet for implementers, Haiku for GSD state
- 1-agent simplify (was 3), inlined checkpoint protocol
- Conditional context injection in implementer prompt
- Plan-work brainstorm fast-track for Simple tasks
- Configurable plan limits via config.json
- 3 plans executed with SUMMARYs

### Phase 9: Learning Persistence & Feedback Loop
**Goal:** Workflow issues extracted from claude-mem and filed as GitHub issues.
**Status:** Complete (skill shipped)

- `/fh:learnings` analyzes cross-project observations
- Positive insights, clustering, dedup, auto-filing, dry-run, configurable windows
- 8 evals (4 core + 4 edge-case)
- _Note: plan 01 SUMMARY pending — skill was verified complete, just needs doc_

### Phase 10-11: Startup Validation Skills
**Goal:** Pre-building skills for founders to validate ideas before coding.
**Status:** Complete (shipped in v1.39.0)

- 5 skills shipped: startup-design, startup-competitors, startup-positioning, startup-pitch, startup-advisor
- Upstream snapshot saved, PATCHES.md updated
- new-project bridge (Step 0.5), auto detection
- 15+ startup skill evals

---

## Active Work

### Phase 5: Advanced Integrations — Serena & Context Workflow
**Goal:** Skills leverage Serena for symbol navigation and context-mode for token efficiency. Workflow rework to identify what Serena should replace vs complement.
**Status:** In progress — Plans 01-03 (context-mode) complete, Plans 04-06 (Fallow+Serena) partially executed

**Completed:**
- Context-mode integration across 18+ skills (ctx_search, ctx_batch_execute patterns)
- Fallow CLI wired into map-codebase, review, simplify, fix, extract, refactor
- Serena setup with `--mode no-memories` (symbol tools only, claude-mem handles memory)
- Serena references in fix, refactor, extract skills

**Remaining (Serena workflow rework):**
- [ ] **Serena as primary symbol navigator** — currently "enhanced alternative", needs to become primary when installed (D-AUTO-06)
- [ ] **map-codebase Serena integration** — pre-agent `get_symbols_overview` on entry points (D-AUTO-07)
- [ ] **Evaluate Serena vs claude-mem memory overlap** — research spike concluded: no-memories is correct, but need to verify workflow handoffs
- [ ] **Context-mode + Serena synergy** — define when to use ctx_search vs Serena symbol tools vs direct Read
- [ ] **Workflow decision matrix** — document which tool to use when (context-mode for large output, Serena for symbols, claude-mem for cross-session, Read for editing)
- [ ] **Eval coverage** — update existing evals for Serena-primary behavior, add map-codebase symbol eval

**Key decisions locked:**
- D-AUTO-06: Serena as primary, not enhanced alternative
- Decision 1 (Plan 06): Memory architecture Option C (no-memories) — symbol tools only
- D-AUTO-01: Fallow in map-codebase via pre-agent injection

### Phase 7: Autonomous Execution & Harness Engineering
**Goal:** Users invoke `/fh:auto` and walk away — system produces working codebase with decision audit trail.
**Status:** In progress — core pipeline working, optimization and observability needed

**Completed:**
- DECISIONS.md as append-only autonomous decision journal
- `/fh:new-project --auto` with scope-expansion roadmap
- Autonomous loop: plan-work → plan-review (HOLD SCOPE) → build → review
- Headless orchestrator via `claude -p` with crash recovery
- Stuck detection, timeout supervision, cost tracking
- Decision correction cascade
- Parallel pipeline architecture (3-wave: concurrent plan → concurrent review → dependency-ordered build)
- Activity events and kill sentinel support (uncommitted, 72 lines)
- Per-step stuck thresholds (build: 15min, plan/review: 8min)

**Remaining (optimization + observability):**
- [ ] **Commit orchestrator improvements** — 72 lines of uncommitted changes (activity events, kill sentinel, per-step thresholds)
- [ ] **Resume state validation** — validate .auto-state.json on resume, handle corruption gracefully (Plan 07-10 Task 1)
- [ ] **Milestone completion awareness** — detect all-phases-done and suggest `gsd-tools milestone complete` (Plan 07-10 Task 2)
- [ ] **Walk-away documentation** — document full narrative in SKILL.md (Plan 07-10 Task 3)
- [ ] **Auto pipeline lifecycle evals** — corrupt state, milestone complete, walk-away from description (Plan 07-10 Task 4)
- [ ] **Observability dashboard** — tracker UI shows live auto progress (activity feed, step tokens, cost chart)
- [ ] **Cost optimization** — measure and reduce per-phase agent cost, identify context waste
- [ ] **Context-mode integration in auto** — agents use ctx_search instead of Read for large files (CONTEXT-SHARING.md improvements)

---

## New Phases

### Phase 12: Eval Framework & Continuous Improvement
**Goal:** Eval-driven development loop where skill changes are measured, not guessed. /auto-improve runs iteratively to find and fix skill issues. /skill-creator provides structured skill development with built-in eval measurement.
**Status:** Planning

**Workstreams:**

1. **Auto-improve loop hardening**
   - [ ] Verify `/auto-improve` command works end-to-end (currently at `.claude/commands/auto-improve.md`)
   - [ ] Run /auto-improve against current eval suite, baseline pass rates
   - [ ] Add tier support (micro for fast iteration, smoke for core skills)
   - [ ] Track improvement deltas across runs

2. **Skill-creator integration**
   - [ ] Assess skill-creator availability (not found locally — check if upstream or installable)
   - [ ] Use skill-creator for new skill development with eval-first methodology
   - [ ] Integrate eval benchmarking into skill development workflow

3. **Eval infrastructure improvements**
   - [ ] Fixture-backed evals for auto skill (mock .auto-state.json scenarios)
   - [ ] Deterministic checks alongside keyword heuristics
   - [ ] LLM grader for nuanced eval assessment
   - [ ] Eval coverage dashboard (which skills have gaps)
   - [ ] Baseline tracking: save pass rates, detect regressions

4. **Measurement-driven decisions**
   - [ ] Before/after metrics for every skill change
   - [ ] Cost-per-phase tracking in auto runs
   - [ ] Context-mode savings measurement (token reduction)
   - [ ] Serena impact measurement (symbol resolution accuracy)

---

## Deferred

- **Fallow MCP server integration** — use MCP instead of CLI shelling (revisit when Fallow MCP adoption grows)
- **Fallow baseline/regression tracking** — nice-to-have across builds
- **Multi-milestone auto execution** — archive → create → execute loop (D-070: roadmap creation scope only for now)
- **Tracker UI redesign** — Linear-inspired dashboard (design docs exist at `.planning/designs/DESIGN.md`, partially implemented components exist)
