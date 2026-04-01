---
type: roadmap
project: fhhs-skills
version: v2
created: "2026-03-25"
revised: "2026-04-01"
phases: 17
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

### Phase 13: Skill System Consolidation
**Goal:** Simplify the skill graph, redistribute quality responsibilities (build lighter, review smarter), enforce consistent claude-mem integration, and consolidate Fallow usage.
**Status:** Complete — 4/4 plans executed

- Skill graph cleanup: removed revise-claude-md, merged ui-redesign into ui-branding
- Pipeline redistribution: build stripped of design gates, review gains Quality Refinement step
- Cross-cutting quality: all skills audited against claude-mem-rules.md, SKILLS-GRAPH updated
- Native task tracking removed, progress migrated to claude-mem timeline
- _Note: todos removal deferred due to GSD CLI infrastructure dependencies_

### Phase 7: Autonomous Execution & Harness Engineering
**Goal:** Users invoke `/fh:auto` and walk away — system produces working codebase with decision audit trail.
**Status:** Complete — 20 plans executed

- DECISIONS.md as append-only autonomous decision journal
- `/fh:new-project --auto` with scope-expansion roadmap
- Headless orchestrator via `claude -p` with crash recovery
- Parallel pipeline (3-wave: concurrent plan → concurrent review → dependency-ordered build)
- Stuck detection, timeout supervision, cost tracking, activity events, kill sentinel
- Resume state validation with corruption handling
- Milestone completion awareness
- Walk-away documentation in SKILL.md
- 49 auto evals (lifecycle, corrupt state, milestone complete)
- Live operations dashboard with log filtering and per-phase costs

---

## New Phases

### Phase 12: Eval Framework & Continuous Improvement
**Goal:** Eval-driven development loop where skill changes are measured, not guessed. /auto-improve runs iteratively to find and fix skill issues. Evals measure token usage to surface inefficiencies.
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
   - [ ] **Token usage tracking in evals** — measure tool call tokens per eval run to baseline efficiency

4. **Measurement-driven decisions**
   - [ ] Before/after metrics for every skill change
   - [ ] Cost-per-phase tracking in auto runs
   - [ ] Context-mode savings measurement (token reduction)
   - [ ] Tool call token breakdown per skill invocation

### Phase 16: Data Contracts & Schema Enforcement
**Goal:** Define formal schemas for all cross-skill artifacts, fix active tracker breakage from schema drift, centralize path constants, and add validation at write boundaries.
**Status:** Planning — 4 plans created

**Plans:**
1/4 plans complete
2. **Plan 02: Fix Active Breakage** — Merge saveAutoState/writeAutoStatus into single writer, fix registry name normalization, add UI null-safety and always-expanded logs
3. **Plan 03: Central Path Constants** — Create bin/lib/paths.cjs, migrate top 4 offenders (init, verify, phase, auto-orchestrator)
4. **Plan 04: Validation & Conventions** — Add validateAutoState() at write boundaries, update skill-authoring-guide with contract rules, add 3 schema compliance evals

**Key decisions (locked in 16-CONTEXT.md):**
- Markdown-embedded JSON Schema format (human+LLM readable, no tooling deps)
- Single writer pattern for .auto-state.json (eliminate saveAutoState)
- Fail-open validation (warn, never block)
- Incremental path migration (top offenders first, rest later)

### Phase 17: GSD State Efficiency & Tool Restoration
**Goal:** Reduce token waste from state management, restore valuable upstream GSD capabilities lost during fork simplification, and improve phase lifecycle management.
**Status:** Planning — 5 plans created

**Plans:**
1/6 plans complete
2. **Plan 02: Named Milestones & Lifecycle** — M{N} notation (M3: v3.0 Ecosystem & Sync), milestone-info command, milestone_number field, new-milestone command, archiving, auto end-of-milestone detection, progress hierarchy, requirements evolution
3. **Plan 03: GSD Tool Restoration & Gap Closure** — Restore plan-checker, verifier, integration-checker agents; update PATCHES.md
4. **Plan 04: Build Pipeline Checkpoint Protocol** — Adopt GSD checkpoint types for interactive build mode
5. **Plan 05: Milestone Awareness Sweep** — Wire M{N} notation into all skills, agents, commands; init contexts inject milestone_number; plan-work checks milestone scope; zero redundant reads

