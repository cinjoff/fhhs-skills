# Codebase Concerns

**Analysis Date:** 2026-03-12

## Tech Debt

**Plugin Version Sync Risk (RESOLVED):**
- Issue: `plugin.json` and `marketplace.json` can drift in version numbers, breaking updates
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
- Impact: `/fh:update` fails or loads wrong versions; users stuck on outdated plugin
- Current status: Both files at v1.12.5 (in sync). Monitoring required.
- Fix approach: `/release` command enforces dual-file update; pre-release checklist must verify version match in both files before tagging

**Parallel Read Cascade Errors (FIXED in v1.12.5):**
- Issue: Batching optional files with required reads caused cascade cancellations when optional files missing
- Files: `.claude/skills/build/SKILL.md`, `.claude/skills/quick/SKILL.md`
- Impact: Subagent invocations fail with "Cancelled: parallel tool call" when CLAUDE.md or skills/ directory missing
- Resolution: v1.12.5 separates optional reads from required reads in all subagent prompts
- Prevention: All skill dispatches now batch optionals separately or load them conditionally

**GSD Tools Path (FIXED in v1.12.4):**
- Issue: Skills used relative path `./gsd-tools.cjs` instead of `$HOME/` path
- Files: All `.claude/skills/*.md` files that reference gsd-tools
- Impact: "GSD tools not found" errors in user projects when plugin installs outside working directory
- Resolution: v1.12.4 changed all references to `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs`
- Prevention: Symlink created by `/fh:setup` during installation

**Reference Files Not Shipped (FIXED in v1.12.2):**
- Issue: `references/*.md` files (implementer-prompt, spec-gate-prompt) not copied to plugin cache, causing subagent failures
- Files: `references/implementer-prompt.md`, `references/spec-gate-prompt.md`, `references/gsd-state-updates.md`
- Impact: `/build` and `/plan-work` subagent prompts fail with "File does not exist" errors
- Resolution: v1.12.2 ensures all reference files ship with plugin; skill build process copies them into `.claude/skills/` for accessibility
- Prevention: Plugin manifest includes all `references/` files in shipping boundary

**String.replace() Corruption (FIXED in v1.11.2):**
- Issue: `String.replace(pattern, dynamicContent)` interpreted `$&` in minified JS as replacement pattern, corrupting bundled output
- Files: `templates/project-tracker/` (tracker bundling)
- Impact: Build process generates syntactically invalid JavaScript; tracker fails to start
- Resolution: v1.11.2 replaced all dynamic injections with function form: `str.replace(pattern, () => dynamicContent)`
- Prevention: Code review checks for `.replace()` with dynamic/minified content; uses function form exclusively

## Known Bugs

**Tracker Bugs (FIXED in v1.11.0):**
- Symptoms: Concerns count mismatches, milestone names missing, buttons not rendering, body extract truncation
- Files: `templates/project-tracker/` (Preact components)
- Cause: Stale parser state, missing regex boundaries, overflow constraints
- Resolution: v1.11.0 rewrite with tiered caching, regex improvements, grid overflow constraints
- Status: No outstanding tracker bugs reported since v1.11.0

## Architectural Concerns

**Setup Re-linking Shortcut (FIXED in v1.5.1):**
- Issue: `/fh:setup` would skip linking when symlinks already existed, even if target paths changed after plugin upgrade
- Files: `commands/setup.md` (linking logic)
- Impact: After upgrade, old banner scripts remain; "banner script not available" errors
- Resolution: v1.5.1 always re-links to latest cached plugin version, never short-circuits
- Prevention: Linking logic runs unconditionally in setup

**LSP Plugin Dependency (MITIGATED):**
- Risk: TypeScript LSP requires manual two-step install: `npm install -g` + `claude plugin install`
- Files: `commands/setup.md`, `commands/help.md`
- Impact: Users can skip plugin install; workflow loses LSP features (code navigation in `/build`, `/fix`, `/refactor`, `/plan-work`)
- Current mitigation: `/fh:setup` walks through both steps explicitly; documentation emphasizes TypeScript LSP as recommended
- Limitation: No automatic postinstall hooks in Claude Code plugins — can't force plugin install at plugin-install time
- Improvement path: Mention LSP prominently in `/help` and add LSP-optional fallback patterns in skills that need it

