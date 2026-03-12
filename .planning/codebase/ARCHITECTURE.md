# Architecture

**Analysis Date:** 2026-03-12

## Pattern Overview

**Overall:** Four-layer plugin architecture with upstream integration, skill composition, agent dispatch, and state management.

**Key Characteristics:**
- Three bundled upstream projects (Superpowers, Impeccable, GSD) unified through composite skills
- Orchestrator-delegate model: composites coordinate, subagents execute
- Lean context usage: composites stay under 15% context, offload work to fresh agents
- State backend: All project tracking flows through GSD file formats and `bin/gsd-tools.cjs`
- Plugin-only shipping boundary: `.claude/skills/` shipped to user installs; `references/`, `templates/`, `skills/` available as co-located guidance during execution

## Layers

**Composite Commands (User Facing):**
- Purpose: Multi-step workflow orchestrators that define WHAT happens WHEN
- Location: `.claude/skills/{name}/SKILL.md` (e.g., `build/`, `plan-work/`, `fix/`, `refactor/`)
- Contains: Markdown-based step choreography, subagent dispatch directives, state update calls
- Depends on: Internal skills, agent types, reference templates, GSD CLI
- Used by: End users via `/fh:{command}` or `/plan-work`, etc.

**Design Commands (User Facing & Auto-invoked):**
- Purpose: Specialized quality gates for visual/UX aspects (critique, polish, normalize, harden, etc.)
- Location: `.claude/skills/{name}/SKILL.md` (23 design commands under `.claude/skills/`)
- Contains: Diagnostic checks, refactor guidance, design system application
- Depends on: `skills/frontend-design/` reference, `references/` templates
- Used by: User directly or auto-invoked as quality gates during `/build`

**Internal Skills (Invoked by Composites):**
- Purpose: Reusable skill definitions for HOW to do specific tasks (TDD, debugging, code review, etc.)
- Location: `skills/{name}/SKILL.md` (17 skills: brainstorming, test-driven-development, systematic-debugging, dispatching-parallel-agents, verification-before-completion, etc.)
- Contains: Detailed methodologies, step-by-step procedures, examples
- Depends on: References, templates, upstream project guidance
- Used by: Composite commands in their step definitions

**Agent Types (Subagent Dispatch):**
- Purpose: Persona definitions for fresh subagents dispatched via Task tool
- Location: `agents/{name}.md` (15 agents: code-reviewer, gsd-planner, gsd-executor, gsd-verifier, gsd-debugger, etc.)
- Contains: System prompt, behavioral directives, context requirements
- Depends on: Upstream definitions, adapted patterns
- Used by: Composites and orchestrators spawning parallel workers

**References (Shared Templates & Prompts):**
- Purpose: Reusable prompt templates, state management helpers, file scaffolds
- Location: `references/` directory
- Contains: `implementer-prompt.md` (task template for subagents), `spec-gate-prompt.md` (quality review template), `summary-template.md` (SUMMARY.md scaffold), `gsd-state-updates.md` (state modification helpers), `gsd-templates/` (GSD file scaffolds)
- Depends on: GSD schema, skill guidance
- Used by: Composites filling in subagent prompts, GSD state writes

**GSD CLI (State Backend):**
- Purpose: Programmatic state and template management for project tracking
- Location: `bin/gsd-tools.cjs` (main entry point), `bin/lib/` (modules)
- Contains: Project state reads/writes, roadmap management, phase scaffolding, config management
- Depends on: Node.js, filesystem, Git
- Used by: Composites calling `gsd-tools.cjs config-get`, `gsd-tools.cjs state-update`, etc.

## Data Flow

**New Project Setup (`/fh:new-project`):**

1. User invokes `/fh:new-project` (command in `commands/new-project.md`)
2. Command scaffolds `.planning/` structure using `gsd-tools.cjs`
3. Creates `PROJECT.md` (vision, tech stack), `ROADMAP.md` (phases), `STATE.md` (current phase)
4. User creates initial `DESIGN.md` and `CLAUDE.md`

**Feature Planning (`/plan-work`):**

1. User specifies feature
2. Composite checks GSD state (`.planning/PROJECT.md`, `ROADMAP.md`)
3. Phase matching: maps feature to existing/new phase
4. Optional research delegation: spawns `gsd-phase-researcher` agent if needed
5. Brainstorming: invokes `skills/brainstorming/` for collaborative design
6. Plan generation: produces `.planning/plans/PLAN.md` with tasks, waves, and requirements
7. Writes PLAN frontmatter with metadata (phase, wave dependencies)

**Execution (`/build`):**

1. Composite finds plan in `.planning/phases/{phase}/PLAN.md` or `.planning/plans/PLAN.md`
2. Analyzes task waves (grouped by dependency order)
3. Per wave, dispatches parallel `general-purpose` subagents:
   - Each subagent gets `references/implementer-prompt.md` template (filled with task context)
   - Reads `CLAUDE.md` sections relevant to task type
   - Executes task with TDD if flagged, frontend patterns if UI work, etc.
