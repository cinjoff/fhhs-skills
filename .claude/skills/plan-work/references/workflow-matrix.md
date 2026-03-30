# Workflow Decision Matrix

## Tool Selection by Task Type

| Task | Primary Tool | Fallback | Why |
|------|-------------|----------|-----|
| **Read file to edit** | `Read` | — | Edit tool needs content in context |
| **Search code patterns** | `Grep` / `Glob` | — | Fast, targeted |
| **Large output processing** | `ctx_batch_execute` / `ctx_execute` | — | Keeps raw data in sandbox, auto-indexes |
| **Symbol navigation** | TS LSP `workspaceSymbol` | `Grep` | Name-based symbol lookup |
| **Cross-file references** | LSP `findReferences` | `Grep` | Semantic vs text matching |
| **Cross-session memory** | claude-mem `search` | — | Cross-project semantic search |
| **Cross-session code patterns** | claude-mem `smart_search` | `Grep` | AST-aware code recall across sessions |
| **Code structure overview** | claude-mem `smart_outline` | `Read` | Token-efficient structural view |
| **Read specific function** | claude-mem `smart_unfold` | `Read` | AST-exact extraction, never truncates |
| **Project structure mapping** | `/fh:map-codebase` | — | Deterministic, structured output |
| **Static analysis** | Fallow CLI (pre-agent injection) | — | Unused exports, circular deps, complexity |
| **Web research** | Firecrawl | WebSearch | LLM-optimized markdown output |
| **Library docs** | context7 `query-docs` | Firecrawl | Current, version-specific |

## Token Efficiency Guidelines

**Prefer ctx_search over Read** for broad queries (conventions, decisions, architecture patterns). ctx_search returns only relevant snippets; Read loads entire files.

**Prefer Grep/Glob over Read** for targeted lookups. Grep returns matching lines; Read loads full files.

**Avoid redundant reads:** If a file was already read earlier in the session (e.g., CONTEXT.md during Step 0), reference the in-memory content rather than re-reading.

**Fallow replaces LLM guessing** for: dead code detection, circular deps, complexity metrics, duplication. Trust Fallow's deterministic output over LLM pattern matching on raw source.

**claude-mem replaces repeated context gathering** for: cross-session patterns, prior decisions, team conventions. Search claude-mem before re-deriving known answers.

**claude-mem `smart_search` for code structure:** When investigating bugs, reviewing code, or refactoring — call `smart_search` with the target module/function name to get AST-aware structural context from the current codebase (function signatures, call sites, related symbols). This is cheaper than reading full files and provides targeted structural context.

**claude-mem `smart_outline` for structure:** When you need to understand a module's structure without reading the full file, call `smart_outline` for a token-efficient structural view. Prefer this over Read for initial orientation.