**Design System Coupling:**
- Risk: Design skills (`/critique`, `/polish`, `/normalize`) expect `.planning/DESIGN.md` to exist; missing file = degraded quality review
- Files: `.claude/skills/fix/SKILL.md` (Step 3), `.claude/skills/build/SKILL.md` (design gates)
- Impact: Frontend fixes and builds without design context produce inconsistent visuals
- Safeguard: Skills check for DESIGN.md existence; gracefully skip design checks if missing (no blocking)
- Fix approach: `/teach-impeccable` creates DESIGN.md during `/fh:new-project` setup; design skills document fallback behavior clearly

## Security Considerations

**Environment Variable Exposure (PROTECTED):**
- Risk: `.env*` files contain secrets (API keys, database URLs, service credentials)
- Files: `.env`, `.env.local`, `.env.production` (gitignored, not committed)
- Current safeguard: `.gitignore` excludes all `.env*` patterns; no secrets committed
- Dependency: Git hooks enforce this; `/fh:setup` documents secret safety
- Limitation: Subagents can read `.env` files during task execution; must not log or commit them
- Prevention: Implementer prompts warn against `.env` references; skills log only sanitized values

**Seed Data in Fixtures (CONTAINED):**
- Risk: Eval fixture `evals/fixtures/nextjs-app-deep/` contains mock auth tokens, test user data
- Files: `evals/fixtures/nextjs-app-deep/src/lib/auth.ts`, `.planning/STATE.md` (test timestamps)
- Impact: Fixtures could be confused with real project code if accidentally deployed
- Safeguard: Fixtures are test-only, gitignored from main workspace; clearly marked "EVAL FIXTURE"
- Prevention: Fixtures have no production build path; `/fh:new-project` uses separate templates, not fixtures

## Performance Bottlenecks

**Context Budget Distribution:**
- Concern: `/build` orchestrator uses ~15% context, leaves 85% for subagents. Large plans (10+ tasks) may exhaust context midway
- Files: `.claude/skills/build/SKILL.md` (Step 1-6), `references/implementer-prompt.md`
- Problem: Each task dispatch loads full implementer prompt + all CLAUDE.md sections + design context — compounding overhead per task
- Current behavior: Spec gate runs after each wave; if later waves exhaust context, gate becomes unreliable
- Mitigation: Waves are designed shallow (3-4 tasks per wave max); plan checker validates task count pre-build
- Improvement path: Implement task prioritization (high-risk tasks first), lazy-load CLAUDE.md sections (only include relevant parts per task), cache design context once instead of per-task

**Codebase Mapper Parallelization:**
- Concern: `/map-codebase` spawns 4 parallel explorer agents; if codebase is very large (10k+ files), agents may OOM or timeout
- Files: `.claude/skills/map-codebase/SKILL.md` (Step 1)
- Problem: No feedback loop on agent progress; orchestrator waits for all 4 agents before proceeding
- Current behavior: Agents explore independently; results may vary in depth/quality
- Mitigation: Explorers have exploration budgets (max files to read per agent); shallow mode skips deep traversal
- Improvement path: Add agent health monitoring, graceful degradation if agent returns early, parallel result aggregation feedback

## Fragile Areas

**Subagent Interruption Handling:**
- Files: `.claude/skills/build/SKILL.md` (Step 3), `.claude/skills/fix/SKILL.md` (Step 1)
- Why fragile: Subagents can get stuck with "what should I do next?" when task spec is ambiguous. Orchestrator must re-dispatch, but re-dispatch logic is manual (not automated)
- Safe modification: Always include example-driven spec in task prompts; if subagent reports interruption, add a "Decision" checkpoint to clarify ambiguity before re-dispatching
- Test coverage: Evals 39, 56, 89 test recovery from blocked tasks; evals 92-95 test misrouting guards
- Gap: No automated retry logic for interrupted agents — user must manually approve re-dispatch

