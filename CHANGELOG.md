# Changelog

All notable changes to fhhs-skills will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries affecting `/fh:setup` or `/fh:new-project` environment carry reconciliation tags
(`[setup:TYPE:ID]`, `[project:TYPE:ID]`) used by `/fh:update` for post-update checks.

## [1.42.0] - 2026-03-28

### Added
- **Local Supabase via OrbStack** — `/fh:new-project` now offers local/cloud/both Supabase modes when database is needed. Local mode auto-detects container runtime (OrbStack preferred on macOS, Docker fallback), configures `DOCKER_HOST` for OrbStack, installs Supabase CLI, runs `supabase init` + `supabase start`, checks for existing migrations, and generates `.env.local` with local credentials. Adds `db:start`, `db:stop`, `db:reset` package.json scripts. [setup:tool:orbstack] [setup:tool:supabase]
- **Container runtime detection in `/fh:setup`** — prerequisite check now detects Docker/OrbStack/Supabase CLI and recommends OrbStack on macOS for ~2x less power usage
- **Supabase drift detection in `/fh:update`** — Step 5b½ checks `DOCKER_HOST` configuration, OrbStack socket, Supabase CLI availability, and container running status during environment reconciliation
- **Auto-start Supabase in Conductor** — `conductor.json` setup script now starts Supabase containers automatically when `supabase/config.toml` exists
- **6 new evals** covering OrbStack/Supabase local setup flows (IDs 261-266): happy-path local setup, Docker Desktop fallback, cloud-only mode, auto-mode defaults, update drift detection, and migration handling

### Changed
- **`/fh:new-project` sync mode** now checks local Supabase container status, cloud Supabase configuration, and container runtime availability separately
- **OrbStack research** — comprehensive documentation scraped and indexed at `.planning/research/orbstack-supabase-RESEARCH.md`

## [1.41.2] - 2026-03-28

### Changed
- **Global tracker install** — tracker dashboard now installs globally at `~/.claude/tracker/` instead of per-project `.project-tracker/`, shared across all projects. `/fh:update` reconciliation refreshes from the global location.

### Fixed
- **`/fh:update` tracker refresh** — post-update reconciliation now refreshes tracker template files when the plugin version changes, so dashboard redesigns are picked up without manually re-running `/fh:tracker`
- **`/fh:update` CLAUDE_MEM_PROJECT** — post-update reconciliation now sets `CLAUDE_MEM_PROJECT` in project-local `.claude/settings.json` derived from `git rev-parse --show-toplevel`, fixing observation misattribution in interactive Conductor sessions [setup:env:CLAUDE_MEM_PROJECT]

## [1.41.0] - 2026-03-28

### Changed
- **Tracker dashboard redesign** — Linear-inspired UI with OKLCH color system, workspace-grouped sidebar, portfolio summary, phase grid with expandable tasks, activity feed, and cost chart using Chart.js
- **`/fh:update` cross-worktree reconciliation** — when the plugin is already current, still runs environment reconciliation to catch gaps from updates applied in a different worktree

## [1.40.0] - 2026-03-28

### Added
- **Parallel wave builds** — auto-orchestrator executes build tasks concurrently within each wave, reducing multi-task phase build time
- **Micro eval tier** — `--tier micro` runs only the fastest subset of evals for rapid iteration loops
- **Auto-improve script** — `auto-improve.sh` iteratively runs evals, analyzes failures, and applies fixes
- **Context-sharing in auto pipeline** — unified claude-mem patch with `CLAUDE_MEM_PROJECT` env var ensures observations are attributed to the correct project across worktrees; `ctx_search`-first strategy reduces redundant file reads
- **Multi-project tracker** — `/fh:tracker` discovers Conductor workspaces automatically, supports project registration via `/api/register`, and serves a three-column dashboard with decision workflow
- **Auto pipeline dashboard** — wave-centric pipeline visualization with live activity feed, cost charts, and step timeline in the project tracker
- **Testing enforcement** — build pipeline generates test specs before execution, tracks `spec_tests_count` in summaries, and references a testing manifesto for quality standards
- **Eval quality infrastructure** — tiered suites (smoke/micro/full), deterministic assertion checks (`required_terms`, `forbidden_terms`, `regex`), baseline tracking, and new fixtures (broken-project, minimal-gsd, nextjs-app-deep)
- **Strategic decision recording** — decisions now capture alternatives considered and impact categories
- **Per-directory CLAUDE.md files** — AI context documents across skills, agents, evals, and templates directories
- **Codebase mapping refresh** — updated architecture, concerns, conventions, integrations, stack, structure, and testing documentation

