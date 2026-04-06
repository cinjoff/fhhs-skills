# Tool Availability Guards

Canonical availability checks for optional tools. Skills reference this file instead of inlining checks.

## Manifest-Guaranteed Tools

These tools are `required: true` in `manifest-schema.cjs`. They are expected to be available — no availability check or fallback needed. If missing, fail fast with: `"[tool] not found. Run /fh:setup to configure your environment."`

| Tool | Manifest ID | What it provides |
|------|-------------|-----------------|
| node | `node` | JavaScript runtime for gsd-tools.cjs |
| git | `git` | Version control |
| bun | `bun` | Fast package management and script running |
| ast-grep | `ast-grep` | Structural code search and replace |
| claude-mem | `claude-mem` (plugin) | Cross-session memory, smart code navigation |

**Do not guard these tools.** Use them directly. The manifest check in `/fh:setup` and `/fh:update` guarantees their presence.

---

## Codemap MCP

**Source:** `@jordancoin/codemap` — registered via `claude mcp add codemap -- npx -y @jordancoin/codemap`

**Check:** Inspect available tool list for `mcp__codemap__` prefixed tools at session start.

If codemap MCP tools are in the tool list:
- `CODEMAP_AVAILABLE = true`
- Use `mcp__codemap__get_codebase_structure` for tree views
- Use `mcp__codemap__search_code` for semantic code search

**Fallback:** Skip enrichment. Proceed with grep/glob-based analysis.

---

## ast-grep MCP

> **Note:** ast-grep is manifest-guaranteed. The MCP and CLI sections below document usage patterns, not availability checks.

Use `find_code_by_rule` / `sg_search` for structural pattern matching.

**Hard ceiling:** ast-grep has no language support for Markdown — do not attempt structural queries on `.md` files. Fall back to Grep for Markdown always.

**Conditional GO status:** Structural search (4.1/5) is reliable. Bulk replace (3.2/5) requires verification pass after each transform.

**CLI usage:**
```bash
sg --pattern '$PATTERN' --lang typescript src/
```

---

## LSP

**Check:** Inspect tool list for LSP tools (`goToDefinition`, `findReferences`, `hover`, `diagnostics`).

**Fallback:** Use Grep for reference lookups, Read for type navigation.

**Reference pattern:**
```
If LSP tools available → prefer findReferences/goToDefinition over grep
Else → grep for symbol name across codebase
```

---

## claude-mem

> **Note:** claude-mem is manifest-guaranteed. No availability check needed.

Use claude-mem smart tools directly. See `@.claude/skills/shared/claude-mem-rules.md` for full patterns (A through G).

---

## Fallow CLI

**Check:**
```bash
FALLOW_AVAILABLE=false
command -v fallow &>/dev/null && FALLOW_AVAILABLE=true
```

**Fallback:** Skip static analysis. Access Fallow results in non-review skills via `/fh:review` dispatch.

**Used by:** review (quality agent ground truth), map-codebase (deterministic metrics).

---

## Summary Table

| Tool | Status | Fallback |
|------|--------|---------|
| node, git, bun | Manifest-guaranteed | Fail fast |
| ast-grep (MCP + CLI) | Manifest-guaranteed | Fail fast |
| claude-mem | Manifest-guaranteed | Fail fast |
| Codemap MCP | Optional — tool list inspection (`mcp__codemap__`) | Skip enrichment |
| LSP | Optional — tool list inspection | Grep + Read |
| Fallow | Optional — `which fallow` | Skip static analysis |
