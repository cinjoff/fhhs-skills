# claude-mem Usage Rules

How skills use claude-mem. All skills referencing claude-mem follow these rules.

**Reading this file efficiently:** Use `smart_unfold({path: "shared/claude-mem-rules.md", symbol: "Pattern A"})` to load just the pattern you need instead of reading the whole file.

## Core Principle: Progressive Disclosure

Never dump observations into context. Three layers, each cheaper than the next:

1. **Index** — `search(query, project, limit)` → titles + types (~800 tokens for 50 items)
2. **Details** — `get_observations(ids)` → full content for specific IDs (~155 tokens each)
3. **Source** — `Read` the actual file only when observation content isn't sufficient

`CLAUDE_MEM_CONTEXT_OBSERVATIONS` MUST be `0`. Skills query on-demand, not at session start.

## Tool Selection

| Need | Tool | Fallback |
|------|------|----------|
| Find where X is defined | `smart_search({query})` | Grep/Glob |
| See file structure | `smart_outline({path})` | Read |
| Read one function | `smart_unfold({path, symbol})` | Read with offset/limit |
| Prior decisions/gotchas | `search({query, project})` → `get_observations({ids})` | — |
| Recent session history | `timeline({query, depth_before})` | — |
| Cross-session patterns | `search` with keywords: gotcha, decision, trade-off | — |
| Open-ended "how does X work?" | Explore Agent (subagent) | Read multiple files |

**Default to smart tools. Escalate to Explore Agent only when cross-file synthesis is needed.**

Smart tools are 11-27x cheaper than Read. Use `smart_outline` before reading any file. Use `smart_unfold` to read a specific function instead of the full file. Only `Read` a full file when you need to `Edit` it.

## Graceful Degradation

Every claude-mem call MUST be guarded. Never fail a skill because claude-mem is missing.

```
If claude-mem is available (check tool list for mcp__plugin_claude-mem_*):
  → Use the patterns below
If not available:
  → Fall back to Read/Grep/Glob
  → Skills work identically, just without cross-session memory
```

Skip silently if claude-mem is unavailable or any MCP call fails.

## Patterns

Skills reference these by name instead of inlining the steps. Each pattern derives project name from `.planning/PROJECT.md` name field (fall back to basename of cwd).

---

### Pattern A: Past Learnings Check

Run at the start of any skill that investigates, plans, or builds. Surfaces prior mistakes and decisions so the skill doesn't repeat them.

```
1. search({query: "2-3 keywords from task context", project, limit: 10})
2. Scan index for relevant IDs — prioritize types: gotcha, decision, trade-off
3. get_observations({ids: [top 2-3 IDs]}) for full details
4. If temporal context helps: timeline({query: "subsystem/module", depth_before: 3})
5. If structural context helps: smart_search({query: "function/module under review", limit: 3})
6. Present: "**Prior context:** - {observation}" — max 3 items
7. Feed into the skill's next step as input context
```

Budget: <2% context. Skip silently if no relevant results.

---

### Pattern B: Code Structure Exploration

Run before reading files for review, investigation, or refactoring.

```
1. smart_outline({path}) → see file structure without loading full content
2. smart_search({query: "symbol or pattern"}) → find across codebase
3. smart_unfold({path, symbol}) → read specific function (never truncates)
4. Only Read full file when you need to Edit it
```

---

### Pattern D: Persist Findings

Run after a skill produces insights worth remembering across sessions. claude-mem's PostToolUse hook captures the output text as an observation.

```
1. Skip if findings are trivial (typo fix, config change, no real pattern)
2. Output each significant finding as:
   **[{skill}-learning]** {area}: {pattern found} → {what worked or what to avoid}
3. Max 3 findings per skill run. Focus on patterns that could recur.
```

The `[{skill}-learning]` tag makes findings searchable in future Past Learnings Checks. Use the skill's name: `[review-learning]`, `[fix-learning]`, `[refactor-learning]`, `[research-finding]`, `[security-finding]`.

---

### Pattern E: Research Caching

Before dispatching a new researcher agent, check if prior research exists:

```
1. search({query: "research findings {domain}", project, limit: 5})
2. If relevant research found from recent session (within 7 days): present findings, ask "Prior research found — reuse or re-research?"
3. If reused: skip researcher dispatch, feed existing findings into brainstorm/spec
4. New research findings are auto-indexed by PostToolUse hook — tagged with [research-finding]
Budget: <1% context for the check. Skip silently if no results.
```

---

## Anti-Patterns

- **Dumping observations at session start** — query on-demand, never auto-inject
- **Reading full files to find one function** — smart_outline → smart_unfold
- **Re-researching settled decisions** — search claude-mem first
- **Observing claude-mem's own tools** — creates feedback loops (SKIP_TOOLS handles this)
- **Ignoring observation types** — gotcha/decision/trade-off are highest value; fetch those first
- **Inlining pattern steps** — reference "Pattern A/B/D from claude-mem-rules.md" instead
