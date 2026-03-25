# Serena Research Report

**Researched:** 2026-03-25
**Overall confidence:** HIGH (official docs confirmed, multiple independent sources, architecture verified via DeepWiki code analysis)

---

## 1. What Serena Is

Serena is an open-source (MIT) coding agent toolkit that exposes IDE-like semantic code understanding to LLMs via MCP (Model Context Protocol). It wraps language servers (LSP) behind a higher-level abstraction called **SolidLSP**, providing symbol-level code navigation and editing tools that any MCP-compatible client can consume.

**Key identity:** Serena is NOT a language server itself. It is an MCP server that delegates to real language servers (pylsp/Pyright, typescript-language-server, rust-analyzer, gopls, clangd, Eclipse JDTLS, etc.) and exposes their capabilities as structured MCP tools.

### Key Stats

| Metric | Value |
|--------|-------|
| GitHub stars | ~22.1K |
| License | MIT |
| Language | Python |
| Commits | 2,358+ |
| Approaching | v1.0.0 |
| Supported languages | 40+ |
| MCP transport | stdio (default), streamable-http |

---

## 2. How It Works -- Architecture

### Layer Stack

```
MCP Client (Claude Code, Cursor, etc.)
    |
    v
FastMCP Server (Python MCP SDK)
    |
    v
SerenaAgent (tool orchestration, project state, modes)
    |
    v
ToolRegistry (discovered via reflection at startup)
    |
    v
SolidLSP (synchronous LSP abstraction over multilspy)
    |
    v
Language Server subprocesses (pyright, ts-server, rust-analyzer, etc.)
```

### Core Design Decisions

1. **SolidLSP** is a fork/extension of Microsoft's multilspy library. It adds:
   - Synchronous (not async) operation -- suitable for agent task sequencing
   - Two-tier caching (raw LSP responses + processed DocumentSymbols) in `.solidlsp/cache/`
   - File buffer management with `didOpen`/`didChange`/`didClose` lifecycle
   - Content-hash-based cache invalidation (edits automatically expire cached data)
   - Symbolic reasoning layer on top of raw LSP responses

2. **Tool execution is serialized** -- single-threaded TaskExecutor processes MCP calls sequentially. This avoids race conditions with language servers but means no parallel tool calls.

3. **Dual backend** -- SolidLSP for most use cases, or JetBrains IDE plugin for environments where JetBrains is already running (superior polyglot indexing, type hierarchy support).

4. **Context-aware tool exposure** -- different MCP clients get different tool sets. The `--context` flag controls which tools are exposed:
   - `ide-assistant` (Claude Code, Cursor) -- editing tools enabled, shell command disabled
   - `desktop-app` (Claude Desktop) -- more conservative
   - `codex` -- Codex CLI compatibility

5. **Modes** -- runtime tool filtering:
   - `planning` mode -- excludes editing tools
   - `editing` mode -- enables modifications
   - Users can switch modes mid-session

### Project Lifecycle

1. First activation triggers **onboarding** -- agent explores codebase structure, documents findings in `.serena/memories/` as markdown files
2. Subsequent sessions load persisted memories for long-term context
3. Configuration at three levels: global (`~/.serena/serena_config.yml`), project (`.serena/project.yml`), and context/mode

---

## 3. Complete Tool Inventory

### Symbol Tools (core value)

| Tool | What It Does |
|------|-------------|
| `find_symbol` | Global/local symbol search via language server -- finds classes, functions, methods by name |
| `find_referencing_symbols` | Finds all symbols that reference a given symbol (like LSP findReferences) |
| `get_symbols_overview` | Lists top-level symbols in a file (like LSP documentSymbol) |
| `replace_symbol_body` | Replaces a symbol's implementation while preserving its signature |
| `insert_after_symbol` | Inserts content after a symbol's definition |
| `insert_before_symbol` | Inserts content before a symbol's definition |
| `rename_symbol` | Renames a symbol across the entire codebase (LSP rename refactoring) |
| `restart_language_server` (optional) | Restarts LS when external edits desynchronize state |

### JetBrains Tools (optional, requires running IDE)

