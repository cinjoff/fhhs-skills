---
description: "Print the composite skills reference guide. Use when the user says 'help', 'what commands are available', 'how do composites work', 'skills guide', or needs an overview of all composite commands and how GSD/Superpowers/Impeccable fit together."
---

Print the composite skills guide below. Output ONLY the formatted content — no commentary before or after.

---

# Composite Skills Guide

Eight skills that unify GSD state management, Superpowers engineering discipline, and Impeccable design quality into a single workflow interface.

## The Skills

### `/setup` — Install dependencies
Checks for Superpowers and Impeccable plugins, installs any that are missing. GSD installs per-project via `/new-project`. Run once after installing fhhs-skills.

### `/new-project` — Bootstrap a tracked project
GSD new-project questioning -> tech stack defaults (Next.js/TS/Tailwind/Shadcn/Vercel, optional Supabase) -> `impeccable:teach-impeccable` for DESIGN.md -> CLAUDE.md generation -> GSD requirements + roadmap. All `.planning/` files, no scaffolding.

### `/plan` — Design before building
Requires GSD project. Research-first detection -> brainstorm (`superpowers:brainstorming`) -> discuss implementation (lock decisions in CONTEXT.md) -> derive must_haves -> PLAN.md -> plan-check -> execution handoff.

### `/build` — Execute a plan
Find plan -> resume detection -> wave-based parallel subagents (TDD, YAGNI, deviation rules) -> auto-detect frontend files -> Impeccable design gates if frontend (`critique` -> `polish` -> `normalize`) -> SUMMARY.md -> phase completion detection -> dual verification -> two-stage review -> finish.

### `/fix` — Auto-triage bug fix
Triage depth (SIMPLE/MODERATE/PARALLEL/COMPLEX) -> appropriate debug path (COMPLEX seeds `.planning/debug/` for `/gsd:debug`) -> TDD fix -> design check (Impeccable anti-patterns) -> spec review -> verify.

### `/refactor` — Safe code restructuring
Scope blast radius -> capture baseline (characterization tests if needed) -> atomic steps (revert-on-red iron law) -> two-stage review -> verify.

### `/verify` — Standalone dual verification
Goal-backward (must_haves truth table) + evidence-based (fresh commands, exit codes) + frontend suggestion (`/verify-ui`) + anti-pattern detection. Auto-creates gap-closure plans on failure. Writes VERIFICATION.md.

### `/resume` — Context restoration
Read state (GSD + git + incomplete work) -> present briefing -> route to right composite.

### `/research` — Investigate a topic
Dispatch subagent with Firecrawl + Context7. GSD-compatible frontmatter. Prescriptive output with confidence tagging.

### `/verify-ui` — Visual verification
Playwright screenshots at 3 breakpoints -> design critique against `.planning/DESIGN.md`. Severity-rated report.

## Typical Workflows

```
First time:   /setup -> /new-project -> /plan -> /build -> /verify
New project:  /new-project -> /plan -> /build -> /verify
Feature:     /plan -> /build -> /verify -> /verify-ui
Bug fix:     /fix
Refactoring: /refactor
Resuming:    /resume -> (routes to next action)
Verifying:   /verify (standalone, any time)
```

---

## How the Frameworks Combine

**GSD is the state machine.** It owns project structure: phases, milestones, requirements, roadmaps, STATE.md.

**Superpowers is the discipline engine.** It enforces: TDD, two-stage review, evidence-based verification, fresh subagents, YAGNI.

**Impeccable is the design gate.** It enforces: critique, polish, normalize, harden, animate.

**Composites are the unified interface.** They wire the three frameworks together so you never think about which to invoke. When Superpowers updates its TDD skill, `/fix` automatically gets better. When Impeccable updates its critique methodology, `/build`'s design gates automatically get better.

## Decision Matrix

**Use GSD commands for project structure:**

| Command | Purpose |
|---------|---------|
| `/gsd:new-project` | Initialize project with requirements, roadmap, milestones |
| `/gsd:new-milestone` | Add milestone to existing project |
| `/gsd:discuss-phase` | Gather context through conversation before planning |
| `/gsd:progress` | Check position, metrics, route to next action |
| `/gsd:debug` | Multi-session debugging with persistent state |
| `/gsd:quick` | Quick ad-hoc task with GSD guarantees |
| `/gsd:audit-milestone` | Verify milestone completion before archiving |
| `/gsd:complete-milestone` | Archive and prepare for next milestone |
| `/gsd:add-phase`, `remove-phase`, `insert-phase` | Edit roadmap structure |
| `/gsd:health` | Diagnose and repair `.planning/` directory integrity |
| `/gsd:cleanup` | Archive phase directories from completed milestones |
| `/gsd:reapply-patches` | Reapply local modifications after a GSD update |

**Use composites for doing work:**

| Command | Purpose | Replaces |
|---------|---------|----------|
| `/plan` | Brainstorm -> research -> PLAN.md -> plan-check | `/gsd:plan-phase` |
| `/build` | Execute plans with discipline + auto design gates | `/gsd:execute-phase` |
| `/new-project` | Bootstrap project with design + tracking | `/gsd:new-project` |
| `/research` | Investigate topic with GSD-compatible output | `/gsd:research-phase` |
| `/fix` | Auto-triage -> debug -> TDD fix -> verify | — |
| `/refactor` | Safe restructuring, behavior preservation | — |
| `/verify` | Standalone dual verification | `/gsd:verify-work` |
| `/resume` | Context restoration -> routing | `/gsd:resume-work` |

## Non-Negotiable Disciplines

Every composite that executes code enforces these:

1. **TDD** — no production code without a failing test first
2. **Two-stage review** — spec compliance first, code quality second
3. **Verification-before-completion** — no claims without fresh evidence
4. **Fresh subagents** — no context pollution between tasks
5. **YAGNI** — no features, abstractions, or error handling beyond what's specified

## GSD State Integration

Composites auto-detect GSD projects (`.planning/PROJECT.md` exists):

| Composite | GSD files written |
|-----------|-------------------|
| `/plan` | PLAN.md with must_haves frontmatter in `.planning/phases/` |
| `/build` | SUMMARY.md, VERIFICATION.md, STATE.md, ROADMAP.md (+ design-pass commits if frontend) |
| `/fix` | Lightweight SUMMARY.md, STATE.md, CONCERNS.md |
| `/refactor` | SUMMARY.md, STATE.md |
| `/verify` | VERIFICATION.md, STATE.md |
| `/resume` | Reads all state, routes to composites |
| `/research` | RESEARCH.md with GSD frontmatter |


## Design Principles

1. **Delegate discipline, own workflow.** Composites define WHAT happens WHEN. They invoke source skills for HOW.
2. **Lean orchestrator.** The composite coordinates. Subagents do the work. Stay under 15% context.
3. **Attribute, don't copy.** Subagent prompts include brief behavioral directives, not full skill recreations.
4. **GSD as state backend.** All state writes use GSD file formats. If GSD updates formats, composites adapt.
5. **Auto-improve through frameworks.** Composites get better when their dependencies update — no changes needed.
