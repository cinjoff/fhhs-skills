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

## Tool Expectations

claude-mem, ast-grep, and bun are **manifest-required** tools — they are declared in `plugin.json` and expected to be present in every session.

**Important:** claude-mem MCP tools are **deferred** — their schemas must be fetched via `ToolSearch` before they can be called. Every skill that uses claude-mem must include a Step 0: Tool Readiness block:

```
ToolSearch("select:mcp__plugin_claude-mem_mcp-search__smart_search,mcp__plugin_claude-mem_mcp-search__smart_outline,mcp__plugin_claude-mem_mcp-search__smart_unfold,mcp__plugin_claude-mem_mcp-search__search,mcp__plugin_claude-mem_mcp-search__get_observations")
```

If ToolSearch returns empty, fall back to Read-based approach. Do not add `if available` guards for these tools — they are part of the contract. The ToolSearch step is the guard.

ast-grep and bun are directly available (not deferred) — no ToolSearch needed.

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

Max 3 items. Skip silently if no relevant results.

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
Skip silently if no results.
```

---

### Pattern F: Context Query by Intent

Query by **intent** (what you need), not by file path (where it lives). Resolves planning artifacts without reading files first.

```
1. Formulate an intent phrase — describe what you need, not which file contains it:
   ✓ "current plan active tasks wave 2"
   ✓ "spec architecture data flow authentication"
   ✓ "context decisions locked scope reduction"
   ✗ "PLAN.md"  ← too literal, file-path thinking

2. search({query: "<intent phrase>", project, limit: 5})

3. Scan results by type priority:
   - decision, trade-off, gotcha  → fetch immediately with get_observations
   - plan-artifact, spec-section  → fetch if task-relevant
   - note, log                    → fetch only if nothing higher-priority found

4. If relevant observations found (within 7 days): use as primary input
   If observations are stale or absent: fall back to artifact-resolution.md chain

5. Skip silently if no results.
```

**Tag priority hierarchy** (highest → lowest value per token):
1. `decision` — locked choices that constrain implementation
2. `trade-off` — known compromises that affect design
3. `gotcha` — pitfalls that cost time when re-discovered
4. `plan-artifact` — PLAN.md / SPEC.md section snapshots
5. `spec-section` — SPEC.md architecture, failure modes, quality rubrics
6. `build-learning`, `review-learning`, `fix-learning` — post-run findings
7. `note`, `log` — general observations

When multiple types are found, fetch in priority order. Stop when you have enough context for the task.

---

### Pattern G: Spec Section Loading

Load SPEC.md sections on demand via `smart_unfold` instead of reading the full file.

```
1. When a task needs SPEC.md context, identify which sections are relevant:
   - Architecture    → system design, component boundaries
   - Failure Modes   → what can go wrong, error handling expectations
   - Quality Rubrics → acceptance criteria, performance targets
   - Data Flow       → how data moves through the system

2. Check if SPEC.md observations are already in claude-mem (Pattern F first):
   search({query: "spec {section-name} {task-domain}", project, limit: 3})

3. If not in claude-mem (or observations stale):
   smart_unfold({path: "<spec-path>", symbol: "<Section Name>"})
   → Loads only that heading's content (~200-400 tokens vs full file ~2000+)

4. Map loaded content to implementer-prompt placeholders:
   Architecture    → {SPEC_ARCHITECTURE}
   Failure Modes   → {SPEC_FAILURE_MODES}
   Quality Rubrics → {SPEC_QUALITY_RUBRICS}
   Data Flow       → {SPEC_DATA_FLOW}

5. If section is absent or SPEC.md doesn't exist: leave placeholder empty.
   Never fail — the implementer-prompt guards empty placeholders.
```

Load 1-3 sections per task dispatch. Never load the whole SPEC.md at once unless the task explicitly requires full spec review.

---

### Pattern H: Cross-Session Pipeline Cache

When a skill completes, it emits a structured observation (Pattern D) with a skill-specific tag. The next skill in the pipeline queries for this tag before re-reading planning files.

```
1. At skill exit, emit: **[{skill}-output]** {structured summary of outputs}
   Tags: [plan-work-output], [plan-review-output], [build-output], [review-output], [fix-output], [auto-output]

2. At skill entry (after Step 0), query for prior skill output:
   search({query: "[prior-skill-output] {phase-name}", project, limit: 3})

3. If fresh result found (< 2 hours old): use as primary input, skip redundant file reads
   If stale or absent: fall back to normal file reading

4. Budget: 1 search call. Skip silently if no results.
```

This eliminates redundant STATE.md / ROADMAP.md / CONTEXT.md reads in auto flows where plan-work → plan-review → build → review execute sequentially.

---

## Anti-Patterns

- **Dumping observations at session start** — query on-demand, never auto-inject
- **Reading full files to find one function** — smart_outline → smart_unfold
- **Re-researching settled decisions** — search claude-mem first
- **Observing claude-mem's own tools** — creates feedback loops (SKIP_TOOLS handles this)
- **Ignoring observation types** — gotcha/decision/trade-off are highest value; fetch those first
- **Inlining pattern steps** — reference "Pattern A/B/D from claude-mem-rules.md" instead
- **Guarding manifest-required tools** — `if claude-mem is available` checks are anti-patterns; claude-mem, ast-grep, and bun are expected in every session per plugin.json manifest