### Fixed
- **Tracker ProjectTree props** — wired up component interface correctly and fixed workspace name display
- **Build Step 2.5 ordering** — moved pre-wave-1 test creation gate before first wave execution
- **Eval #168 schema mismatch** — aligned assertion field names with actual `test_metrics` output
- **Tracker input validation** — `/api/register` validates path input and enforces body size limits
- **Auto-orchestrator review findings** — DRY improvements, decision format consistency, resume reliability, and pre-index correctness

## [1.39.0] - 2026-03-28

### Added
- **Startup validation skills** — 5 new skills for pre-building startup validation: `/fh:startup-design` (8-phase idea-to-validated-plan), `/fh:startup-competitors` (battle cards, pricing landscape, feature matrix), `/fh:startup-positioning` (April Dunford framework, Moore statement, category analysis), `/fh:startup-pitch` (5 pitch formats + investor roleplay practice), `/fh:startup-advisor` (conversational advisor with 12 curated decision frameworks + web search fallback)
- **Startup-to-project bridge** — `/fh:new-project` Step 0.5 detects `.planning/startup/` artifacts and auto-populates project vision, scope, and constraints from validated startup data
- **Startup context in planning** — `/fh:plan-work` indexes `.planning/startup/` as domain context; `/fh:auto` pre-indexes startup artifacts for each phase and suggests startup skills when no project exists

## [1.38.0] - 2026-03-27

### Added
- **`.planning/` health check in `/fh:update`** — after post-update reconciliation, suggests running `/fh:health --repair` if the project has an existing `.planning/` directory that may have structural issues from older plugin versions or plain GSD

## [1.37.1] - 2026-03-27

### Fixed
- **`/fh:update` marketplace staleness** — refreshes marketplace immediately before running `claude plugin update`, preventing stale cached metadata from causing the wrong version to install

## [1.37.0] - 2026-03-27

### Added
- **Configurable model profiles** — `/fh:new-project` now asks which model profile to use (Balanced, Budget, or Quality) with token cost context. `/fh:build` and `/fh:progress` resolve models from config instead of hardcoding Opus/Sonnet. `/fh:settings` updated for consistency

## [1.36.0] - 2026-03-27

### Added
- **`/fh:learnings` skill** — analyzes cross-project claude-mem observations to surface workflow insights (wins and productive patterns first), then auto-files GitHub issues on the fhhs-skills repo for skill bugs, workflow gaps, feature ideas, and common mistakes. Supports `--dry-run` and `--days N` flags. Suggests claude-mem dashboard for deeper exploration [setup:plugin:claude-mem@thedotmack]

## [1.35.0] - 2026-03-27

### Added
- **Strategic workshop in `/fh:auto`** — autonomous execution now includes a strategic planning workshop that aligns vision, constraints, and phased execution before building
- **Firecrawl + MCP context7 in researchers** — project and phase researcher agents use Firecrawl for web research and context7 for library documentation, producing higher-quality research outputs
- **Self-healing `/fh:update`** — post-update reconciliation auto-installs missing tools, plugins, env vars, hooks, and config instead of telling users to re-run `/fh:setup` or `/fh:new-project`
- **Release reconciliation tag audit** — release process verifies changelog entries carry setup/project tags so `/fh:update` can always close gaps for new requirements
- **Release README update step** — release process checks whether new skills, integrations, or behavior changes need README updates

### Fixed
- **Research pipeline** — fixes to researcher agent dispatch and output collection in the autonomous pipeline

## [1.34.1] - 2026-03-27

### Fixed
- **shadcn skills detection** — `/fh:setup` checks correct install path (`~/.agents/skills/shadcn` instead of `~/.skills/shadcn`) and uses non-interactive flags (`-g -y --all`) to prevent interactive mode prompts
- **Vercel worktree linking** — `/fh:new-project` moves `.vercel` to main repo and symlinks back after `vercel link` in worktrees, so config survives archival and is available to future worktrees. Sync mode also checks `$CONDUCTOR_ROOT_PATH/.vercel`

## [1.34.0] - 2026-03-27

