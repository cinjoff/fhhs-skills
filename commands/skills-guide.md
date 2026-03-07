---
description: "Print the composite skills reference guide. Use when the user says 'help', 'what commands are available', 'how do composites work', 'skills guide', or needs an overview of all composite commands and how they fit together."
---

Print the composite skills guide below. Output ONLY the formatted content — no commentary before or after.

---

# Composite Skills Guide

A unified workflow interface with composite commands, engineering discipline skills, and design quality commands — all built into one plugin.

## Command Reference

### Core Workflow

| Command | Purpose |
|---------|---------|
| `/setup` | Welcome and orientation. Run once after installing. |
| `/new-project` | Bootstrap project: vision → tech stack → DESIGN.md → CLAUDE.md → GSD requirements + roadmap |
| `/plan` | Research → brainstorm → discuss → must_haves → PLAN.md → plan-check → handoff |
| `/build` | Wave-based subagents → per-wave spec gates → design gates (frontend) → quality review → simplify → verify |
| `/fix` | Auto-triage (SIMPLE/MODERATE/PARALLEL/COMPLEX) → appropriate debug path → TDD fix → verify |
| `/refactor` | Scope blast radius → capture baseline → atomic steps (revert-on-red) → review → simplify → verify |
| `/verify` | Goal-backward + evidence-based dual verification. Auto-creates gap-closure plans on failure |
| `/resume` | Read state (GSD + git + incomplete work) → present briefing → route to right composite |
| `/research` | Dispatch subagent with Firecrawl + Context7. GSD-compatible, prescriptive output |
| `/verify-ui` | agent-browser screenshots at 3 breakpoints → design critique against DESIGN.md |
| `/simplify` | Code reuse, efficiency, and hygiene review on recent changes |

### Design Quality

Available for frontend work. Used automatically by `/build` design gates, or invoke directly:

| Command | Purpose |
|---------|---------|
| `/critique` | Evaluate design quality with severity ratings |
| `/polish` | Final alignment, spacing, consistency pass |
| `/normalize` | Ensure consistency with design system tokens |
| `/harden` | Error handling, i18n, edge cases |
| `/animate` | Motion and micro-interactions |
| `/teach-impeccable` | One-time design context setup producing DESIGN.md |

### CLAUDE.md Management

| Command | Purpose |
|---------|---------|
| `/revise-claude-md` | Capture session learnings into CLAUDE.md |
| `/revise-claude-md audit` | Full quality audit with scoring and targeted fixes |
| `/revise-claude-md init` | Generate initial CLAUDE.md from project context |

Uses `skills/claude-md-improver/` with GSD-aware quality criteria.

### Project Tracking

| Command | Purpose |
|---------|---------|
| `/progress` | Check position, metrics, route to next action |
| `/quick` | Quick ad-hoc task with GSD guarantees |
| `/health` | Diagnose and repair `.planning/` directory integrity |
| `/add-todo` | Capture ideas or tasks for later |
| `/check-todos` | Review and work on pending todos |
| `/map-codebase` | Analyze codebase structure with parallel agents |
| `/settings` | Configure workflow preferences |

Phase management, milestone lifecycle, and test generation are handled automatically by `/plan`, `/build`, and `/verify`.

## Typical Workflows

```
First time:   /setup → /new-project → /plan → /build → /verify
Feature:      /plan → /build → /verify → /verify-ui
Bug fix:      /fix
Refactoring:  /refactor (includes /simplify automatically)
Code cleanup: /simplify (standalone, on any recent changes)
Resuming:     /resume → (routes to next action)
CLAUDE.md:    /revise-claude-md (after sessions or /revise-claude-md audit)
```

## Architecture

**GSD is the state machine.** It owns project structure: phases, milestones, requirements, roadmaps, STATE.md. Always required — run `/new-project` first.

**Composites are the interface.** They wire engineering disciplines, design quality tools, and GSD together so you never think about which skill to invoke. Composites define WHAT happens WHEN; internal skills handle HOW. Subagents do the heavy work — composites stay under 15% context.

**Self-contained.** All engineering disciplines, design quality tools, GSD project tracking, and TypeScript LSP integration are built into this plugin.

## Non-Negotiable Disciplines

Every composite that executes code enforces these via built-in skills:

1. **TDD** — no production code without a failing test first
2. **Per-wave spec gates** — adversarial spec verification after each wave
3. **Quality review** — code quality, security, architecture review
4. **Simplify** — code reuse, efficiency, and hygiene
5. **Verification-before-completion** — no claims without fresh evidence
6. **Fresh subagents** — structured prompts with self-review and analysis paralysis guard
7. **YAGNI** — no features, abstractions, or error handling beyond what's specified

## Code Intelligence

**TypeScript LSP** (installed via `/setup`) provides precise code navigation used across composites: `workspaceSymbol` and `documentSymbol` for architecture analysis, `findReferences` for blast radius mapping, `goToDefinition` and call hierarchy for data flow tracing, `hover` for type information.
