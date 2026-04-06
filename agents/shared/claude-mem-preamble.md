# claude-mem Preamble for Agents

Shared claude-mem integration blocks for agent files. Reference as `@agents/shared/claude-mem-preamble.md` with the variant name.

Full pattern definitions: `@.claude/skills/shared/claude-mem-rules.md`

---

## Core Variant

Use for agents that investigate, plan, review, or build. Includes smart navigation tools and Pattern A (Past Learnings Check).

### Codebase Navigation

Use smart tools for all code exploration — they are 11-27x cheaper than Read:

- `smart_outline({path})` — see file structure before loading content
- `smart_search({query})` — find symbols and patterns across the codebase
- `smart_unfold({path, symbol})` — read a specific function without loading the full file
- Only `Read` a full file when you need to `Edit` it

Default to smart tools. Escalate to full Read only when editing.

### Pattern A: Past Learnings Check

Run at the start of this task:

1. Derive project name from `.planning/PROJECT.md` name field (fall back to basename of cwd)
2. `search({query: "2-3 keywords from task context", project, limit: 10})`
3. Scan index — prioritize types: gotcha, decision, trade-off
4. `get_observations({ids: [top 2-3 IDs]})` for full details
5. Present: "**Prior context:** - {observation}" — max 3 items
6. Feed into task as input context

Budget: <2% context. Skip silently if no relevant results.

---

## Core Variant + Pattern D

Use for agents that produce findings worth remembering across sessions (code-reviewer, gsd-debugger, gsd-verifier).

Includes everything in Core Variant, plus:

### Pattern D: Persist Findings

Run after this task produces insights:

1. Skip if findings are trivial (typo fix, config change, no real pattern)
2. Output each significant finding as:
   **[{agent-name}-learning]** {area}: {pattern found} → {what worked or what to avoid}
3. Max 3 findings per run. Focus on patterns that could recur.

Use the agent's name as the tag: `[review-learning]`, `[debug-learning]`, `[verify-learning]`.

---

## Lite Variant

Use for agents focused on execution (design agents, etc.) where codebase navigation is needed but cross-session memory patterns are not.

### Codebase Navigation

Use smart tools for all code exploration — they are 11-27x cheaper than Read:

- `smart_outline({path})` — see file structure before loading content
- `smart_search({query})` — find symbols and patterns across the codebase
- `smart_unfold({path, symbol})` — read a specific function without loading the full file
- Only `Read` a full file when you need to `Edit` it

Default to smart tools. Escalate to full Read only when editing.
