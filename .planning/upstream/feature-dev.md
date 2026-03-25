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

## Deep Capability Descriptions

| Agent | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **code-explorer** | Traces execution paths through codebase, identifies key files for a given feature area, maps dependencies and call chains, surfaces hidden complexity. Dispatched as subagent to investigate before planning. | Prevents planning based on assumptions. "What does the code actually do?" before "What should we change?" | **ACTIVE** — dispatched in `/fh:build` brainstorming phase (line 65) and by other skills for codebase understanding. |
| **code-architect** | Designs 3 implementation approaches (minimal, clean, pragmatic) for a given feature. Evaluates tradeoffs, identifies risks, recommends approach. Dispatched as subagent to propose design before implementation. | Prevents single-approach thinking. Forces consideration of alternatives and tradeoffs. The three-approach model is well-calibrated. | **ACTIVE** — dispatched in brainstorming phase (line 71) for architecture design. |
| **code-reviewer** | Reviews completed work for: bugs, quality issues, convention compliance, security concerns, performance implications. Structured output with severity ratings. | Systematic review that goes beyond "looks good." Convention compliance catching is especially valuable. | **ACTIVE** — dispatched in `/fh:build` spec-gate and `/fh:review` for quality checks. |

## Skills Table

| Skill | SDLC Phase | Quality | Pipeline Status | fhhs Equivalent | Notes |
|-------|-----------|---------|----------------|-----------------|-------|
| feature-dev (workflow) | Full lifecycle | B | 🔀 Pattern absorbed | Patterns in /fh:build | 7-phase workflow replaced by GSD |

## Subagent Definitions Table

| Agent | Purpose | Dispatched by | Quality | Status | Notes |
|-------|---------|---------------|---------|--------|-------|
| code-explorer | Codebase exploration | /fh:build brainstorming, general use | B | ✅ **Active** | agents/code-explorer.md |
| code-architect | Architecture design | /fh:build brainstorming | B | ✅ **Active** | agents/code-architect.md |
| code-reviewer | Code quality review | /fh:build spec-gate, /fh:review | B | ✅ **Active** | agents/code-reviewer.md |

## Assessment

feature-dev's primary value lies entirely in its three agent personas. All three are actively used in fhhs's core pipelines.

### What's Working

All three agents are well-integrated:
- **code-explorer** provides codebase understanding before planning
- **code-architect** provides multi-approach design exploration
- **code-reviewer** provides structured quality review

The workflow itself was correctly absorbed into fhhs's more sophisticated GSD-backed execution model rather than being exposed as a standalone command.

### Integration Opportunity for plan-work

The code-explorer agent could be more systematically used in `/fh:plan-work` when the user is working in an unfamiliar codebase. Currently, brainstorming references it but the exploration is optional. For complex plans in unfamiliar codebases, explicit code-explorer dispatch should be suggested to the user.

### Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| **Medium** | Suggest code-explorer dispatch in `/fh:plan-work` for unfamiliar codebases | Better plans from better codebase understanding |
| **None** | No other changes needed | All agents fully integrated |
