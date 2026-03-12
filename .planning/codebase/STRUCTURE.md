# Codebase Structure

**Analysis Date:** 2026-03-12

## Directory Layout

```
sun-valley/
├── .claude-plugin/
│   ├── plugin.json                    # Plugin metadata (name: "fh", version, author, keywords)
│   └── marketplace.json               # Marketplace listing (separate from plugin.json)
│
├── .claude/
│   ├── skills/                        # User-facing skills (shipped to plugin installs)
│   │   ├── adapt/                     # Responsive design skill
│   │   ├── add-todo/                  # Task capture
│   │   ├── animate/                   # Motion design
│   │   ├── audit/                     # Accessibility/perf audit
│   │   ├── bolder/                    # Amplify visual impact
│   │   ├── build/                     # Orchestrate plan execution
│   │   ├── check-todos/               # Task review
│   │   ├── clarify/                   # UX copy improvement
│   │   ├── colorize/                  # Add strategic color
│   │   ├── critique/                  # Design evaluation
│   │   ├── delight/                   # Personality/joy
│   │   ├── distill/                   # Remove complexity
│   │   ├── extract/                   # Design system extraction
│   │   ├── fix/                       # Triage → debug → TDD fix
│   │   ├── harden/                    # Error/i18n/edge cases
│   │   ├── map-codebase/              # Parallel codebase analysis
│   │   ├── nextjs-perf/               # Next.js performance optimization
│   │   ├── normalize/                 # Design system consistency
│   │   ├── onboard/                   # First-time UX design
│   │   ├── optimize/                  # Performance optimization
│   │   ├── plan-work/                 # Brainstorm → research → plan
│   │   ├── playwright-testing/        # Playwright testing framework
│   │   ├── polish/                    # Alignment and spacing
│   │   ├── progress/                  # Status + routing
│   │   ├── quick/                     # Ad-hoc task execution
│   │   ├── quieter/                   # Reduce visual intensity
│   │   ├── refactor/                  # Scope → baseline → atomic steps
│   │   ├── research/                  # Web search → GSD output
│   │   ├── resume-work/               # Context restore → routing
│   │   ├── review/                    # Code review dispatch
│   │   ├── secure/                    # Security hardening
│   │   ├── simplify/                  # Code reuse/quality/efficiency
│   │   ├── teach-impeccable/          # Design language setup (DESIGN.md)
│   │   ├── tracker/                   # Visual project dashboard
│   │   ├── verify/                    # Goal-backward verification
│   │   └── verify-ui/                 # Visual verification with screenshots
│   │
│   ├── commands/                      # System commands (setup, project init)
│   │   ├── setup.md                   # Tooling setup (Node, GitHub CLI, TypeScript LSP)
│   │   ├── new-project.md             # GSD project initialization
│   │   ├── update.md                  # Plugin self-update
│   │   ├── settings.md                # Workflow config (model profiles, auto-advance)
│   │   ├── health.md                  # .planning/ integrity check
│   │   ├── help.md                    # Command reference
│   │   ├── revise-claude-md.md        # Session learning capture
│   │   └── (shell scripts for `/fh:` routing)
│   │
│   ├── hooks/                         # Git hooks (post-receive, etc.)
│   │   └── (enforcement and tracking helpers)
│   │
│   └── worktrees/                     # Git worktree templates (for isolated branches)
│
├── commands/                          # Legacy/admin commands (not shipped, maintainer-only)
│   ├── new-project.md
│   ├── setup.md
│   ├── settings.md
│   └── ...
│
├── agents/                            # Agent type definitions (used with Task tool)
│   ├── code-reviewer.md               # Spec verification + quality review
│   ├── code-explorer.md               # Code comprehension
│   ├── code-architect.md              # Architecture evaluation
│   ├── gsd-planner.md                 # Plan creation (1309 lines)
│   ├── gsd-executor.md                # Plan execution (489 lines)
│   ├── gsd-verifier.md                # Verification (581 lines)
│   ├── gsd-debugger.md                # Scientific debugging (1257 lines)
│   ├── gsd-plan-checker.md            # Plan quality gate
│   ├── gsd-codebase-mapper.md         # Codebase analysis (772 lines)
│   ├── gsd-phase-researcher.md        # Pre-planning research
│   ├── gsd-project-researcher.md      # Domain research
│   ├── gsd-research-synthesizer.md    # Research aggregation
│   ├── gsd-roadmapper.md              # Roadmap creation
│   ├── gsd-nyquist-auditor.md         # Test coverage analysis
│   └── gsd-integration-checker.md     # Cross-phase wiring validation
│
├── skills/                            # Internal skills (co-located reference docs, NOT shipped)
│   ├── brainstorming/SKILL.md         # Collaborative design methodology
│   ├── test-driven-development/SKILL.md # RED-GREEN-REFACTOR with examples
│   ├── systematic-debugging/SKILL.md  # Scientific debugging steps
│   ├── dispatching-parallel-agents/SKILL.md # Parallel work coordination
│   ├── verification-before-completion/SKILL.md # Evidence-based verification
│   ├── requesting-code-review/SKILL.md # Code review dispatch
│   ├── receiving-code-review/SKILL.md # Handling review feedback
│   ├── finishing-a-development-branch/SKILL.md # Merge/PR workflow
│   ├── using-superpowers/SKILL.md     # Superpowers skill discovery
│   ├── using-git-worktrees/SKILL.md   # Isolated branch workflows
│   ├── writing-plans/SKILL.md         # Plan authoring guidelines
│   ├── writing-skills/SKILL.md        # Skill definition patterns
│   ├── subagent-driven-development/SKILL.md # Subagent patterns (includes agents/workflows)
│   ├── executing-plans/SKILL.md       # Plan execution choreography
│   ├── simplify/SKILL.md              # 3-agent code cleanup
│   ├── frontend-design/SKILL.md       # Design principles + anti-patterns
│   └── claude-md-improver/SKILL.md    # CLAUDE.md audit + improvement
│
├── references/                        # Shared templates and prompts (co-located, NOT shipped)
│   ├── implementer-prompt.md          # Task subagent template (filled per task)
│   ├── spec-gate-prompt.md            # Per-wave spec review template
│   ├── summary-template.md            # SUMMARY.md scaffold
│   ├── checkpoint-protocol.md         # State checkpoint helpers
│   ├── dependency-check.md            # .planning/PROJECT.md validation
│   ├── gsd-state-updates.md           # State modification commands
│   ├── gsd/                           # GSD documentation (upstream reference)
│   └── gsd-templates/                 # GSD file scaffolds
│       ├── project.md                 # PROJECT.md template
│       ├── state.md                   # STATE.md template
│       ├── context.md                 # CONTEXT.md template
│       ├── summary.md                 # SUMMARY.md template
│       ├── debug-subagent-prompt.md   # Debug task template
│       └── (other GSD templates)
│
├── bin/                               # GSD CLI and tools (bundled with plugin)
│   ├── gsd-tools.cjs                  # Main GSD state/config entry point
│   ├── lib/                           # CLI modules
│   └── VERSION                        # GSD version (1.22.4)
│
├── upstream/                          # Upstream project snapshots (NEVER EDIT)
│   ├── superpowers-4.3.1/             # Verbatim copy for diff baseline
│   │   ├── .claude-plugin/
│   │   ├── .claude/
│   │   ├── CHANGELOG.md
│   │   └── ... (complete upstream)
│   ├── impeccable-1.2.0/              # Verbatim copy for diff baseline
│   ├── gsd-1.22.4/                    # Verbatim copy for diff baseline
│   ├── feature-dev-55b58ec6/          # Reference copy (agents adapted but not forked verbatim)
│   ├── claude-md-management-1.0.0/    # Verbatim copy for diff baseline
│   ├── playwright-best-practices-b4b0fd3c/ # Reference copy
│   └── vercel-react-best-practices-64bee5b7/ # Reference copy
│
├── evals/                             # Skill evaluation definitions and fixtures
│   ├── fixtures/                      # Mock projects for testing
│   │   ├── nextjs-app-deep/           # Full Next.js app fixture
│   │   └── ...
│   ├── run_all_evals.py               # Test runner
│   └── (eval definitions 1-130+)
│
├── fhhs-skills-workspace/             # Eval workspace and test runs
│   ├── full-run-1/                    # Eval execution results
│   └── ...
│
├── .planning/                         # Plugin's own planning artifacts (not project artifacts)
│   ├── codebase/                      # Codebase analysis (ARCHITECTURE.md, STRUCTURE.md, etc.)
│   ├── PLAN.md                        # Plugin dev plans
│   ├── STATE.md                       # Plugin dev state
│   └── ...
│
├── .context/                          # Claude context attachments
│   └── attachments/
│
├── hooks/                             # Git hooks (deprecated, moved to .claude/hooks/)
│
├── templates/                         # Project templates (not shipped, reference only)
│   ├── project-tracker/               # Example tracker UI template
│   └── ...
│
├── SPEC.md                            # Architecture specification
├── README.md                           # User documentation (install, quick start, commands)
├── CHANGELOG.md                        # Version history (v1.12.5 current)
├── COMPATIBILITY.md                    # Upstream versions and attribution
├── PATCHES.md                          # All modifications from upstream projects
└── .gitignore                          # Excludes node_modules, .env, etc.
```

