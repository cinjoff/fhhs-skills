# Fallow Tools Research

**Researched:** 2026-03-25
**Overall confidence:** MEDIUM (docs site confirmed, no npm package name verified, no community discussion found outside official sources)

---

## 1. Overview and Purpose

Fallow is a Rust-native static analyzer for TypeScript and JavaScript that identifies unused code, circular dependencies, code duplication, and complexity hotspots. Its tagline captures the philosophy: **"AI writes code. Nobody deletes it."**

While linters enforce style and formatters ensure consistency, Fallow enforces **code relevance** -- it finds artifacts that accumulate during development and AI-assisted coding that nobody cleans up.

**What it is NOT:** Fallow is not a code understanding tool in the LSP sense. It does not provide go-to-definition, find-references, type inference, hover information, or call graphs. It is a specialized dead-code and code-health analyzer.

### Key Stats

| Metric | Value |
|--------|-------|
| Language | Rust |
| Parser | Oxc (JS/TS parser) |
| Parallelism | Rayon |
| Config | Zero-config with auto-detection |
| Speed | 3,000+ file monorepo in ~300ms |
| vs knip | 3-46x faster |
| vs jscpd | 20-33x faster |
| vs madge/dpdm | 3-32x faster |
| Memory | 3-6x less than alternatives |

---

## 2. Architecture

### Technical Stack

- **Parser:** Oxc -- the same Rust-based JS/TS parser used by oxlint. Provides AST and scope-aware binding analysis via `oxc_semantic`.
- **Parallelism:** Rayon for concurrent file parsing.
- **Duplicate detection:** Suffix array with LCP (Longest Common Prefix) algorithm -- a classical string-matching approach adapted for token sequences.
- **Circular dependency detection:** Tarjan's algorithm on the module graph.
- **Module graph:** Full resolution including barrel files, re-export chains, and conditional exports.

### How It Works

1. **Entry point discovery** -- Auto-detects from `package.json` fields (`main`, `module`, `types`, `bin`, `exports`) plus 84 framework plugins (Next.js, Vite, Jest, etc.).
2. **Module graph construction** -- Parses all reachable files, resolves imports/exports, builds a complete dependency graph.
3. **Reachability analysis** -- Traces from entry points through the graph to determine which exports are actually consumed.
4. **Reporting** -- Flags unreachable code as unused, detects cycles, finds duplicates.

### Analysis is Syntactic Only

**Critical limitation:** Fallow performs syntactic analysis only -- no type information. The Oxc parser gives AST and scope bindings, but Fallow does not run a type checker. This is a deliberate tradeoff for speed. Consequences:
- No type-level dead code detection beyond exported type declarations
- No understanding of generic instantiations or conditional types
- Dynamic imports are only partially resolved (template literals, `import.meta.glob`, `require.context`)

---

## 3. Key Features and Capabilities

### 3.1 Dead Code Detection (13 issue types)

| Issue Type | What It Finds |
|------------|---------------|
| `unused-files` | Files not reachable from any entry point |
| `unused-exports` | Exported symbols never imported elsewhere |
| `unused-types` | Exported type declarations never used |
| `unused-deps` | `dependencies` in package.json never imported |
| `unused-optional-deps` | Unused `optionalDependencies` |
| `unused-enum-members` | Enum values never referenced |
| `unused-class-members` | Class methods/properties never called externally |
| `unresolved-imports` | Import paths that don't resolve |
| `unlisted-deps` | Imports of packages not in package.json |
| `duplicate-exports` | Same symbol exported multiple times |
| `circular-deps` | Circular import chains |
| `type-only-deps` | Runtime deps that could be `devDependencies` |

### 3.2 Code Duplication (4 modes)

| Mode | Description |
|------|-------------|
| **strict** | Exact token matches |
| **mild** | AST-based (ignores formatting differences) |
| **weak** | Tolerates different literal values |
| **semantic** | Tolerates renamed variables (structural clones) |

Configuration: `minTokens`, `minLines`, `threshold`.

### 3.3 Code Health

