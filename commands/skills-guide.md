---
description: "Print the composite skills reference guide. Use when the user says 'help', 'what commands are available', 'how do composites work', 'skills guide', or needs an overview of all composite commands and how they fit together."
---

Print the composite skills guide below. Output ONLY the formatted content — no commentary before or after.

---

# Composite Skills Guide

A unified workflow interface with composite commands, engineering discipline skills, and design quality commands — all built into one plugin.

## Composite Commands

### `/setup` — Welcome and orientation
Overview of what fhhs-skills provides. Run once after installing.

### `/new-project` — Bootstrap a tracked project
Vision questioning -> tech stack defaults (Next.js/TS/Tailwind/Shadcn/Vercel, optional Supabase) -> `/teach-impeccable` for DESIGN.md -> CLAUDE.md generation -> GSD requirements + roadmap. All `.planning/` files, no scaffolding.

### `/plan` — Design before building
Requires GSD project. Research-first detection -> brainstorm (`skills/brainstorming/`) -> discuss implementation (lock decisions in CONTEXT.md) -> derive must_haves -> PLAN.md -> plan-check -> execution handoff.

### `/build` — Execute a plan
Find plan -> wave-based parallel subagents (structured implementer prompt with TDD, YAGNI, self-review, analysis paralysis guard) -> per-wave spec gate (`code-reviewer` agent, adversarial) -> design gates if frontend (`/critique` -> `/polish` -> `/normalize`) + background integration check (`gsd-integration-checker`) -> SUMMARY.md -> phase completion detection -> dual verification (`gsd-verifier`) -> quality review (`code-reviewer` agent) -> finish.

### `/fix` — Auto-triage bug fix
Triage depth (SIMPLE/MODERATE/PARALLEL/COMPLEX) -> appropriate debug path (COMPLEX seeds `.planning/debug/` for `/gsd:debug`) -> TDD fix -> design check (frontend anti-patterns) -> spec review -> verify.

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

## Design Quality Commands

These are available for frontend work. Used automatically by `/build` design gates, or invoke directly:

| Command | Purpose |
|---------|---------|
| `/critique` | Evaluate design quality with severity ratings |
| `/polish` | Final alignment, spacing, consistency pass |
| `/normalize` | Ensure consistency with design system tokens |
| `/harden` | Error handling, i18n, edge cases |
| `/animate` | Motion and micro-interactions |
| `/teach-impeccable` | One-time design context setup producing DESIGN.md |

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

## How It Works

**GSD is the state machine.** It owns project structure: phases, milestones, requirements, roadmaps, STATE.md. Always required.

**Engineering disciplines are built in.** TDD, two-stage review, evidence-based verification, fresh subagents, YAGNI — all provided by internal skills (`skills/test-driven-development/`, `skills/verification-before-completion/`, `skills/requesting-code-review/`, etc.).

**Design quality is built in.** Critique, polish, normalize, harden, animate — all provided by internal commands. The `skills/frontend-design/` skill provides anti-pattern reference and design guidance.

**Composites are the unified interface.** They wire everything together so you never think about which skill or command to invoke. Just use the composite and it orchestrates the right ones.

## Command Reference

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
| `/verify-ui` | Visual verification with Playwright | — |
| `/critique` | Design quality evaluation | — |
| `/polish` | Alignment and consistency pass | — |
| `/normalize` | Design system token consistency | — |
| `/harden` | Error handling, i18n, edge cases | — |
| `/animate` | Motion and micro-interactions | — |
| `/teach-impeccable` | One-time design context setup | — |

**GSD structural commands** (for project management, not replaced by composites):

| Command | Purpose |
|---------|---------|
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

## Non-Negotiable Disciplines

Every composite that executes code enforces these (via built-in skills):

1. **TDD** (`skills/test-driven-development/`) — no production code without a failing test first
2. **Per-wave spec gates** (`references/spec-gate-prompt.md` + `code-reviewer` agent) — adversarial spec verification after each wave, before dependent work starts
3. **Quality review** (`skills/requesting-code-review/` + `code-reviewer` agent) — code quality, security, architecture at end of build
4. **Verification-before-completion** (`skills/verification-before-completion/`) — no claims without fresh evidence
5. **Fresh subagents** (`skills/dispatching-parallel-agents/` + `references/implementer-prompt.md`) — structured prompts with self-review, analysis paralysis guard, deferred items
6. **YAGNI** — no features, abstractions, or error handling beyond what's specified

## GSD State Integration

All composites require a GSD project (`.planning/PROJECT.md`). Run `/new-project` first.

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

1. **Delegate discipline, own workflow.** Composites define WHAT happens WHEN. They invoke internal skills for HOW.
2. **Lean orchestrator.** The composite coordinates. Subagents do the work. Stay under 15% context.
3. **Attribute, don't copy.** Subagent prompts include brief behavioral directives, not full skill recreations.
4. **GSD as state backend.** All state writes use GSD file formats. If GSD updates formats, composites adapt.
5. **Self-contained.** All engineering disciplines and design quality tools are built into this plugin — no external dependencies.