### Added
- **Pipeline quality gates** — `/fh:build` now runs Gate 0 (fallow blast-radius integration check), Gate 1.5 (OWASP security review at phase completion), and Gate 3 architecture artifact refresh (FLOWS.md + ERD.md regeneration) [setup:tool:fallow]
- **Impact Radius Analysis** — `/fh:plan-review` Section 4 runs batch fallow analysis on `files_modified`, classifies blast radius (CRITICAL/HIGH/MEDIUM/LOW by fan-in), cross-references FLOWS.md user journeys, and flags untested downstream consumers
- **PROJECT_CONSTRAINTS injection** — `/fh:build` extracts project gotchas from CLAUDE.md and injects them as imperative constraints into implementer subagent prompts (max 15 lines)
- **Architecture Artifacts Check** — `/fh:plan-review` pre-review audit warns when FLOWS.md/ERD.md are missing and suggests `/fh:map-codebase`

### Changed
- **`/fh:map-codebase`** — now generates FLOWS.md (user journey diagrams with dynamic guard discovery) and ERD.md (entity-relationship diagrams from Supabase migrations) with empty-project graceful handling

## [1.33.0] - 2026-03-27

### Added
- **Cross-session memory lifecycle** — 8 skills (fix, review, plan-review, refactor, audit, optimize, secure, research) now read past learnings at session start and persist key findings at session end via structured semantic markers that claude-mem auto-captures [setup:plugin:claude-mem@thedotmack] [setup:plugin:context-mode@context-mode]
- **Context-mode acceleration** — refactor, audit, optimize, secure, and research skills use `ctx_batch_execute` to index large analysis output and `ctx_search` to distill findings without flooding the context window
- **Shared context in `/fh:auto`** — headless pipeline loads context-mode and claude-mem MCP plugins into each `claude -p` session, sharing an FTS5 database across plan-work → plan-review → build → review via deterministic `CLAUDE_SESSION_ID`

### Changed
- **README rewrite** — new "Why" section with value propositions, memory lifecycle diagram, plugin integration map; pipeline diagrams collapsed; 557 → 304 lines
- **`/fh:update` Conductor fallback** — detects when `claude plugin update` fails (common in Conductor workspaces) and prompts user to run the command from a separate terminal
- **`/fh:build` placeholder injection** — restores `{DESIGN_DECISIONS}` and `{CLAUDE_MD_SECTIONS}` injection with ctx_search fallback for agents without plugins

### Fixed
- **Setup summary missing context-mode** — `/fh:setup` Step 10 status table now shows context-mode installation status alongside claude-mem

## [1.32.2] - 2026-03-27

### Fixed
- **`/fh:auto` headless sessions** — corrects `claude -p` invocation: removes unsupported `--cwd` flag, adds `--plugin-dir` for skill access, enables `bypassPermissions` mode to prevent interactive hangs, fixes `gsd-tools.cjs` path resolution, and enriches step prompts with phase goal and system context

## [1.32.1] - 2026-03-27

### Fixed
- **Conductor workspace project identity** — adds `CLAUDE_CWD` to conductor.json setup script so plugins like claude-mem identify projects by repo name instead of workspace directory name [setup:env:CLAUDE_CWD]

## [1.32.0] - 2026-03-27

### Added
- **Continuous improvement loop** — SessionStart hook (`fhhs-learnings.js`) reads a learnings digest and surfaces top improvement items automatically at session start; say `improve N` to address items via background agents with scope-appropriate process (direct fix / plan+build / plan+review+build)
- **Learnings digest generation** — `/fh:build` generates a learnings digest from claude-mem observations after every successful build; context monitor triggers digest write at WARNING threshold
- **Past learnings in `/fh:plan-work`** — research step queries claude-mem for past mistakes and pitfalls relevant to the current task before designing

### Changed
- **claude-mem auto-CLAUDE.md recommended** — `/fh:setup` now recommends keeping `FOLDER_CLAUDEMD_ENABLED=true` since claude-mem's observations complement fhhs-skills' CLAUDE.md content
- **Context monitor digest timing** — digest generation instruction moved from CRITICAL to WARNING threshold for better context budget

### Fixed
- **Learnings hook robustness** — guards against null/undefined items, missing summaries, `generated` vs `generated_at` field name mismatch, and misleading "addressed recently" stat (now uses `stats.addressed_since_last`)

## [1.31.0] - 2026-03-27

### Added
- **Changelog-driven reconciliation in `/fh:update`** — post-update Step 5 now checks tagged changelog entries deterministically via `gsd-tools.cjs changelog reconcile` instead of reading setup.md (894 lines) and new-project.md (16K+ tokens), eliminating ~17K tokens per update
- **Reconciliation tag convention in `/release`** — changelog entries affecting `/fh:setup` or `/fh:new-project` environment now carry `[setup:TYPE:ID]` tags for automated post-update checks