- **Cyclomatic complexity** per function
- **Cognitive complexity** per function
- **File maintainability score** (0-100)
- **Hotspot detection** combining git churn with complexity
- Configurable thresholds and top-N ranking

### 3.4 Auto-Fix

```bash
fallow fix              # Remove unused exports and dependencies
fallow fix --dry-run    # Preview what would be removed
```

### 3.5 Framework Support (84 plugins)

Auto-detects: Next.js, Nuxt, Remix, SvelteKit, Vite, Webpack, Jest, Vitest, Playwright, ESLint, Tailwind, Prisma, Turborepo, and many more. Custom plugins can be defined in config.

### 3.6 Non-JS File Support

- Vue/Svelte SFC `<script>` block extraction
- Astro frontmatter parsing
- MDX import/export statements
- CSS/SCSS `@import`, `@use`, `@forward`, `@apply`/`@tailwind`
- CSS Modules class name tracking

---

## 4. CLI Reference

### Commands

```bash
fallow check          # Dead code + circular deps (default command)
fallow dupes          # Duplication + complexity hotspots
fallow health         # Complexity metrics and maintainability
fallow fix            # Auto-remove unused exports/deps
fallow fix --dry-run  # Preview fixes
fallow watch          # Real-time analysis (file watcher)
fallow init           # Create config file
fallow migrate        # Convert knip/jscpd configs
fallow list           # Show detected entry points
```

### Key Flags

| Flag | Purpose |
|------|---------|
| `-f, --format <FMT>` | Output: `human`, `json`, `sarif`, `compact`, `markdown` |
| `--ci` | CI mode (SARIF + fail-on-issues + quiet) |
| `--changed-since <REF>` | Only analyze files changed since git ref |
| `--baseline <PATH>` | Compare against saved baseline |
| `--save-baseline <PATH>` | Save current results as baseline |
| `--production` | Exclude test/story/dev files |
| `--trace <FILE:EXPORT>` | Debug why an export appears unused |
| `--trace-file <PATH>` | Show all imports/exports for a file |
| `--trace-dependency <PKG>` | Show where a dependency is used |
| `--performance` | Display timing metrics |
| `--explain` | Include metric descriptions and doc links |
| `-q, --quiet` | Hide progress messages |
| `--fail-on-issues` | Exit 1 when issues found |

### Issue Type Filters

Each issue type has a corresponding `--<type>` flag (e.g., `--unused-files`, `--circular-deps`) to isolate specific checks.

---

## 5. Output Formats

| Format | Use Case |
|--------|----------|
| `human` | Terminal display (default) |
| `json` | Programmatic consumption, AI agents |
| `sarif` | GitHub Code Scanning integration |
| `compact` | Scripting, piping |
| `markdown` | PR comments |

JSON output is the key format for agent integration. The `--format json` flag produces structured output suitable for parsing.

---

## 6. MCP Server Integration

### Architecture

The MCP server (`fallow-mcp`) is a **stdio subprocess wrapper** around the CLI binary. All analysis logic stays in the CLI; the MCP crate only handles protocol framing and argument mapping. CLI and MCP always produce identical results.

### Setup

For Claude Code, add to `.claude/settings.json`:
```json
{
  "mcpServers": {
    "fallow": {
      "command": "fallow-mcp"
    }
  }
}
```

Custom binary path via `FALLOW_BIN` environment variable.

### Available MCP Tools (7 tools)

| Tool | Purpose |
|------|---------|
| `analyze` | Full dead code analysis |
| `check_changed` | Analyze only changed files (git-aware) |
| `find_dupes` | Duplication detection |
| `fix_preview` | Preview auto-fix results |
| `fix_apply` | Apply auto-fixes |
| `check_health` | Complexity and maintainability metrics |
| `project_info` | Project structure and entry point info |

---

## 7. Configuration

### File Formats (searched in order)

1. `.fallowrc.json` (JSONC with comments)
2. `fallow.toml`
3. `.fallow.toml`
4. Embedded in `package.json`

### Key Config Fields

