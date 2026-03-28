# Codebase Structure

**Analysis Date:** 2026-03-27

## Directory Layout

```
fhhs-skills/
├── .claude/                    # Claude Code plugin integration
│   ├── commands/               # Maintainer-only slash commands (NOT shipped)
│   ├── hooks/                  # Claude Code hook config (settings.json)
│   └── skills/                 # ★ SHIPPING BOUNDARY — user-facing skills
│       ├── build/              # Plan execution orchestrator
│       │   └── references/     # Co-located templates (implementer-prompt, spec-gate, etc.)
│       ├── plan-work/          # Planning workflow
│       ├── plan-review/        # Plan stress-testing
│       ├── fix/                # Bug triage + TDD fix
│       ├── refactor/           # Scoped refactoring
│       ├── review/             # Code review
│       │   └── references/     # Co-located review templates
│       ├── auto/               # Autonomous multi-phase execution
│       ├── map-codebase/       # Parallel codebase analysis
│       ├── new-project/        # Project bootstrapping
│       ├── progress/           # Status + session resume
│       ├── setup/              # One-time plugin orientation
│       ├── settings/           # Workflow config UI
│       ├── update/             # Self-update
│       ├── tracker/            # Visual project dashboard
│       ├── health/             # .planning/ integrity check
│       ├── help/               # Command reference
│       ├── research/           # Web search → GSD output
│       ├── learnings/          # claude-mem analysis → GitHub issues
│       │   └── references/     # Co-located learnings templates
│       ├── secure/             # Security audit
│       │   └── references/     # Co-located security checklists
│       ├── todos/              # Task management
│       ├── onboard/            # First-time UX
│       ├── optimize/           # Performance optimization
│       ├── revise-claude-md/   # CLAUDE.md maintenance
│       ├── observability/      # Monitoring setup
│       ├── nextjs-perf/        # Next.js specific perf
│       ├── playwright-testing/ # Playwright test patterns
│       │   └── references/     # Co-located Playwright refs
│       ├── ui-test/            # Visual testing
│       │   └── references/     # Co-located UI test refs
│       ├── ui-critique/        # Design evaluation
│       ├── ui-redesign/        # Full redesign workflow
│       ├── ui-animate/         # Motion design
│       ├── ui-branding/        # DESIGN.md setup
│       ├── polish/             # Alignment/spacing
│       ├── normalize/          # Design system consistency
│       ├── harden/             # Error/i18n/edge cases
│       ├── simplify/           # Code complexity reduction
│       ├── distill/            # Remove complexity
│       ├── adapt/              # Responsive design
│       ├── bolder/             # Amplify visual impact
│       ├── quieter/            # Reduce visual intensity
│       ├── extract/            # Design system extraction
│       ├── colorize/           # Strategic color
│       ├── audit/              # Accessibility/perf audit
│       ├── clarify/            # UX copy improvement
│       └── delight/            # Personality/joy
│
├── skills/                     # Internal skills (invoked by composites, NOT shipped)
│   ├── brainstorming/
│   ├── test-driven-development/
│   ├── systematic-debugging/
│   ├── dispatching-parallel-agents/
│   ├── verification-before-completion/
│   ├── requesting-code-review/
│   ├── receiving-code-review/
│   ├── finishing-a-development-branch/
│   ├── using-superpowers/
│   ├── using-git-worktrees/
│   ├── writing-plans/
│   ├── writing-skills/
│   ├── subagent-driven-development/
│   ├── executing-plans/
│   ├── simplify/
│   ├── frontend-design/
│   └── claude-md-improver/
│
├── agents/                     # Subagent persona definitions (for Task tool)
│   ├── code-reviewer.md
│   ├── code-explorer.md
│   ├── code-architect.md
│   ├── gsd-executor.md
│   ├── gsd-planner.md
│   ├── gsd-verifier.md
│   ├── gsd-debugger.md
│   ├── gsd-plan-checker.md
│   ├── gsd-codebase-mapper.md
│   ├── gsd-phase-researcher.md
│   ├── gsd-project-researcher.md
│   ├── gsd-research-synthesizer.md
│   ├── gsd-roadmapper.md
│   ├── gsd-nyquist-auditor.md
│   └── gsd-integration-checker.md
│
├── references/                 # Shared templates/prompts (NOT shipped — dev-only)
│   ├── dependency-check.md
│   ├── gsd-state-updates.md
│   ├── gsd/                    # GSD reference docs (checkpoints, git, profiles, etc.)
│   └── gsd-templates/          # GSD file templates (project.md, roadmap.md, state.md, etc.)
│
├── bin/                        # Bundled GSD CLI tooling
│   ├── gsd-tools.cjs           # Main CLI entry point (~60+ commands)
│   ├── fhhs-banner.js          # ASCII art banner utility
│   ├── VERSION                 # GSD version tracker (1.22.4)
│   └── lib/                    # CLI modules
│       ├── commands.cjs        # Command definitions and CONTEXT.md contract
│       ├── state.cjs           # STATE.md parser/writer
│       ├── phase.cjs           # Phase lifecycle operations
│       ├── roadmap.cjs         # ROADMAP.md parser/operations
│       ├── config.cjs          # config.json management
│       ├── milestone.cjs       # Milestone archive operations
│       ├── changelog.cjs       # CHANGELOG.md generation
│       ├── core.cjs            # Shared utilities
│       ├── frontmatter.cjs     # YAML frontmatter parser
│       ├── init.cjs            # Init context loader
│       ├── template.cjs        # Template scaffolding
│       └── verify.cjs          # Verification helpers
│
├── hooks/                      # Claude Code hook scripts
│   ├── fhhs-context-monitor.js # PostToolUse: context window warnings at 35%/25%
│   ├── fhhs-statusline.js      # Statusline: phase/progress display
│   ├── fhhs-check-update.js    # Session start: version update check
│   └── fhhs-learnings.js       # Session end: learnings capture
│
├── upstream/                   # Verbatim upstream snapshots (NEVER edit)
│   ├── superpowers-4.3.1/
│   ├── impeccable-1.2.0/
│   ├── gsd-1.22.4/
│   ├── feature-dev-55b58ec6/
│   ├── claude-md-management-1.0.0/
│   ├── gstack-0.3.3/
│   ├── playwright-best-practices-b4b0fd3c/
│   └── vercel-react-best-practices-64bee5b7/
│
├── templates/                  # Runtime templates (NOT shipped — copied by skills)
│   └── project-tracker/        # Visual tracker HTML/JS (copied by /fh:tracker)
│
├── evals/                      # Eval suite (210+ evals)
│   ├── evals.json              # Eval definitions
│   └── fixtures/               # Mock project fixtures for evals
│
├── fhhs-skills-workspace/      # Eval workspace and test harness
│   ├── run_all_evals.py
│   ├── llm_grader.py
│   ├── verify_command_map.py
│   ├── mock-project/
│   └── evals/
│
├── .claude-plugin/             # Plugin metadata
│   ├── plugin.json             # Name ("fh"), version, skills path
│   └── marketplace.json        # Marketplace listing
│
├── .planning/                  # This plugin's own project tracking
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── STATE.md
│   ├── REQUIREMENTS.md
│   ├── config.json
│   ├── codebase/               # Codebase analysis docs (this file lives here)
│   ├── phases/                 # Phase plan/summary directories
│   ├── research/               # Research artifacts
│   ├── retros/                 # Retrospectives
│   └── designs/                # Design docs
│
├── .context/                   # Session context (notes, todos, attachments)
│   ├── notes.md
│   ├── todos.md
│   └── attachments/
│
├── .research/                  # Research artifacts
│   └── session-profiling/
│
├── CLAUDE.md                   # Project instructions for Claude Code
├── SPEC.md                     # Architecture specification
├── README.md                   # User-facing documentation
├── CHANGELOG.md                # Version history (Keep a Changelog format)
├── PATCHES.md                  # All upstream modifications with rationale
├── COMPATIBILITY.md            # Upstream attribution and version tracking
└── .gitignore
```

