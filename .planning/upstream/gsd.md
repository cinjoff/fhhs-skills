# Upstream: gsd (v1.22.4)

**Overall Quality: A**

## Overview

GSD (Get Shit Done) is a goal-backward project execution engine built around a state machine that tracks projects through planning, execution, and verification phases. Its philosophy is structured autonomy: the system maintains project state (plans, milestones, phases, progress) while dispatching specialized subagents for each type of work. What makes it distinctive is the combination of persistent state management (via `.planning/` directory), phased execution with checkpoints, and a rich library of 12 specialized agents — making it the most architecturally complex upstream in the catalog.

## File Tree

```
upstream/gsd-1.22.4/
├── VERSION                                       ← version tracking
├── agents/
│   ├── gsd-planner.md                            ← phase planning agent
│   ├── gsd-executor.md                           ← phase execution agent
│   ├── gsd-verifier.md                           ← verification agent
│   ├── gsd-plan-checker.md                       ← plan quality gate
│   ├── gsd-phase-researcher.md                   ← phase-scoped research
│   ├── gsd-project-researcher.md                 ← project-wide research
│   ├── gsd-research-synthesizer.md               ← research synthesis
│   ├── gsd-roadmapper.md                         ← roadmap generation
│   ├── gsd-debugger.md                           ← debugging agent
│   ├── gsd-integration-checker.md                ← cross-phase integration
│   ├── gsd-codebase-mapper.md                    ← codebase discovery
│   └── gsd-nyquist-auditor.md                    ← test coverage auditor
├── references/
│   ├── model-profiles.md                         ← LLM capability profiles
│   ├── model-profile-resolution.md               ← profile selection logic
│   ├── git-integration.md                        ← git workflow patterns
│   ├── git-planning-commit.md                    ← planning commit format
│   ├── verification-patterns.md                  ← verification strategies
│   ├── tdd.md                                    ← TDD methodology ref
│   ├── planning-config.md                        ← planning configuration
│   ├── checkpoints.md                            ← checkpoint/save strategy
│   ├── continuation-format.md                    ← session continuation
│   ├── questioning.md                            ← when to ask vs decide
│   ├── phase-argument-parsing.md                 ← phase ID parsing rules
│   ├── decimal-phase-calculation.md              ← subphase numbering
│   └── ui-brand.md                               ← terminal UI styling
├── templates/
│   ├── config.json                               ← project config template
│   ├── project.md                                ← PROJECT.md template
│   ├── requirements.md                           ← REQUIREMENTS.md template
│   ├── roadmap.md                                ← ROADMAP.md template
│   ├── state.md                                  ← STATE.md template
│   ├── context.md                                ← context template
│   ├── continue-here.md                          ← continuation template
│   ├── discovery.md                              ← discovery notes template
│   ├── research.md                               ← research output template
│   ├── milestone.md                              ← milestone template
│   ├── milestone-archive.md                      ← archived milestone
│   ├── summary.md                                ← summary template
│   ├── summary-complex.md                        ← complex project summary
│   ├── summary-standard.md                       ← standard summary
│   ├── summary-minimal.md                        ← minimal summary
│   ├── verification-report.md                    ← verification report
│   ├── retrospective.md                          ← retro template
│   ├── user-setup.md                             ← user config template
│   ├── phase-prompt.md                           ← phase execution prompt
│   ├── planner-subagent-prompt.md                ← planner dispatch prompt
│   ├── debug-subagent-prompt.md                  ← debugger dispatch prompt
│   ├── DEBUG.md                                  ← debug session template
│   ├── UAT.md                                    ← user acceptance test
│   ├── VALIDATION.md                             ← validation checklist
│   ├── codebase/                                 ← codebase mapping templates
│   │   ├── architecture.md
│   │   ├── concerns.md
│   │   ├── conventions.md
│   │   ├── integrations.md
│   │   ├── stack.md
│   │   ├── structure.md
│   │   └── testing.md
│   └── research-project/                         ← research project templates
│       ├── ARCHITECTURE.md
│       ├── FEATURES.md
│       ├── PITFALLS.md
│       ├── STACK.md
│       └── SUMMARY.md
├── workflows/
│   ├── new-project.md                            ← project initialization
│   ├── plan-phase.md                             ← phase planning
│   ├── execute-phase.md                          ← phase execution
│   ├── execute-plan.md                           ← full plan execution
│   ├── verify-phase.md                           ← phase verification
│   ├── verify-work.md                            ← work verification
│   ├── progress.md                               ← progress reporting
│   ├── health.md                                 ← project health check
│   ├── quick.md                                  ← quick single-phase task
│   ├── settings.md                               ← user settings
│   ├── set-profile.md                            ← model profile config
│   ├── map-codebase.md                           ← codebase mapping
│   ├── add-todo.md                               ← add todo item
│   ├── check-todos.md                            ← check todo status
│   ├── discuss-phase.md                          ← discussion workflow
│   ├── discovery-phase.md                        ← discovery workflow
│   ├── research-phase.md                         ← research workflow
│   ├── resume-project.md                         ← resume from pause
│   ├── validate-phase.md                         ← pre-execution validation
│   ├── pause-work.md                             ← pause state
│   ├── new-milestone.md                          ← create milestone
│   ├── complete-milestone.md                     ← complete milestone
│   ├── audit-milestone.md                        ← audit milestone
│   ├── add-phase.md                              ← add phase to plan
│   ├── insert-phase.md                           ← insert phase at position
│   ├── remove-phase.md                           ← remove phase from plan
│   ├── add-tests.md                              ← add test phase
│   ├── diagnose-issues.md                        ← diagnose problems
│   ├── plan-milestone-gaps.md                    ← gap analysis
│   ├── list-phase-assumptions.md                 ← assumption tracking
│   ├── transition.md                             ← phase transition
│   ├── cleanup.md                                ← project cleanup
│   ├── help.md                                   ← help/usage
│   └── update.md                                 ← update workflow
```