**Key decisions (locked in 17-CONTEXT.md):**
- Session-scoped queries replace global "current phase" singleton — solves parallel execution
- Deterministic scripts over LLM parsing — gsd-tools commands for structured data extraction
- Env var fallback chain: env vars → gsd-tools → file reads (last resort)
- Named milestones (version + topic name) as workflow boundaries
- Restored agents are fhhs forks, not raw upstream copies

### Phase 18: Manifest-Driven Update Infrastructure
**Goal:** Replace the LLM-heavy update skill with a deterministic manifest engine. Single source of truth (`fhhs-manifest.json`) declares expected environment state — script diffs actual vs desired, auto-remediates, and reports via structured JSON. Update skill becomes a thin wrapper with user-friendly table output.
**Status:** Planning — 1 plan created

**Plans:**
1. **Plan 01: Manifest Engine + Update Rewrite** — Schema, check/remediate engine, gsd-tools CLI commands, thin SKILL.md wrapper, context-mode deprecation sweep

**Key decisions (locked in 18-CONTEXT.md):**
- Dedicated `fhhs-manifest.json` (two layers: global + project)
- Manifest is single source of truth (replaces CHANGELOG tags)
- Created by new-project, maintained by update, backfills for existing projects
- Deterministic script with resilient error handling (never crashes, always valid JSON)
- Auto-remove deprecated items (no user confirmation)
- Project profile: stack, framework, database, auth, testing, packageManager

### Phase 14: Upstream Sync Cycle (GSD + Superpowers Priority)
**Goal:** Sync GSD (1.22.4→1.30.0), Superpowers (4.3.1→5.0.7), and cherry-pick gstack QA v2.0 into ui-test. Establish comparative eval framework measuring fhhs vs raw upstream performance.
**Status:** Planning — 4 plans created
**Note:** Moved to end of roadmap — complete all local improvements first, then sync upstream.

**Plans (reduced in review-r2 — QA + eval split to Phase 15):**
1. **Plan 01: Eval Baseline + PATCHES.md Cleanup** — Capture baseline, fix gstack qa→ui-test rename
2. **Plan 02: Superpowers 4.3.1→5.0.7** — New snapshot, reapply 15 skill patches, absorb escalation framework
3. **Plan 03: GSD 1.30.0 Agents** — New snapshot, reapply patches to 11 agents
4. **Plan 04: GSD 1.30.0 Skills + Consolidated Docs** — Reapply patches to 9 shipped skills, Fallow/config.json reimplementation, consolidated PATCHES.md + COMPATIBILITY.md update, old snapshot cleanup

**Key decisions (locked in 14-CONTEXT.md):**
- Re-implement missing patches during GSD sync (code matches PATCHES.md)
- Snapshot deletion deferred to Plan 04 (rollback safety)
- Patch fidelity spot-checks after each merge plan
- Defer: Impeccable 1.6.0, vercel-react, playwright, GSD new agents/workflows

### Phase 15: QA Absorption + Comparative Eval Framework
**Goal:** Absorb gstack QA v2.0 into ui-test (fix loop, tiers, health scoring). Build comparative eval framework measuring fhhs vs raw upstream.
**Status:** Planning — 2 plans created (split from Phase 14 in review-r2)

**Plans:**
1. **Plan 01: gstack QA v2.0 → ui-test** — Full absorption: fix loop, tier system, health scoring, WTF-likelihood, test bootstrap, 4 new evals
2. **Plan 02: Comparative Eval Framework + Docs** — Side-by-side harness via claude -p prompt injection, benchmark suite, post-sync regression check

**Key decisions (locked in 15-CONTEXT.md):**
- gstack QA: full absorption, no gstack binary dependency, .planning/ paths
- Comparative eval: prompt-injection via claude -p (known MCP limitation documented)

---

## Deferred

- **Serena MCP integration** — symbol-level navigation and editing (research complete at `.planning/research/serena-research.md`, revisit after optimizing current tool stack with LSP + context-mode + claude-mem)
- **Fallow MCP server integration** — use MCP instead of CLI shelling (revisit when Fallow MCP adoption grows)
- **Fallow baseline/regression tracking** — nice-to-have across builds
- **Multi-milestone auto execution** — archive → create → execute loop (D-070: roadmap creation scope only for now)
- **Tracker UI redesign** — Linear-inspired dashboard (design docs exist at `.planning/designs/DESIGN.md`, partially implemented components exist)
