# Upstream: feature-dev (55b58ec6)

**Overall Quality: B**

## Overview

feature-dev is a lightweight feature development workflow that orchestrates a 7-phase process (explore, design, plan, implement, review, test, finalize) using three specialized agents. Its philosophy is structured feature delivery with separation of concerns — each agent handles a distinct competency (exploration, architecture, review) rather than one agent doing everything. What makes it distinctive is its simplicity: a single command file plus three focused agent personas, making it the most concise upstream in the catalog while still providing genuine architectural value.

## File Tree

```
upstream/feature-dev-55b58ec6/
├── LICENSE                                       ← MIT license
├── README.md                                     ← project documentation
├── agents/
│   ├── code-explorer.md                          ← codebase exploration agent
│   ├── code-architect.md                         ← architecture & design agent
│   └── code-reviewer.md                          ← code review agent
└── commands/
    └── feature-dev.md                            ← 7-phase workflow command
```

## Capability Flow Diagram

```
                    FEATURE-DEV 7-PHASE WORKFLOW

  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐
  │ 1.EXPLORE│───▶│ 2.DESIGN │───▶│  3.PLAN  │───▶│ 4.IMPLEMENT  │
  └──────────┘    └──────────┘    └──────────┘    └──────────────┘
       │               │                                  │
  code-explorer   code-architect                          │
  (Task agent)    (Task agent)                            │
                                                          │
  ┌──────────┐    ┌──────────┐    ┌──────────┐           │
  │7.FINALIZE│◀───│  6.TEST  │◀───│ 5.REVIEW │◀──────────┘
  └──────────┘    └──────────┘    └──────────┘
                                       │
                                  code-reviewer
                                  (Task agent)
```

## Skills Table

| Skill | SDLC Phase | Quality | Status | fhhs Equivalent | Notes |
|-------|-----------|---------|--------|-----------------|-------|
| feature-dev (workflow) | Full lifecycle | B | 🔀 Partial | Patterns absorbed into /fh:build | 7-phase feature workflow |

## Subagent Definitions Table

| Agent | Purpose | Dispatched by | Quality | Status | Notes |
|-------|---------|---------------|---------|--------|-------|
| code-explorer | Codebase exploration & understanding | feature-dev (phase 1) | B | ✅ Forked | agents/code-explorer.md |
| code-architect | Architecture & design decisions | feature-dev (phase 2) | B | ✅ Forked | agents/code-architect.md |
| code-reviewer | Code review & quality checks | feature-dev (phase 5) | B | ✅ Forked | agents/code-reviewer.md |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| commands/feature-dev.md | Command | Root command | 🔀 Partial | Workflow absorbed into composites |

## Assessment

feature-dev's primary value lies in its three agent personas rather than its workflow command. The code-explorer, code-architect, and code-reviewer agents are all integrated into fhhs's agents/ directory and dispatched by composite skills like /fh:build and /fh:review. The 7-phase workflow itself has been absorbed into fhhs's more sophisticated GSD-backed execution model rather than being exposed as a standalone command. This is the right trade-off: the agents are reusable building blocks while the workflow was too rigid for fhhs's flexible pipeline model.