## Directory Purposes

**.claude/skills/:**
- Purpose: The plugin shipping boundary — everything here is delivered to plugin installs
- Contains: User-facing skill SKILL.md files, each defining a `/fh:{name}` command
- Key constraint: All runtime-read files MUST be co-located here. Skills cannot reference `references/`, `templates/`, or repo-root dirs at install time.
- Key files: `build/SKILL.md`, `plan-work/SKILL.md`, `fix/SKILL.md`, `auto/SKILL.md`

**.claude/commands/:**
- Purpose: Maintainer-only commands available only in this repo (not shipped)
- Contains: Release management, upstream sync, phase operations, debugging tools
- Key files: `release.md`, `sync-upstream.md`, `add-phase.md`, `update-gsd.md`

**skills/:**
- Purpose: Internal skills referenced by composites — behavioral patterns, not workflows
- Contains: Engineering discipline definitions (TDD, debugging, verification, code review)
- Key files: `test-driven-development/SKILL.md`, `systematic-debugging/SKILL.md`, `verification-before-completion/SKILL.md`

**agents/:**
- Purpose: Subagent persona definitions for Claude Code Task tool dispatch
- Contains: One .md file per agent type with YAML frontmatter + role instructions
- Key files: `gsd-executor.md`, `gsd-planner.md`, `code-reviewer.md`, `gsd-codebase-mapper.md`