| Tool | What It Does |
|------|-------------|
| `jet_brains_find_symbol` | Symbol search via JetBrains backend |
| `jet_brains_find_referencing_symbols` | Reference finding via JetBrains |
| `jet_brains_get_symbols_overview` | Symbol overview via JetBrains |
| `jet_brains_type_hierarchy` | Type hierarchy (supertypes + subtypes) -- unique to JetBrains backend |

### File Tools

| Tool | What It Does |
|------|-------------|
| `read_file` | Read a file within the project |
| `create_text_file` | Create or overwrite files |
| `find_file` | Find files by path pattern |
| `list_dir` | Directory listing with optional recursion |
| `search_for_pattern` | Grep-like pattern search |
| `replace_content` | Find-and-replace with optional regex |
| `delete_lines` (optional) | Delete line ranges |
| `insert_at_line` (optional) | Insert at specific line |
| `replace_lines` (optional) | Replace line ranges |

### Memory Tools

| Tool | What It Does |
|------|-------------|
| `write_memory` | Persist project knowledge for future sessions |
| `read_memory` | Retrieve persisted knowledge |
| `list_memories` | List available memory files |
| `edit_memory` | Regex-based memory content replacement |
| `delete_memory` | Remove memory files |
| `rename_memory` | Move memories between project/global scope |

### Workflow Tools

| Tool | What It Does |
|------|-------------|
| `onboarding` | Initial project exploration and documentation |
| `check_onboarding_performed` | Check if onboarding was already done |
| `initial_instructions` | Provides usage instructions to the agent |
| `prepare_for_new_conversation` | Context reset between sessions |
| `summarize_changes` (optional) | Summarize codebase changes |
| `think_about_collected_information` (optional) | Metacognitive tool: assess information completeness |
| `think_about_task_adherence` (optional) | Metacognitive tool: check task alignment |
| `think_about_whether_you_are_done` (optional) | Metacognitive tool: assess task completion |

### Config/Command Tools

| Tool | What It Does |
|------|-------------|
| `activate_project` | Switch active project |
| `get_current_config` | Show current configuration state |
| `execute_shell_command` | Run arbitrary shell commands (disabled in IDE contexts by default) |
| `open_dashboard` (optional) | Open web dashboard |
| `switch_modes` (optional) | Change between planning/editing modes |

### Query Project Tools (optional)

| Tool | What It Does |
|------|-------------|
| `list_queryable_projects` | List projects available for querying |
| `query_project` | Execute read-only tools against external projects |

---

## 4. Language Support

40+ languages via SolidLSP. The language servers are auto-downloaded on first use into `~/.serena/language_servers/static/`.

**Tier 1 (well-tested):** Python (Pyright), TypeScript, JavaScript, Java (Eclipse JDTLS), Go (Gopls), Rust (rust-analyzer), C/C++ (Clangd), C# (Roslyn/OmniSharp)

**Tier 2 (supported):** Ruby, Kotlin, Swift, Scala, Dart, PHP, Elixir, Haskell, Lua, Julia, Perl, R, Zig, Fortran, Clojure, Erlang, Elm, OCaml, Nix

**Tier 3 (partial/experimental):** Bash, TOML, YAML, Markdown, GLSL, HLSL, WGSL, Groovy, F# (some bugs), AL, Ansible, Lean 4, Luau, Solidity, MATLAB, PowerShell

---

## 5. Comparison: Serena vs. LSP vs. Fallow

### What Each Tool Actually Is

| | Serena | TypeScript LSP (direct) | Fallow |
|---|--------|------------------------|--------|
| **Category** | MCP server wrapping language servers | Language server protocol | Dead code / code health CLI |
| **Protocol** | MCP (stdio or HTTP) | LSP (stdio or TCP) | CLI with JSON output, or MCP |
| **Core purpose** | Expose code understanding to AI agents | Provide code intelligence to editors | Find unused code, duplicates, complexity |
| **Analysis type** | Semantic (via delegated LSP) | Semantic (type-aware) | Syntactic (AST only, no types) |

### Capability Matrix

