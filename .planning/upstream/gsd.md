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
  ├── settings / set-profile   └── gsd-nyquist-auditor (test coverage)
  └── milestone management
```

## Commands/Workflows Table

| Command | Purpose | Exposed as | Status | Notes |
|---------|---------|-----------|--------|-------|
| new-project | Initialize project state | /fh:new-project | ✅ Forked | Creates .planning/ structure |
| plan-phase | Plan a phase of work | /fh:plan-work | ✅ Forked | Core planning workflow |
| execute-phase | Execute a planned phase | /fh:build | ✅ Forked | Composite with superpowers |
| verify-phase | Verify phase completion | (internal to /fh:build) | 🔀 Partial | Folded into build pipeline |
| verify-work | Verify specific work | (internal to /fh:build) | 🔀 Partial | Folded into build pipeline |
| progress | Report project progress | /fh:progress | ✅ Forked | State reading |
| health | Project health check | /fh:health | ✅ Forked | Maintenance check |
| quick | Quick single-phase task | /fh:quick | ✅ Forked | Bypass formal planning |
| settings | User preferences | /fh:settings | ✅ Forked | Config management |
| set-profile | Model profile config | /fh:settings | ✅ Forked | Merged into settings |
| map-codebase | Codebase mapping | /fh:map-codebase | ✅ Forked | Discovery tool |
| add-todo | Add todo item | /fh:todos | ✅ Forked | Merged add+check |
| check-todos | Check todo status | /fh:todos | ✅ Forked | Merged add+check |
| discuss-phase | Discussion workflow | (absorbed into /fh:plan-work) | 🔀 Absorbed | Planning discussion |
| research-phase | Research workflow | /fh:research | 🔀 Absorbed | Research capability |
| discovery-phase | Discovery workflow | /fh:research | 🔀 Absorbed | Merged with research |
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
| transition | Phase transition | — | 🔀 Internal | State machine internals |
| cleanup | Project cleanup | — | 🔀 Internal | State cleanup |
| help | Usage help | — | 🚫 N/A | fhhs has /fh:help |
| update | Update GSD | — | 🚫 N/A | fhhs has /fh:update |

## Subagent Definitions Table

| Agent | Purpose | Dispatched by | Quality | Status | Notes |
|-------|---------|---------------|---------|--------|-------|
| gsd-planner | Phase planning & decomposition | plan-phase, execute-phase | A | ✅ Forked | Core planning agent |
| gsd-executor | Phase execution | execute-phase, quick | A | ✅ Forked | Core execution agent |
| gsd-verifier | Verification & testing | verify-phase, verify-work | A | ✅ Forked | Core verification agent |
| gsd-plan-checker | Plan quality validation | plan-phase | A | ✅ Forked | Plan gate agent |
| gsd-phase-researcher | Phase-scoped research | research-phase | A | ✅ Forked | Integrated but unused |
| gsd-project-researcher | Project-wide research | research-phase | A | ✅ Forked | Integrated but unused |
| gsd-research-synthesizer | Research synthesis | research-phase | B | ✅ Forked | Integrated but unused |
| gsd-roadmapper | Roadmap generation | new-project | A | ✅ Forked | Integrated but unused |
| gsd-debugger | Debugging & diagnosis | diagnose-issues, /fh:fix | A | ✅ Forked | Active in /fh:fix |
| gsd-integration-checker | Cross-phase integration | verify-work | A | 🔀 Partial | Partially integrated |
| gsd-codebase-mapper | Codebase discovery | map-codebase | B | ✅ Forked | Active in /fh:map-codebase |
| gsd-nyquist-auditor | Test coverage auditing | (unused) | B | 🔀 Partial | Integrated but unused |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| model-profiles.md | Reference | All agents | ✅ Forked | LLM capability profiles |
| model-profile-resolution.md | Reference | settings | ✅ Forked | Profile selection logic |
| git-integration.md | Reference | execute-phase, verify | ✅ Forked | Git workflow patterns |
| git-planning-commit.md | Reference | plan-phase | ✅ Forked | Planning commit format |
| verification-patterns.md | Reference | verify-phase | ✅ Forked | Verification strategies |
| tdd.md | Reference | execute-phase | ✅ Forked | TDD methodology |
| planning-config.md | Reference | plan-phase | ✅ Forked | Planning configuration |
| checkpoints.md | Reference | execute-phase | ✅ Forked | Checkpoint strategy |
| continuation-format.md | Reference | resume-project | ✅ Forked | Session continuation |
| questioning.md | Reference | All agents | ✅ Forked | When to ask vs decide |
| phase-argument-parsing.md | Reference | All workflows | ✅ Forked | Phase ID parsing |
| decimal-phase-calculation.md | Reference | All workflows | ✅ Forked | Subphase numbering |
| ui-brand.md | Reference | All UI output | ✅ Forked | Terminal styling |
| templates/ (26 files) | Templates | Various workflows | ✅ Forked | State & report templates |
| templates/codebase/ (7 files) | Templates | map-codebase | ✅ Forked | Codebase mapping templates |
| templates/research-project/ (5 files) | Templates | research-phase | ✅ Forked | Research output templates |

## Assessment

GSD is the state management backbone of fhhs. Its phased execution model (plan → execute → verify) combined with persistent `.planning/` state gives fhhs session continuity that no other upstream provides. The 12-agent library is the richest in the catalog, though 4 agents (phase-researcher, project-researcher, research-synthesizer, roadmapper) are integrated but see little real-world dispatch. The biggest integration gap is in the 13 unexposed workflows (milestone management, phase CRUD, add-tests) — these represent edge-case capabilities that could add value for complex multi-milestone projects but are low priority. The reference and template libraries are exceptionally well-organized and fully integrated.