**GSD State Synchronization:**
- Files: `references/gsd-state-updates.md`, `.claude/skills/build/SKILL.md` (Step 6)
- Why fragile: Multiple skills write to `.planning/STATE.md` and `.planning/ROADMAP.md`. Concurrent writes risk corruption or race conditions
- Safe modification: STATE updates happen only in Step 6 of `/build` (once, after all waves complete); `/fix` updates happen after TDD completes; never during task execution
- Test coverage: Evals 27-29, 50 test corrupted STATE.md recovery; evals 119-121 test phase transitions
- Gap: No file locking; if two orchestrators write simultaneously, last-write-wins silently corrupts state

**Spec Gate Strictness vs. Pragmatism:**
- Files: `references/spec-gate-prompt.md`, `.claude/skills/build/SKILL.md` (Step 3b)
- Why fragile: Spec gate blocks promotion if code deviates from requirements, but "deviation" is subjective. Threshold is set to confidence >= 75 (from feature-dev upstream); lower than typical reviews (80), but still filters out low-signal issues
- Safe modification: Confidence scoring is strict but transparent — each issue includes "Why this matters" section for user context
- Test coverage: Evals 41-45, 51 test spec gate blocking and auto-fix paths
- Gap: Confidence scoring can't account for domain-specific trade-offs (e.g., "it's OK to use this pattern in this codebase")

**Simplify Agent Quality Variance:**
- Files: `.claude/skills/simplify/` (3 parallel agents: reuse, quality, efficiency)
- Why fragile: Each agent has independent prompt; they may contradict or over-count issues. Results depend on agent model variation and prompt randomness
- Safe modification: Simplify runs after waves complete, not during execution — it's advisory, not blocking. User can skip or iterate
- Test coverage: Evals 35-38 test simplify output; eval 62 tests extreme edge case (empty diff)
- Gap: No de-duplication across agent findings; user may see same issue reported 2-3 times

## Dependencies at Risk

**Upstream Version Drift:**
- Risk: Upstream projects (Superpowers v4.3.1, GSD v1.22.4, Impeccable v1.2.0) may release breaking changes; fhhs-skills would need patches
- Files: `COMPATIBILITY.md`, `PATCHES.md`
- Impact: Patches become stale; behavior diverges from upstream
- Current status: Snapshots preserved in `upstream/` for diff tracking; compatibility table documents which versions are locked
- Prevention: PATCHES.md must be reviewed before any upstream bump; COMPATIBILITY.md updated together with PATCHES.md
- Improvement path: Automated upstream version checker (CI) that alerts when new releases available

**TypeScript LSP Plugin Availability:**
- Risk: `typescript-lsp@claude-plugins-official` is first-party Claude plugin; if deprecated, `/fh:setup` installation will fail
- Files: `commands/setup.md` (Step 7), `commands/help.md` (documentation)
- Impact: New users can't install LSP; workflow degrades to grep-based code navigation
- Current status: Plugin is official (maintained by Anthropic); no deprecation planned
- Prevention: `/help` documents LSP as optional (workflow still works without it, just slower)
- Improvement path: Build grep-based fallbacks for all LSP operations

**GSD CLI (bin/gsd-tools.cjs) Maintenance:**
- Risk: gsd-tools.cjs bundles state management, config helpers, template scaffolding. If GSD upstream changes significantly, tool becomes incompatible
- Files: `bin/gsd-tools.cjs` (v1.22.4 from upstream/gsd-1.22.4/)
- Impact: `/plan-work`, `/build`, `/fix` state operations fail; phase management breaks
- Current status: Bundled snapshot from GSD v1.22.4; no live dependency
- Limitation: Can't get GSD bug fixes without re-bundling entire tool
- Prevention: `/release` process includes GSD tool version check; release notes document version
- Improvement path: Consider splitting state management into minimal fhhs-specific layer to reduce GSD dependency

## Test Coverage Gaps

**Plugin-Level Integration Tests (MISSING):**
- What's not tested: End-to-end plugin installation, `/fh:setup` tooling verification, cross-plugin interactions
- Files: `evals/evals.json` (118 evals exist, but few test setup/installation paths)
- Risk: Plugin may fail to install or symlink correctly on certain platforms; users discover via broken `/fh:help`
- Coverage: Evals 1-5 test setup commands; eval 1 tests `/fh:setup` itself
- Gap: No eval tests Windows-specific setup behavior; no eval tests symlink collision handling

