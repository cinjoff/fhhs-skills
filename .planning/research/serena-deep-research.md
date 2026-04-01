---
researched: 2026-03-29
domain: Serena MCP deep integration analysis
confidence: HIGH
sources: oraios.github.io/serena docs, github.com/oraios/serena, claude-code.yml context definition
---

# Serena Deep Integration Research

## 1. Setup & Onboarding — What Actually Happens

### Installation (Confirmed: HIGH)

**Prerequisites:** Python 3.11+ and `uv` package manager.

**Claude Code setup (per-project):**
```bash
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context claude-code --project "$(pwd)"
```

**Claude Code setup (global, all projects):**
```bash
claude mcp add --scope user serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context=claude-code --project-from-cwd
```

The `--project-from-cwd` flag makes Serena search upward from cwd for `.serena/project.yml` or `.git` markers to auto-activate the project.

### Project Creation (Confirmed: HIGH)

Two paths:
1. **Implicit:** Just activate a directory — uses defaults, auto-detects language.
2. **Explicit:** Run `serena project create [--language python --language typescript --name my-project --index]` — generates `.serena/project.yml`.

**`.serena/project.yml` configures:** programming languages for LSP spawning, language backend (LSP vs JetBrains), file encoding, ignore rules, write access, initial prompt on activation, default tools/modes.

### Onboarding Process (Confirmed: HIGH)

The onboarding is automatic on first project activation:

1. Serena checks if any memories exist for the project (via `check_onboarding_performed`).
2. If no memories found, triggers onboarding: reads key files and directories to understand the project.
3. Writes findings into `.serena/memories/` as project-specific markdown files.
4. On subsequent activations, memories are listed and the LLM reads them by name as needed.

**Key insight:** Onboarding is LLM-driven. The `initial_instructions` tool provides a prompt telling the LLM to explore and write memories. The LLM decides what to explore and what to remember. This is NOT a deterministic indexing step — it is a conversation turn consumed by the LLM.

### Token Efficiency Feature (Confirmed: HIGH)

Serena explicitly supports Claude Code's on-demand tool loading (`ENABLE_TOOL_SEARCH=true`). With this enabled, tool descriptions are NOT sent on startup — Claude searches for tools as needed. This is the official recommendation to mitigate the ~21-tool description overhead.

```bash
ENABLE_TOOL_SEARCH=true claude
```

## 2. Claude Code Context — What Gets Excluded

The `claude-code` context definition (source: `src/serena/resources/config/contexts/claude-code.yml`) excludes:

| Excluded Tool | Reason |
|---|---|
| `create_text_file` | Claude Code has Write/Edit |
| `read_file` | Claude Code has Read |
| `execute_shell_command` | Claude Code has Bash |
| `prepare_for_new_conversation` | N/A for Claude Code |
| `replace_content` | Claude Code has Edit |

**Tools remaining in `claude-code` context (~16 tools):**

| Category | Tools | Count |
|---|---|---|
| **symbol_tools** | `find_symbol`, `find_referencing_symbols`, `get_symbols_overview`, `insert_after_symbol`, `insert_before_symbol`, `rename_symbol`, `replace_symbol_body` | 7 |
| **file_tools** (partial) | `find_file`, `list_dir`, `search_for_pattern` | 3 |
| **memory_tools** | `list_memories`, `read_memory`, `write_memory`, `delete_memory`, `rename_memory` | 5 |
| **onboarding_tools** | `check_onboarding_performed`, `initial_instructions` | 2 |
| **config_tools** (partial) | `get_current_config` | 1 |

**Note:** `activate_project` is always disabled in `single_project` mode (which `claude-code` context uses). JetBrains tools are optional/disabled by default.

## 3. Redundancy Analysis — Tool-by-Tool

### 3.1 Serena Symbol Tools vs TypeScript LSP (Verdict: COMPLEMENTARY, not redundant)

| Capability | Serena | Claude Code Built-in LSP | Winner |
|---|---|---|---|
| Find by name | `find_symbol` — name-path search, flexible | `workspaceSymbol` — exact match | Serena |
| Find references | `find_referencing_symbols` — returns symbol context | `findReferences` — returns locations | Serena (richer) |
| Overview | `get_symbols_overview` — file-level symbol tree | `documentSymbol` — similar | Tie |
| Rename | `rename_symbol` — cross-file via LSP | Not exposed | **Serena unique** |
| Edit by symbol | `replace_symbol_body`, `insert_after_symbol`, `insert_before_symbol` | Not available | **Serena unique** |
| Language support | 40+ languages | TypeScript/JavaScript only | **Serena unique** |

**Verdict:** Serena's symbol tools are NOT redundant with the built-in TS LSP. They provide (a) symbol-level editing that doesn't exist in Claude Code, (b) multi-language support, and (c) richer context in search results. For pure TS/JS projects, Serena is still superior because `rename_symbol` and `replace_symbol_body` are genuinely new capabilities. **Confidence: HIGH.**

### 3.2 Serena Memory vs claude-mem (Verdict: REDUNDANT — pick one)