**references/:**
- Purpose: Dev-time shared templates and GSD documentation (NOT shipped)
- Contains: Prompt templates, state update instructions, GSD reference docs, file templates
- Key constraint: At runtime (installed plugin), these are NOT accessible. Skills that need templates must co-locate them in `.claude/skills/{skill}/references/`

**bin/:**
- Purpose: Bundled GSD CLI for state management and workflow operations
- Contains: Node.js CLI entry point + modular library files
- Key files: `gsd-tools.cjs` (main), `lib/state.cjs`, `lib/phase.cjs`, `lib/commands.cjs`

**hooks/:**
- Purpose: Claude Code lifecycle hooks for session monitoring
- Contains: Node.js scripts for PostToolUse, session start/end events
- Key files: `fhhs-context-monitor.js` (context window warnings), `fhhs-statusline.js` (progress display)

**upstream/:**
- Purpose: Verbatim snapshots of forked upstream projects — diff baselines only
- Contains: Unmodified copies at specific versions
- Key constraint: NEVER edit these files. Used by `/fh:sync-upstream` for diff comparison.

**templates/:**
- Purpose: Runtime templates copied to user projects by skills (NOT shipped directly)
- Contains: Project tracker HTML/JS app
- Key files: `project-tracker/server.cjs`, `project-tracker/index.html`

**evals/:**
- Purpose: Skill evaluation definitions and mock fixtures
- Contains: `evals.json` with 210+ eval definitions, fixture directories
- Key files: `evals.json`, `fixtures/nextjs-app-deep/`

## Key File Locations

**Entry Points:**
- `.claude-plugin/plugin.json`: Plugin metadata — name `"fh"`, version, skills path `./.claude/skills/`
- `.claude/skills/*/SKILL.md`: Each file is a user-invocable slash command
- `bin/gsd-tools.cjs`: CLI entry point for all state management operations

**Configuration:**
- `.claude-plugin/plugin.json`: Plugin identity and version
- `.claude-plugin/marketplace.json`: Marketplace listing (must stay version-synced with plugin.json)
- `.planning/config.json`: Per-project workflow config (model profiles, auto-advance)
- `CLAUDE.md`: Project instructions for Claude Code sessions

**Core Logic:**
- `.claude/skills/build/SKILL.md`: Plan execution orchestrator (dispatches subagents per wave)
- `.claude/skills/plan-work/SKILL.md`: Planning workflow (research → brainstorm → plan)
- `.claude/skills/auto/SKILL.md`: Autonomous pipeline (loops plan → review → build → review)
- `bin/gsd-tools.cjs`: State management CLI (60+ commands)
- `bin/lib/commands.cjs`: CONTEXT.md contract and command definitions

**State Files (per user project):**
- `.planning/PROJECT.md`: Project vision and scope
- `.planning/ROADMAP.md`: Phased plan with progress tracking
- `.planning/STATE.md`: Current position (active phase, plan status)
- `.planning/REQUIREMENTS.md`: Work items and success criteria
- `.planning/config.json`: Workflow preferences
- `.planning/phases/{N}-{slug}/PLAN.md`: Phase plan
- `.planning/phases/{N}-{slug}/CONTEXT.md`: Locked decisions, discretion areas, deferred ideas
- `.planning/phases/{N}-{slug}/SUMMARY.md`: Phase completion evidence

