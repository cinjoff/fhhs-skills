# Changelog

All notable changes to fhhs-skills will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.22.0] - 2026-03-25

### Added
- **`/fh:ui-branding` skill** — one-time design context setup, forked from `teach-impeccable` into `.claude/skills/ui-branding/` (shipping boundary fix — upstream snapshots aren't shipped with plugin install)
- **Supabase setup in `/fh:new-project`** — new Step 6e automates Supabase CLI login, project creation, API key retrieval, `.env.local` configuration, Vercel env sync, and security guardrails (RLS reminders, service_role key protection)
- **Eval coverage expansion** — 40 new evals (IDs 135-174) covering 15 zero-coverage skills and strengthening 11 weak skills

### Changed
- **`teach-impeccable` → `ui-branding`** — renamed across SPEC, PATCHES, COMPATIBILITY, help skill, and README for clarity
- **`revise-claude-md` co-located references** — `templates.md` and `update-guidelines.md` moved from repo-root `references/` into the skill directory (shipping boundary fix)
- **GSD symlink setup improved** — `/fh:new-project` now verifies the global symlink exists and creates it if missing, instead of assuming `/fh:setup` was run

### Fixed
- **Eval suite overhaul** — fixes stale COMMAND_MAP (8 broken paths, 5 renamed skills, 13 dead entries), removes 28 out-of-scope evals, adds 17 new evals for undertested user-invokable skills

## [1.21.4] - 2026-03-25

### Fixed
- **Skill names missing fh: prefix** — all 37 plugin skills now use the `fh:` prefix in their name field (e.g. `/fh:build`, `/fh:fix`, `/fh:plan-work`) so users can identify them as fh skills; updated all cross-references in skill content, README, SPEC, PATCHES, marketplace.json, and commands
- **Eval suite overhaul** — fixes stale COMMAND_MAP (8 broken paths, 5 renamed skills, 13 dead entries), removes 28 out-of-scope evals, adds 17 new evals for undertested user-invokable skills (ui-redesign, observability, ui-animate, update, refactor, plan-review, map-codebase, tracker), enriches mock app fixture with intentional security vulnerabilities and additional test files, adds `verify_command_map.py` drift detection script

## [1.21.3] - 2026-03-25

### Fixed
- **Stale skill references after rename consolidation** — updated help, new-project, sync-upstream, todos, progress, README, and marketplace.json to use current skill names (ui-critique, ui-animate, ui-redesign, ui-test, todos)
- **shadcn skills install location** — now installs globally to `~/.skills/shadcn` instead of per-project, avoiding repo pollution

## [1.21.2] - 2026-03-25

### Changed
- **Skill descriptions rewritten for clarity** — all 16 user-invokable skills now have plain-language descriptions that explain what each one does without jargon

## [1.21.1] - 2026-03-25

### Fixed
- **Skills path broken after `.claude-plugin/` migration** — relative path in `plugin.json` was `./.claude/skills` instead of `../.claude/skills`, causing all `/fh:` skills to be invisible to Claude Code

## [1.21.0] - 2026-03-25

### Added
- **Observability in `/review`** — queries local Sentry error store for runtime errors related to changed files, cross-references by basename, feeds matches to gap analysis, and adds WARN to the gate decision
- **claude-mem in `/progress`** — pulls cross-session context via `timeline` and `smart_search` MCP tools, showing relevant observations from previous sessions (gracefully skips if plugin not installed)

### Changed
- **Skill surface reduced from 37 to 15 user-invokable skills** — design skills (adapt, bolder, quieter, distill, clarify, colorize, delight, extract, onboard, optimize) are now internal-only, auto-invoked by `/build` pipelines
- **`ui-*` namespace** — animate→ui-animate, critique→ui-critique, qa→ui-test, teach-impeccable→ui-redesign for clearer grouping
- **`/progress` absorbs `/resume-work`** — single entry point for session resumption and status; includes git state, integrity checks, and claude-mem context; works with and without GSD projects
- **`/todos` replaces `/add-todo` + `/check-todos`** — unified todo management (with args = add, without = review)
- **`/verify` and `/verify-ui` removed** — functionality merged into `/review --verify` and `/ui-test`

## [1.20.1] - 2026-03-20

### Fixed
- **Observability skill docs** — corrects envelope type signatures (`Envelope` not `Uint8Array`), documents `extractEventFields` parser, and fixes tunnel endpoint description

## [1.20.0] - 2026-03-20

### Changed
- **`/fh:plan-review` feedback loop** — review findings now feed back into PLAN.md (`must_haves.truths` with `[review]` prefix) and CONTEXT.md (review decisions + deferred scope) instead of writing a disconnected file to `.planning/designs/`; `/fh:build` automatically picks up the strengthened plan
- **`/fh:build` subagent context** — implementer prompt includes "Locked Decisions & Scope Boundary" framing so subagents respect review decisions and deferred scope from CONTEXT.md

## [1.19.0] - 2026-03-20

### Added
- **shadcn/ui skills in `/fh:setup`** — installs `shadcn/ui` skills (`npx skills add shadcn/ui`) giving agents context for components, CLI, and registry workflows
- **shadcn/ui preset support in `/fh:new-project`** — optional Step 2b prompts users to design a custom preset at shadcn/create and paste the code; Phosphor Icons enforced regardless of preset
- **Supabase CLI automation in `/fh:new-project`** — full Step 2c automates project creation, auth config (email confirmations, redirect URLs for Vercel), email template scaffolding, API key retrieval, and config push — zero dashboard visits required
- **Supabase email templates** — scaffolds clean, minimal HTML templates for confirmation, recovery, magic link, and email change with Go template variables and inline styles

### Changed
- **`/fh:setup` summary** — adds shadcn skills row to the completion status table
- **`/fh:new-project` Phase 1 requirements** — includes shadcn init with preset, Phosphor Icons enforcement, Supabase SSR scaffolding (`@supabase/ssr`, middleware, callback route), and `getUser()` security note

## [1.18.0] - 2026-03-19

### Added
- **Post-update reconciliation in `/fh:update`** — after updating, automatically re-applies machine-level setup (symlinks, hooks, env vars) from `setup.md`, detects missing project features from `new-project.md` and offers them in plain language, and shows actionable tips about new skills and workflow changes derived from the changelog

### Changed
- **`/fh:update` Step 3 format** — replaces release-notes bullet summaries with actionable tips grouped into "New skills" and "Workflow changes", telling users what to do differently rather than what changed

## [1.17.1] - 2026-03-19

### Fixed
- **`/fh:update` marketplace command** — uses correct `claude plugin marketplace update fhhs-skills` instead of ambiguous `claude marketplace update`, preventing retry failures during plugin updates

## [1.17.0] - 2026-03-19

### Added
- **`/fh:sync-upstream` skill** — checks all 8 upstream repos for updates, shows changelogs, classifies patch compatibility, and guides intelligent reapplication with doc updates

### Changed
- **Upstream management** — replaces old `update-upstream` command (5 upstreams, report-only) with full 8-upstream skill including apply workflow and upstream registry

## [1.16.0] - 2026-03-19

### Added
- **claude-mem in `/fh:setup`** — setup now installs claude-mem plugin automatically for persistent session memory across conversations

## [1.15.3] - 2026-03-18

### Fixed
- **/fh:update** — adds explicit `claude marketplace update` step before plugin update, preventing agents from using non-existent `claude marketplace refresh` command

## [1.15.2] - 2026-03-18

### Fixed
- **Statusline shows native task titles** — reads from `~/.claude/tasks/{TASK_LIST_ID}/` for tasks created via `TaskCreate`, displaying `activeForm` or `subject` instead of bare task IDs
- **Conductor task list ID** — `CLAUDE_CODE_TASK_LIST_ID` now set via setup script instead of `env` block, since Conductor doesn't interpolate shell variables in env values
- **Native tasks enabled** — `CLAUDE_CODE_ENABLE_TASKS=true` added to conductor.json `env` block for automatic enablement in new workspaces

## [1.15.0] - 2026-03-17

### Added
- **Native task tracking in `/plan-work`** — creates tasks for all 7 planning steps upfront with live status updates as each step starts, completes, or is skipped
- **Native task tracking in `/build`** — creates tasks from plan's `<tasks>` block with wave dependencies; subagents create sub-tasks for granular live progress via `{TASK_ID}` threading
- **TDD coverage validation** — `/plan-work` WARNs when <30% of tasks mention tests, prompting test coverage before execution
- **Playwright E2E advisory** — `/plan-work` WARNs for frontend projects without E2E test coverage in the plan
- **TDD commit-order check** — spec gate WARNs when implementation commits precede test commits (TDD discipline)
- **Workspace-scoped task lists** — `CLAUDE_CODE_TASK_LIST_ID` in `conductor.json` isolates task tracking per Conductor workspace; archive script cleans up
- **Plan-review handoff** — `/plan-work` now suggests `/plan-review` at completion for plan challenge before build
- **Sub-task visibility** — build subagents create their own sub-tasks (write test → implement → verify) visible in the parent task list
- **Graceful task degradation** — if TaskCreate/TaskUpdate are unavailable, both workflows fall back to GSD-only tracking with a warning
- **17 new evals** — coverage for task tracking, plan-review handoff, TDD enforcement, and Playwright prompting

### Changed
- **Task messaging** — all task updates include descriptive `activeForm` text (e.g., "Implementing auth middleware" not "Task 1 started")
- **Implementer prompt** — adds Task Progress Tracking section with sub-task creation instructions and {TASK_ID} placeholder
- **Spec gate prompt** — adds TDD commit-order verification as a WARN-level check

## [1.14.1] - 2026-03-16

### Changed
- **Vercel project setup** — creates `vercel.json` with framework preset before linking, ensuring correct build config before the Next.js scaffold exists
- **Vercel GitHub integration** — documents Vercel GitHub App as a prerequisite for auto-deployments, with clear one-time setup instructions
- **Conductor workspace scripts** — uses `cp` instead of `ln -s` for `.env` files, since symlinks break in git worktrees
- **Plugin install guidance** — adds terminal CLI fallback (`claude plugin`) for Conductor and headless environments where `/plugin` commands aren't available
- **Setup prerequisites** — removes Vercel CLI from setup; defers to `/fh:new-project` where it's actually needed

## [1.14.0] - 2026-03-15

### Added
- **gstack upstream** — verbatim snapshot of gstack v0.3.3 in `upstream/` for diff tracking and compatibility
- **`/plan-review`** — founder-level plan challenge with 10-star problem-solving patterns, forked from gstack's plan-ceo-review
- **`/qa`** — systematic QA testing with agent-browser backend, issue taxonomy, and exploration checklist
- **Production safety checklist** — data migration risks, breaking API changes, feature flags, and rollback plans integrated into `/review`
- **Evals for gstack-derived skills** — evaluation coverage for plan-review, qa, and production safety patterns

### Changed
- **`/plan-work`** — enhanced with engineering review patterns from gstack
- **`/build`** — adds context pressure management and QA routing for frontend work
- **`/fix`** — anti-drift patterns to prevent scope creep during debugging
- **`/verify-ui`** — QA routing for visual verification handoffs
- **README** — updated with gstack as 7th upstream source, plan-review/qa in workflow diagrams

## [1.13.0] - 2026-03-13

### Added
- **`/fh:review`** — pre-promotion code review workflow with quality, architecture, security, and goal verification
- **`/fh:secure`** — OWASP Top 10 security scanner integrated into composite skills
- **Playwright Best Practices skill** — upstream adoption with `playwright-testing` skill for test guidance
- **Vercel React Best Practices skill** — upstream `nextjs-perf` skill for React/Next.js performance patterns
- **LLM grader** — semantic assertion engine for evals with flexible matching
- **Deep eval fixtures** — full Next.js app fixture with planted issues for thorough eval coverage
- **36 new evals** — skill-specific evals 106-130 and fixture-backed high-value flow tests

### Changed
- **Core loop skills streamlined** — improved context management, review pipeline, and subagent efficiency
- **Review and secure wired into composites** — `/fh:build` and other composites now run review and security gates

### Fixed
- **LLM grader index mapping** — corrected grader artifact handling and index alignment
- **Eval accuracy** — fixed eval 83 command, updated 4 evals for post-build review, added evidence verification assertions
- **`/secure` scan scope** — corrected scope targeting and eval invocability

## [1.12.5] - 2026-03-11

### Fixed
- **Parallel read cascade errors** — subagent prompts in /build and /quick no longer batch optional files (CLAUDE.md, skills/) with required reads, preventing cascade cancellations when optional files don't exist

### Added
- **Conductor workspace support** — /fh:setup detects Conductor and shows configuration guidance; /fh:new-project auto-generates conductor.json with stack-appropriate setup and run scripts

## [1.12.4] - 2026-03-08

### Fixed
- **GSD tools path** — all shipped skills used `./` (relative to CWD) instead of `$HOME/` for `gsd-tools.cjs`, causing "GSD tools not found" errors in user projects
- **Tracker milestone plans** — scans `.planning/milestones/` directories for phase plan files, fixing empty task lists for all historical phases

## [1.12.3] - 2026-03-08

### Fixed
- **Tracker milestone plans** — scans `.planning/milestones/` directories for phase plan files, fixing empty task lists for all historical phases

## [1.12.2] - 2026-03-08

### Fixed
- **Parallel tool call errors** — reference files (implementer-prompt, spec-gate-prompt, etc.) were not shipped with plugin installs, causing "File does not exist" errors that cascaded into "Cancelled: parallel tool call" failures during /build and /plan-work

## [1.12.1] - 2026-03-08

### Changed
- **Tracker startup** — skips template file copying when already up to date, using version-based caching

## [1.12.0] - 2026-03-08

### Added
- **Flat plan parsing** — tracker now discovers plans from `.planning/plans/NN-PLAN.md` in addition to `.planning/phases/{dir}/XX-NN-PLAN.md`
- **Auto-generated phases** — when no ROADMAP.md exists, phases are built from discovered plan files

## [1.11.2] - 2026-03-08

### Fixed
- **Build corruption** — `String.replace()` was interpreting `$&` in minified JS as a special pattern, corrupting the bundled output with syntax errors

## [1.11.1] - 2026-03-08

### Changed
- **Sidebar action buttons** — repositions [fix these] and [update] inline with section titles instead of below content
- **Codebase staleness** — [update] button only appears when codebase map is >5 days old

### Added
- **Backlog planning** — [plan these] button on backlog section copies `/plan-work` command to prioritize and plan open todos

## [1.11.0] - 2026-03-08

### Added
- **Tracker v2** — complete rewrite with Preact, JSX components, Tailwind CSS, tiered caching server, and build infrastructure
- **Plan objectives** — extracts and displays objectives from PLAN.md files
- **Sidebar action buttons** — [fix these] on concerns, [update] on codebase, with tooltips
- **Expandable phases** — click to expand/collapse phase details

### Changed
- **Update command** — fetches latest version from GitHub raw instead of marketplace cache
- **Tracker launch** — always refreshes template files from plugin source

### Fixed
- **Grid overflow** — constrain left column with min-w-0
- **7 tracker bugs** — concerns counts, milestone names, buttons, header, body extracts, objectives
- **Tiered caching** — gate state/todos/retros re-parsing, store completion events
- **Plan row layout** — constrain width and align with phase titles

### Removed
- **Recent Activity section** — removed from sidebar

## [1.10.0] - 2026-03-08

### Changed
- **Project Tracker redesign** — terminal-aesthetic UI with FHHS design language: JetBrains Mono, CRT scan lines, `//` section headers, text status icons (`✓ ▶ · ~`), fire-red active highlights, and acid-green progress glow
- **Stats bar promoted to hero** — full-width progress bar with completion count as the dominant visual element
- **Empty states** — sidebar sections now show helpful command hints (`/fh:add-todo`, `/fh:quick`) instead of hiding when empty
- **Entrance animations** — staggered fade-in on milestone groups, blinking cursor on active subtask, pulsing connection dot

### Removed
- **Tailwind CSS dependency** — replaced with purpose-built CSS using FHHS color palette

## [1.9.0] - 2026-03-07

### Changed
- **Project Tracker dashboard** — two-column layout with milestone grouping for better visual organization of project progress

## [1.8.0] - 2026-03-07

### Added
- **Project Tracker** — local web dashboard that visualizes GSD project progress with real-time updates via SSE. Launch with `/fh:tracker`
- **`/fh:tracker` skill** — scaffolds `.project-tracker/` into your project (gitignored) and starts the dashboard server
- **`/new-project` integration** — automatically sets up the project tracker during project initialization

## [1.7.1] - 2026-03-07

### Fixed
- **LSP guidance across code-working skills** — simplify review agents, fix triage/spec review, refactor scope/execute, and extract discover/migrate now include specific LSP operations (`findReferences`, `workspaceSymbol`, `rename`, `documentSymbol`, etc.)
- **Skill frontmatter names** — 16 UI skills still had `ui:` prefix in YAML `name` field after v1.7.0 restructure
- **SPEC.md accuracy** — architecture diagram reflects prefix-free skill dirs; "Playwright" corrected to "agent-browser"

### Changed
- **Eval scenarios expanded** — broader coverage across skills

## [1.7.0] - 2026-03-07

### Changed
- **Prefix-free command invocation** — workflow skills now invokable without the `fh:` prefix: `/build`, `/fix`, `/verify`, `/quick`, `/refactor`, `/simplify`, `/research`, `/progress`, `/map-codebase`, `/add-todo`, `/check-todos`, `/verify-ui`
- **Design skills lose separate prefix** — 17 impeccable-derived design skills now invoked as `/fh:polish`, `/fh:critique`, `/fh:audit`, `/fh:animate`, `/fh:bolder`, etc. (same `fh:` prefix as all other plugin skills)
- **Setup/maintenance commands keep `fh:` prefix** — `/fh:setup`, `/fh:update`, `/fh:settings`, `/fh:new-project`, `/fh:health`, `/fh:help`, `/fh:revise-claude-md` unchanged
- **`/plan` renamed to `/plan-work`** — avoids conflict with Claude Code's native `/plan` command
- **`/resume` renamed to `/resume-work`** — avoids conflict with Claude Code's native `/resume` command

## [1.6.1] - 2026-03-07

### Fixed
- **Test subagents no longer hang** — all test-running instructions now specify non-watch (CI) mode; vitest uses `--run`, jest uses `CI=true`, preventing subagents from blocking indefinitely in watch mode

## [1.6.0] - 2026-03-07

### Added
- **Homebrew auto-install in setup** — `/fh:setup` now checks for Homebrew upfront and installs it if missing before checking other tools
- **GitHub + Vercel automation in new-project** — `/fh:new-project` now creates a private GitHub repo, links a Vercel project, and connects them for auto-deploys — no manual wiring needed

### Fixed
- **Command cross-references use correct prefix** — all commands now suggest `/fh:build`, `/fh:plan`, etc. instead of unprefixed `/build`, `/plan` which could trigger wrong commands
- **Subagent interruption in `/fh:build`** — implementer prompt no longer tells subagents to "ask before starting" (they can't receive answers); subagents now proceed with documented assumptions or return a structured BLOCKED report; orchestrator has explicit recovery protocol for interrupted/blocked agents

## [1.5.2] - 2026-03-07

### Fixed
- **Update indicator** — `/fh:update` now clears the statusline cache after updating, so the `⬆ /fh:update` indicator disappears
- **Setup banner** — summary horse art displays as direct text instead of via Bash, which Claude Code auto-collapses

## [1.5.1] - 2026-03-07

### Fixed
- **Setup re-linking** — `/fh:setup` now always re-links to the latest cached plugin version instead of short-circuiting when symlinks already exist, fixing "banner script not available" errors after upgrades

## [1.5.0] - 2026-03-07

### Added
- **Colored ASCII banner script** — `bin/fhhs-banner.js` outputs the fire horse mark with ANSI colors (red horse, green goggles, yellow fire traces); supports `--summary` mode
- **New horse head ASCII art** — classic style horse profile with wide hacker goggles (`<═◆●◆═>`), diagonal frame arm toward ear, and full head/neck (no longer cut off)

### Fixed
- **CLI tools version check** — no longer falsely reports "broken" (removed nonexistent `--version` flag)
- **Plugin root picks latest version** — sort + tail instead of arbitrary `head -1`; prefers dev checkout over stale cache
- **Variable persistence across steps** — bin + hooks linking runs in a single Bash call
- **LSP plugin check uses node** — replaced `python3` dependency with `node` (guaranteed available)
- **Settings.json update** — uses Read/Edit tools instead of `node -e` to avoid shell escaping issues with `!`

### Changed
- **Setup art** — replaced abstract geometric pyramid with recognizable horse head profile from classic ASCII art

## [1.4.0] - 2026-03-07

### Added
- **Fire horse ASCII art banner** — `/setup` opens with the branded fire horse mark (angular head, diamond glasses, fire traces) matching the FHHS visual identity
- **Statusline hook** — `hooks/fhhs-statusline.js` shows model name, current task, context usage bar, and update-available indicator
- **Update check hook** — `hooks/fhhs-check-update.js` checks GitHub for new fhhs-skills versions on SessionStart (background, throttled to 6h)
- **Context monitor hook** — `hooks/fhhs-context-monitor.js` warns the agent when context window is running low (WARNING at 65%, CRITICAL at 75% used)

### Changed
- **`/setup` rewritten with FHHS UI branding** — stage banners, status symbols, checkpoint boxes, error boxes, spawning indicators, and Next Up block. Uses `FHHS ►` prefix instead of `GSD ►`
- **`/setup` installs hooks** — configures `settings.json` with statusline, SessionStart, and PostToolUse hooks; removes old GSD hooks if present
- **README** — added `/reload-plugins` step to install instructions

## [1.3.0] - 2026-03-07

### Changed
- **Deduplicated GSD agents** — removed 12 near-duplicate skill copies from `skills/gsd-*/`; agents now live only in `agents/` where they're dispatched via the Agent tool. Saves ~31k tokens per session from skill description overhead
- **Evals updated** — audited all 53 evals against current commands; removed 2 obsolete evals (skills-guide, update-upstream), fixed 3 outdated evals (setup, help, fix-complex). 51 evals remain, all verified passing
- **README** — updated skill/agent counts (17 skills + 15 agents), clarified GSD agent architecture
- **SPEC.md** — directory layout updated to reflect agent/skill separation

### Removed
- `skills/gsd-*/` directories (12 files, ~7,800 lines) — exact duplicates of `agents/gsd-*.md` with only `user-invokable: false` added

## [1.2.2] - 2026-03-07

### Changed
- **README** — rewritten with full command reference, skill overview, and setup instructions
- **Maintainer commands** — `/update-upstream` and `/update-gsd` moved out of shipped commands

### Added
- **`/release` command** — maintainer tooling for consistent version bumps, changelog, and GitHub releases
- **Post-push hook** — reminds to release when untagged commits exist on main

## [1.2.1] - 2026-03-07

### Fixed
- **`/update` command** — uses `marketplace update` (not `refresh`) and refreshes marketplace before installing
- **Hidden internal skills** — GSD and Superpowers skills no longer clutter the user-facing skill list; only composite commands and Impeccable design skills are shown

## [1.2.0] - 2026-03-07

### Added
- **`/simplify` command and skill** — parallel code reuse, quality, and efficiency review. Runs automatically as Step 8b in `/build`, also standalone
- **`/revise-claude-md` command and `claude-md-improver` skill** — audit, evaluate, and improve CLAUDE.md files with GSD-aware context detection
- **Bundled GSD CLI** — `bin/gsd-tools.cjs` ships with the plugin; `/setup` symlinks it, no separate `npm install -g get-shit-done` needed
- **LSP integration** — codebase mapper, systematic debugging, and implementer prompt use LSP (`goToDefinition`, `findReferences`, `incomingCalls`, `hover`) for precise code navigation
- **GSD integration in Superpowers skills** — `writing-plans` and `executing-plans` check for `.planning/PROJECT.md` and route to GSD phase paths automatically
- **EnterPlanMode prohibition** — hard gates in `writing-plans`, `executing-plans`, and `using-superpowers` prevent plan mode trapping
- **Cross-platform `/setup`** — detects macOS/Linux/Windows, walks through Homebrew, Node.js, GitHub CLI, Vercel CLI, TypeScript LSP plugin installation
- **Architecture spec** (`SPEC.md`) — documents the full layer model, routing, and design principles
- **Session retros** (`.planning/retros/`) — post-session retrospective notes

### Changed
- **Corrected upstream references** — Superpowers repo is `obra/superpowers` (was `pcvelz`), forked from v4.3.1 (was incorrectly listed as v4.3.4/4.3.5)
- **Upstream snapshots added** — `upstream/superpowers-4.3.1/`, `upstream/feature-dev-55b58ec6/`, `upstream/claude-md-management-1.0.0/`
- **COMPATIBILITY.md** — added feature-dev, claude-md-management, external dependencies table, expanded Superpowers and Impeccable coverage
- **PATCHES.md** — comprehensive rewrite with accurate patch tracking for all upstreams including claude-md-management and feature-dev agents
- **`/update-gsd` simplified** — streamlined from large script to focused update check

### Removed
- **`.tasks.json` persistence** — stripped from `writing-plans`, `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, `brainstorming`. GSD state management replaces it
- **`TaskCreate`/`TaskUpdate` boilerplate** — removed native task tool integration sections from skills (GSD tracking handles this)
- **`upstream/superpowers-4.3.5/`** — stale snapshot replaced by corrected `upstream/superpowers-4.3.1/`

## [1.1.0] - 2026-03-06

### Added
- **Code explorer agent** — reusable agent for tracing code flows and surfacing essential files before design
- **Code architect agent** — reusable agent for designing implementation blueprints with different architectural lenses
- **Confidence scoring in code review** — issues rated 0-100, only high-signal issues (>=75) reported
- **Deep exploration in brainstorming** — optional parallel explorer/architect agents for complex features
- **`/update` command** — check for updates and install without digging through plugin menus
- **Version tracking** — CHANGELOG.md and git tags for release management

### Fixed
- User-facing routing now recommends composite commands (`/plan`, `/build`, `/verify`) instead of raw GSD commands (`/gsd:plan-phase`, `/gsd:execute-phase`, `/gsd:verify-work`)

## [1.0.1] - 2026-03-06

### Added
- Visual verification with Playwright (`/verify-ui`) using agent-browser with fallback

### Changed
- Updated upstream: Superpowers 4.3.5, Impeccable 1.2.0, simplify renamed to distill

## [1.0.0] - 2026-02-28

Initial release.

- Composite commands: `/plan`, `/build`, `/fix`, `/refactor`, `/verify`, `/resume`, `/new-project`, `/research`
- Design quality: `/critique`, `/polish`, `/normalize`, `/harden`, `/animate`, `/teach-impeccable`
- Engineering discipline: TDD, verification, code review, systematic debugging
- Project tracking: GSD phases, milestones, roadmaps
- Forked upstream: Superpowers 4.3.4, Impeccable 1.1.0, GSD 1.22.4
