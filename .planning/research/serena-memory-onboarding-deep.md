# Serena Memory & Onboarding Deep Dive

> Source: Serena repo source code and docs, fetched 2026-03-29 from `github.com/oraios/serena` (main branch)

---

## 1. Memory System Architecture

### Storage Format
- Memories are **plain Markdown files** (`.md`) stored on the filesystem
- Both humans and the LLM agent can create, read, and edit them
- UTF-8 encoded, with a configurable max character limit per write

### Two Scopes
| Scope | Storage Location | Naming Convention |
|-------|-----------------|-------------------|
| **Project-specific** | `.serena/memories/` inside project root | Any name, e.g. `auth/login/logic` |
| **Global** (cross-project) | `~/.serena/memories/global/` | Must start with `global/`, e.g. `global/java/style_guide` |

### Topic Organization
- Memories support **topic-scoping** via `/` in the name (e.g. `modules/frontend`, `auth/login/logic`)
- Topics map to subdirectories on the filesystem
- `list_memories` can filter by topic, enabling structured exploration of large memory sets
- Moving between project and global scope is supported (e.g. rename `global/foo` to `bar`)

### Protection Mechanisms
- **Read-only patterns**: `read_only_memory_patterns` in config (regex). Example: `"global/.*"` protects all global memories from agent edits
- **Ignored patterns**: `ignored_memory_patterns` in config (regex). Completely excludes matching memories from ALL tools (list, read, write). Access only via raw `read_file` on the filesystem path
- Patterns from global and project-level configs are merged additively

### Key Insight: No External Integration API
- Serena's memory system is **entirely filesystem-based** with no plugin/hook mechanism
- There is **no way to redirect memory writes to claude-mem or any external system** without forking Serena
- The `MemoriesManager` class handles all I/O internally; `save_memory`, `load_memory`, `delete_memory` etc. all operate on the filesystem
- To bridge Serena memories and claude-mem, you would need to either:
  1. Fork Serena and modify `MemoriesManager` (invasive, maintenance burden)
  2. Use `no-memories` mode and implement memory externally in the skill layer
  3. Run a filesystem watcher that syncs `.serena/memories/` to claude-mem (fragile)
  4. Post-process: after onboarding, read `.serena/memories/` and inject into claude-mem

---

## 2. Memory Tools — Complete Reference

### `write_memory`
```
Parameters:
  memory_name: str     — meaningful name, supports "/" for topic org (e.g. "auth/login/logic")
                         Use "global/" prefix for cross-project memories
  content: str         — UTF-8 content to write
  max_chars: int = -1  — max characters (default from config: default_max_tool_answer_chars)
```
- Raises ValueError if content exceeds max_chars
- Implements `ToolMarkerCanEdit` (disabled in read-only mode)

### `read_memory`
```
Parameters:
  memory_name: str     — name of memory to read
```
- Agent instructed to only read if relevant (infer from name)
- Should not read same memory twice in one conversation

### `list_memories`
```
Parameters:
  topic: str = ""      — optional topic filter
```
- Returns JSON dict of available memories
- Respects `ignored_memory_patterns`

### `edit_memory`
```
Parameters:
  memory_name: str
  needle: str                           — literal string or regex pattern
  repl: str                             — replacement string (verbatim)
  mode: Literal["literal", "regex"]     — how needle is interpreted
  allow_multiple_occurrences: bool = False
```
- Regex mode uses Python `re` with DOTALL and MULTILINE flags
- Errors if multiple matches found and `allow_multiple_occurrences` is False

### `delete_memory`
```
Parameters:
  memory_name: str
```
- Only allowed on explicit user request
- Implements `ToolMarkerCanEdit`

### `rename_memory`
```
Parameters:
  old_name: str
  new_name: str
```
- Supports moving between project and global scope
- Use "/" for topic organization

---

## 3. Onboarding System — Complete Reference