**Testing:**
- `evals/evals.json`: All eval definitions
- `fhhs-skills-workspace/run_all_evals.py`: Eval runner
- `fhhs-skills-workspace/llm_grader.py`: LLM-based eval grading

## Naming Conventions

**Files:**
- Skills: `SKILL.md` (always uppercase, always inside a named directory)
- Agents: `{role-name}.md` in kebab-case (e.g., `gsd-executor.md`, `code-reviewer.md`)
- CLI modules: `{module}.cjs` (CommonJS, e.g., `state.cjs`, `phase.cjs`)
- Hooks: `fhhs-{purpose}.js` (prefixed with plugin name, e.g., `fhhs-context-monitor.js`)
- Planning files: UPPERCASE.md (e.g., `PROJECT.md`, `ROADMAP.md`, `PLAN.md`, `SUMMARY.md`)
- Config: lowercase (e.g., `config.json`, `plugin.json`)

**Directories:**
- Skills (shipped): lowercase kebab-case matching the command name (e.g., `plan-work/`, `map-codebase/`)
- Skills (internal): lowercase with hyphens, descriptive (e.g., `test-driven-development/`, `systematic-debugging/`)
- Phases: `{N}-{slug}/` with zero-padded number and kebab-case slug (e.g., `02-upstream-sync/`, `05-context-mode/`)
- Upstream snapshots: `{name}-{version}/` (e.g., `superpowers-4.3.1/`, `gsd-1.22.4/`)

## Where to Add New Code

**New User-Facing Skill:**
- Skill definition: `.claude/skills/{name}/SKILL.md`
- Co-located references (if needed): `.claude/skills/{name}/references/`
- YAML frontmatter must include: `name: fh:{name}`, `description:`, `user-invocable: true`
- Spelling: use `user-invocable` (with c), NOT `user-invokable`
- Add at least 1 eval in `evals/evals.json`
- Update `/fh:help` if it maintains a command listing

**New Internal Skill:**
- Skill definition: `skills/{name}/SKILL.md`
- NOT shipped to plugin installs — only referenced by composites
- Follow existing naming: lowercase-with-hyphens directory name

**New Agent:**
- Agent definition: `agents/{name}.md`
- YAML frontmatter: `name`, `description`, `tools`, `color`
- Follow naming: `gsd-{role}.md` for GSD agents, `code-{role}.md` for code agents

**New CLI Command:**
- Add handler in `bin/gsd-tools.cjs` (command dispatch switch)
- Module code in `bin/lib/{module}.cjs`
- Update help text in gsd-tools.cjs header comment

**New Maintainer Command:**
- File: `.claude/commands/{name}.md`
- NOT shipped — repo-local only

**New Reference Template:**
- If needed at runtime: co-locate in `.claude/skills/{skill}/references/`
- If dev-only: place in `references/`

**New Upstream Source:**
- Snapshot: `upstream/{name}-{version}/` (verbatim, never edit)
- Document in `PATCHES.md` and `COMPATIBILITY.md`
- Update upstream registry in `.claude/commands/upstream-registry.md`

## Special Directories

**.planning/:**
- Purpose: Per-project GSD state (also used for this plugin's own planning)
- Generated: Yes, by `/fh:new-project`
- Committed: Yes (project state is versioned)

**.planning/codebase/:**
- Purpose: Codebase analysis documents generated by `/fh:map-codebase`
- Generated: Yes, by mapper subagents
- Committed: Yes
- Staleness tracked via `.planning/codebase/.last-mapped` (git SHA)

**upstream/:**
- Purpose: Verbatim upstream snapshots for diff baselines
- Generated: No — manually placed during upstream sync
- Committed: Yes
- Constraint: NEVER edit files here

**templates/project-tracker/:**
- Purpose: Visual tracker app copied to user projects by `/fh:tracker`
- Generated: No — maintained by developers
- Committed: Yes (in this repo), but copied to `.project-tracker/` in user projects (gitignored there)

**fhhs-skills-workspace/:**
- Purpose: Eval workspace with mock projects and test harness
- Generated: Partially — mock projects are fixtures
- Committed: Yes

---

*Structure analysis: 2026-03-27*
