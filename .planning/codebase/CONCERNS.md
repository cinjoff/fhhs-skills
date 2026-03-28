# Codebase Concerns

**Analysis Date:** 2026-03-27

## Tech Debt

**Duplicated utility functions across auto-orchestrator and core CLI:**
- Issue: `comparePhaseNum`, `normalizePhaseName`, and `findPhaseDir` are reimplemented in both `bin/lib/core.cjs` and `.claude/skills/auto/auto-orchestrator.cjs` instead of sharing from a single source
- Files: `bin/lib/core.cjs` (lines 193-228, 230-273), `.claude/skills/auto/auto-orchestrator.cjs` (lines 147-192)
- Impact: Bug fixes to phase comparison logic must be applied in two places. Divergence risk is high since they are slightly different implementations (e.g., the auto-orchestrator version uses `Number()` instead of `Number.isFinite` for decimal parts)
- Fix approach: The auto-orchestrator runs in the installed plugin context where `bin/` is not available. Either (a) move shared utilities into `.claude/skills/auto/lib/` and have both import from there, or (b) inline the orchestrator's copy but add a comment anchoring it to the canonical implementation

**No unit tests for CLI tooling (gsd-tools):**
- Issue: The `bin/lib/` directory contains 5,827 lines of JavaScript across 12 modules with zero unit tests. Only `templates/project-tracker/parser.test.cjs` has tests, and it covers a template parser not used by the core CLI
- Files: `bin/lib/core.cjs`, `bin/lib/state.cjs`, `bin/lib/phase.cjs`, `bin/lib/verify.cjs`, `bin/lib/init.cjs`, `bin/lib/commands.cjs`, `bin/lib/roadmap.cjs`, `bin/lib/frontmatter.cjs`, `bin/lib/milestone.cjs`, `bin/lib/changelog.cjs`, `bin/lib/template.cjs`, `bin/lib/config.cjs`
- Impact: Regressions in phase numbering, frontmatter parsing, state updates, or roadmap manipulation can go unnoticed. The eval suite (`evals/evals.json`) tests behavioral outcomes of skills but does not exercise the CLI modules directly
- Fix approach: Add a test runner (vitest or plain Node test runner) with unit tests for critical functions: `comparePhaseNum`, `normalizePhaseName`, `loadConfig`, `extractFrontmatter`, `reconstructFrontmatter`, frontmatter CRUD, and state update operations

**Large monolithic CLI router:**
- Issue: `bin/gsd-tools.cjs` is a 639-line switch statement routing to 12 modules. The arg-parsing logic is repeated per-command with manual `indexOf` patterns
- Files: `bin/gsd-tools.cjs`
- Impact: Adding new commands requires duplicating the same arg-parsing boilerplate. Easy to introduce bugs (e.g., forgetting to handle `--raw`, missing value after flag)
- Fix approach: Extract a lightweight arg-parser helper or adopt a minimal CLI framework. Low priority since the router works and changes are infrequent

## Known Bugs

**Regex `.test()` then `.replace()` with global flag resets lastIndex:**
- Symptoms: In `bin/lib/milestone.cjs` (line 44-45), `checkboxPattern.test(reqContent)` advances `lastIndex` for the global regex, then `reqContent.replace(checkboxPattern, ...)` starts from the advanced position, potentially missing the first match
- Files: `bin/lib/milestone.cjs` (lines 40-57)
- Trigger: When the first requirement ID in the file matches, `.test()` moves `lastIndex` past it, so `.replace()` may skip it
- Workaround: The code partially handles this for the table pattern (line 52-54, recreating the regex) but not for the checkbox pattern on line 45. Reset `checkboxPattern.lastIndex = 0` before `.replace()`, or use a non-global regex for the `.test()` check

## Security Considerations

**Auto-orchestrator runs with `--permission-mode bypassPermissions`:**
- Risk: The `auto-orchestrator.cjs` spawns `claude -p` with `--permission-mode bypassPermissions` (line 362), giving spawned sessions unrestricted tool access. A malicious or confused plan could execute arbitrary shell commands, delete files, or push to remote repos
- Files: `.claude/skills/auto/auto-orchestrator.cjs` (line 362)
- Current mitigation: The orchestrator is gated behind explicit `/fh:auto` invocation and cost budget. DECISIONS.md provides an audit trail
- Recommendations: (1) Document the security model in the SKILL.md so users understand what `bypassPermissions` means. (2) Consider an allowlist-based permission mode if Claude Code supports it in future. (3) Add a `--safe-mode` flag that uses `acceptEdits` instead of `bypassPermissions` for less risky runs