## Directory Purposes

**`.claude-plugin/`:**
- Purpose: Plugin metadata for Claude Code marketplace and installation
- Contains: `plugin.json` (name: "fh", version, skills path), `marketplace.json` (separate listing)
- Key files: `plugin.json` defines shipping boundary (`./.claude/skills`)
- Note: **CRITICAL: Both must stay in sync — version drift breaks `/fh:update`**

**`.claude/skills/`:**
- Purpose: User-facing skills shipped to plugin installations
- Contains: 37 SKILL.md files (each defines command behavior)
- Pattern: `/fh:{skill-name}` maps to `.claude/skills/{skill-name}/SKILL.md`
- Design commands: 23 skills for visual/UX quality (critique, polish, normalize, harden, etc.)
- Workflow commands: 14 skills for engineering (build, plan-work, fix, refactor, verify, etc.)
- Key structure: Each skill has SKILL.md frontmatter (name, description, user-invokable flag)

**`.claude/commands/`:**
- Purpose: System setup and project management commands
- Contains: setup.md, new-project.md, health.md, update.md, settings.md, help.md, revise-claude-md.md
- Note: These are available at install time (non-skill commands)

**`.claude/hooks/`:**
- Purpose: Git hooks for state enforcement and tracking
- Contains: Hooks for post-receive, pre-commit, etc. (automation of GSD state updates)