### Fixed
- **Shell portability in `/fh:review`** — removes `DIFF_EXCLUDE` variable pattern that broke in fish shell; pathspec exclusions are now literal arguments on every `git diff` command
- **Unquoted diff range in `/fh:secure`** — quotes `"$MERGE_BASE..HEAD"` to prevent word-splitting across shells

## [1.30.0] - 2026-03-27

### Added
- **Brownfield sync mode for `/fh:new-project`** — detects existing `.planning/` and fills gaps instead of refusing to run, covering planning files, GSD tooling, codebase mapping, observability, and infrastructure status

### Fixed
- **`shadcn init` hangs in automated flows** — adds `--yes` flag to all `npx shadcn@latest init` commands in `/fh:new-project`
- **`config.json` not created during project init** — greenfield Step 7 now calls `config-ensure-section` to write the file (previously only printed context to stdout)
- **Missing `plan_limits` in config defaults** — `config-ensure-section` now includes `plan_limits` matching the runtime defaults, so the property is persisted when creating new projects
- **Dead computation in `config-ensure-section`** — early-exit guard for existing configs moved before Brave key detection and defaults loading

## [1.29.1] - 2026-03-27

### Fixed
- **`better-sqlite3` setup in `/fh:new-project`** — adds `npx prebuild-install` step to download pre-compiled native bindings, fixing setup failures when the `.node` binary isn't compiled during install. Troubleshooting note added to `/fh:observability` as well.

## [1.29.0] - 2026-03-27

### Added
- **`.planning/` indexing in context-mode** — `/fh:map-codebase` now indexes PROJECT, ROADMAP, STATE, DESIGN, REQUIREMENTS, and DECISIONS into FTS5 alongside codebase docs, with manifest-based cache invalidation
- **Background re-indexing in `/fh:progress`** — stale `.planning/` files are re-indexed via a fire-and-forget haiku subagent at session start, zero blocking
- **Auto map-codebase after scaffold** — `/fh:new-project` runs `/fh:map-codebase` automatically when using the default starter template (Step 8¾), making context-mode immediately valuable

### Changed
- **Build pipeline** — 9 steps reduced to 7. Spec gate moved to `/fh:review` Step 1.8, design gates folded into phase completion, subagents pinned to `model: sonnet`
- **Review restructured** — security scan removed from default pipeline (use `/fh:secure`), spec verification added, 3 agents reduced to 2 (quality + gap)
- **Simplify consolidated** — 3 parallel agents replaced with 1 sequential agent applying 3 lenses (reuse, quality, efficiency)
- **DIFF_EXCLUDE everywhere** — `.planning/`, lockfiles, `.next/`, source maps stripped from all git diffs across build, review, simplify, fix
- **21 skills marked `disable-model-invocation`** — prevents auto-detection waste, saves 1.5-2.5k tokens/session

### Removed
- **`/fh:quick`** — quick tasks now handled by simplified `/fh:plan-work` flow

## [1.28.0] - 2026-03-26

### Added
- **`/fh:auto` — autonomous multi-phase execution** — plans, reviews, builds, and reviews each phase without human intervention using `claude -p` for process-isolated sessions
- **`/fh:new-project --auto`** — derives vision, tech stack, and roadmap from a project description, then hands off to `/fh:auto` to build every phase
- **DECISIONS.md audit trail** — every autonomous decision is logged with confidence levels, affected artifacts, and correction format. LOW confidence decisions flagged with `NEEDS REVIEW`
- **Crash recovery** — orchestrator saves state to `.auto-state.json` between steps; `--resume` picks up where a crashed run left off
- **Stuck detection** — soft timeout at 10min (warning), hard timeout at 45min (kill + logged decision), max 2 retries per step
- **Cost tracking** — estimates token usage per session, enforces `--budget` ceiling with graceful stop
- **Decision correction cascade** — `--check-corrections` reads CORRECTED decisions, identifies downstream artifacts, auto-fixes mechanical changes and produces correction plans for architectural ones
- **DECISIONS.md awareness across pipeline** — plan-review cross-checks decisions, spec gate verifies Affects fields, build filters decisions by phase for subagent injection, plan-work dedup guard prevents re-deciding

### Fixed
- **Phase completion gating** — phases only marked complete when critical steps (plan-work, plan-review, build) all succeed
- **Orchestrator crash recovery** — missing artifact verification treated as step failure with decision logging instead of fatal exit
- **CLI argument validation** — guards against missing values for `--project-dir`, `--start-phase`, `--end-phase`, `--budget`