## Capability Flow Diagram

```
                          GSD STATE MACHINE

                    ┌─────────────────────┐
                    │    new-project       │
                    │  (initialize state)  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
            ┌──────│      PLANNING        │──────┐
            │      │  plan-phase          │      │
            │      │  ┌─────────────────┐ │      │
            │      │  │ gsd-planner     │ │      │
            │      │  │ gsd-plan-checker│ │      │
            │      │  └─────────────────┘ │      │
            │      └──────────┬──────────┘      │
            │                 │                  │
  ┌─────────▼───────┐  ┌─────▼──────────┐  ┌───▼──────────────┐
  │   RESEARCH      │  │   EXECUTION    │  │   DISCOVERY      │
  │ research-phase  │  │ execute-phase  │  │ discovery-phase   │
  │ ┌─────────────┐ │  │ ┌────────────┐ │  │ discuss-phase     │
  │ │phase-       │ │  │ │gsd-executor│ │  └──────────────────┘
  │ │researcher   │ │  │ └────────────┘ │
  │ │project-     │ │  └───────┬────────┘
  │ │researcher   │ │          │
  │ │synthesizer  │ │  ┌───────▼────────┐
  │ └─────────────┘ │  │  VERIFICATION  │
  └─────────────────┘  │ verify-phase   │
                       │ verify-work    │
                       │ ┌────────────┐ │
                       │ │gsd-verifier│ │
                       │ │integration-│ │
                       │ │checker     │ │
                       │ └────────────┘ │
                       └───────┬────────┘
                               │
                    ┌──────────▼──────────┐
                    │    COMPLETION       │
                    │  progress, health   │
                    │  cleanup            │
                    └─────────────────────┘

  SUPPORT WORKFLOWS:          AGENT DISPATCH:
  ├── quick (bypass planning)  ├── gsd-debugger (on failures)
  ├── pause-work / resume      ├── gsd-codebase-mapper (discovery)
  ├── add/check-todos          ├── gsd-roadmapper (planning)
  └── milestone management     └── gsd-nyquist-auditor (test coverage)
```