| Capability | Serena | Claude Code built-in LSP | Fallow |
|-----------|--------|--------------------------|--------|
| Go-to-definition | YES (via `find_symbol`) | YES (`goToDefinition`) | NO |
| Find references | YES (via `find_referencing_symbols`) | YES (`findReferences`) | NO |
| Symbol overview | YES (via `get_symbols_overview`) | YES (`documentSymbol`) | NO |
| Rename refactoring | YES (via `rename_symbol`) | NO | NO |
| Type hierarchy | YES (JetBrains only) | NO | NO |
| Symbol-level code editing | YES (replace/insert at symbol boundaries) | NO | NO |
| Unused exports | NO | NO | YES (primary feature) |
| Unused files | NO | NO | YES |
| Unused dependencies | NO | NO | YES |
| Circular dependencies | NO | NO | YES |
| Code duplication | NO | NO | YES |
| Complexity metrics | NO | NO | YES |
| Auto-fix dead code | NO | NO | YES |
| Module/import graph | NO | NO | YES |
| Hover / type info | NO (not exposed) | YES | NO |
| Diagnostics | NO (not exposed) | YES | NO |
| Project memory/onboarding | YES | NO | NO |
| Multi-language (40+) | YES | TypeScript only | JS/TS only |
| Agent metacognition tools | YES | NO | NO |

### Key Differentiators

**Serena has that LSP does NOT:**
1. **Symbol-level code editing** -- `replace_symbol_body`, `insert_after_symbol`, `insert_before_symbol`. This is the killer feature. Raw LSP provides read-only navigation; Serena turns it into structured write operations.
2. **Cross-project rename** via `rename_symbol` -- leverages LSP rename but exposes it to agents
3. **Persistent project memory** -- agents retain knowledge across sessions
4. **Onboarding workflow** -- systematic project exploration and documentation
5. **Metacognitive tools** -- help agents self-regulate task adherence
6. **Multi-language** -- one MCP server handles 40+ languages, not just TypeScript
7. **JetBrains backend option** -- type hierarchy, superior polyglot indexing

**Serena has that Fallow does NOT:**
- Everything related to code navigation and understanding
- Code editing capabilities
- Multi-language support beyond JS/TS

**Fallow has that Serena does NOT:**
- Dead code detection (unused exports, files, dependencies)
- Code duplication detection
- Complexity metrics and maintainability scoring
- Module/import graph analysis
- Auto-fix capabilities for dead code removal
- Framework-aware entry point detection (84 plugins)

### Verdict: Complementary, Not Competing

```
Serena  = "Understand and edit code at the symbol level" (navigation + refactoring)
Fallow  = "Find and remove code that shouldn't exist" (hygiene + health)
LSP     = "Raw protocol that Serena wraps" (foundation layer)
```

All three occupy different niches. Serena and Fallow together would cover both code understanding AND code health. Neither replaces the other.

---

## 6. Serena vs. Claude Code's Built-in LSP

This is the most practically relevant comparison. Since Claude Code v2.0.74, there are built-in LSP tools:

| Capability | Serena | Claude Code Built-in LSP |
|-----------|--------|--------------------------|
| Find definitions | `find_symbol` (name-path based, flexible) | `goToDefinition` (cursor-position based) |
| Find references | `find_referencing_symbols` | `findReferences` |
| Symbol overview | `get_symbols_overview` | `documentSymbol` |
| Rename | YES | NO |
| Symbol-level editing | YES | NO |
| Project memory | YES | NO |
| 40+ languages | YES | 11 languages |
| Setup required | YES (uv, Python 3.11+) | NO (built-in) |
| Token usage | Claimed 70% savings | Standard |

**Serena maintainers' position:** "Claude's built-in LSP tools are not a replacement for Serena. They are significantly less powerful tools." The recommendation is to use Serena instead, not alongside, to avoid duplicate tool calls consuming context.

**Key advantages of Serena over built-in LSP:**
1. Name-path-based symbol lookup (more flexible than cursor-position-based)
2. Symbol-level code editing (the built-in LSP is read-only)
3. Rename refactoring across codebase
4. Persistent project memory
5. 40+ languages vs 11
6. Onboarding and metacognitive tools