## [1.27.1] - 2026-03-26

### Fixed
- **Package manager detection** — `/fh:new-project` detects pnpm/yarn/bun from lockfile instead of hardcoding npm, fixing sentry-local `better-sqlite3` native binding failures on pnpm projects
- **Native binding rebuild** — adds explicit `$PM rebuild better-sqlite3` step after install to ensure `.node` binary compiles for the current platform

### Changed
- **Default package manager** — new projects without a lockfile default to pnpm instead of npm

## [1.27.0] - 2026-03-26

### Added
- **Better Auth env setup** — `/fh:new-project` generates `BETTER_AUTH_SECRET` and writes auth env vars to `.env.local` automatically
- **Resend CLI integration** — guides user through Resend signup, authenticates CLI, and creates a project-scoped sending key for transactional email
- **Organization opt-in** — asks if user wants multi-tenant support and sets `ENABLE_ORGANIZATIONS=true` in `.env.local`
- **shadcn skills auto-install** — installs shadcn/ui agent skills globally (`~/.skills/shadcn`) when using the default stack

## [1.26.0] - 2026-03-26

### Added
- **Fallow static analysis in setup** — `/fh:setup` Step 8 installs Fallow with package manager detection (pnpm/yarn/npm) [setup:tool:fallow]
- **Fallow in fix skill** — `/fh:fix` runs `fallow check` + `fallow health` before triage for deterministic dead-code, circular dependency, and complexity findings
- **Supabase DATABASE_URL with pooler** — `/fh:new-project` resets the DB password after Supabase setup and writes `DATABASE_URL` with the pooler connection string to `.env.local` and Vercel

### Changed
- **Worktree .env.local sync** — Conductor setup scripts use `ln -sf` instead of `cp` for `.env.local` and `.vercel/`, keeping all worktrees in bidirectional sync
- **Setup step numbering** — Fallow is Step 8, Conductor is Step 9, Summary is Step 10

## [1.25.0] - 2026-03-26

### Added
- **Brand-aware shadcn preset generation** — `/fh:new-project` Step 2b extracts colors, fonts, and style from user-provided references (websites, images, brand guidelines) and generates a shadcn preset with a live preview URL at `ui.shadcn.com/create`
- **Task tracking in setup** — `/fh:setup` enables `CLAUDE_CODE_ENABLE_TASKS` for native task tracking used by `/fh:plan-work` and `/fh:build` [setup:env:CLAUDE_CODE_ENABLE_TASKS]

### Changed
- **Setup LSP guidance** — improved instructions for Conductor and non-interactive environments
- **Update skill** — expanded flow with better version detection and fallbacks
- **Help command table** — consolidates `/fh:add-todo` and `/fh:check-todos` into `/fh:todos`

### Fixed
- **Upstream registry path** — corrects `forked_to` path for revise-claude-md

### Removed
- **Duplicate `commands/` directory** — files already shipped under `.claude/skills/` and `.claude/commands/`

## [1.24.6] - 2026-03-26

### Fixed
- **Starter template cloning** — pulls template files into existing repos via clone+rsync instead of `gh repo create --template` which fails when a repo already exists
- **Template ordering** — moves template scaffolding before Supabase setup so `supabase init` runs on top of a real Next.js project
- **Vercel worktree compatibility** — works around Vercel CLI rejecting `.git` files in git worktrees by temporarily symlinking to the real git dir
- **`vercel env add` flags** — removes invalid `--yes` flag that caused errors
- **Worktree env sharing** — copies `.env.local` and `.vercel/` to the main repo so future worktrees have access

## [1.24.5] - 2026-03-26

### Changed
- **Supabase project creation** — defaults project name to the repo name instead of requiring manual input

## [1.24.4] - 2026-03-26

### Fixed
- **Skill visibility** — corrected `user-invokable` typo to `user-invocable` across all 43 skills so internal skills no longer appear in the `/` menu

## [1.24.3] - 2026-03-26

### Changed
- **`/fh:update` simplified** — uses plain `claude plugin update` instead of uninstall+reinstall workaround

## [1.24.2] - 2026-03-26

### Fixed
- **Skills discovery** — plugin manifest now declares the correct skills path so all shipped skills are discoverable
- **Private commands** — `audit-upstream` and `sync-upstream` no longer exposed to plugin users

## [1.24.1] - 2026-03-26