## Deep Capability Descriptions

### Agents

| Agent | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **gsd-planner** | Goal-backward planning: starts from "what must be TRUE?" and builds task structure to achieve those outcomes. Produces structured PLAN.md with frontmatter, files/action/verify/done per task, TDD RED/GREEN/REFACTOR phases, checkpoint definitions. | Ensures plans achieve outcomes, not just list tasks. Measurable success criteria. | **ACTIVE** — core of `/fh:plan-work` and `/fh:build` |
| **gsd-executor** | Atomic per-task execution with deviation handling. Auto-fixes bugs (Rules 1-3), gates architectural changes (Rule 4) as checkpoints. Tracks state in STATE.md, supports TDD workflows, handles auth gates. | Reliable execution that handles surprises without stopping. Only pauses for decisions that matter. | **ACTIVE** — core of `/fh:build` and `/fh:quick` |
| **gsd-verifier** | Goal-backward verification at three levels: (1) artifact exists, (2) not a stub (min_lines, expected patterns), (3) wired into system (imported/used, not orphaned). Re-verification mode focuses on previously-failed items. | Catches incomplete work that looks done but isn't. "Did you build a chat component?" vs "Does it display real messages?" | **DEAD** — not wired into any pipeline. **HIGH-VALUE GAP**: should be in `/fh:build` completion. |
| **gsd-plan-checker** | Pre-execution plan quality gate: requirement coverage, task completeness, dependency correctness, scope sanity, context compliance, Nyquist test coverage. Returns issues or approval. | Prevents executing plans with gaps. Quality gate before spending compute. | **ACTIVE** — used in `/fh:plan-work` via plan-review |
| **gsd-phase-researcher** | Deep domain investigation per phase. Spawned with full tool access (web search, doc fetch). Produces structured RESEARCH.md: standard stack with versions, architecture patterns, common pitfalls, code examples from authoritative sources, validation architecture. Honors locked decisions from CONTEXT.md. | Ensures plans are built on verified current knowledge, not stale training data. Phase-specific, not generic. | **CONDITIONAL** — plan-work suggests deep research when complexity warrants (Phase 3.5). |
| **gsd-project-researcher** | 4 parallel researcher agents investigating: (1) stack ecosystem, (2) feature landscape, (3) architecture patterns, (4) domain pitfalls. Each writes a separate document. | Comprehensive initial project understanding before any planning. Parallelized for speed. | **DEAD** — fhhs uses simpler `/fh:research`. **INTEGRATION OPPORTUNITY**: `/fh:new-project` should offer deep research mode for unfamiliar stacks. |
| **gsd-research-synthesizer** | Combines 4 parallel researcher outputs into unified SUMMARY.md with executive summary, key findings, roadmap implications, research flags, confidence assessment. | Single coherent research output instead of 4 fragmented docs. Directly feeds roadmapping. | **DEAD** — no multi-researcher synthesis in fhhs. |
| **gsd-roadmapper** | Derives project phases from requirements (not imposed structure). Goal-backward success criteria. 100% requirement coverage validation. Traceability mapping. | Every requirement maps to exactly one phase with observable success criteria. No orphan requirements. | **ACTIVE** — basis of `/fh:new-project` roadmap creation |
| **gsd-debugger** | Scientific method debugging with persistent sessions in `.planning/debug/`. Hypothesis formation, falsifiability testing, binary search, differential debugging. Sessions survive `/clear`. Parallel UAT diagnosis mode. | Systematic investigation that persists across context resets. Enables multi-session debugging. | **DEAD** — fhhs uses Superpowers systematic-debugging instead. GSD debugger's persistence advantage is unused. |
| **gsd-integration-checker** | Cross-phase wiring verification: export/import connectivity, API coverage, auth protection, E2E flow completeness. Per-requirement integration mapping. | Catches architectural breaks between phases. Ensures systems work as integrated wholes, not isolated pieces. | **DEAD** — not wired. Low priority for plugin projects. |
| **gsd-codebase-mapper** | Explores and documents existing codebases. Writes STACK.md, ARCHITECTURE.md, CONVENTIONS.md, STRUCTURE.md, TESTING.md, CONCERNS.md, INTEGRATIONS.md to `.planning/codebase/`. | Provides context for planners/executors without token waste. Answers "how do I write code that fits this project?" | **ACTIVE** — exposed as `/fh:map-codebase` |
| **gsd-nyquist-auditor** | Generates minimal behavioral tests for unverified requirements. Max 3 debug iterations per gap. Never modifies implementation (escalates bugs). Updates VALIDATION.md. | Ensures test coverage for all phase requirements. Fills gaps, doesn't rewrite. | **DEAD** — integrated but never dispatched. |

