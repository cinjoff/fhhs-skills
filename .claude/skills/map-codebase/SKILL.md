---
name: fh:map-codebase
description: Explore and document how your codebase is structured.
user-invocable: true
---

Spawns a single mapper agent that explores the codebase and writes a focused `CODEBASE.md` capturing three things agents can't discover by grepping: where to put new code, which patterns to follow, and how layers connect.

<philosophy>
**One document, not seven.**
Previous versions produced 7 documents across 4 parallel agents (~250K tokens). Most of that duplicated what package.json, config files, and grep already provide. This version produces a single ~150-line CODEBASE.md focused on prescriptive guidance.

**Prescriptive over descriptive.**
"Put new routes in `src/routes/{feature}/`" is useful. "Routes are in src/routes" is grep output.

**Run once, update incrementally.**
Full mapping runs at project bootstrap. After that, the build completion flow updates CODEBASE.md incrementally based on what changed. Re-mapping should be rare — only after major restructuring.
</philosophy>

<process>

<step name="init_context" priority="first">
Load codebase mapping context:

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init map-codebase)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extract from init JSON: `mapper_model`, `commit_docs`, `codebase_dir`, `existing_maps`, `has_maps`, `codebase_dir_exists`.
</step>

<step name="check_existing">
Check if .planning/codebase/ already exists using `has_maps` from init context.

**Cost awareness:** Full mapping spawns 1 agent, uses ~60K tokens, and takes ~2 minutes. Still, re-mapping is only worthwhile after major changes (new framework, directory restructure, significant new modules).

If `codebase_dir_exists` is true:
```bash
ls -la .planning/codebase/
# Check how stale the map is
if [ -f .planning/codebase/.last-mapped ]; then
  MAPPED_SHA=$(cat .planning/codebase/.last-mapped)
  CURRENT_SHA=$(git rev-parse HEAD)
  COMMITS_SINCE=$(git rev-list --count $MAPPED_SHA..$CURRENT_SHA 2>/dev/null || echo "unknown")
  echo "Mapped at: $MAPPED_SHA"
  echo "Current:   $CURRENT_SHA"
  echo "Commits since mapping: $COMMITS_SINCE"
fi
```

**If exists — present staleness context and options:**

```
.planning/codebase/CODEBASE.md exists ([N] lines).
Mapped [N] commits ago.

What's next?
1. Refresh - Remap the codebase (~60K tokens, ~2 min)
2. Skip - Use existing map as-is (recommended if <50 commits since last map)
```

Default to **Skip** if the map is recent (<50 commits). Only suggest Refresh if there's been a major structural change.

Wait for user response.

If "Refresh": Delete .planning/codebase/CODEBASE.md, continue to create_structure
If "Skip": Exit workflow

**If doesn't exist:**
Continue to create_structure.
</step>

<step name="create_structure">
Create .planning/codebase/ directory:

```bash
mkdir -p .planning/codebase
```

**Expected output:** A single `CODEBASE.md` (~150-200 lines) covering structure, conventions, and architecture.

Continue to static_analysis.
</step>

<step name="static_analysis">
Gather deterministic codebase metrics from Fallow if installed.

```bash
if command -v fallow &>/dev/null; then
  FALLOW_CHECK=$(timeout 30 fallow check --format json --quiet 2>/dev/null) || FALLOW_CHECK=""
  FALLOW_DUPES=$(timeout 30 fallow dupes --format json --quiet 2>/dev/null) || FALLOW_DUPES=""
  FALLOW_HEALTH=$(timeout 30 fallow health --format json --quiet 2>/dev/null) || FALLOW_HEALTH=""
fi
```

**Post-filter:**
- From `FALLOW_CHECK`: extract summary counts (unused files, unused exports, circular deps) — not full file lists
- From `FALLOW_DUPES`: extract duplication clusters (file pairs + similarity %) — top 10 by size
- From `FALLOW_HEALTH`: extract top-10 complexity hotspots (file path + cyclomatic score)
- **Hard cap:** Each output section ≤50 lines after filtering
- If all empty or fallow not installed: skip injection silently

Continue to spawn_agent.
</step>

<step name="spawn_agent">
Spawn a single gsd-codebase-mapper agent.

Use Agent tool with `subagent_type="gsd-codebase-mapper"`, `model="{mapper_model}"`, and **`mode="bypassPermissions"`**.

**CRITICAL: `mode="bypassPermissions"` is required.** Without it, the agent inherits the parent's permission mode. In interactive sessions (default mode), the agent cannot surface Write permission prompts — it fails silently.

```
Agent(
  subagent_type="gsd-codebase-mapper",
  model="{mapper_model}",
  mode="bypassPermissions",
  description="Map codebase structure, conventions, and architecture",
  prompt="Analyze this codebase and write .planning/codebase/CODEBASE.md.

Capture three things:
1. Structure — where to put new code (directory layout, placement rules, entry points)
2. Conventions — which patterns to follow (naming, style, imports, error handling)
3. Architecture — how layers connect (pattern overview, dependencies, data flow)

Stay focused: ~150-200 lines. No stack versions, no integrations, no tech debt — those can be discovered on-demand from source files.

If the following Static Analysis Data section is present, use those metrics in Architecture and Concerns sections. If absent, proceed without it.

## Static Analysis Data (deterministic — trust these numbers)

### Dead Code Summary
[FALLOW_CHECK summary: N unused files, M unused exports, K circular dependency chains]

### Duplication Clusters (top 10)
[FALLOW_DUPES: file pairs with similarity percentages]

### Complexity Hotspots (top 10)
[FALLOW_HEALTH top-10 by cyclomatic complexity]

Use these metrics in the Architecture and Concerns sections:
- Circular deps → document as architectural concerns
- Complexity hotspots → note which modules are fragile
- Duplication clusters → document as maintenance burden in Concerns
- Dead code count → include as a health metric

Write the document directly. Return confirmation only."
)
```

