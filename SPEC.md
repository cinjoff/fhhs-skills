# fhhs-skills — Architecture Spec

## What This Is

fhhs-skills is a single-install Claude Code plugin that provides a complete software development workflow. It bundles three upstream projects — engineering discipline (Superpowers), design quality (Impeccable), and project tracking (GSD) — into one cohesive system where composite commands orchestrate the underlying skills automatically.

The user installs one plugin and gets: planning, building, fixing, refactoring, code review, TDD, design critique, project tracking, visual verification, and more. No other plugins required.

## Architecture

### Layer Model

```
┌─────────────────────────────────────────────────────┐
│  Composite Commands (user-facing)                   │
│  /plan-work  /build  /fix  /refactor  /verify  /resume-work │
│  /simplify  /research  /fh:new-project  /verify-ui     │
├─────────────────────────────────────────────────────┤
│  Design Commands (user-facing, also auto-invoked)   │
│  /critique /polish /normalize /harden /animate ...  │
├─────────────────────────────────────────────────────┤
│  GSD Structural Commands (user-facing)              │
│  /add-phase /progress /fh:health /cleanup /quick ...   │
├─────────────────────────────────────────────────────┤
│  Internal Skills (invoked by composites, not users) │
│  brainstorming, TDD, systematic-debugging,          │
│  dispatching-parallel-agents, verification,         │
│  code-review, simplify, frontend-design, ...        │
├─────────────────────────────────────────────────────┤
│  Agents (subagent types for Task tool dispatch)     │
│  code-reviewer, code-explorer, code-architect,      │
│  gsd-executor, gsd-planner, gsd-verifier, ...       │
├─────────────────────────────────────────────────────┤
│  References (shared templates and prompts)          │
│  implementer-prompt, spec-gate-prompt,              │
│  summary-template, gsd-state-updates, ...           │
├─────────────────────────────────────────────────────┤
│  GSD CLI (bin/gsd-tools.cjs)                        │
│  State management, template scaffolding,            │
│  verification helpers, config management            │
└─────────────────────────────────────────────────────┘
```

### Directory Layout

