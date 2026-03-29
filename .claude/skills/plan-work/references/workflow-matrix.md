# Workflow Decision Matrix

## Tool Selection by Task Type

| Task | Primary Tool | Fallback | Why |
|------|-------------|----------|-----|
| **Read file to edit** | `Read` | — | Edit tool needs content in context |
| **Search code patterns** | `Grep` / `Glob` | — | Fast, targeted |
| **Large output processing** | `ctx_batch_execute` / `ctx_execute` | — | Keeps raw data in sandbox, auto-indexes |
| **Symbol navigation** | Serena `find_symbol` / `get_symbols_overview` (deferred) | TS LSP `workspaceSymbol` | Multi-language, richer context |
| **Symbol editing (rename/move)** | Serena `rename_symbol` / `replace_symbol_body` (deferred) | Manual Edit | No built-in equivalent |
| **Cross-file references** | Serena `find_referencing_symbols` (deferred) | `Grep` | Semantic vs text matching |
| **Cross-session memory** | claude-mem | — | Cross-project semantic search |
| **Project structure mapping** | `/fh:map-codebase` | — | Deterministic, structured output |
| **Static analysis** | Fallow CLI (pre-agent injection) | — | Unused exports, circular deps, complexity |
| **Web research** | Firecrawl | WebSearch | LLM-optimized markdown output |
| **Library docs** | context7 `query-docs` | Firecrawl | Current, version-specific |

<details><summary>Serena guidance (deferred)</summary>

> **Deferred — Serena integration not yet active. Retained for future reference.**

## When Serena Adds Value vs When It Doesn't

### Use Serena for:
- Renaming symbols across files (unique capability)
- Understanding call graphs and reference chains
- Multi-language projects (40+ languages vs TS-only LSP)
- Exploring unfamiliar codebases (symbol overview on entry points)

### Don't use Serena for:
- Memory/knowledge persistence (claude-mem is canonical)
- Project onboarding (map-codebase is deterministic)
- File search (context-mode auto-indexes, better token efficiency)
- Pattern search (Grep is faster and doesn't consume Serena tokens)

</details>

## Token Efficiency Guidelines

**Prefer ctx_search over Read** for broad queries (conventions, decisions, architecture patterns). ctx_search returns only relevant snippets; Read loads entire files.

**Prefer Grep/Glob over Read** for targeted lookups. Grep returns matching lines; Read loads full files.

**Avoid redundant reads:** If a file was already read earlier in the session (e.g., CONTEXT.md during Step 0), reference the in-memory content rather than re-reading.

**Fallow replaces LLM guessing** for: dead code detection, circular deps, complexity metrics, duplication. Trust Fallow's deterministic output over LLM pattern matching on raw source.

**claude-mem replaces repeated context gathering** for: cross-session patterns, prior decisions, team conventions. Search claude-mem before re-deriving known answers.