### `check_onboarding_performed`
```
Parameters: none
```
- Checks if ANY project memories exist
- If no memories: returns message saying onboarding not performed, suggests calling `onboarding` tool
- If memories exist: returns count and suggests reading relevant ones
- Always appends: "If you have not read the 'Serena Instructions Manual', do so now."

### `onboarding` tool
```
Parameters: none
Returns: a prompt (string) instructing the LLM how to perform onboarding
```
- **This is NOT an automated process** — it returns a prompt that tells the LLM to:
  1. Explore the project structure using available tools
  2. Identify: purpose, tech stack, code style, build/test/lint commands, codebase structure, conventions
  3. Call `write_memory` multiple times to save findings
  4. Key required memories: `suggested_commands.md`, style/conventions file, task-completion checklist
- The prompt is a **Jinja template** that includes the current system name (e.g. "Darwin")
- Called at most once per conversation

### `initial_instructions` tool
```
Parameters: none
Returns: the full system prompt (dynamic)
```
- Calls `self.agent.create_system_prompt()` — returns the **complete system prompt** assembled from:
  - Base system prompt template (Jinja)
  - Context-specific prompt (e.g. `claude-code` context)
  - Mode-specific prompts (e.g. `interactive`, `editing`)
  - List of global memories (if memory tools available)
  - Available tool markers
- Marked as `ToolMarkerDoesNotRequireActiveProject`
- Only needed for clients that don't read system prompt automatically (e.g. Claude Desktop)
- **For Claude Code**: the system prompt is already injected automatically, so this tool is rarely needed

### Onboarding Flow (step by step)
1. Project activated (via CLI `--project` or in-conversation)
2. System prompt includes memory list (if memories exist)
3. Agent calls `check_onboarding_performed`
4. If no memories found → agent calls `onboarding` tool
5. Onboarding tool returns instructional prompt
6. Agent explores project: reads files, directories, config
7. Agent calls `write_memory` multiple times to persist findings
8. On next conversation: `check_onboarding_performed` finds memories → skips onboarding
9. **Recommendation**: switch to new conversation after onboarding (context window gets full)

---

## 4. Modes — Complete Reference

### `no-memories` Mode
**Definition** (from `src/serena/resources/config/modes/no-memories.yml`):
```yaml
description: Excludes Serena's memory tools (and onboarding tools, which rely on memory)
prompt: |
  Serena's memory tools are not available and the onboarding workflow is not being applied.
excluded_tools:
  - write_memory
  - read_memory
  - delete_memory
  - edit_memory
  - rename_memory
  - list_memories
  - onboarding
  - check_onboarding_performed
```