**Shell command construction in `execGit` and `isGitIgnored`:**
- Risk: `isGitIgnored` in `bin/lib/core.cjs` (line 156) sanitizes paths with a character allowlist (`/[^a-zA-Z0-9._\-/]/g`), and `execGit` (line 168-170) uses shell-safe escaping. However, `isGitIgnored` strips characters silently rather than erroring, which could cause false negatives on paths with special characters
- Files: `bin/lib/core.cjs` (lines 150-164, 166-185)
- Current mitigation: The character stripping in `isGitIgnored` is conservative. `execGit` properly quotes arguments with single quotes and escapes embedded single quotes
- Recommendations: Use `execFileSync` with argument arrays instead of string concatenation to eliminate injection surface entirely

**Cost estimation is heuristic-based and unbounded:**
- Risk: The auto-orchestrator's cost tracking (`estimateSessionCost` in `auto-orchestrator.cjs` lines 248-254) uses rough `4 chars/token` heuristic with hardcoded Opus pricing. Actual costs could be significantly higher than estimates, and the budget check may not halt execution promptly
- Files: `.claude/skills/auto/auto-orchestrator.cjs` (lines 37-43, 248-254)
- Current mitigation: Budget is optional and advisory
- Recommendations: Add a warning when estimated cost exceeds 80% of budget. Consider using Claude API's actual usage reporting if available

## Performance Bottlenecks

**Synchronous file I/O throughout CLI:**
- Problem: All file operations in `bin/lib/*.cjs` use synchronous `fs.readFileSync`/`fs.writeFileSync`. For single-file operations this is fine, but `init` commands that read 5-10 files serially could benefit from parallel reads
- Files: `bin/lib/init.cjs`, `bin/lib/verify.cjs`, `bin/lib/state.cjs`
- Cause: CLI was designed for simplicity; async would add complexity
- Improvement path: Low priority. The CLI runs as a subprocess from Claude Code, and total I/O is small (reading markdown files). Only matters if users report slow `gsd-tools init` commands

**`init.cjs` spawns `find` subprocess for language detection:**
- Problem: `cmdInitMapCodebase` (line 174) runs `find . -maxdepth 3 ... | grep -v node_modules | head -5` via `execSync` to detect source files. On large repos, this could be slow
- Files: `bin/lib/init.cjs` (line 174)
- Cause: Quick heuristic approach, not a concern for typical repos
- Improvement path: Replace with `fs.readdirSync` recursive walk with early termination. Low priority

## Fragile Areas

**ROADMAP.md regex-based parsing:**
- Files: `bin/lib/core.cjs` (lines 349-381), `bin/lib/roadmap.cjs`, `.claude/skills/auto/auto-orchestrator.cjs` (lines 130-145)
- Why fragile: The ROADMAP.md format is parsed with multiple regex patterns that assume specific heading formats (`## Phase N:`, `**Goal:**`, `**Plans:**`, progress tables). Any user reformatting (e.g., using `###` instead of `##`, or changing bold markers) breaks parsing silently
- Safe modification: When changing ROADMAP.md parsing, test with multiple format variations. The `escapeRegex` helper in `core.cjs` properly handles special characters in phase numbers
- Test coverage: Zero unit tests for roadmap parsing

**STATE.md frontmatter and body parsing:**
- Files: `bin/lib/state.cjs`, `bin/lib/frontmatter.cjs`
- Why fragile: STATE.md uses a custom YAML-like frontmatter format parsed by `extractFrontmatter` in `frontmatter.cjs`. The parser handles indentation, arrays, and nested objects but is not a full YAML parser. Edge cases (multi-line strings, comments, quoted colons) could break
- Safe modification: Always test frontmatter changes against the actual STATE.md format used by `gsd-tools scaffold context`. Read `bin/lib/frontmatter.cjs` before modifying any frontmatter-related code
- Test coverage: Zero unit tests for frontmatter extraction/reconstruction

**CONTEXT.md section names are load-bearing:**
- Files: `bin/lib/commands.cjs`, `.claude/skills/plan-work/SKILL.md`, `.claude/skills/plan-review/SKILL.md`, `.claude/skills/build/SKILL.md`
- Why fragile: The three canonical CONTEXT.md sections (Decisions, Discretion Areas, Deferred Ideas) are referenced by name in multiple skills and the CLI. Renaming a section requires updating all consumers simultaneously. Old section names (`Design Decisions`, `Review Decisions`, `Locked Decisions`, `NOT in scope`) must NOT appear in shipped skills
- Safe modification: Grep for both old and new section names before any rename. The CLAUDE.md documents this constraint
- Test coverage: Evals test behavioral outcomes but not section name matching directly

## Scaling Limits