**Subagent Failure Recovery (PARTIAL):**
- What's not tested: PARALLEL debugger agents failing independently (eval 23 is isolated); some edge cases in BLOCKED report handling
- Files: `.claude/skills/fix/SKILL.md` (Step 1), `.claude/skills/build/SKILL.md` (Step 3)
- Risk: Multi-subsystem bugs where one debugger fails could leave inconsistent state
- Coverage: Evals 22-24 test PARALLEL path; eval 92-95 test failure recovery and misrouting
- Gap: No eval tests cleanup after interrupted PARALLEL agents

**Design System Validation (MINIMAL):**
- What's not tested: Frontend code that violates design system after `/normalize`; visual regression between versions
- Files: `skills/frontend-design/` (reference-only, no executable checks)
- Risk: Design drifts over time; `/normalize` may not catch all inconsistencies
- Coverage: Design skills have thin assertions (2-3 vs 15+ for `/build`)
- Gap: No visual regression tests; design assertions recently enriched in v1.12.5 to 5+ per skill

**Eval Coverage Improvement Plan (IN PROGRESS):**
- Current status: 130 evals (105 baseline + 18 skill-specific + 7 fixture-backed evals 106-130)
- Gaps addressed in recent commits: 5 previously uncovered skills, failure recovery, state corruption scenarios
- Outstanding: No evals for `/secure` OWASP scan detail (e.g., SQL injection detection); no evals for TypeScript strictness violations
- Plan: Evals 131-140 target security detail; evals 141-145 target TS strictness edge cases

## Scaling Limits

**Parallel Subagent Scaling:**
- Current capacity: `/build` supports up to ~10 tasks per wave (4 subagents in parallel per wave is typical)
- Limit: Beyond 10 tasks, orchestrator context usage climbs; wave tracking becomes error-prone
- Scaling path: Implement task batching (group small tasks), multi-wave chains (pipelined waves), and deeper parallelism (more subagents per wave with careful context budgeting)

**Codebase Size:**
- Current capacity: `/map-codebase` tested up to ~2,000 files; 4 parallel explorers scale well
- Limit: Monorepos with 10k+ files may cause explorer timeouts or incomplete traversal
- Scaling path: Implement directory-first filtering (let user specify exploration scope), agent batching (more agents for larger codebases), and streaming results (don't wait for all agents)

**Phase Count in ROADMAP:**
- Current capacity: Tested up to 15 phases; UI updates are O(n)
- Limit: 30+ phases may cause phase tracking slowness; milestone rendering lags in tracker UI
- Scaling path: Phase grouping (collapse completed phases), lazy loading in tracker, pagination

## Missing Critical Features

**Automated Rollback (NOT IMPLEMENTED):**
- Problem: `/build` can fail mid-wave; no automatic rollback to pre-build state
- Blocks: Complex multi-phase builds that must be atomic
- Workaround: User manually `git revert` or uses `git worktree` to isolate changes
- Fix approach: Capture pre-build SHA in Step 3, offer "Rollback to {SHA}" button if build fails
- Complexity: Medium (requires worktree cleanup, state reset)

**Dependency Upgrade Automation (NOT IMPLEMENTED):**
- Problem: No built-in command to audit, update, or bump npm/pip dependencies
- Blocks: Keeping dependencies current, security patching workflow
- Workaround: Manual `npm update` or `npm audit fix`
- Fix approach: New `/upgrade-deps` command that runs audit, proposes updates, creates PR with changelog
- Complexity: High (requires testing updated versions, changelog generation, security assessment)

**Visual Regression Tests (NOT IMPLEMENTED):**
- Problem: No automated visual diff checks between builds
- Blocks: Design changes that create unintended visual drift
- Workaround: `/verify-ui` screenshots (manual inspection)
- Fix approach: Integrate with screenshot service (Percy, Chromatic); track diffs between branches
- Complexity: High (external service integration, baseline management)

---

*Concerns audit: 2026-03-12*
