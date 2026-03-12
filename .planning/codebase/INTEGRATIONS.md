# External Integrations

**Analysis Date:** 2026-03-12

## APIs & External Services

**Web Search & Documentation:**
- Firecrawl - Web scraping and search capability
  - Purpose: Scrape web content for research subagents
  - Reference: `.claude/skills/research/SKILL.md` and `.claude/skills/plan-work/SKILL.md`
  - Fallback: If unavailable, subagents fall back to WebSearch/WebFetch

- Context7 - Library documentation aggregation
  - Purpose: Search library documentation for research phase
  - Reference: `.claude/skills/research/SKILL.md` and `.claude/skills/plan-work/SKILL.md`
  - Integration: Used alongside Firecrawl in research workflows

- Brave Search API - Web search service
  - Configuration: `BRAVE_API_KEY` environment variable
  - Files: `bin/lib/commands.cjs`, `bin/lib/init.cjs`, `bin/lib/config.cjs`
  - Status: Optional; if not configured, web search features disabled
  - Default fallback location: `~/.brave-api-key` or `process.env.BRAVE_API_KEY`

**AI & Language Services:**
- Claude Code - Host IDE/platform
  - All composites, skills, and agents run within Claude Code environment
  - Plugin system used for skill registration and invocation
  - TypeScript Language Server integration for code navigation (goToDefinition, findReferences, hover, documentSymbol, workspaceSymbol)

## Data Storage

**Databases:**
- None detected - Project uses file-based state management via `.planning/` directory

**File Storage:**
- Local filesystem only
  - State: `.planning/STATE.md`
  - Roadmap: `.planning/ROADMAP.md`
  - Plans: `.planning/phases/XX-name/XX-PLAN.md`
  - Summaries: `.planning/phases/XX-name/XX-SUMMARY.md`
  - Designs: `.planning/designs/YYYY-MM-DD-<topic>.md`
  - Project metadata: `.planning/PROJECT.md`
  - Configuration: `.planning/config.json`

**Caching:**
- None detected - State is read from disk for each operation

## Authentication & Identity

**Auth Provider:**
- None detected for the plugin itself
- GitHub authentication used for Git operations
  - Git CLI (`gh`) is required and checked during setup (`commands/setup.md`)
  - Used for PR creation, branch management, and commit history
  - Referenced in composites that use git workflows (finishing-a-development-branch, build pipeline)

## Monitoring & Observability

**Error Tracking:**
- None detected - Errors logged via console output

**Logs:**
- Console output (stdout/stderr) from CLI tools
- gsd-tools.cjs may write structured output
- Project tracker server logs request processing

## CI/CD & Deployment

**Hosting:**
- Claude Code plugin system (user's local Claude Code installation)
- Installation path: `~/.claude/plugins/fh/`
- Dashboard server: Runs on `localhost:3847` when `/fh:tracker` invoked
- Plugin version: 1.12.5 (in `plugin.json`)
- Marketplace version: 1.12.5 (in `marketplace.json`)

**CI Pipeline:**
- None detected at runtime
- Evaluation suite present (`evals/` directory) with test fixtures
- Playwright-based E2E testing supported via `/fh:playwright-testing` skill

## Environment Configuration

**Required env vars:**
- `HOME` - User home directory (for plugin discovery, `.brave-api-key` location)
- Optional: `BRAVE_API_KEY` - Brave Search API key (if not using `~/.brave-api-key`)

**Secrets location:**
- Brave API key: Environment variable `BRAVE_API_KEY` OR `~/.brave-api-key` file
- Git credentials: Managed by system Git/GitHub CLI
- No other secrets detected in codebase

**Build-time env:**
- `NODE_ENV` - Not explicitly referenced (build is environment-agnostic)
- Platform detection: `uname -s` output (macOS/Darwin, Linux, Windows)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected - Project is synchronous request-response only

## LSP Integration

**TypeScript Language Server:**
- Capability: Code navigation (goToDefinition, findReferences, hover, documentSymbol, workspaceSymbol, rename, incomingCalls, outgoingCalls)
- Used by: `/build`, `/fix`, `/refactor`, `/plan-work`, `/extract` composites
- Provides: Fast code traversal without grep, reference discovery, symbol lookup
- Installation: Required via `npm install -g typescript-language-server typescript` and `/plugin install typescript-lsp@claude-plugins-official`
- Not forked/modified - Uses `typescript-lsp@claude-plugins-official` (first-party built-in)

## Upstream Dependencies

**Bundled source projects:**
- Superpowers (v4.3.1) - Engineering discipline skills, bundled from upstream snapshot
- Impeccable (v1.2.0) - Design quality skills, bundled with Playwright and Motion
- GSD (v1.22.4) - Project orchestration CLI, bundled in `bin/`
- feature-dev (55b58ec6) - Code intelligence agents, adapted (not verbatim)
- Vercel React Best Practices (v1.0.0, 64bee5b7) - Nextjs-perf optimization skill
- Playwright Best Practices - E2E testing skill reference files

All upstreams tracked in `upstream/` directory with deviations documented in `PATCHES.md`.

## Runtime Plugin System

**Skill Invocation:**
- Skills at `.claude/skills/{name}/SKILL.md` invoked as `/fh:{name}` commands
- Agent dispatch: Tasks spawned via Agent tool with agent definitions from `agents/` directory
- Composites: Orchestrator skills that delegate to subagents

**Reference Files:**
- Prompts: `references/implementer-prompt.md`, `references/spec-gate-prompt.md`
- Templates: `references/gsd-templates/` for GSD file scaffolding
- Cannot be read from disk by shipped plugins — only `.claude/skills/` paths work at runtime

---

*Integration audit: 2026-03-12*