**Eval suite runs via Python, not integrated with Node tooling:**
- Current capacity: 210+ evals in `evals/evals.json`, run via `python3 evals/run_all_evals.py`
- Limit: As eval count grows, the Python runner becomes a bottleneck. No parallelism, no incremental runs, no CI integration documented
- Scaling path: Move to a Node-based eval runner that can parallelize, cache results, and integrate with the existing CJS tooling

**Plugin size grows with each upstream absorption:**
- Current capacity: 44 skills in `.claude/skills/`, plus references directories. The playwright-testing skill alone has 35 reference files
- Limit: Claude Code plugin install copies the entire `.claude/skills/` tree. Large plugins slow install and increase context when skills are auto-discovered
- Scaling path: Monitor total skill payload size. Consider lazy-loading references (read on demand vs. bundled). The `disable-model-invocation: true` frontmatter on 21 skills already mitigates auto-discovery noise

## Dependencies at Risk

**Upstream drift across 7 forked projects:**
- Risk: The plugin forks from 7 upstream projects (Superpowers v4.3.1, Impeccable v1.2.0, GSD v1.22.4, gstack v0.3.3, feature-dev, vercel-react-best-practices, claude-md-management, playwright-best-practices). Each upstream may release breaking changes. `PATCHES.md` (432 lines) and `COMPATIBILITY.md` track modifications but re-applying patches during upstream bumps is manual and error-prone
- Files: `PATCHES.md`, `COMPATIBILITY.md`, `upstream/`
- Impact: Falling behind on upstream security fixes or capability improvements. Patch conflicts during bumps
- Migration plan: Maintain the current snapshot+patch model. When bumping, diff the new upstream against the snapshot, identify conflicts with PATCHES.md entries, and re-run the full eval suite. Consider automating the diff+patch process

**`claude -p` CLI interface dependency:**
- Risk: The auto-orchestrator depends on `claude -p` (process mode) CLI interface including `--permission-mode`, `--plugin-dir`, and `--append-system-prompt` flags. These are Claude Code internal APIs that could change without notice
- Files: `.claude/skills/auto/auto-orchestrator.cjs` (lines 354-407)
- Impact: Any Claude Code CLI update that changes flag names or behavior breaks autonomous mode
- Migration plan: Pin to known-good Claude Code versions in documentation. Add version check at orchestrator startup

## Missing Critical Features

**No automated cross-reference validation for shipped skills:**
- Problem: Skills reference other skills, internal prompts, and references by path (e.g., `references/implementer-prompt.md`, `skills/test-driven-development/PROMPT.md`). There is no automated check that all referenced paths exist within the shipping boundary
- Blocks: After skill renames or restructuring, broken references can ship to users. The CLAUDE.md warns to "grep for old paths" but this is manual
- Fix approach: Add a `validate references` command to `gsd-tools` that scans all `.claude/skills/**/*.md` files, extracts path references, and verifies they resolve relative to the skill's directory or the plugin root

**No health check for gsd-tools symlink:**
- Problem: `/fh:setup` symlinks `bin/gsd-tools.cjs` to `$HOME/.claude/get-shit-done/bin/`. If the symlink breaks (e.g., plugin directory moves after update), all GSD workflows fail with cryptic errors
- Blocks: Users see "node: cannot find module" errors with no guidance
- Fix approach: Add a symlink health check to `/fh:health` that verifies the symlink target exists and is executable

## Test Coverage Gaps

**CLI modules have zero unit tests:**
- What's not tested: All 12 modules in `bin/lib/` — phase numbering, frontmatter CRUD, state progression, roadmap parsing, milestone operations, verification suite, template filling, changelog reconciliation
- Files: `bin/lib/*.cjs` (5,827 lines total)
- Risk: Regressions in core workflow operations (phase numbering comparison, frontmatter merge, state update atomicity) go undetected. The eval suite covers end-to-end behavior but cannot isolate CLI bugs
- Priority: High — these modules are the mechanical backbone of all GSD workflows

**Auto-orchestrator untested:**
- What's not tested: Session spawning, stuck detection, cost estimation, crash recovery, decision correction cascade
- Files: `.claude/skills/auto/auto-orchestrator.cjs` (1,160 lines)
- Risk: The orchestrator manages autonomous multi-phase execution with real cost implications. A bug in stuck detection or budget checking could lead to runaway sessions
- Priority: Medium — `/fh:auto` is an advanced feature with limited user base currently

**Frontmatter edge cases untested:**
- What's not tested: Nested YAML objects, arrays with quoted strings, multi-line values, frontmatter with no closing `---`, frontmatter with embedded `---` in values
- Files: `bin/lib/frontmatter.cjs` (299 lines)
- Risk: Silent data corruption when reading/writing STATE.md or PLAN.md frontmatter
- Priority: High — frontmatter operations are used by every GSD command

---

*Concerns audit: 2026-03-27*
