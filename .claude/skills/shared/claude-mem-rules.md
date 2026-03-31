# claude-mem Usage Rules

Best practices derived from claude-mem official documentation (context-engineering, progressive-disclosure, smart-explore-benchmark). All skills referencing claude-mem MUST follow these rules.

## Core Principle: Progressive Disclosure

Never dump observations into context. Use the three-layer approach:

1. **Layer 1: Index** — `search(query, project, limit)` returns titles + types + token costs (~800 tokens for 50 items)
2. **Layer 2: Details** — `get_observations(ids)` fetches full content for specific IDs (~155 tokens each)
3. **Layer 3: Source** — Read the actual files only when observation content isn't sufficient

**Why:** Dumping everything wastes 94% of tokens. Progressive disclosure achieves ~100% relevance.

## Session Start: Zero Auto-Inject

`CLAUDE_MEM_CONTEXT_OBSERVATIONS` MUST be `0`. Skills query claude-mem explicitly when they need cross-session context — not on every session start. This saves ~25,000-35,000 tokens per session.

## Tool Selection Matrix

| Task | claude-mem tool | Fallback |
|------|----------------|----------|
| "Where is X defined?" | `smart_search({query})` | Grep/Glob |
| "What functions are in this file?" | `smart_outline({path})` | Read |
| "Show me function X" | `smart_unfold({path, symbol})` | Read |
| Prior decisions on this topic | `search({query, project})` → `get_observations({ids})` | — |
| What happened in recent sessions | `timeline({query, depth_before})` | — |
| Cross-session patterns/mistakes | `smart_search({query})` with keywords: gotcha, decision, trade-off | — |
| Open-ended "how does X work?" | Explore Agent (subagent) | Read multiple files |

### Smart Explore vs Explore Agent

- **Smart Explore** (smart_search/smart_outline/smart_unfold): 11-27x cheaper. Use for targeted lookups, known symbols, file structure. 1 tool call, predictable cost.
- **Explore Agent**: Use for open-ended synthesis ("how does auth work end-to-end?"), architecture understanding, cross-cutting concerns. 15-37 tool calls, higher cost but richer understanding.

**Default to Smart Explore. Escalate to Explore Agent only when synthesis is needed.**

## Observation Hook Configuration

claude-mem's PostToolUse hook (`matcher: "*"`) observes all tool calls. Configure `CLAUDE_MEM_SKIP_TOOLS` to maximize signal-to-noise ratio.

### Observe (high-signal — DO NOT skip)

| Tool | Why |
|------|-----|
| `Edit` | Code changes — highest signal observation |
| `Write` | File creation — high signal |
| `Bash` | Commands reveal intent and outcomes |
| `Agent` | Delegation patterns, research topics |
| `Read` | File access patterns reveal investigation focus |
| `Grep` | Search patterns show what's being investigated |
| `Glob` | File discovery patterns |
| `WebSearch`, `WebFetch` | Research topics |

### Skip (noise — add to SKIP_TOOLS)

| Tool | Why skip |
|------|----------|
| `ListMcpResourcesTool`, `ReadMcpResourceTool` | Internal MCP discovery |
| `SlashCommand`, `Skill` | Invocation metadata, not content |
| `TodoWrite` | Deprecated |
| `AskUserQuestion` | UI interaction |
| `ToolSearch` | Internal tool schema loading |
| `TaskCreate`, `TaskUpdate`, `TaskGet`, `TaskList`, `TaskOutput`, `TaskStop` | No longer used by skills — retained defensively for other plugins/tools that may invoke them |
| `SendMessage` | Internal agent communication |
| `EnterPlanMode`, `ExitPlanMode` | Mode switching |
| `EnterWorktree`, `ExitWorktree` | Internal worktree management |
| `LSP` | Symbol lookups too granular — dozens per investigation |
| `CronCreate`, `CronDelete`, `CronList` | Internal scheduling |
| `TeamCreate`, `TeamDelete` | Internal team management |
| `NotebookEdit` | Rare, low signal |
| All `mcp__plugin_claude-mem_*` | Self-referential loop avoidance |