**`agents/`:**
- Purpose: Persona definitions for Task tool subagent dispatch
- Contains: 15 agent definitions (code-reviewer, gsd-planner, gsd-executor, gsd-verifier, gsd-debugger, etc.)
- Each file: Detailed system prompt, behavioral directives, context requirements
- Usage: Composites fill these prompts and dispatch via Task tool with `subagent_type: "code-reviewer"` etc.
- Key agents:
  - `gsd-planner.md` (1309 lines): Creates execution plans from requirements
  - `gsd-debugger.md` (1257 lines): Scientific debugging methodology
  - `gsd-codebase-mapper.md` (772 lines): Architecture and structure analysis

**`skills/`:**
- Purpose: Internal skill definitions (co-located reference docs, NOT shipped to installs)
- Contains: 17 SKILL.md files for methodology guidance (TDD, debugging, brainstorming, code review, etc.)
- Usage: Composites reference these in their step definitions (e.g., "Follow `skills/test-driven-development/`")
- Key skills:
  - `test-driven-development/`: RED-GREEN-REFACTOR with code examples
  - `systematic-debugging/`: 6-step scientific debugging methodology
  - `dispatching-parallel-agents/`: How to spawn and coordinate parallel workers
  - `brainstorming/`: Collaborative design and discovery
  - `frontend-design/`: Design principles, anti-patterns, token usage