| Aspect | Serena Memories | claude-mem |
|---|---|---|
| Storage | `.serena/memories/*.md` — human-readable files | SQLite database |
| Scope | Project-specific + global | Cross-project |
| Structure | Flat markdown files organized by topic dirs | Observations, timelines, smart_search |
| Search | List by topic, read by name | BM25/semantic search, unfold |
| Write | `write_memory` — full file replacement | `observe` — append observations |
| Read | `read_memory` — full file content | `smart_search`, `smart_unfold` — semantic |
| Tools count | 5 tools (list, read, write, delete, rename) | 5+ tools (search, unfold, outline, timeline, observe) |

**Verdict:** These are REDUNDANT for the same purpose (cross-session project memory). claude-mem is more sophisticated (semantic search, timeline, structured observations). Serena memories are simpler but human-readable/editable. Running both wastes ~10 tool slots for memory alone. **Use claude-mem as primary, disable Serena memories via `no-memories` mode.** Confidence: HIGH.

### 3.3 Serena File Tools vs Claude Code Built-in (Verdict: MOSTLY REDUNDANT)

| Tool | Serena | Claude Code Equivalent | Redundant? |
|---|---|---|---|
| `find_file` | Glob search | Glob tool | YES |
| `list_dir` | Directory listing | `ls` via Bash | YES |
| `search_for_pattern` | Regex search in project | Grep tool | YES |

**Verdict:** All 3 remaining file tools duplicate Claude Code built-ins exactly. The `claude-code` context already excludes `read_file`, `create_text_file`, `replace_content`. It should ALSO exclude `find_file`, `list_dir`, and `search_for_pattern`. **Confidence: HIGH.**

### 3.4 Serena File Tools vs context-mode (Verdict: REDUNDANT, context-mode wins)

context-mode provides `ctx_execute(language: "shell", ...)` which can run any search/find command AND auto-indexes results into a searchable knowledge base. Serena's `search_for_pattern` and `find_file` return raw results that consume context tokens directly. context-mode is strictly superior for search tasks. **Confidence: HIGH.**

### 3.5 Serena Onboarding vs map-codebase (Verdict: PARTIALLY REDUNDANT)

| Aspect | Serena Onboarding | `/fh:map-codebase` |
|---|---|---|
| Trigger | Automatic on first activation | Manual invocation |
| Output | Markdown memory files | Structured codebase map document |
| Method | LLM explores and writes memories | Agent with deterministic structure |
| Includes | Whatever LLM decides to remember | Architecture, dependencies, concerns, Fallow metrics |
| Reusable | Yes, across sessions via memories | Yes, as a document |

**Verdict:** `/fh:map-codebase` is more structured and deterministic. Serena onboarding is LLM-dependent and produces variable results. If using map-codebase, disable Serena onboarding via `no-onboarding` mode. The memories created by onboarding add nothing that map-codebase + claude-mem don't already provide. **Confidence: HIGH.**

## 4. Token Cost Analysis

### Current State (without Serena)
Claude Code built-in tools + context-mode + claude-mem + Fallow CLI + TS LSP = baseline.

### Adding Serena with `claude-code` context (default)
~16 additional tool descriptions in context. At ~200 tokens per tool description = **~3,200 tokens per turn** of overhead.

### Adding Serena with optimal configuration
Using `no-memories` mode + `no-onboarding` mode + custom tool exclusions:
- Remove: 5 memory tools + 2 onboarding tools + 3 file tools = 10 tools removed
- Keep: 7 symbol tools + 1 config tool = 8 tools
- Cost: ~1,600 tokens per turn

### With on-demand tool loading (`ENABLE_TOOL_SEARCH=true`)
Tool descriptions are deferred. Only tools actually used in a turn are loaded. Overhead drops to near-zero for turns that don't use Serena. **This is the recommended approach.**

## 5. Prescriptive Recommendations

### R1: Use Serena ONLY for symbol tools. Disable everything else. (Confidence: HIGH)

The only genuinely new capabilities Serena brings to the fhhs-skills stack are:
1. `find_symbol` — superior to built-in LSP for name-path search
2. `find_referencing_symbols` — richer context than built-in `findReferences`
3. `get_symbols_overview` — comparable but works for 40+ languages
4. `rename_symbol` — **unique, no equivalent in Claude Code**
5. `replace_symbol_body` — **unique, no equivalent in Claude Code**
6. `insert_after_symbol` / `insert_before_symbol` — **unique, no equivalent**

Everything else (file tools, memory, onboarding, shell, config) is redundant with existing stack.

### R2: Use `no-memories` + `no-onboarding` modes. (Confidence: HIGH)

```bash
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server \
  --context claude-code \
  --project "$(pwd)" \
  --mode no-memories \
  --mode no-onboarding
```

This eliminates 7 redundant tools. claude-mem handles cross-session memory. `/fh:map-codebase` handles project exploration.

### R3: Additionally disable `find_file`, `list_dir`, `search_for_pattern` in project.yml. (Confidence: HIGH)