### Workflows — What They Actually Do

| Workflow | What It Does | When You'd Use It | fhhs Status |
|----------|-------------|-------------------|-------------|
| **new-project** | Full bootstrap: 4 parallel researchers → synthesis → roadmapper → ROADMAP.md with phases, success criteria, requirement traceability | Starting a new tracked project from scratch | **ACTIVE** — `/fh:new-project` |
| **discuss-phase** | Structured decision workshop producing CONTEXT.md with three categories: **Locked decisions** (Claude must follow), **Discretion** (Claude decides within bounds), **Deferred** (track for later). Uses questioning.md elicitation techniques. | Before planning a phase with consequential architectural decisions. Prevents Claude from re-deciding things across sessions. | **ACTIVE** — plan-work Step 3 produces CONTEXT.md with locked/discretion/deferred decisions (Phase 3.5). |
| **discovery-phase** | Open-ended exploration of problem space. No coding. User and Claude investigate constraints, existing solutions, stakeholder needs. | When requirements are unclear and need investigation before planning | **ABSORBED** — merged into `/fh:research` |
| **research-phase** | Deep domain investigation: spawns phase-researcher with web/doc access, produces structured RESEARCH.md | Before planning a phase in an unfamiliar domain | **ABSORBED but simplified** — `/fh:research` does lighter version. **INTEGRATION OPPORTUNITY**: plan-work should detect unfamiliar domains and suggest deep research. |
| **plan-phase** | Plan creation: researcher → planner → plan-checker → approval loop | Before execution of any phase | **ACTIVE** — `/fh:plan-work` |
| **execute-phase** | Run plans with checkpoint handling, deviation rules, state tracking | Building planned work | **ACTIVE** — `/fh:build` |
| **verify-phase** / **verify-work** | Goal-backward verification + Nyquist gap filling | After execution, before moving to next phase | **DEAD** — not in any pipeline. **GAP**: builds complete without goal verification. |
| **validate-phase** | Pre-execution validation: are dependencies met? Is context sufficient? | Before starting execution of a dependent phase | **DEAD** — partially in plan-checker |
| **diagnose-issues** | Parallel debugging: spawns debugger per issue domain | Multiple simultaneous failures across different subsystems | **DEAD** — overlaps `/fh:fix` |
| **plan-milestone-gaps** | Gap analysis: creates targeted plans for verification gaps | After verification finds incomplete work | **DEAD** — no verification = no gaps to plan for |
| **progress** | Status reporting and session resumption | Starting a new session, checking where things stand | **ACTIVE** — `/fh:progress` |
| **health** | .planning/ directory integrity validation | Suspecting corrupted planning state | **ACTIVE** — `/fh:health` |
| **quick** | Single-phase bypass: skip formal planning for small tasks | Small, well-understood changes | **ACTIVE** — `/fh:quick` |
| **milestone management** (new/complete/audit) | Multi-milestone lifecycle: creation, completion with integration check, health audit | Large projects spanning multiple milestones | **DEAD** — exposed as commands but rarely used |
| **phase CRUD** (add/insert/remove) | Plan mutation during execution | Urgent scope changes mid-project | **DEAD** — exposed as commands but edge-case |