```
fhhs-skills/
├── .claude-plugin/
│   ├── plugin.json              # Plugin metadata (name, version, author)
│   └── marketplace.json         # Marketplace listing
│
├── commands/                    # User-facing slash commands
│   ├── build.md                 # Composite: orchestrate plan execution
│   ├── plan.md                  # Composite: brainstorm → research → plan
│   ├── fix.md                   # Composite: triage → debug → TDD fix
│   ├── refactor.md              # Composite: scope → baseline → atomic steps
│   ├── verify.md                # Composite: dual verification
│   ├── resume.md                # Composite: context restore → routing
│   ├── simplify.md              # Composite: code reuse/quality/efficiency
│   ├── research.md              # Composite: web search → GSD output
│   ├── new-project.md           # Composite: bootstrap project
│   ├── verify-ui.md             # Composite: Playwright screenshots
│   ├── setup.md                 # One-time orientation
│   ├── skills-guide.md          # Full command reference
│   ├── update.md                # Self-update
│   ├── update-upstream.md       # Check upstream for changes
│   ├── update-gsd.md            # Redirect to /fh:update
│   ├── critique.md              # Impeccable: design evaluation
│   ├── polish.md                # Impeccable: alignment pass
│   ├── normalize.md             # Impeccable: design system consistency
│   ├── harden.md                # Impeccable: error/i18n/edge cases
│   ├── animate.md               # Impeccable: motion design
│   ├── teach-impeccable.md      # Impeccable: one-time DESIGN.md setup
│   ├── distill.md               # Impeccable: remove complexity
│   ├── adapt.md                 # Impeccable: responsive design
│   ├── bolder.md                # Impeccable: amplify visual impact
│   ├── quieter.md               # Impeccable: reduce visual intensity
│   ├── extract.md               # Impeccable: design system extraction
│   ├── colorize.md              # Impeccable: add strategic color
│   ├── audit.md                 # Impeccable: accessibility/perf audit
│   ├── clarify.md               # Impeccable: UX copy improvement
│   ├── onboard.md               # Impeccable: first-time UX
│   ├── optimize.md              # Impeccable: performance
│   ├── delight.md               # Impeccable: personality/joy
│   ├── add-phase.md             # GSD: roadmap management
│   ├── remove-phase.md          # GSD: roadmap management
│   ├── insert-phase.md          # GSD: roadmap management
│   ├── add-todo.md              # GSD: task capture
│   ├── check-todos.md           # GSD: task review
│   ├── complete-milestone.md    # GSD: milestone lifecycle
│   ├── audit-milestone.md       # GSD: milestone verification
│   ├── new-milestone.md         # GSD: milestone lifecycle
│   ├── progress.md              # GSD: status + routing
│   ├── quick.md                 # GSD: ad-hoc task
│   ├── health.md                # GSD: .planning/ integrity
│   ├── cleanup.md               # GSD: archive phases
│   ├── pause-work.md            # GSD: context save
│   ├── discuss-phase.md         # GSD: pre-planning conversation
│   ├── map-codebase.md          # GSD: parallel codebase analysis
│   ├── settings.md              # GSD: workflow config
│   ├── set-profile.md           # GSD: model profile switching
│   ├── validate-phase.md        # GSD: test coverage audit
│   ├── plan-milestone-gaps.md   # GSD: gap detection
│   ├── list-phase-assumptions.md # GSD: assumption surfacing
│   ├── help.md                  # GSD: command listing
│   └── revise-claude-md.md      # claude-md-management: session learnings / audit / init
│
├── skills/                      # Internal skills (composites invoke these)
│   ├── brainstorming/           # Superpowers: collaborative design
│   ├── test-driven-development/ # Superpowers: RED-GREEN-REFACTOR
│   ├── systematic-debugging/    # Superpowers: scientific debugging
│   ├── dispatching-parallel-agents/ # Superpowers: parallel dispatch
│   ├── verification-before-completion/ # Superpowers: evidence-based verify
│   ├── requesting-code-review/  # Superpowers: review dispatch
│   ├── finishing-a-development-branch/ # Superpowers: merge/PR workflow
│   ├── using-superpowers/       # Superpowers: skill discovery meta-skill
│   ├── using-git-worktrees/     # Superpowers: isolated branches
│   ├── writing-plans/           # Superpowers: plan authoring
│   ├── writing-skills/          # Superpowers: skill authoring
│   ├── subagent-driven-development/ # Superpowers: subagent patterns
│   ├── executing-plans/         # Superpowers: plan execution
│   ├── receiving-code-review/   # Superpowers: review handling
│   ├── simplify/                # Custom: 3-agent code cleanup
│   ├── frontend-design/         # Impeccable: design principles + reference/
│   └── claude-md-improver/      # claude-md-management: audit + improve CLAUDE.md
│
├── agents/                      # Agent type definitions (for Agent tool)
│   ├── code-reviewer.md         # Adapted from Superpowers + feature-dev
│   ├── code-explorer.md         # Adapted from feature-dev
│   ├── code-architect.md        # Adapted from feature-dev
│   ├── gsd-planner.md           # GSD: plan creation
│   ├── gsd-executor.md          # GSD: plan execution
│   ├── gsd-verifier.md          # GSD: verification
│   ├── gsd-debugger.md          # GSD: scientific debugging
│   ├── gsd-plan-checker.md      # GSD: plan quality gate
│   ├── gsd-codebase-mapper.md   # GSD: codebase analysis
│   ├── gsd-phase-researcher.md  # GSD: pre-planning research
│   ├── gsd-project-researcher.md # GSD: domain research
│   ├── gsd-research-synthesizer.md # GSD: research aggregation
│   ├── gsd-roadmapper.md        # GSD: roadmap creation
│   ├── gsd-nyquist-auditor.md   # GSD: test coverage
│   └── gsd-integration-checker.md # GSD: cross-phase wiring
│
├── references/                  # Shared templates and prompts
│   ├── implementer-prompt.md    # /build task subagent template
│   ├── spec-gate-prompt.md      # /build per-wave spec reviewer template
│   ├── summary-template.md      # SUMMARY.md scaffold
│   ├── gsd-state-updates.md     # State update commands for composites
│   ├── dependency-check.md      # Pre-flight check (just .planning/PROJECT.md)
│   ├── gsd/                     # GSD reference docs
│   └── gsd-templates/           # GSD file templates
│
├── bin/                         # Bundled GSD CLI
│   ├── gsd-tools.cjs            # Main CLI entry point
│   ├── lib/                     # CLI modules
│   └── VERSION                  # GSD version (1.22.4)
│
├── upstream/                    # Clean upstream snapshots (NEVER edit)
│   ├── superpowers-4.3.1/       # Verbatim copy for diff baseline
│   ├── impeccable-1.2.0/        # Verbatim copy for diff baseline
│   ├── gsd-1.22.4/              # Verbatim copy for diff baseline
│   ├── feature-dev-55b58ec6/    # Reference copy (agents adapted, not forked verbatim)
│   └── claude-md-management-1.0.0/ # Verbatim copy for diff baseline
│
├── evals/                       # Skill evaluation definitions
├── fhhs-skills-workspace/       # Eval workspace and mock projects
├── .planning/                   # Plugin's own planning artifacts
│
├── SPEC.md                      # This file
├── README.md                    # User-facing documentation
├── CHANGELOG.md                 # Version history
├── PATCHES.md                   # All modifications from upstream
├── COMPATIBILITY.md             # Upstream attribution and versions
└── .gitignore
```