**`references/`:**
- Purpose: Reusable prompt templates and file scaffolds (co-located, NOT shipped)
- Contains: 5 core templates + `gsd-templates/` (28 GSD file scaffolds)
- Key files:
  - `implementer-prompt.md`: Task subagent template (filled with task context, CLAUDE.md sections, TDD flag, design guidance)
  - `spec-gate-prompt.md`: Per-wave spec review template (filled after each wave)
  - `summary-template.md`: SUMMARY.md output format (results, issues, next steps)
  - `gsd-state-updates.md`: Command reference for state modifications (phase updates, completed plans, etc.)
  - `gsd-templates/`: Scaffolds for PROJECT.md, STATE.md, CONTEXT.md, PLAN.md, SUMMARY.md, DEBUG.md, UAT.md, etc.

**`bin/`:**
- Purpose: GSD CLI for state and config management (bundled with plugin)
- Contains: `gsd-tools.cjs` (main entry point), `lib/` (modules), `VERSION` (1.22.4)
- Used by: All composites for state reads, state writes, template scaffolding
- Commands: `config-get`, `config-set`, `state-read`, `state-update`, `verify-project`, etc.

**`upstream/`:**
- Purpose: Verbatim snapshots of upstream projects for diff baselines
- Contains: Complete copies of Superpowers 4.3.1, Impeccable 1.2.0, GSD 1.22.4
- Note: **NEVER EDIT** — used only for `git diff upstream/ .` to find all deviations
- Reference copies: feature-dev, playwright-best-practices, vercel-react-best-practices (adapted, not forked verbatim)
- Update process: Save snapshot BEFORE forking, then diff shows exactly what changed and why

**`evals/`:**
- Purpose: Skill evaluation and validation
- Contains: 130+ eval definitions, fixtures (mock projects), test runner
- Fixtures: `nextjs-app-deep/` (full Next.js app for testing), other project templates
- Usage: `run_all_evals.py` executes evals to validate skill behavior

**`.planning/`:**
- Purpose: Plugin's own planning artifacts (separate from user projects' `.planning/`)
- Contains: PLAN.md, STATE.md, codebase analysis, designs
- Subdirectory `codebase/`: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

## Key File Locations

**Entry Points:**
- `.claude-plugin/plugin.json`: Plugin name and metadata
- `.claude/commands/`: System commands (setup.md, new-project.md)
- `.claude/skills/{name}/SKILL.md`: User-facing skill definitions (37 total)

**Configuration:**
- `.claude-plugin/plugin.json`: Plugin manifest (version, skills path)
- `.claude-plugin/marketplace.json`: Marketplace listing
- `bin/gsd-tools.cjs`: GSD state and config API

**Core Logic:**
- `agents/*.md`: Subagent personas and behavioral prompts
- `skills/*/SKILL.md`: Internal methodology guides (TDD, debugging, brainstorming, etc.)
- `references/implementer-prompt.md`: Task execution template
- `references/spec-gate-prompt.md`: Quality review template

**Testing/Validation:**
- `evals/`: Eval definitions and fixtures
- `evals/fixtures/nextjs-app-deep/`: Full Next.js project for testing

## Naming Conventions

**Files:**
- Skill definitions: `.claude/skills/{kebab-case}/SKILL.md` (e.g., `plan-work/SKILL.md`, `teach-impeccable/SKILL.md`)
- Agent definitions: `agents/{kebab-case}.md` (e.g., `code-reviewer.md`, `gsd-planner.md`)
- Internal skills: `skills/{kebab-case}/SKILL.md` (e.g., `test-driven-development/SKILL.md`)
- System commands: `commands/{kebab-case}.md` (e.g., `new-project.md`, `setup.md`)
- References: `references/{kebab-case}.md` (e.g., `implementer-prompt.md`, `spec-gate-prompt.md`)

