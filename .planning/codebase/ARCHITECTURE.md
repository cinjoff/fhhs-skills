# Architecture

**Analysis Date:** 2026-03-27

## Pattern Overview

**Overall:** Layered Plugin Architecture — Markdown skill files orchestrate subagent dispatch and CLI tooling. No traditional application runtime; the "application" is a Claude Code plugin whose entry points are skill/command markdown files interpreted by Claude Code.

**Key Characteristics:**
- Three-layer upstream composition: Superpowers (engineering discipline) + Impeccable (design quality) + GSD (project tracking) merged into a single plugin
- Lean orchestrator pattern: user-facing skills coordinate by dispatching subagents via Claude Code's Task tool, staying under 15% context usage
- State management through markdown files in `.planning/` and a bundled Node.js CLI (`bin/gsd-tools.cjs`)
- Shipping boundary is `.claude/skills/` only — everything outside that directory is dev-time or reference material

## Layers

**Composite Commands (User-Facing Skills):**
- Purpose: Top-level entry points users invoke directly via `/fh:{name}`
- Location: `.claude/skills/*/SKILL.md`
- Contains: Multi-step workflow orchestration in markdown with embedded bash/shell snippets
- Depends on: Internal skills, agents, references, GSD CLI
- Used by: End users via Claude Code slash commands
- Key files: `.claude/skills/build/SKILL.md`, `.claude/skills/plan-work/SKILL.md`, `.claude/skills/fix/SKILL.md`, `.claude/skills/auto/SKILL.md`, `.claude/skills/review/SKILL.md`

**Internal Skills (Discipline Enforcement):**
- Purpose: Reusable engineering/design patterns invoked by composites, not directly by users
- Location: `skills/*/SKILL.md`
- Contains: Detailed behavioral instructions for specific disciplines (TDD, debugging, code review, etc.)
- Depends on: Nothing (leaf nodes in dependency graph)
- Used by: Composite commands via skill references in their markdown
- Key files: `skills/test-driven-development/SKILL.md`, `skills/systematic-debugging/SKILL.md`, `skills/verification-before-completion/SKILL.md`, `skills/simplify/SKILL.md`, `skills/frontend-design/SKILL.md`

**Agents (Subagent Personas):**
- Purpose: Define persona/role for Claude Code Task tool dispatch — each agent type has specific constraints, tools, and behavioral instructions
- Location: `agents/*.md`
- Contains: YAML frontmatter (name, description, tools, color) + role instructions
- Depends on: Internal skills (referenced for behavioral guidance)
- Used by: Composite commands that dispatch subagents
- Key files: `agents/gsd-executor.md`, `agents/gsd-planner.md`, `agents/code-reviewer.md`, `agents/gsd-codebase-mapper.md`

**References (Shared Templates & Prompts):**
- Purpose: Reusable prompt templates, state update instructions, GSD documentation
- Location: `.claude/skills/build/references/` (shipped), `references/` (dev-only)
- Contains: Prompt templates with `{PLACEHOLDER}` variables, GSD reference docs, file templates
- Depends on: Nothing
- Used by: Composite commands fill placeholders and inject into subagent prompts
- Key files: `.claude/skills/build/references/implementer-prompt.md`, `.claude/skills/build/references/spec-gate-prompt.md`, `.claude/skills/build/references/summary-template.md`

**GSD CLI (State Backend):**
- Purpose: Centralized state management, config parsing, model resolution, phase operations, validation
- Location: `bin/gsd-tools.cjs` + `bin/lib/*.cjs`
- Contains: Node.js CLI with ~15 command groups (state, phase, roadmap, milestone, validate, progress, etc.)
- Depends on: `.planning/` directory structure (STATE.md, ROADMAP.md, config.json)
- Used by: All composite commands via `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" <command>`
- Key files: `bin/gsd-tools.cjs`, `bin/lib/state.cjs`, `bin/lib/phase.cjs`, `bin/lib/commands.cjs`, `bin/lib/config.cjs`

**Hooks (Session Lifecycle):**
- Purpose: Claude Code hook scripts for context monitoring, update checks, learnings capture, statusline
- Location: `hooks/*.js`
- Contains: Node.js scripts triggered by Claude Code's hook system (PostToolUse, etc.)
- Key files: `hooks/fhhs-context-monitor.js`, `hooks/fhhs-statusline.js`, `hooks/fhhs-check-update.js`, `hooks/fhhs-learnings.js`

## Data Flow

**Plan-Build-Review Pipeline (primary workflow):**

1. `/fh:new-project` → creates `.planning/` structure (PROJECT.md, ROADMAP.md, STATE.md, REQUIREMENTS.md, config.json)
2. `/fh:plan-work` → reads STATE.md for current phase → dispatches research subagents → produces PLAN.md with waves and tasks
3. `/fh:plan-review` → reads PLAN.md → challenges business alignment + engineering rigor → user iterates
4. `/fh:build` → reads PLAN.md → groups tasks into waves → dispatches `general-purpose` subagents per task using `implementer-prompt.md` template → runs spec gates after each wave → runs simplify + verification passes → writes SUMMARY.md → updates STATE.md via `gsd-tools.cjs`
5. `/fh:review` → reads git diff → dispatches `code-reviewer` subagent → produces findings report

**Autonomous Pipeline (`/fh:auto`):**

1. Validates prerequisites (PROJECT.md, ROADMAP.md, STATE.md)
2. Runs Strategic Requirements Workshop (domain research, user engagement)
3. Loops through phases: plan-work → plan-review → build → review → advance state
4. Each phase is a full plan-build-review cycle without human intervention

