# Workflow Decision Matrix

## Tool Selection by Task Type

| Task | Primary Tool | Fallback | Why |
|------|-------------|----------|-----|
| **Read file to edit** | `Read` | — | Edit tool needs content in context |
| **Search code patterns** | `Grep` / `Glob` | — | Fast, targeted |
| **Targeted code lookup** | claude-mem `smart_search` / `smart_unfold` | `Grep` / `Read` | AST-aware, token-efficient |
| **Symbol navigation** | TS LSP `workspaceSymbol` | `Grep` | Name-based symbol lookup |
| **Cross-file references** | LSP `findReferences` | `Grep` | Semantic vs text matching |
| **Cross-session memory** | claude-mem `search` | — | Cross-project semantic search |
| **Cross-session code patterns** | claude-mem `smart_search` | `Grep` | AST-aware code recall across sessions |
| **Code structure overview** | claude-mem `smart_outline` | `Read` | Token-efficient structural view |
| **Read specific function** | claude-mem `smart_unfold` | `Read` | AST-exact extraction, never truncates |
| **Project structure mapping** | `/fh:map-codebase` | — | Deterministic, structured output |
| **Static analysis** | Fallow CLI (review, map-codebase) | — | Unused exports, circular deps, complexity — enhancement, not required |
| **Structural code search** | ast-grep MCP `find_code_by_rule` | Grep | AST-precise pattern matching; not for Markdown |
| **Bulk structural refactor** | ast-grep CLI (`sg`) | Edit per file | Conditional GO — verify after each transform |
| **Dependency blast radius** | Codemap `codemap diff` | Grep estimates | Deterministic fan-out count; strip ANSI before LLM injection |
| **Codebase hub analysis** | Codemap `codemap hubs` | — | High fan-in files; use in map-codebase for CONCERNS.md |
| **Web research (general)** | Firecrawl `firecrawl_search` | WebSearch | LLM-optimized markdown, sourceType filtering |
| **Scrape specific URL** | Firecrawl `firecrawl_scrape` | WebFetch | Handles JS rendering, anti-bot |
| **YouTube transcripts** | Firecrawl `firecrawl_scrape` (markdown format) | — | Captions embedded in markdown output |
| **Documentation sites** | context7 `query-docs` | Firecrawl `firecrawl_scrape` | Context7 for libs; firecrawl for non-lib docs |
| **GitHub discovery** | Firecrawl `firecrawl_search` (category: github) | WebSearch | Filtered search for repos/issues |
| **Research papers** | Firecrawl `firecrawl_search` (category: research) | WebSearch | arXiv, Nature, IEEE, PubMed |
| **Site structure discovery** | Firecrawl `firecrawl_map` | — | Fast URL discovery via sitemaps |

See `@.claude/skills/shared/firecrawl-guide.md` for detailed content-type patterns and options.

## Token Efficiency Guidelines

**Prefer claude-mem Smart Explore over Read** for broad queries (conventions, decisions, architecture patterns). `smart_search` returns AST-aware structural context; `smart_outline` gives token-efficient module overviews; `smart_unfold` extracts specific symbols. All cheaper than reading full files. Default to Smart Explore; escalate to Explore Agent only for open-ended synthesis.

**Prefer Grep/Glob over Read** for targeted lookups. Grep returns matching lines; Read loads full files.

**Avoid redundant reads:** If a file was already read earlier in the session (e.g., CONTEXT.md during Step 0), reference the in-memory content rather than re-reading.

**Fallow replaces LLM guessing** for: dead code detection, circular deps, complexity metrics, duplication. Trust Fallow's deterministic output over LLM pattern matching on raw source. Fallow runs in `review` (quality agent ground truth) and `map-codebase` (deterministic metrics). It does NOT run in `build`, `fix`, `refactor`, `plan-review`, or `setup`. Access Fallow results in other skills via `/fh:review` dispatch.

**Codemap replaces LLM blast-radius estimation** for: dependency fan-out, structural tree, hub file identification. Use `codemap diff` in `review` and `codemap tree/deps/hubs` in `map-codebase`. Strip ANSI output (`sed 's/\x1b\[[0-9;]*m//g'`) before injecting into LLM context. Conditional availability — check `which codemap` first.

**ast-grep replaces text-grep for code patterns**: Use ast-grep MCP for structural queries in `review` (anti-pattern detection) and ast-grep CLI in `fix` (recurrence check) and `refactor` (bulk migration). Hard ceiling: no Markdown support — fall back to Grep for `.md` files always. Bulk replace is CONDITIONAL GO — always verify with test suite after transform.

## Fallow Scope

Fallow is an enhancement, not a requirement. Skills not listed in "Used by" can access Fallow results by dispatching to `/fh:review`.

| Fallow capability | Used by | Not used by (available via /fh:review) |
|---|---|---|
| Dead code detection | review, map-codebase | fix, refactor |
| Circular dependencies | review, map-codebase | — |
| Code duplication | review | simplify (via review dispatch) |
| Complexity metrics | map-codebase | — |

**claude-mem replaces repeated context gathering** for: cross-session patterns, prior decisions, team conventions. Search claude-mem before re-deriving known answers.

**claude-mem `smart_search` for code structure:** When investigating bugs, reviewing code, or refactoring — call `smart_search` with the target module/function name to get AST-aware structural context from the current codebase (function signatures, call sites, related symbols). This is cheaper than reading full files and provides targeted structural context.

**claude-mem `smart_outline` for structure:** When you need to understand a module's structure without reading the full file, call `smart_outline` for a token-efficient structural view. Prefer this over Read for initial orientation.