## How Composites Work

A composite command is a markdown file in `commands/` that defines a multi-step workflow. It coordinates by delegating to internal skills and agents rather than doing the work itself.

### Composition Pattern

```
/build (composite)
  ├── reads: references/implementer-prompt.md (task template)
  ├── reads: references/spec-gate-prompt.md (review template)
  ├── dispatches: general-purpose agents (task execution)
  ├── dispatches: code-reviewer agents (spec gates + quality review)
  ├── dispatches: gsd-integration-checker agent (cross-phase wiring)
  ├── invokes: /critique, /polish, /normalize (design gates)
  ├── invokes: skills/simplify/ (code cleanup)
  ├── invokes: skills/verification-before-completion/ (final verify)
  ├── invokes: skills/finishing-a-development-branch/ (merge/PR)
  ├── writes: SUMMARY.md (via references/summary-template.md)
  └── calls: gsd-tools.cjs (state updates)
```

### Design Rules

1. **Delegate discipline, own workflow.** Composites define WHAT happens WHEN. Internal skills define HOW.
2. **Lean orchestrator.** The composite coordinates. Subagents do the work. Target < 15% context usage.
3. **Attribute, don't copy.** Subagent prompts include brief behavioral directives and skill references, not full skill recreations.
4. **GSD as state backend.** All state writes use GSD file formats and `gsd-tools.cjs`.
5. **Self-contained.** No external plugin dependencies. Everything ships in this repo.

## Upstream Relationship

### Forking Model

Each upstream project is forked at a specific version:

| Upstream | Version | Snapshot | What's Forked |
|----------|---------|----------|---------------|
| Superpowers | v4.3.1 | `upstream/superpowers-4.3.1/` | Skills, agents, patterns |
| Impeccable | v1.2.0 | `upstream/impeccable-1.2.0/` | Skills (as commands), frontend-design |
| GSD | v1.22.4 | `upstream/gsd-1.22.4/` | Workflows (as commands), agents, CLI, templates |
| feature-dev | 55b58ec6 | `upstream/feature-dev-55b58ec6/` | Agents (adapted, not verbatim) |
| claude-md-management | v1.0.0 | `upstream/claude-md-management-1.0.0/` | Skill, command, references |

The feature-dev agents were adapted rather than forked verbatim:
- `agents/code-explorer.md` — broadened scope, removed YAML frontmatter
- `agents/code-architect.md` — removed YAML frontmatter
- `agents/code-reviewer.md` — restructured as template with placeholders, threshold adjusted

The **simplify** skill (`skills/simplify/SKILL.md`) is an original creation that extracts functionality that was a native Superpowers capability into an explicit, standalone skill.

### Upstream Snapshots

The `upstream/` directory holds **verbatim, unmodified copies** of each upstream at the forked version. These are never edited. They serve as diff baselines when checking for upstream updates via `/update-upstream`.

### Patch Tracking