**Directories:**
- Top level: `agents/`, `skills/`, `references/`, `bin/`, `upstream/`, `evals/`, `.planning/`, `.claude/`, `commands/`
- Subdirs: Use kebab-case (e.g., `.claude/skills/plan-work/`, `upstream/superpowers-4.3.1/`)

**Invocation:**
- Plugin skills: `/fh:{name}` (e.g., `/fh:build`, `/fh:plan-work`, `/fh:teach-impeccable`)
- System commands: `/fh:{name}` (e.g., `/fh:setup`, `/fh:new-project`)
- Note: Plugin name is "fh" in plugin.json — Claude Code automatically prefixes all invocations

## Where to Add New Code

**New Workflow Skill (user-facing):**
- Primary code: Create `.claude/skills/{name}/SKILL.md` with frontmatter (name, description, user-invokable: true)
- Step definition: Follow composite orchestrator pattern (read context → analyze → delegate → aggregate)
- Agent references: Link to subagent types by name (e.g., "dispatch code-reviewer agent")
- Template references: Include path to shared templates used (e.g., `references/implementer-prompt.md`)
- References: Co-locate skill-specific references in `.claude/skills/{name}/references/` if needed
- Test/eval: Add eval definition to `evals/` with fixture and assertions

**New Design Command (user-facing):**
- Primary code: Create `.claude/skills/{name}/SKILL.md`
- Diagnostic section: Follow audit pattern (check for issues, categorize by severity)
- Frontend guidance: Reference `skills/frontend-design/SKILL.md` for design principles
- Template references: Use `references/` templates for report generation
- Invocation: Include in design quality gate chains (e.g., critique → polish → normalize)

**New Internal Skill (referenced by composites):**
- Primary code: Create `skills/{name}/SKILL.md` with full step-by-step methodology
- Usage: Composites reference this in their steps with `Follow skills/{name}/` inline instruction
- Examples: Include code snippets, patterns, anti-patterns
- Not shipped: This stays in repo only; composites embed the guidance inline

**New Agent Type (subagent dispatch):**
- Primary code: Create `agents/{name}.md` with system prompt and behavioral directives
- System prompt: Include context requirements, success criteria, error handling
- Usage: Reference from composites that dispatch this agent type
- Testing: Verify agent can access co-located references in `.claude/skills/{dispatch-skill}/references/`

**New Reference Template:**
- Primary code: Create `references/{name}.md` with placeholders
- Placeholders: Use `{UPPERCASE_PLACEHOLDER}` format
- Usage: Composites fill placeholders before dispatch or output
- GSD templates: Store file scaffolds in `references/gsd-templates/{filename}.md`

**Utilities/Helpers:**
- Shared functions: Add to `bin/lib/` modules (Node.js)
- GSD CLI commands: Add to `bin/gsd-tools.cjs` with arg parsing
- Git hooks: Add to `.claude/hooks/` with shell scripts

## Special Directories

**`upstream/`:**
- Purpose: Baseline snapshots for diff tracking
- Generated: No (manually saved before forking)
- Committed: Yes (historical record for PATCHES.md)
- Update: When bumping upstream version, save NEW snapshot before applying patches
- Never edit: These are read-only baselines — all changes go elsewhere

**`evals/`:**
- Purpose: Skill evaluation and validation
- Generated: Test runs create new subdirs under `fhhs-skills-workspace/`
- Committed: No (eval results and test artifacts ignored)
- Update: Add new eval definition (e.g., eval-124.md) and add fixtures as needed

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents (ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, etc.)
- Generated: By `map-codebase` agent
- Committed: Yes (reference for future development)
- Update: Run `/fh:map-codebase` to regenerate analysis

**`.context/attachments/`:**
- Purpose: Session context files and attachments
- Generated: By Claude Code sessions
- Committed: No (.gitignore)
- Update: Automatic (session-level only)

---

*Structure analysis: 2026-03-12*