## Commands/Workflows Table

| Command | Purpose | Exposed as | Status | Notes |
|---------|---------|-----------|--------|-------|
| new-project | Initialize project state | /fh:new-project | ✅ Forked | Creates .planning/ structure |
| plan-phase | Plan a phase of work | /fh:plan-work | ✅ Forked | Core planning workflow |
| execute-phase | Execute a planned phase | /fh:build | ✅ Forked | Composite with superpowers |
| verify-phase | Verify phase completion | — | ⚠️ **GAP** | Should be in /fh:build completion |
| verify-work | Verify specific work | — | ⚠️ **GAP** | Should be in /fh:build completion |
| progress | Report project progress | /fh:progress | ✅ Forked | State reading |
| health | Project health check | /fh:health | ✅ Forked | Maintenance check |
| quick | Quick single-phase task | /fh:quick | ✅ Forked | Bypass formal planning |
| settings | User preferences | /fh:settings | ✅ Forked | Config management |
| set-profile | Model profile config | /fh:settings | ✅ Forked | Merged into settings |
| map-codebase | Codebase mapping | /fh:map-codebase | ✅ Forked | Discovery tool |
| add-todo | Add todo item | /fh:todos | ✅ Forked | Merged add+check |
| check-todos | Check todo status | /fh:todos | ✅ Forked | Merged add+check |
| discuss-phase | Decision workshop → CONTEXT.md | /fh:plan-work Step 3 | ✅ **Active** | CONTEXT.md with locked/discretion/deferred decisions |
| research-phase | Deep domain research | /fh:research + /fh:plan-work | 🔀 Conditional | plan-work suggests deep research for complex tasks |
| discovery-phase | Problem space exploration | /fh:research | 🔀 Absorbed | Merged with research |
| resume-project | Resume from pause | (via /fh:progress) | 🔀 Partial | State restoration |
| execute-plan | Full plan execution | (internal to /fh:build) | 🔀 Internal | Orchestration |
| validate-phase | Pre-execution validation | — | ⬜ Available | Partially in plan-checker |
| pause-work | Pause project state | — | ⬜ Available | State persistence |
| new-milestone | Create milestone | — | ⬜ Available | Multi-milestone support |
| complete-milestone | Complete milestone | — | ⬜ Available | Milestone lifecycle |
| audit-milestone | Audit milestone | — | ⬜ Available | Milestone verification |
| add-phase | Add phase to plan | — | ⬜ Available | Plan mutation |
| insert-phase | Insert phase at position | — | ⬜ Available | Plan mutation |
| remove-phase | Remove phase from plan | — | ⬜ Available | Plan mutation |
| add-tests | Add test phase | — | ⬜ Available | Test insertion |
| diagnose-issues | Diagnose problems | — | ⬜ Available | Overlaps /fh:fix |
| plan-milestone-gaps | Gap analysis | — | ⬜ Available | Plan completeness |
| list-phase-assumptions | Assumption tracking | — | ⬜ Available | Risk tracking |

## Subagent Definitions Table

