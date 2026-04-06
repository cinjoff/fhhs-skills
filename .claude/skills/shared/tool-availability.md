# Tool Availability Guards

Canonical availability checks for optional tools. Skills reference this file instead of inlining checks.

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

**Check:** Inspect available tool list for ast-grep tools at session start.

```
AST_GREP_MCP_AVAILABLE=false
If tool list contains tools matching "ast_grep" or "sg_*" → AST_GREP_MCP_AVAILABLE=true
```

**Fallback:** Use Grep tool for pattern search. Use Edit tool for targeted replacements.

**Hard ceiling:** ast-grep has no language support for Markdown — do not attempt structural queries on `.md` files. Fall back to Grep for Markdown always.

**Reference pattern:**
```
If ast-grep MCP tools are in the tool list:
  → Use find_code_by_rule / sg_search for structural pattern matching
Else:
  → Use Grep with regex patterns
```

---

## ast-grep CLI

**Check:**
```bash
AST_GREP_CLI_AVAILABLE=false
command -v ast-grep &>/dev/null || command -v sg &>/dev/null && AST_GREP_CLI_AVAILABLE=true
```

**Fallback:** Use Edit tool for single-file changes. Use Grep + manual Edit for bulk changes.

**Conditional GO status:** Structural search (4.1/5) is reliable. Bulk replace (3.2/5) requires verification pass after each transform.

**Reference pattern:**
```bash
if command -v sg &>/dev/null; then
  sg --pattern '$PATTERN' --lang typescript src/
fi
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

**Check:** Inspect tool list for `mcp__plugin_claude-mem_*` tools.

**Fallback:** Use Read/Grep/Glob directly. Skills work identically without cross-session memory.

**Reference pattern:** See `@.claude/skills/shared/claude-mem-rules.md` for full patterns (A, B, D).

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

| Tool | Check method | Fallback |
|------|-------------|---------|
| Codemap MCP | Tool list inspection (`mcp__codemap__`) | Skip enrichment |
| ast-grep MCP | Tool list inspection | Grep tool |
| ast-grep CLI | `which ast-grep \|\| which sg` | Edit tool |
| LSP | Tool list inspection | Grep + Read |
| claude-mem | Tool list inspection (`mcp__plugin_claude-mem_*`) | Read/Grep/Glob |
| Fallow | `which fallow` | Skip static analysis |