**Key advantages of built-in LSP over Serena:**
1. Zero setup -- just works
2. No Python/uv dependency
3. Hover information and diagnostics (Serena does not expose these)
4. Lower overhead -- no separate process
5. `ENABLE_LSP_TOOL=1` is all that's needed

---

## 7. Integration with Claude Code Skills/Plugins

### Option A: MCP Server (recommended)

Add Serena as an MCP server in the project's `.mcp.json` or via `claude mcp add`:

```bash
claude mcp add serena -- \
  uvx --from git+https://github.com/oraios/serena \
  serena start-mcp-server --context ide-assistant --project "$(pwd)"
```

Or in `.mcp.json`:
```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--from", "git+https://github.com/oraios/serena",
        "serena", "start-mcp-server",
        "--context", "ide-assistant",
        "--project-from-cwd"
      ]
    }
  }
}
```

**Pros:** Full tool access, persistent memory, mode switching, project onboarding.
**Cons:** Requires Python 3.11+ and `uv`. Heavy dependency for a plugin that ships skills only.

### Option B: Skills that reference Serena MCP tools

An fhhs-skills plugin skill could instruct Claude to use Serena's MCP tools when available. This is a "documentation-only" integration -- the skill provides instructions, Serena provides the tools.

Example: a `/fh:navigate` skill could say "Use `find_symbol` and `find_referencing_symbols` from the serena MCP server to navigate the codebase. If serena is not available, fall back to grep and file reading."

**Pros:** No dependency on Serena being installed. Graceful degradation.
**Cons:** Skill can't guarantee Serena is available. User must set up Serena separately.

### Option C: NOT viable -- bundling Serena in a plugin

Claude Code plugins ship `.claude/skills/` only. There are no postinstall hooks. You cannot install Python packages, start MCP servers, or run setup scripts at plugin install time. Serena cannot be bundled inside fhhs-skills.

### Recommendation for fhhs-skills

**Option B is the only viable path.** Skills can reference Serena tools when present and fall back gracefully. The plugin could include a `/fh:setup` step that documents how to add Serena as an MCP server, but cannot automate the installation.

---

## 8. Installation and Setup Requirements

### Prerequisites

| Requirement | Details |
|-------------|---------|
| Python | 3.11+ (NOT 3.12+ per some reports, but docs say 3.11+) |
| `uv` | Python package manager (replaces pip for Serena) |
| Language servers | Auto-downloaded on first use per language |
| Disk space | Language server binaries stored in `~/.serena/language_servers/static/` |

### Quick Install

```bash
# Run directly (no local install)
uvx --from git+https://github.com/oraios/serena serena start-mcp-server --help

# Or clone and run
git clone https://github.com/oraios/serena
cd serena
uv run serena-mcp-server
```

### Per-Project Setup

Serena creates `.serena/project.yml` in each project root. Recommended starting config:

```yaml
read_only: true
project_name: my_project
```

---

## 9. Limitations and Caveats

### Technical Limitations

1. **Synchronous only** -- single-threaded execution. No parallel tool calls. Can be slow on initial symbol resolution for large projects.
2. **LSP subset only** -- Serena exposes find_symbol, find_references, document_symbols, rename, and text edits. It does NOT expose diagnostics, hover, completion, code actions, or many other LSP capabilities.
3. **No incremental compilation** -- large projects may experience delays on first use until language servers index.
4. **External runtime dependencies** -- Go, Rust, Java language servers require their respective runtimes installed on the system.
5. **Language server stability varies** -- some language servers (Go in particular) have had initialization timeout issues.

### Security Concerns

A July 2025 security audit identified **HIGH risk** vulnerabilities:
- `execute_shell_command` allows arbitrary command execution (mitigated: disabled by default in ide-assistant context)
- Network exposure via streamable-http transport
- Insufficient access controls in some configurations

**Mitigation:** Use `read_only: true` in project config, use `ide-assistant` context (disables shell), and monitor tool executions.

### Practical Caveats