Every modification from upstream is documented in `PATCHES.md` with:
- Which skill/command was changed
- What specifically changed (numbered patches)
- Why it was changed (rationale)

This enables:
- Reviewing patches before reapplying after upstream update
- Identifying which patches may conflict with upstream changes
- Knowing which patches are obsolete if upstream fixed the same issue

### Update Workflow

```
/update-upstream [superpowers|impeccable|gsd|feature-dev] [version]
  1. Download new upstream version to temp dir
  2. Diff upstream/{name}-{old}/ vs new version
  3. Cross-reference changed files against PATCHES.md
  4. Present report: changes, conflicts, new files, removed files
  5. User manually reviews and merges
  6. Replace upstream/ snapshot with new version
  7. Update PATCHES.md version headers
  8. Run evals to verify
```

No auto-apply — the user decides what to merge.

## Plugin Installation

### What Users Install

```bash
# Add marketplace (one-time)
/plugin marketplace add cinjoff/fhhs-skills

# Install plugin
/plugin install fh@fhhs-skills

# Run setup
/fh:setup
```

### Setup Flow (`/fh:setup`)

1. **Welcome** — overview of what the plugin provides
2. **Platform detection + prerequisites** — detect macOS/Linux/Windows, check for Homebrew, Node.js, npm, gh, vercel, git. Install missing tools via Homebrew (macOS/Linux) or present Windows-specific installer links
3. **TypeScript LSP** — auto-detect and install `typescript-language-server` (npm) + `typescript-lsp` Claude plugin
4. **GSD symlink** — auto-detect and create `$HOME/.claude/get-shit-done/bin/` → plugin's `bin/`
5. **Summary + next steps** — status report of all tools, route to `/fh:new-project` or `/resume-work`

Each step checks current state before acting (idempotent). Running `/fh:setup` multiple times is safe.

### External Dependencies

| Dependency | Required | Installed by `/fh:setup` | Purpose |
|------------|----------|----------------------|---------|
| Homebrew | No (macOS/Linux convenience) | Yes (offers install) | Package manager for other tools |
| Node.js + npm | Yes | Yes (via brew / winget) | Runtime for GSD CLI and TypeScript LSP |
| GitHub CLI (`gh`) | Recommended | Yes (via brew / winget) | PR creation, issue management |
| Vercel CLI | Recommended | Yes (via brew / npm) | Deployment (if using Vercel) |
| `typescript-language-server` | Recommended | Yes (via npm) | Precise code navigation (LSP) |
| `typescript-lsp` Claude plugin | Recommended | Yes (via plugin install) | Claude Code LSP integration |
| Git | Yes | Yes (via brew / winget) | Version control |

On Windows, `/fh:setup` provides `winget` commands and download links instead of Homebrew.

The plugin functions without TypeScript LSP but loses precise navigation features (goToDefinition, findReferences, call hierarchy, hover types). Composites that reference LSP degrade gracefully — they use grep/glob as fallback.

## Non-Negotiable Disciplines

Every composite that executes code enforces these via internal skills:

1. **TDD** — no production code without a failing test first
2. **Per-wave spec gates** — adversarial spec verification after each wave
3. **Quality review** — code quality, security, architecture review at end
4. **Simplify pass** — code reuse, efficiency, hygiene after quality review
5. **Verification-before-completion** — no claims without fresh evidence
6. **Fresh subagents** — structured prompts with self-review, analysis paralysis guard, deferred items
7. **YAGNI** — no features, abstractions, or error handling beyond what's specified

## Version Tracking

- `plugin.json` and `marketplace.json` carry the plugin version
- `CHANGELOG.md` follows Keep a Changelog format
- `bin/VERSION` tracks the bundled GSD version
- `upstream/` directory names embed upstream versions
- Git tags mark releases

## Adding New Upstream Sources

To incorporate a new upstream project:

1. Download the specific version to `upstream/{name}-{version}/`
2. Fork the relevant files into `commands/` and/or `skills/`
3. Apply necessary adaptations (path references, GSD integration, namespace)
4. Document every change in `PATCHES.md` with rationale
5. Add to `COMPATIBILITY.md` upstream attribution table
6. Update `/update-upstream` to handle the new source
7. Update `/skills-guide` command reference
8. Run evals
