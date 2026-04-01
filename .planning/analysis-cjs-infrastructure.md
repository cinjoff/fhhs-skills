# CJS Script Infrastructure Analysis

## Script Inventory

| Path | LOC | Purpose | Node APIs |
|------|-----|---------|-----------|
| `bin/gsd-tools.cjs` | 641 | CLI router — dispatches to lib modules based on `argv` | `fs`, `path` |
| `bin/lib/core.cjs` | 516 | Shared utilities: output formatting, config loading, git helpers, phase search | `fs`, `path`, `os`, `child_process.execSync` |
| `bin/lib/commands.cjs` | 548 | Misc commands: slug, timestamp, todos, scaffold, websearch, commit | `fs`, `path`, `child_process.execSync` |
| `bin/lib/state.cjs` | 867 | STATE.md CRUD: frontmatter parse/write, progress calc, decision/blocker tracking | `fs`, `path` |
| `bin/lib/phase.cjs` | 901 | Phase operations: find, add, insert, remove, complete, plan-index | `fs`, `path` |
| `bin/lib/verify.cjs` | 910 | Verification suite: plan structure, phase completeness, references, artifacts | `fs`, `path` |
| `bin/lib/init.cjs` | 710 | Compound init commands: aggregates config+state+phase data per workflow | `fs`, `path`, `child_process.execSync` |
| `bin/lib/frontmatter.cjs` | 299 | YAML-like frontmatter parser/writer (no YAML dep, hand-rolled) | `fs`, `path` |
| `bin/lib/roadmap.cjs` | 298 | ROADMAP.md operations: get-phase, analyze, update-plan-progress | `fs`, `path` |
| `bin/lib/milestone.cjs` | 241 | Milestone complete, requirements mark-complete | `fs`, `path` |
| `bin/lib/changelog.cjs` | 235 | Changelog reconcile: version range diff with reconciliation tags | `fs`, `path`, `os`, `child_process.execSync` |
| `bin/lib/template.cjs` | 222 | Template fill: generate PLAN.md, SUMMARY.md, VERIFICATION.md scaffolds | `fs`, `path` |
| `bin/lib/config.cjs` | 178 | Config CRUD for `.planning/config.json` | `fs`, `path`, `os` |
| `bin/lib/schemas.cjs` | 90 | Schema validator for `.auto-state.json` (pure logic, no I/O) | *none* |
| `bin/global-reconcile.cjs` | 673 | Post-update: discover all projects, run patches + health checks | `fs`, `path`, `os`, `child_process.execFileSync` |
| `.claude/skills/auto/auto-orchestrator.cjs` | 3415 | Headless autonomous orchestrator: spawns `claude -p` sessions in a loop | `fs`, `path`, `os`, `child_process.spawn/execFileSync/exec` |
| `.claude/skills/auto/auto-orchestrator.test.cjs` | 601 | Unit tests for orchestrator | (test harness) |
| `.claude/skills/patches/patch-claude-mem-project-env.cjs` | 162 | Patches claude-mem's minified worker-service.cjs for env var + worktree detection | `fs`, `path`, `os` |
| `.claude/skills/patches/patch-claude-mem-worktree.cjs` | 16 | Deprecated shim, redirects to unified patch | `path`, `child_process.execFileSync` |
| `templates/project-tracker/server.cjs` | 1151 | HTTP dashboard server for project tracking UI | `http`, `fs`, `path`, `os` |
| `templates/project-tracker/parser.cjs` | 953 | Parses `.planning/` structure into JSON for the dashboard | `fs`, `path` |
| `templates/project-tracker/parser.test.cjs` | 245 | Parser unit tests | (test harness) |
| **Total** | **~12,671** | | |

## Invocation Patterns

### Who calls gsd-tools.cjs and how often

**Shipped skills** (`.claude/skills/`):
- **build/SKILL.md** — 5+ calls (config-get, resolve-model, verify, phase complete, commit)
- **plan-work/SKILL.md** — 3+ calls (config-get, verify plan-structure, frontmatter validate)
- **new-project/SKILL.md** — 3 calls (init new-project, config-ensure-section, state load)
- **todos/SKILL.md** — 5 calls (init todos, generate-slug, commit)
- **progress/SKILL.md** — 5 calls (init progress, state-snapshot, roadmap analyze, summary-extract, progress bar)
- **auto/SKILL.md** — 2 calls (config-set)
- **settings/SKILL.md** — 2 calls (config-ensure-section, state load)
- **health/SKILL.md** — 2 calls (validate health)
- **map-codebase/SKILL.md** — 2 calls (init map-codebase, commit)
- **update/SKILL.md** — 3 calls (changelog reconcile, validate health)
- **build/references/gsd-state-updates.md** — 10+ calls (state finalize-plan, advance-plan, update-progress, record-metric, add-decision, record-session, roadmap update, verify, phase complete, commit)

**Agent files** (`agents/`):
- **gsd-phase-researcher.md** — 3 calls (websearch, init, commit)
- **gsd-debugger.md** — 2 calls (state load, commit)
- Other agents (project-researcher, research-synthesizer) — 1-2 calls each

**Estimated per-session frequency:**
- A `/fh:build` session (plan + execute a phase) runs **15-25 gsd-tools invocations**
- A `/fh:progress` session runs **5-8 invocations**
- Simple skills (health, settings) run **2-3 invocations**