**State Management:**
- All state persists in `.planning/` as markdown files with YAML frontmatter
- `gsd-tools.cjs` is the single writer for state mutations (field updates, phase transitions, progress tracking)
- Skills read state via bash: `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state load`
- Config lives in `.planning/config.json` (model profiles, workflow preferences)

**Subagent Dispatch Pattern:**
- Orchestrator reads `implementer-prompt.md` template
- Fills placeholders: `{TASK_TEXT}`, `{CLAUDE_MD_SECTIONS}`, `{DESIGN_DECISIONS}`, `{HARD_CONSTRAINTS}`
- Resolves model via `gsd-tools.cjs resolve-model gsd-executor --raw`
- Dispatches via Claude Code Task tool with filled prompt
- Subagent writes code but does NOT commit — orchestrator commits after all waves

## Key Abstractions

**Skill (SKILL.md):**
- Purpose: A self-contained workflow definition in markdown that Claude Code interprets as a slash command
- Examples: `.claude/skills/build/SKILL.md`, `.claude/skills/fix/SKILL.md`, `.claude/skills/plan-work/SKILL.md`
- Pattern: YAML frontmatter (name, description, user-invocable, allowed-tools) + sequential numbered steps with embedded bash snippets and behavioral instructions

**Agent (agents/*.md):**
- Purpose: A subagent persona definition dispatched via Claude Code's Task tool
- Examples: `agents/gsd-executor.md`, `agents/code-reviewer.md`, `agents/gsd-planner.md`
- Pattern: YAML frontmatter (name, description, tools, color) + `<role>` block with behavioral instructions

**Phase (.planning/phases/{N}-{slug}/):**
- Purpose: A unit of work in a project roadmap, containing plans, context, and summaries
- Examples: `.planning/phases/02-upstream-sync/`, `.planning/phases/05-context-mode/`
- Pattern: Directory with PLAN.md, CONTEXT.md (decisions/discretion/deferred), SUMMARY.md (completion evidence)

**Reference Template:**
- Purpose: A prompt template with `{PLACEHOLDER}` variables for subagent injection
- Examples: `.claude/skills/build/references/implementer-prompt.md`, `.claude/skills/build/references/spec-gate-prompt.md`
- Pattern: Markdown with `{VARIABLE_NAME}` placeholders filled at dispatch time

## Entry Points

**User-Invocable Skills (`.claude/skills/*/SKILL.md`):**
- Location: `.claude/skills/{name}/SKILL.md`
- Triggers: User types `/fh:{name}` in Claude Code
- Responsibilities: Full workflow orchestration, subagent dispatch, state management
- 44 skills total: build, plan-work, plan-review, fix, refactor, review, auto, progress, setup, new-project, map-codebase, tracker, health, help, settings, update, research, onboard, learnings, secure, todos, plus 20+ design skills (polish, normalize, harden, animate, adapt, etc.)

**Maintainer Commands (`.claude/commands/*.md`):**
- Location: `.claude/commands/{name}.md`
- Triggers: Repo maintainer types `/{name}` in this repo only (not shipped to plugin installs)
- Responsibilities: Release management, upstream sync, phase operations
- Key files: `.claude/commands/release.md`, `.claude/commands/sync-upstream.md`, `.claude/commands/add-phase.md`

**GSD CLI (`bin/gsd-tools.cjs`):**
- Location: `bin/gsd-tools.cjs`
- Triggers: Called by skills via `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" <command>`
- Responsibilities: State CRUD, phase lifecycle, model resolution, validation, progress rendering
- Symlinked to `$HOME/.claude/get-shit-done/bin/` during `/fh:setup`

**Hooks (`hooks/*.js`):**
- Location: `hooks/*.js`
- Triggers: Claude Code PostToolUse lifecycle events
- Responsibilities: Context window monitoring, version update checks, learnings capture, statusline rendering

## Error Handling

**Strategy:** Graceful degradation with advisory warnings. Skills never hard-block on optional features.

**Patterns:**
- Codebase freshness: check `.planning/codebase/.last-mapped` SHA against HEAD — warn if stale, never block
- Missing optional tools: `if ctx_batch_execute is available... otherwise skip silently`
- Missing planning state: hard-stop with actionable message ("Run `/fh:new-project` first")
- Context window pressure: `hooks/fhhs-context-monitor.js` injects warnings at 35% remaining (WARNING) and 25% remaining (CRITICAL)
- Task tracking unavailable: "If TaskCreate fails, set TASKS_AVAILABLE=false and proceed normally"
- GSD CLI errors: commands exit with non-zero codes; skills check `$?` and report

## Cross-Cutting Concerns

**Logging:** No structured logging framework. Skills output progress via formatted markdown banners using patterns from `references/gsd/ui-brand.md`. Context monitor writes metrics to tmpdir JSON files.

**Validation:** `gsd-tools.cjs validate health [--repair]` checks `.planning/` integrity. `gsd-tools.cjs validate consistency` checks phase numbering and disk/roadmap sync. `/fh:health` wraps these for user access.

**Authentication:** No auth layer. Plugin operates in the user's local Claude Code session with their filesystem permissions.

**Configuration:** `.planning/config.json` stores per-project workflow config (model profiles, auto-advance, commit preferences). `gsd-tools.cjs config-get` and `config-ensure-section` manage reads/writes.

**Context Management:** `context-mode` MCP plugin integration for indexing/searching large codebases. Skills test for availability and fall back to direct file reads. `hooks/fhhs-context-monitor.js` tracks context window usage.

---

*Architecture analysis: 2026-03-27*