```jsonc
{
  // Additional entry points beyond auto-detected
  "entry": ["src/**/*.ts"],

  // Files to exclude entirely
  "ignorePatterns": ["**/*.generated.ts"],

  // Packages always considered used
  "ignoreDependencies": ["@types/node"],

  // Fine-grained export ignoring
  "ignoreExports": {
    "src/public-api.ts": ["*"]
  },

  // Severity per issue type: "error" | "warn" | "off"
  "rules": {
    "unused-files": "error",
    "unused-exports": "warn",
    "circular-deps": "error"
  },

  // Duplication settings
  "duplicates": {
    "mode": "mild",
    "minTokens": 50,
    "minLines": 5
  },

  // Complexity thresholds
  "health": {
    "maxCyclomatic": 15,
    "maxCognitive": 20
  },

  // Focus on production code only
  "production": false,

  // Config inheritance
  "extends": "./base-fallow.json",

  // Per-pattern rule overrides
  "overrides": [
    {
      "patterns": ["**/*.test.ts"],
      "rules": { "unused-exports": "off" }
    }
  ]
}
```

### Inline Suppression

```typescript
// fallow-ignore-next-line
export const legacyApi = ...;

// fallow-ignore-file  (at top of file)
```

---

## 8. Comparison with LSP for Code Understanding

This is the critical comparison for the fhhs-skills context.

| Capability | Fallow | TypeScript LSP |
|------------|--------|----------------|
| **Go-to-definition** | NO | YES |
| **Find references** | NO | YES |
| **Hover / type info** | NO | YES |
| **Call graph** | NO (module graph only) | Partial (via references) |
| **Rename symbol** | NO | YES |
| **Code completion** | NO | YES |
| **Unused exports** | YES (primary feature) | Basic (via `noUnusedLocals`) |
| **Unused files** | YES | NO |
| **Unused dependencies** | YES | NO |
| **Circular dependencies** | YES | NO |
| **Code duplication** | YES | NO |
| **Complexity metrics** | YES | NO |
| **Module graph** | YES (full) | NO (per-file only) |
| **Auto-fix dead code** | YES | NO |
| **Framework awareness** | YES (84 plugins) | NO |
| **Speed on large codebases** | Very fast (300ms for 3k files) | Slower (type checking overhead) |
| **Type-level analysis** | NO (syntactic only) | YES (full type system) |

### Verdict

**Fallow and LSP serve completely different purposes and are complementary, not competitive.**

- **LSP** is for code navigation, understanding, and editing -- "What does this symbol mean? Where is it used? What type does it have?"
- **Fallow** is for code hygiene and health -- "What code is dead? What's duplicated? What's too complex? What dependencies are unused?"

For a Claude Code skill focused on helping developers understand and navigate code, **LSP is the right tool**. Fallow would be valuable as a separate, complementary skill for code cleanup and health monitoring.

---

## 9. Integration Patterns for Claude Code Skills

### Pattern A: MCP Server (recommended for persistent analysis)

```json
// .claude/settings.json
{
  "mcpServers": {
    "fallow": { "command": "fallow-mcp" }
  }
}
```

Then in skill instructions, reference the MCP tools directly. The agent can call `analyze`, `check_changed`, etc.

### Pattern B: CLI with JSON output (simpler, no MCP dependency)

```bash
# In a skill, shell out to fallow
fallow check --format json --quiet
fallow dupes --format json --quiet
fallow health --format json --quiet
```

Parse the JSON output in the skill's logic.

### Pattern C: CI/PR workflow

```bash
# Check only changed files in a PR
fallow check --changed-since origin/main --format markdown
```

Output markdown directly usable in PR comments.

---

## 10. Installation

```bash
# Via npm (prebuilt binaries)
npm install -g fallow

# Via npx (no install)
npx fallow check

# Via cargo
cargo install fallow-cli

# Binary download
# Available for macOS (arm64, x64), Linux (x64, arm64), Windows (x64)
```

No Node.js runtime dependency -- the npm package just contains the prebuilt binary.