### Invocation pattern
All calls follow: `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" <command> [args]`
Canonical path from `core.cjs:gsdToolsPath()`: `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs`

### auto-orchestrator.cjs
Invoked once per `/fh:auto` session via: `node .claude/skills/auto/auto-orchestrator.cjs --project-dir "$(pwd)"`
Long-running process that spawns child `claude -p` sessions.

### Patches
Invoked by `/fh:setup` and `/fh:update` — run once per plugin install/update.

### server.cjs
Invoked manually by users: `node server.cjs` — long-running HTTP server on port 4111.

## Startup Cost Profile

### Require chain (gsd-tools.cjs)
```
gsd-tools.cjs
  ├── fs (builtin)
  ├── path (builtin)
  ├── lib/core.cjs        → fs, path, os, child_process
  ├── lib/state.cjs       → fs, path, core, frontmatter
  ├── lib/phase.cjs       → fs, path, core, frontmatter, state
  ├── lib/roadmap.cjs     → fs, path, core
  ├── lib/verify.cjs      → fs, path, core, frontmatter, state
  ├── lib/config.cjs      → fs, path, core
  ├── lib/template.cjs    → fs, path, core, frontmatter
  ├── lib/milestone.cjs   → fs, path, core, frontmatter, state
  ├── lib/commands.cjs    → fs, path, child_process, core, frontmatter
  ├── lib/init.cjs        → fs, path, child_process, core
  ├── lib/frontmatter.cjs → fs, path, core
  └── lib/changelog.cjs   → fs, path, os, child_process, core
```

**Depth:** 2 levels max (gsd-tools -> lib/X -> lib/Y). No circular deps (core is leaf).
**Module count:** 14 internal files + 4 Node builtins = 18 total modules loaded on every invocation.
**All modules loaded eagerly** — the `require()` calls are at top level, so every `gsd-tools` invocation loads ALL 14 lib files even if only one command is used.

### Init work
- No expensive initialization. No network calls at startup.
- `child_process.execSync` only called when git commands are needed (commit, verify commits).
- Config loading reads a single JSON file from disk.
- The main cost is Node.js process startup itself (~30-50ms), not the script logic.

### auto-orchestrator.cjs startup
- Self-contained: only `fs`, `path`, `os`, `child_process` (builtins).
- No npm dependencies. 3415 LOC in a single file.
- Spawns `claude -p` as child processes — the real cost is in those subprocesses.

### server.cjs startup
- Requires `http` (builtin) + `parser.cjs` (953 LOC, pure `fs`/`path`).
- Creates HTTP server, watches filesystem. Moderate startup.

## Bun Compatibility Assessment

### Safe (fully compatible)
- `fs` — Bun has full fs compat
- `path` — Bun has full path compat
- `os` — Bun has full os compat (homedir, tmpdir, etc.)
- `http` — Bun has http.createServer compat
- `JSON.parse/stringify` — universal
- `process.argv`, `process.env`, `process.exit`, `process.stdout.write` — all supported

### Needs testing
- **`child_process.execSync`** — Bun supports this but with occasional edge-case differences in stdio handling. Used in: `core.cjs`, `commands.cjs`, `init.cjs`, `changelog.cjs`.
- **`child_process.spawn`** — Used in `auto-orchestrator.cjs` for long-running claude sessions. Bun supports spawn but stdout/stderr event handling may differ subtly.
- **`child_process.execFileSync`** — Used in `global-reconcile.cjs`, `auto-orchestrator.cjs`, `patch-claude-mem-worktree.cjs`. Bun supports this.
- **`child_process.exec`** — Used once in `auto-orchestrator.cjs`. Supported in Bun.
- **`fs.watch` / `fs.watchFile`** — If used in server.cjs (likely for live reload). Bun's fs.watch has known differences.

### No blockers found
- No native modules / npm dependencies
- No `worker_threads`, `cluster`, `dgram`, `net`, `stream`, `crypto`
- No `require.resolve` tricks or dynamic requires
- No `.node` native addons
- No `vm` module usage

### One concern
- `process.stdout.write` followed by `process.exit(0)` in `core.cjs:output()` — Bun may not flush stdout before exit in all cases. This is the primary output mechanism for all gsd-tools commands. Worth testing explicitly.

## Key Observations

1. **Eager loading is the main inefficiency** — every gsd-tools invocation loads all 14 lib modules (~6,600 LOC parsed) even for simple commands like `generate-slug`. Lazy loading per command would cut startup time.

2. **No npm dependencies anywhere** — the entire 12,671 LOC codebase uses only Node builtins. This is excellent for portability and startup speed.

3. **High invocation frequency** — a single build session runs 15-25 separate `node gsd-tools.cjs` calls, each paying the full Node startup + module loading cost. A persistent daemon or single-invocation batch mode could eliminate this overhead.

4. **Pure computation dominates** — most commands do file reads, regex matching, and JSON manipulation. The only "heavy" operations are git commands via execSync.

5. **auto-orchestrator.cjs is the largest script** (3,415 LOC) but runs as a long-lived process, so startup cost is amortized.

6. **server.cjs + parser.cjs** (2,104 LOC) are templates, not part of the plugin runtime. They serve a dashboard UI.

7. **Bun migration looks straightforward** — zero npm deps, all Node builtins used are well-supported in Bun. The main risk is stdout flushing before exit.