1. **Onboarding overhead** -- first session with a new project takes extra time for Serena to explore and document the codebase.
2. **Token overhead from tool descriptions** -- Serena registers ~21+ tools, each with descriptions. This consumes context window just from tool definitions.
3. **Conflict with Claude Code's built-in LSP** -- if both are enabled, duplicate capabilities waste context. Recommendation: use one or the other.
4. **Memory files accumulate** -- `.serena/memories/` grows over time and may need pruning.
5. **Not useful for greenfield** -- Serena shines on existing, large codebases. For new projects or small files, it adds overhead without value.
6. **Python ecosystem dependency** -- requires `uv` and Python, which is an alien dependency in a Node.js/TypeScript plugin ecosystem.

---

## 10. Relevance to fhhs-skills

### What Serena Adds Beyond Current Capabilities

The fhhs-skills plugin currently relies on Claude Code's built-in tools (Read, Grep, Glob, Edit, Bash) plus the built-in LSP tools (when enabled). Serena would add:

1. **Symbol-level editing** -- replace a function body without knowing line numbers, insert code relative to symbols rather than lines. This is genuinely new capability.
2. **Cross-codebase rename** -- rename a symbol and update all references automatically.
3. **Multi-language navigation** -- same tools work for Python, Go, Rust, Java, not just TypeScript.
4. **Persistent project memory** -- agents remember project structure across sessions.

### What It Does NOT Add

1. Dead code detection (use Fallow for that)
2. Code duplication detection (use Fallow)
3. Complexity metrics (use Fallow)
4. Type-level analysis beyond what the underlying LSP provides
5. Call graphs (not exposed through Serena's tools)

### Integration Feasibility

| Approach | Feasible? | Notes |
|----------|-----------|-------|
| Bundle Serena in plugin | NO | No postinstall hooks, Python dependency |
| MCP server alongside plugin | YES | User installs Serena separately, skills reference its tools |
| Skills that gracefully use Serena | YES | Best approach -- detect availability, fall back to built-in tools |
| Replace built-in LSP with Serena | MAYBE | Serena is more powerful but adds setup friction |

### Bottom Line

Serena is a powerful tool that provides genuine capabilities beyond what Claude Code offers natively. However, it is a **separate MCP server** requiring its own installation and setup. For fhhs-skills, the pragmatic path is:

1. Skills can reference Serena tools as "enhanced mode" when available
2. Skills must always work WITHOUT Serena via fallback to built-in tools
3. A setup/documentation skill can guide users through Serena installation
4. Serena and Fallow are complementary -- together they cover code understanding AND code health

---

## 11. Sources

### Primary (HIGH confidence)

- [Serena GitHub Repository](https://github.com/oraios/serena)
- [Serena Official Documentation](https://oraios.github.io/serena/)
- [Serena Tools Reference](https://oraios.github.io/serena/01-about/035_tools.html)
- [DeepWiki: Serena Language Server Integration](https://deepwiki.com/oraios/serena/6-language-server-integration)
- [DeepWiki: Serena Configuration and Workflow Tools](https://deepwiki.com/oraios/serena/5.5-configuration-and-workflow-tools)
- [GitHub Issue #858: Claude Code built-in LSP overlap](https://github.com/oraios/serena/issues/858)

### Secondary (MEDIUM confidence)

- [ClaudeLog: Serena + Claude Code Setup](https://claudelog.com/claude-code-mcps/serena/)
- [SmartScope: Serena MCP Setup Guide](https://smartscope.blog/en/generative-ai/claude/serena-mcp-implementation-guide/)
- [SmartScope: Serena MCP Coding Agent Overview](https://smartscope.blog/en/generative-ai/claude/serena-mcp-coding-agent/)
- [GitHub Discussion #219: Claude Code + Serena Workflow](https://github.com/oraios/serena/discussions/219)
- [GitHub Discussion #380: Security Audit](https://github.com/oraios/serena/discussions/380)

### Tertiary (LOW confidence)

- [DEV Community: Serena MCP Tutorial](https://dev.to/webdeveloperhyper/how-to-use-ai-more-efficiently-for-free-serena-mcp-5gj6)
- [PulseMCP: Serena Server Page](https://www.pulsemcp.com/servers/oraios-serena)