**Critical findings:**
- Disables ALL memory tools — **both read AND write**
- Also disables onboarding tools (they depend on memories)
- If memories exist on disk but `no-memories` is active: **you cannot read them via Serena tools**
- The agent is told in the system prompt that memory tools are not available
- You CAN still read memory files via `read_file` tool (if available in context), but the agent won't be prompted to do so
- In `claude-code` context, `read_file` is excluded from Serena (Claude Code's native file reading is used instead)

### `no-onboarding` Mode
**Definition** (from `src/serena/resources/config/modes/no-onboarding.yml`):
```yaml
description: The onboarding process is not used (memories may have been created externally)
prompt: |
  The onboarding process is not applied.
excluded_tools:
  - onboarding
  - check_onboarding_performed
```

**Critical findings:**
- Only removes the two onboarding tools
- **Memory tools remain fully available** (read, write, edit, delete, rename, list)
- Designed for cases where memories were "created externally" — perfect for pre-populated setups
- The agent will still see the memory list in system prompt and can read/write memories

### Mode Activation
- Modes configured via: global config → project config → CLI `--mode` flags
- `base_modes` (always active) vs `default_modes` (overridable by CLI)
- Default active modes: `interactive` + `editing`
- Can be switched dynamically mid-session via `switch_modes` tool
- Multiple modes can be active simultaneously

---

## 5. Claude Code Integration Context

### `claude-code` Context Definition
```yaml
description: Claude Code (CLI agent where file operations, basic edits, etc. are already covered)
excluded_tools:
  - create_text_file
  - read_file
  - execute_shell_command
  - prepare_for_new_conversation
  - replace_content
single_project: true
```

**Key behaviors in Claude Code context:**
- File operations delegated to Claude Code's native tools
- `single_project: true` — no project switching, `activate_project` disabled
- Memory and onboarding tools ARE available (unless modes disable them)
- `initial_instructions` tool available but system prompt already injected

---

## 6. System Prompt Structure

The system prompt (from `system_prompt.yml` template) includes:
1. General agent behavior instructions (resource-efficient, symbolic tools preferred)
2. Symbolic tool usage guidance (find_symbol, get_symbols_overview, etc.)
3. **Memory awareness**: "You generally have access to memories and it may be useful for you to read them."
4. Global memories list (if any exist)
5. Context-specific prompt (e.g. claude-code priorities)
6. Mode-specific prompts (from all active modes)
7. Concludes with: "You have hereby read the 'Serena Instructions Manual'"

---

## 7. Critical Answers for Integration Decision

### Q: How does `no-memories` mode actually work?
**A**: It removes ALL 8 memory+onboarding tools. Both read AND write are disabled. Existing memories on disk become invisible to the agent through Serena's tool interface. In Claude Code context, the agent could theoretically read `.serena/memories/` files using Claude Code's native `Read` tool, but won't be prompted to do so.

### Q: How does `no-onboarding` mode work?
**A**: It removes only `onboarding` and `check_onboarding_performed`. All memory CRUD tools remain. Designed for externally-managed onboarding. Agent still sees memory list and can use them normally.

### Q: What does `initial_instructions` return?
**A**: The complete system prompt, dynamically assembled from templates + context + modes + memory list. It's the same prompt injected automatically in Claude Code, so calling this tool is redundant there.

### Q: Can memories be topic-scoped?
**A**: Yes, using "/" in names. Topics map to subdirectories. `list_memories` can filter by topic.

### Q: If memories exist but no-memories mode is active?
**A**: Memories remain on disk but ALL Serena memory tools are excluded. No read, no write, no list. The `read_file` tool could access them but is also excluded in `claude-code` context (Claude Code's own `Read` could though).

### Q: Can Serena write memories to claude-mem?
**A**: No. The memory system is purely filesystem-based with no extension points. Integration would require forking Serena or using a post-processing/sync approach.

---

## 8. Recommended Integration Strategy for fhhs-skills

Based on these findings, the viable approaches are:

### Option A: `no-memories` + `no-onboarding`, handle everything externally
- Run Serena with both modes active
- Use fhhs-skills' own onboarding and memory system (claude-mem based)
- Pro: Complete control, no duplication
- Con: Lose Serena's memory-aware system prompt hints; must replicate onboarding prompt quality

### Option B: `no-onboarding` only, keep Serena memory tools
- Let fhhs-skills handle onboarding and pre-populate `.serena/memories/` on disk
- Agent uses Serena's read/write memory tools naturally
- Pro: Works with Serena's system prompt memory awareness, no forking needed
- Con: Two memory systems (Serena files + claude-mem); no automatic sync

### Option C: Let Serena handle its own onboarding, bridge memories post-hoc
- Standard Serena with default modes
- After onboarding, read `.serena/memories/` and extract key facts into claude-mem
- Pro: Simplest setup, Serena works as designed
- Con: Duplication, stale data risk, context window waste on first run

### Option D: `no-onboarding`, pre-populate memories, write-protect them
- Use `read_only_memory_patterns` to prevent agent from modifying pre-populated memories
- fhhs-skills generates `.serena/memories/` content from its own templates
- Pro: Controlled content, Serena still reads them naturally
- Con: Static memories may drift from project reality