---

## 11. Strengths

1. **Extremely fast** -- sub-second on large codebases where competitors take 10-60 seconds or crash.
2. **Zero config** -- auto-detects entry points and frameworks, works out of the box.
3. **Comprehensive dead code detection** -- 13 issue types covering files, exports, types, deps, enums, class members.
4. **Excellent CI integration** -- SARIF output, baseline comparison, changed-since for incremental checks.
5. **MCP server** -- first-class AI agent integration with 7 structured tools.
6. **Deterministic** -- results traceable to concrete import graph paths (not heuristic).
7. **Auto-fix** -- can actually remove dead code, not just report it.
8. **Framework-aware** -- 84 plugins prevent false positives from framework conventions.

---

## 12. Weaknesses and Gaps

1. **No code navigation** -- cannot do go-to-definition, find-references, hover, or any LSP-like code understanding.
2. **Syntactic only** -- no type information means it misses type-level dead code and cannot reason about generic usage.
3. **Dynamic imports partially resolved** -- template literal imports, `import.meta.glob`, and `require.context` are best-effort.
4. **Svelte exports may go undetected** without compiler semantics (acknowledged limitation).
5. **No call graph** -- builds a module/import graph but not a function-level call graph.
6. **New tool** -- limited community discussion found; web searches return zero results for "fallow.tools" or "fallow-rs" outside the official docs site. This could mean it is very new, or the names I searched may not match the actual npm/crate package names.
7. **No dependency on TypeScript compiler** -- this is both a strength (speed) and weakness (no type analysis).

---

## 13. Confidence Assessment

| Claim | Confidence | Source |
|-------|------------|--------|
| Core features (dead code, dupes, health) | HIGH | Official docs (fetched and confirmed) |
| Performance claims (3-46x faster) | MEDIUM | Official docs only, no independent benchmarks found |
| MCP server with 7 tools | HIGH | Official docs (fetched and confirmed) |
| 84 framework plugins | MEDIUM | Official docs, not independently verified |
| npm package name is "fallow" | LOW | Docs say `npx fallow` but npm search did not surface it; may use a different package name |
| GitHub repo at fallow-rs/fallow | LOW | URL returned content via WebFetch but web search found no references to this org; may be a different actual URL |
| Community adoption | LOW | Zero community discussion found in web searches |

---

## 14. Open Questions

1. **What is the actual npm package name?** The docs reference `npx fallow` but the package was not found in npm search results. It may be published under a different name, or may be very new / not yet indexed.
2. **What is the actual GitHub repository URL?** Web searches found no references to `fallow-rs`. The repo may be private, very new, or under a different org.
3. **Is Fallow generally available?** The lack of any community discussion, blog posts, or third-party references is unusual for a tool with these claimed capabilities. It may be in private beta or very early release.
4. **MCP server binary distribution** -- is `fallow-mcp` included in the npm package or a separate install?
5. **How does it handle monorepo workspaces?** Docs mention workspace support for npm/yarn/pnpm but specifics on cross-workspace unused detection were not found.

---

## 15. Relevance to fhhs-skills

### For code understanding / navigation skills: NOT a replacement for LSP

Fallow does not provide any of the capabilities needed for code understanding skills:
- No symbol lookup, definition navigation, or reference finding
- No type information or hover details
- No call graphs or dependency chains at the function level

### For a potential "code health" or "cleanup" skill: STRONG fit

Fallow would be excellent for a skill like `/fh:cleanup` or `/fh:health` that:
- Finds and removes dead code after refactoring
- Detects circular dependencies that cause initialization bugs
- Identifies duplicated code blocks for consolidation
- Surfaces complexity hotspots needing attention
- Runs as a PR check to prevent code rot

The MCP server integration makes this particularly clean -- a skill could reference the MCP tools directly without shell-out orchestration.

### Recommendation

If the goal is to add code health / dead code detection capabilities to fhhs-skills, Fallow is the right tool. If the goal is to improve code understanding and navigation, stick with TypeScript LSP. These are complementary, not competing, tools.