Wait for agent completion. You will be **notified automatically** — do NOT poll or sleep-loop.

**Handling failure:**
- If the agent fails silently (no output file): re-spawn once with the same prompt. If it fails again, have it return content in its response and write CODEBASE.md yourself.
- Check `ls -la .planning/codebase/` to verify the directory is writable.

Continue to verify_output.
</step>

<step name="verify_output">
Verify document created successfully:

```bash
ls -la .planning/codebase/CODEBASE.md
wc -l .planning/codebase/CODEBASE.md
```

**Verification checklist:**
- CODEBASE.md exists
- Not empty (should have >50 lines)
- Has all 3 sections (Structure, Conventions, Architecture)

If missing or empty, note the failure.

Continue to finalize_context.
</step>

<step name="finalize_context">
Create path-scoped rules, index document, and record git SHA.

**Create .claude/rules/ with path-scoped references:**

```bash
mkdir -p .claude/rules
```

Write `.claude/rules/gsd-planning.md`:
```markdown
---
paths:
  - ".planning/**"
---
GSD project tracking is active. See @.planning/STATE.md for current position and @.planning/ROADMAP.md for phase goals.
When making decisions, check the active phase CONTEXT.md for locked decisions.
```

Write `.claude/rules/codebase-context.md`:
```markdown
---
paths:
  - "src/**"
  - "lib/**"
  - "app/**"
  - "components/**"
  - "pages/**"
---
Codebase mapping available. Before grepping for architecture info, check:
- @.planning/codebase/CODEBASE.md for structure, conventions, and architecture patterns
```

**Index into FTS5 via ctx_index (if context-mode available):**

Check if `ctx_index` MCP tool is available. If not, skip silently.

If available:
1. Read `.planning/codebase/CODEBASE.md` and call `ctx_index` with `title="codebase:CODEBASE"` and `content=file content`
2. Index planning docs that skills read repeatedly:

| File | Index title |
|------|-------------|
| `.planning/PROJECT.md` | `planning:PROJECT` |
| `.planning/ROADMAP.md` | `planning:ROADMAP` |
| `.planning/STATE.md` | `planning:STATE` |
| `.planning/DESIGN.md` | `planning:DESIGN` |
| `.planning/REQUIREMENTS.md` | `planning:REQUIREMENTS` |
| `.planning/DECISIONS.md` | `planning:DECISIONS` |

For each file: if it exists, read and index. Skip missing files silently.

Write manifest for cache invalidation:
```bash
md5sum .planning/PROJECT.md .planning/ROADMAP.md .planning/STATE.md .planning/DESIGN.md .planning/REQUIREMENTS.md .planning/DECISIONS.md .planning/codebase/CODEBASE.md 2>/dev/null > .planning/codebase/.planning-index-manifest
```

**Record git SHA for freshness:**
```bash
git rev-parse HEAD > .planning/codebase/.last-mapped
```

Continue to scan_for_secrets.
</step>

<step name="scan_for_secrets">
**CRITICAL SECURITY CHECK.** Scan output for leaked secrets before committing.

```bash
grep -E '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]+|sk_test_[a-zA-Z0-9]+|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9_-]+|AKIA[A-Z0-9]{16}|xox[baprs]-[a-zA-Z0-9-]+|-----BEGIN.*PRIVATE KEY|eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.)' .planning/codebase/CODEBASE.md 2>/dev/null && SECRETS_FOUND=true || SECRETS_FOUND=false
```

If SECRETS_FOUND=true: alert user and wait for confirmation before committing.
If SECRETS_FOUND=false: continue.
</step>

<step name="commit_codebase_map">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: map existing codebase" --files .planning/codebase/CODEBASE.md
```
</step>

<step name="offer_next">
**Get line count:**
```bash
wc -l .planning/codebase/CODEBASE.md
```

```
Codebase mapped.

Created .planning/codebase/CODEBASE.md ([N] lines)
- Structure: where to put new code
- Conventions: which patterns to follow
- Architecture: how layers connect

---

## ▶ Next Up

**Initialize project** — `/fh:new-project`

<sub>`/clear` first → fresh context window</sub>

---
```

End workflow.
</step>

</process>

<success_criteria>
- .planning/codebase/ directory created before agent spawns
- 1 gsd-codebase-mapper agent spawned with `mode="bypassPermissions"`
- Agent writes CODEBASE.md directly (orchestrator doesn't receive document contents)
- Orchestrator waits for agent completion notification (no sleep-polling)
- CODEBASE.md exists and is non-empty (>50 lines, <250 lines)
- CODEBASE.md has all 3 sections: Structure, Conventions, Architecture
- .claude/rules/codebase-context.md points to CODEBASE.md (not individual docs)
- ctx_index called for CODEBASE.md when context-mode available
- .planning/codebase/.last-mapped written with current git SHA
- Clear completion summary
</success_criteria>