4. Per-wave quality gates:
   - `code-reviewer` agent runs `references/spec-gate-prompt.md` for spec verification
   - Design commands auto-invoked if applicable (critique → polish → normalize)
5. Cross-phase integration check: `gsd-integration-checker` verifies upstream/downstream phase wiring
6. Final simplify pass: `skills/simplify/` agent reviews for code reuse
7. Writes `SUMMARY.md` from `references/summary-template.md`
8. Commits changes with auto-generated message

**State Management (`gsd-tools.cjs`):**

```bash
# Configuration queries
gsd-tools.cjs config-get workflow.auto_advance
gsd-tools.cjs config-get user.email

# State reads
gsd-tools.cjs state-read .planning/STATE.md

# State writes (composites use this)
gsd-tools.cjs state-update .planning/STATE.md phase "Phase 2"
gsd-tools.cjs state-update .planning/STATE.md completed_plans [....]

# Verification
gsd-tools.cjs verify-project .planning/PROJECT.md
```

## Key Abstractions

**Composite Command:**
- Purpose: Coordinates a multi-step workflow by delegating to skills and agents
- Examples: `build/SKILL.md`, `plan-work/SKILL.md`, `fix/SKILL.md`, `refactor/SKILL.md`
- Pattern: Read plan/context → analyze structure → dispatch workers → aggregate results → write state

**Subagent Dispatch Pattern:**
- Purpose: Spawn fresh Claude instances with scoped context for parallel work
- Examples: Task agent with `implementer-prompt.md`, review agent with `spec-gate-prompt.md`
- Pattern: Fill template placeholders → Task tool with subagent_type → poll for results

**Task Wave:**
- Purpose: Group executable work by dependency order
- Pattern: Tasks with no deps = Wave 1 (parallel), tasks depending on Wave 1 = Wave 2 (serial-then-parallel), etc.
- Used by: `/build` to orchestrate parallel execution

**Design Quality Gate:**
- Purpose: Verify visual/UX standards before merge
- Examples: `/critique`, `/polish`, `/normalize`, `/harden`
- Pattern: Diagnostic scan → generate report → user decides → fix or defer

**GSD State Format:**
- Purpose: Track project structure and execution progress
- Pattern: `.planning/{PROJECT,STATE,ROADMAP,phases/}.md` with YAML frontmatter + markdown content
- Keys: phase name, completed plans, current roadmap, phase-specific context

## Entry Points

**User Commands:**
- Location: `.claude/skills/{name}/SKILL.md`
- Invoked as: `/fh:{name}` (e.g., `/fh:build`, `/fh:plan-work`)
- Examples: `build/SKILL.md` (execute plan), `plan-work/SKILL.md` (brainstorm → plan), `fix/SKILL.md` (triage → debug → TDD)

**System Commands:**
- Location: `commands/{name}.md`
- Invoked as: `/fh:{name}`
- Examples: `setup.md` (tooling install), `new-project.md` (GSD init), `health.md` (.planning/ validation)

**GSD CLI Entry Points:**
- Location: `bin/gsd-tools.cjs`
- Invoked as: `node bin/gsd-tools.cjs {command} {args}`
- Used by: Composites for state management and template scaffolding

## Error Handling

**Strategy:** Composites explicitly check for blocking conditions (missing `.planning/PROJECT.md`, missing plan file) before proceeding. Subagents return BLOCKED status if they encounter an issue that cannot be resolved with reasonable assumptions.

**Patterns:**
- Dependency check: Every orchestrator verifies `.planning/PROJECT.md` exists at start
- Blocker escalation: Subagent returns `Status: BLOCKED` with root cause instead of guessing
- Fallback guidance: Composites offer next-step suggestions when critical files are missing (e.g., "Run `/fh:new-project` first")
- Auto-recovery: Some state writes are idempotent (updating existing phase, appending to completed plans list)

## Cross-Cutting Concerns

**Logging:** Internal skills use structured comments and step markers (e.g., "## Step 1: Find the Plan"). Composites report progress at wave/phase boundaries. Subagents document assumptions in reports.

**Validation:** Pre-flight checks on project structure (PROJECT.md presence), plan syntax (YAML frontmatter, task format), GSD state consistency (ROADMAP.md phase references). `gsd-tools.cjs verify-*` commands provide checkpoints.

**Authentication:** System commands like `/fh:setup` detect platform (macOS, Linux, Windows) and guide user through GitHub CLI auth, TypeScript LSP install, Node version management.

**Upstream Traceability:** `upstream/` directory contains verbatim snapshots of Superpowers 4.3.1, Impeccable 1.2.0, GSD 1.22.4 for diff baselines. `PATCHES.md` documents all deviations. `COMPATIBILITY.md` tracks versions and attribution.

---

*Architecture analysis: 2026-03-12*