### Fixed
- **Broken skill registration after update** — `/fh:update` now uses uninstall+reinstall cycle to clear stale cached skill names and `gitCommitSha`, ensuring all skills appear under `/fh:` prefix
- **`/fh:audit-upstream` missing from slash commands** — added missing `fh:` name prefix and `user-invokable` field
- **`/fh:ui-branding` missing from slash commands** — fixed `user-invocable` typo to `user-invokable`
- **Old version cache accumulation** — `/fh:update` now cleans up previous version caches

## [1.24.0] - 2026-03-26

### Added
- **Starter template for `/fh:new-project`** — default stack projects clone from [cinjoff/fh-starter-project](https://github.com/cinjoff/fh-starter-project) instead of starting from scratch; Phase 1 focuses on app-specific setup rather than scaffolding
- **Fallow static analysis in `/fh:review`, `/fh:simplify`, `/fh:build`** — deterministic dead-code detection, circular dependency analysis, and code duplication when Fallow CLI is installed
- **`/fh:audit-upstream` overhaul** — structured capability index with integration opportunity tracking

### Changed
- **`/fh:new-project` Phase 1 naming** — "Core app setup" when using starter template, "Project scaffolding and core setup" for custom stacks

## [1.23.0] - 2026-03-25

### Added
- **Research agent integration in `/fh:plan-work`** — complex tasks spawn `gsd-phase-researcher` for deep domain research with confidence gates; medium tasks use inline research subagents
- **Domain research in `/fh:new-project`** — optional Step 5 spawns parallel project researchers (Features, Pitfalls, and conditionally Stack/Architecture), synthesizes results, and feeds them into requirements definition
- **Research-aware `/fh:plan-review`** — loads RESEARCH.md and verifies plan alignment with research findings (stack, pitfalls, hand-rolled solutions)
- **Respect-but-flag protocol** — plan-review respects locked decisions by default but may surface evidence-based concerns for user decision
- **CONTEXT.md contract** — 3 canonical sections (Decisions, Discretion Areas, Deferred Ideas) enforced across the core loop with contract block in plan-work
- **Complexity assessment in `/fh:plan-work`** — Step 0.5 evaluates task scope and suggests appropriate research/review depth
- **Engineering review in `/fh:plan-review`** — architecture, code quality, tests, and performance sections complement existing business alignment review
- **Verification gates in `/fh:build` and `/fh:fix`** — no success claims without fresh test/build/lint evidence
- **Design quality suggestions in `/fh:build`** — suggests `/fh:audit` for frontend-heavy builds and `/fh:harden` for production-bound work
- **`/fh:audit-upstream` skill** — maintains upstream capability index after syncs
- **Upstream sync validation** — pre-validation, git checkpoint, and post-sync regression detection in `/fh:sync-upstream`
- **16 new evals** (IDs 198-213) covering complexity assessment, decision-locking, engineering review, verification gates, and contract alignment

### Changed
- **Unified CONTEXT.md sections** — replaces fragmented naming (Design Decisions, Review Decisions, Locked Decisions, NOT in scope) with 3 canonical sections aligned to CLI template
- **plan-review updates Decisions directly** — appends with `[review]` prefix instead of separate Review Decisions section

### Fixed
- **Corrupted eval 17** — corrected expected_output
- **16 missing COMMAND_MAP entries** — adds entries for all shipped skills, removes stale resume-work
- **Upstream registry paths** — corrects forked_to paths for shipped skills

## [1.22.2] - 2026-03-25

### Fixed
- **Internal skills no longer exposed to users** — renames SKILL.md to PROMPT.md for 80+ internal/upstream skills so Claude Code's scanner doesn't discover them as user-invokable commands
- **`resume-work` removed** — functionality merged into `/fh:progress`
- **`playwright-testing` and `nextjs-perf` hidden from picker** — kept as internal reference prompts loaded by `/fh:build` and `/fh:fix`

## [1.22.1] - 2026-03-25

### Fixed
- **Plugin fails to load on latest Claude Code** — removed `skills` field from plugin.json manifest; Claude Code now rejects string paths and auto-discovers `.claude/skills/` instead

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
- **shadcn/ui skills in `/fh:setup`** — installs `shadcn/ui` skills (`npx skills add shadcn/ui`) giving agents context for components, CLI, and registry workflows [setup:dir:~/.skills/shadcn]
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
- **claude-mem in `/fh:setup`** — setup now installs claude-mem plugin automatically for persistent session memory across conversations [setup:plugin:claude-mem@thedotmack]

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
