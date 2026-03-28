# External Integrations

**Analysis Date:** 2026-03-27

## APIs & External Services

**Brave Search API:**
- Purpose: Web search capability for the `websearch` CLI command
- Client: Node.js built-in `fetch()` in `bin/lib/commands.cjs` (lines 321-348)
- Endpoint: `https://api.search.brave.com/res/v1/web/search`
- Auth: `BRAVE_API_KEY` environment variable
- Optional: Command gracefully reports `{ available: false }` when key is not set

**GitHub Raw Content:**
- Purpose: Plugin update checks (version comparison)
- Client: Node.js built-in `https` module in `hooks/fhhs-check-update.js`
- Endpoint: Raw GitHub content URL for `plugin.json` from `cinjoff/fhhs-skills`
- Auth: None (public repo)
- Throttle: Checks at most once per 6 hours, caches result in `~/.claude/cache/fhhs-update-check.json`

**Claude Code CLI (`claude -p`):**
- Purpose: Subagent dispatch for builds, reviews, evals, and autonomous orchestration
- Client: `child_process.spawn()` / `child_process.execSync()` in:
  - `.claude/skills/auto/auto-orchestrator.cjs` — Headless multi-phase execution loop
  - `fhhs-skills-workspace/run_all_evals.py` — Behavioral eval runner (ThreadPoolExecutor)
  - `fhhs-skills-workspace/llm_grader.py` — Semantic grading via `claude -p --model haiku`
- Auth: Relies on ambient Claude Code authentication (API key or session)
- Not a traditional API — process-isolated CLI invocations

**GitHub CLI (`gh`):**
- Purpose: PR creation, release management, issue operations
- Client: Shell commands via `bin/lib/commands.cjs` (`execSync`)
- Auth: `gh auth login` (managed by user, checked during `/fh:setup`)
- Recommended but not required

## Data Storage

**Databases:**
- None — All state is file-based Markdown with YAML frontmatter

**File Storage (Local Filesystem):**
- `.planning/` directory — Project state, roadmap, requirements, phase plans, summaries
- `.planning/config.json` — GSD configuration (model profile, plan limits)
- `.planning/STATE.md` — Current phase, plan counter, progress, decisions, blockers
- `.planning/ROADMAP.md` — Phase definitions and progress tracking
- `.planning/REQUIREMENTS.md` — Work items with completion status
- `.planning/phases/N-name/` — Phase directories with PLAN.md, SUMMARY.md, CONTEXT.md, VERIFICATION.md
- `~/.claude/cache/fhhs-update-check.json` — Update check cache (written by hooks)

**Caching:**
- File-based only: `~/.claude/cache/fhhs-update-check.json` for version checks
- GSD CLI large output cache: `$TMPDIR/gsd-*.json` for payloads exceeding 50KB

## Authentication & Identity

**Auth Provider:**
- None — Plugin has no user authentication system
- Relies on ambient Claude Code session for API access
- Relies on `gh auth` for GitHub operations
- Relies on `BRAVE_API_KEY` env var for web search

## Monitoring & Observability

**Error Tracking:**
- None — Errors written to stderr via `bin/lib/core.cjs` `error()` function

**Logs:**
- No structured logging framework
- CLI outputs JSON to stdout (structured) or raw text (with `--raw` flag)
- Auto-orchestrator (`.claude/skills/auto/auto-orchestrator.cjs`) has inline progress logging with timestamps

**Context Monitoring:**
- `hooks/fhhs-context-monitor.js` — Reads context metrics from statusline bridge file, emits WARNING (35%) and CRITICAL (25%) alerts
- `hooks/fhhs-statusline.js` — Statusline data bridge for context usage display

## CI/CD & Deployment

**Hosting:**
- GitHub (`cinjoff/fhhs-skills`) — Source repo
- Claude Code Plugin Marketplace — Distribution via `claude plugin install fh@cinjoff/fhhs-skills`

**CI Pipeline:**
- None detected — No `.github/workflows/`, no CI config files
- Eval suite run manually: `python3 fhhs-skills-workspace/run_all_evals.py`

**Release Process:**
- Manual via `.claude/commands/release.md` maintainer command
- Bumps `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` (must stay in sync)
- Creates git tag and GitHub release via `gh release create`
- Post-push hook (`.claude/hooks/post-push-release-check.sh`) reminds about unreleased commits

## Environment Configuration

**Required env vars:**
- None strictly required — Plugin operates without any env vars

**Optional env vars:**
- `BRAVE_API_KEY` — Enables `websearch` command
- `CLAUDE_CONFIG_DIR` — Override default `~/.claude` path (used by hooks)

**Secrets location:**
- User's shell environment only
- No `.env` files detected in the repository
- No secrets committed or referenced in config files

## Webhooks & Callbacks

**Incoming:**
- None — Plugin has no HTTP server in production use
- Template sub-project (`templates/project-tracker/server.cjs`) runs a local HTTP server for the tracker UI, but this is a template shipped to user projects, not the plugin itself

**Outgoing:**
- None — All external communication is pull-based (fetch on demand)

## Claude Code Plugin Hooks (Event-Driven)

The plugin uses Claude Code's hook system for event-driven behavior. These are not HTTP webhooks but process-spawned scripts triggered by Claude Code events:

**SessionStart:**
- `hooks/fhhs-check-update.js` — Background version check against GitHub

**PostToolUse:**
- `hooks/fhhs-context-monitor.js` — Context window monitoring with threshold alerts
- `hooks/fhhs-learnings.js` — Learning capture
- `hooks/fhhs-statusline.js` — Statusline data bridge
- `.claude/hooks/post-push-release-check.sh` — Release reminder after `git push` (repo-local, matcher: Bash)

## External Tool Dependencies

Managed by `/fh:setup`, detected per-platform:

| Tool | Purpose | Required |
|------|---------|----------|
| Node.js + npm | GSD CLI runtime | Yes |
| Git | Version control operations | Yes |
| GitHub CLI (`gh`) | PR/release management | Recommended |
| Vercel CLI | Deployment commands | Recommended |
| Homebrew | Package management (macOS/Linux) | Convenience |
| `typescript-language-server` | LSP-powered code navigation | Recommended |
| `typescript-lsp` Claude plugin | LSP integration in Claude Code | Recommended |

---

*Integration audit: 2026-03-27*