### Canonical SKIP_TOOLS value

```
ListMcpResourcesTool,ReadMcpResourceTool,SlashCommand,Skill,TodoWrite,AskUserQuestion,ToolSearch,TaskCreate,TaskUpdate,TaskGet,TaskList,TaskOutput,TaskStop,SendMessage,EnterPlanMode,ExitPlanMode,EnterWorktree,ExitWorktree,LSP,CronCreate,CronDelete,CronList,TeamCreate,TeamDelete,NotebookEdit,mcp__plugin_claude-mem_mcp-search____IMPORTANT,mcp__plugin_claude-mem_mcp-search__search,mcp__plugin_claude-mem_mcp-search__get_observations,mcp__plugin_claude-mem_mcp-search__timeline,mcp__plugin_claude-mem_mcp-search__smart_search,mcp__plugin_claude-mem_mcp-search__smart_unfold,mcp__plugin_claude-mem_mcp-search__smart_outline
```

## How Skills Should Use claude-mem

### Pattern: Past Learnings Check (before research/design)

```
1. search({query: "2-3 keywords from task", project: "<project-name>", limit: 10})
2. Scan index for relevant IDs — prioritize types: gotcha, decision, trade-off
3. get_observations({ids: [top 2-3 relevant IDs]})
4. Present as: "From prior sessions: {observation}" — max 3 items
5. Feed into design context to avoid repeating mistakes
```

### Pattern: Code Structure Exploration (before reading files)

```
1. smart_outline({path: "target/module"}) → structural overview without reading full file
2. smart_search({query: "function or pattern name"}) → find definitions across codebase
3. smart_unfold({path, symbol}) → read specific function, never truncates
4. Only Read full file when you need to Edit it
```

### Pattern: Cross-Step Context in Auto Pipeline

claude-mem observations persist across sequential `claude -p` sessions in the auto pipeline. Each step's tool calls are observed and available to subsequent steps via `search` or `timeline`. No explicit pre-indexing needed.

## Pattern: Reference Caching (static skill references)

Shared references (testing-guide, TDD, claude-mem-rules) are static between plugin updates. Use smart_outline + smart_unfold for selective extraction instead of full-file reads:

### Selective Extraction (preferred)

Orchestrator skills (build, auto) extract task-relevant sections once and inject into subagent prompts:

```
1. smart_outline({path: ".claude/skills/shared/testing-guide.md"}) — heading structure (~50 tokens)
2. smart_unfold({path: "...", symbol: "Part B"}) — extract just TDD section (~80 lines vs 189 total)
3. Inject into subagent prompts via {SHARED_REFERENCES} placeholder
```

This eliminates N redundant full-file reads per build (N = number of tasks) and loads only the relevant section per task type.

### Cross-session (claude-mem observations)

The warm-up reads are automatically observed by claude-mem hooks. In future sessions:

```
1. smart_search({query: "testing guide TDD Playwright patterns"}) — check if relevant observations exist
2. If found: get_observations({ids: [relevant IDs]}) for summaries
3. Use smart_unfold for full section content when observations aren't sufficient
```

Note: observations contain summaries, not full content. Use smart_unfold for authoritative section content.

### Cache Invalidation

smart_outline and smart_unfold always read current disk files — no stale cache risk after `/fh:update`.

## Anti-Patterns

- **Dumping observations at session start** — set CONTEXT_OBSERVATIONS=0, query on-demand
- **Reading full files to find one function** — use smart_outline → smart_unfold
- **Re-researching settled decisions** — search claude-mem first
- **Observing claude-mem's own tools** — creates feedback loops, keep in SKIP_TOOLS
- **Ignoring observation types** — gotcha/decision/trade-off are highest value, fetch those first

## Graceful Degradation

All claude-mem calls in skills MUST be guarded:

```
If claude-mem is available (check tool list for mcp__plugin_claude-mem_*):
  → Use progressive disclosure pattern
If not available:
  → Fall back to Read/Grep/Glob directly
  → Skills work identically, just without cross-session memory
```

Never fail a skill because claude-mem is missing. It's an enhancement, not a dependency.