| Agent | Purpose | Dispatched by | Quality | Status | Notes |
|-------|---------|---------------|---------|--------|-------|
| gsd-planner | Phase planning & decomposition | plan-phase, execute-phase | A | ✅ Active | Core planning agent |
| gsd-executor | Phase execution | execute-phase, quick | A | ✅ Active | Core execution agent |
| gsd-verifier | Verification & testing | — | A | ⚠️ **Dead** | Not wired — high-value gap |
| gsd-plan-checker | Plan quality validation | plan-phase | A | ✅ Active | Plan gate agent |
| gsd-phase-researcher | Phase-scoped research | plan-work (conditional) | A | ✅ **Conditional** | plan-work suggests for complex tasks |
| gsd-project-researcher | Project-wide research | — | A | ⚠️ **Dead** | Integration opportunity for new-project |
| gsd-research-synthesizer | Research synthesis | — | B | ⚠️ **Dead** | Depends on multi-researcher flow |
| gsd-roadmapper | Roadmap generation | new-project | A | ✅ Active | Roadmap creation |
| gsd-debugger | Debugging & diagnosis | — | A | ⚠️ **Dead** | Superpowers debugging used instead |
| gsd-integration-checker | Cross-phase integration | — | A | ⬜ Available | Low priority for plugin projects |
| gsd-codebase-mapper | Codebase discovery | map-codebase | B | ✅ Active | Discovery tool |
| gsd-nyquist-auditor | Test coverage auditing | — | B | ⬜ Available | Low priority |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| model-profiles.md | Reference | All agents | ✅ Active | LLM capability profiles |
| model-profile-resolution.md | Reference | settings | ✅ Active | Profile selection logic |
| git-integration.md | Reference | execute-phase, verify | ✅ Active | Git workflow patterns |
| git-planning-commit.md | Reference | plan-phase | ✅ Active | Planning commit format |
| verification-patterns.md | Reference | verify-phase | ✅ Active | Verification strategies |
| tdd.md | Reference | execute-phase | ✅ Active | TDD methodology |
| planning-config.md | Reference | plan-phase | ✅ Active | Planning configuration |
| checkpoints.md | Reference | execute-phase | ✅ Active | Checkpoint strategy |
| continuation-format.md | Reference | resume-project | ✅ Active | Session continuation |
| questioning.md | Reference | discuss-phase, plan-phase | ✅ Active | **Key asset for deeper research/discussion** |
| phase-argument-parsing.md | Reference | All workflows | ✅ Active | Phase ID parsing |
| decimal-phase-calculation.md | Reference | All workflows | ✅ Active | Subphase numbering |
| ui-brand.md | Reference | All UI output | ✅ Active | Terminal styling |
| templates/ (26 files) | Templates | Various workflows | ✅ Active | State & report templates |
| templates/codebase/ (7 files) | Templates | map-codebase | ✅ Active | Codebase mapping templates |
| templates/research-project/ (5 files) | Templates | research-phase | ⚠️ Available | **Useful if deep research integrated** |

## Assessment

GSD is the state management backbone of fhhs. Its phased execution model (plan → execute → verify) combined with persistent `.planning/` state gives fhhs session continuity that no other upstream provides.

### What's Working

The core loop — planner, executor, plan-checker, roadmapper, codebase-mapper — is well-integrated and actively used. The template and reference libraries are comprehensive and fully leveraged.

### What's Underused (Remaining Gaps)

1. **Verification is missing.** The gsd-verifier's goal-backward checking (exists → substantive → wired) is one of GSD's most powerful ideas, but it's not wired into `/fh:build` completion. Builds can claim success without verifying outcomes.

2. ~~**Deep research is bypassed.**~~ ✅ **Closed (Phase 3.5)** — plan-work now suggests spawning gsd-phase-researcher for complex tasks requiring deep domain investigation.

3. ~~**Decision-locking is lost.**~~ ✅ **Closed (Phase 3.5)** — plan-work Step 3 produces CONTEXT.md with locked/discretion/deferred decisions.

### Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| **High** | Wire gsd-verifier into `/fh:build` completion step | Prevents false success claims |
| ~~High~~ | ~~Add complexity-aware research trigger to `/fh:plan-work`~~ | ✅ **DONE** (Phase 3.5, conditional) |
| ~~High~~ | ~~Add decision-locking step (CONTEXT.md pattern) to `/fh:plan-work`~~ | ✅ **DONE** (Phase 3.5) |
| **Medium** | Offer deep research mode in `/fh:new-project` that spawns 4 parallel researchers | Thorough initial project understanding |
| **Low** | Wire milestone management for large projects | Edge case, defer |
| **Low** | Wire gsd-nyquist-auditor as optional post-build test coverage check | Nice-to-have |