In `.serena/project.yml`:
```yaml
excluded_tools:
  - find_file
  - list_dir
  - search_for_pattern
  - get_current_config
```

This brings the active tool count down to **7 symbol tools only** — the genuine value-add.

### R4: Enable on-demand tool loading. (Confidence: HIGH)

Set `ENABLE_TOOL_SEARCH=true` when launching Claude Code. This is Serena's official recommendation for token efficiency. With deferred loading, the 7 symbol tool descriptions (~1,400 tokens) only enter context when actually needed.

### R5: Keep Serena OPTIONAL, not required. (Confidence: HIGH)

Serena requires Python 3.11+ and `uv`. Not all users will have this. The existing fallback pattern in 05-04-PLAN.md ("use Serena if available, fall back to built-in LSP") is correct. Do NOT make Serena a hard dependency.

### R6: Revise `/fh:setup` to include optimal configuration. (Confidence: HIGH)

The setup step for Serena should include `--mode no-memories --mode no-onboarding` and instruct users to add `excluded_tools` to their `.serena/project.yml`. The current 05-04-PLAN.md does not include these optimizations.

### R7: The 05-04-PLAN.md approach is sound but needs refinement. (Confidence: HIGH)

What's correct:
- Fallback pattern (Serena available? Use it. Otherwise built-in LSP.) — **correct**
- Referencing `find_symbol`, `find_referencing_symbols`, `rename_symbol` in skills — **correct**
- Adding Serena to `/fh:setup` — **correct**

What needs revision:
- Setup should specify `--mode no-memories --mode no-onboarding` — **missing**
- Setup should recommend `ENABLE_TOOL_SEARCH=true` — **missing**
- Setup should recommend `excluded_tools` in project.yml — **missing**
- No skill should reference Serena's `search_for_pattern` or `find_file` — **use Grep/Glob instead**

## 6. Ideal Stack Configuration

For a project using fhhs-skills with all optional tools:

| Layer | Tool | Purpose | Overlap |
|---|---|---|---|
| **Semantic code nav** | Serena (symbol tools only) | `find_symbol`, `rename_symbol`, `replace_symbol_body`, `insert_after_symbol` | Partially overlaps TS LSP for TS/JS, but adds multi-lang + symbol editing |
| **Code health** | Fallow CLI | Dead code, duplication, complexity, circular deps | No overlap with Serena |
| **Project memory** | claude-mem | Cross-session observations, semantic search | Replaces Serena memories |
| **Data sandbox** | context-mode | Keep raw data out of context, searchable KB | Replaces Serena file tools |
| **TS/JS LSP** | Built-in TS LSP | Diagnostics, hover, go-to-definition | Keep for diagnostics; Serena handles symbol search |

**What to drop:**
- Serena memory tools (redundant with claude-mem)
- Serena onboarding (redundant with `/fh:map-codebase`)
- Serena file tools (redundant with Claude Code built-ins + context-mode)
- Serena config tools (not needed in single-project mode)

**Net tool budget:** 7 Serena symbol tools added, providing capabilities that genuinely don't exist elsewhere in the stack.

## 7. New Developments Since March 25 Research

Based on current docs (fetched 2026-03-29):

1. **`--project-from-cwd` flag** — New global config option that auto-discovers projects by walking up from cwd. Simpler than per-project MCP config.
2. **On-demand tool loading support** — Officially documented with `ENABLE_TOOL_SEARCH=true`. This was not in the March 25 research.
3. **Modes system matured** — `no-memories`, `no-onboarding`, `planning`, `editing`, `interactive`, `one-shot` modes are now documented. Composable via `--mode` flags.
4. **JetBrains plugin alternative** — Serena now has a JetBrains plugin as an alternative to LSP. Not relevant for Claude Code but shows active development.
5. **22.2k GitHub stars** — Significant adoption, suggesting long-term viability.
6. **`query-projects` mode** — Can query other Serena projects without activating them. Potentially useful for monorepos but not relevant for fhhs-skills.
7. **Memory organization** — Topic-based organization with `/` separators, ignore patterns, read-only patterns. More mature than March 25 research indicated.

## 8. Summary Decision Matrix

| Question | Answer | Confidence |
|---|---|---|
| Should Serena replace existing tools? | NO — complement, not replace | HIGH |
| Should Serena be required? | NO — optional with graceful fallback | HIGH |
| Which Serena tools are genuinely new? | 7 symbol tools (find, refs, overview, rename, replace_body, insert_before/after) | HIGH |
| Which Serena tools are redundant? | Memory (5), file (3), onboarding (2), config (1) = 11 redundant | HIGH |
| Is 05-04-PLAN.md well-designed? | Yes, but needs mode/exclusion optimizations in setup | HIGH |
| Recommended modes? | `--mode no-memories --mode no-onboarding` | HIGH |
| Recommended env? | `ENABLE_TOOL_SEARCH=true` | HIGH |
| Token overhead with optimal config? | ~1,400 tokens (7 tools) or ~0 with on-demand loading | HIGH |
