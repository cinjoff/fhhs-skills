---
name: audit-upstream
description: "Use when evaluating upstream skill changes after sync, assessing integration opportunities, or maintaining the upstream capability index. Triggers on 'audit upstream', 'evaluate upstream', 'what changed upstream', 'integration opportunities', or after /fh:sync-upstream."
---

# Audit Upstream

Evaluate upstream skill changes, assess integration opportunities, and maintain the upstream capability index.

Chain after `/fh:sync-upstream`: sync pulls code, this skill evaluates what changed.

Arguments: $ARGUMENTS

---

## Step 1: SCAN

Inventory the `upstream/` directory. For each upstream source:

1. **Identify version/commit** — read package.json, CHANGELOG, or git metadata to determine the current version
2. **Compare against index** — read `.planning/upstream/INDEX.md` to detect:
   - Version changes (bumped since last audit)
   - New sources (present in `upstream/` but absent from INDEX.md)
   - Removed sources (listed in INDEX.md but missing from `upstream/`)
3. **Scan all four asset categories** for each source:
   - **Skills:** SKILL.md / UPSTREAM-SKILL.md files
   - **Commands/workflows:** workflow .md files, especially `workflows/` directories
   - **Agent definitions:** `agents/` directories
   - **Supporting assets:** references, templates, prompt templates, rule files, tools

Build a complete inventory before proceeding. Record file paths and last-modified dates.

---

## Step 2: DIFF

For each upstream that has changed since the last audit:

1. **Identify changes** — new, modified, or removed items across all four asset categories
2. **Read actual files** — understand the substance of each change, not just file-level diffs
3. **Use git diff** between old and new snapshots when available:
   ```
   git diff <old-commit>..<new-commit> -- upstream/<source>/
   ```
4. **Summarize per source** — produce a change summary listing:
   - Added items (with brief description)
   - Modified items (what changed and why it matters)
   - Removed items (impact on existing integrations)

If no changes detected for any upstream, skip to the "No changes" edge case handling.

---

## Step 3: ASSESS

For each new or changed item, evaluate on these dimensions:

### Quality Rating (A–D)

| Rating | Criteria |
|--------|----------|
| **A** | Well-structured, handles edge cases, has error recovery, documented |
| **B** | Solid structure, some edge cases handled, usable documentation |
| **C** | Functional but gaps in error handling or documentation |
| **D** | Incomplete, fragile, or poorly documented — needs work before integration |

### Integration Analysis

- **Gap fill potential:** Does this address a known gap in the Gap Registry (`.planning/upstream/INDEX.md`)?
- **Integration effort:**
  - **Low** — reference only, no code changes needed
  - **Medium** — new standalone skill or minor enhancement
  - **High** — enhance existing composite skill, requires patching
- **Risk assessment:**
  - Breaking changes to existing patched skills
  - Dependency conflicts with current integrations
  - Naming collisions with existing `/fh:` skills
- **SDLC phase coverage:** Which development lifecycle phase does this serve? (planning, implementation, testing, review, deployment, maintenance)

---

## Step 4: RECOMMEND

Produce prioritized recommendations in four tiers:

### Immediate
Breaking changes or critical fixes to apply now. These block normal operation if ignored.

### Plan
High-value integrations to plan via `/fh:plan-work`. Include:
- What to integrate
- Estimated effort
- Which existing skills are affected
- Suggested work item title

### Backlog
Lower-priority opportunities to track in the Gap Registry. Worth doing but not urgent.

### Skip
Changes with no integration value. Always explain why — prevents re-evaluation in future audits.

---

## Step 5: UPDATE

Refresh the upstream index using the split-file structure in `.planning/upstream/`:

### Per-source files
Update `.planning/upstream/{source-name}.md` for changed upstreams only. Each file contains:
- Source metadata (name, repo, version, last synced date)
- Asset inventory across all four categories
- Quality ratings for each asset
- Integration status (integrated / planned / skipped)

### INDEX.md
Update the central index with:
- **Version numbers** — reflect current `upstream/` state
- **SDLC Coverage Matrix** — update phase coverage based on new/changed assets
- **Gap Registry** — add new gaps discovered, close gaps filled by integrations
- **Subagent Dispatch Matrix** — update if new agent definitions found
- **Command Exposure Map** — update if new commands/workflows found
- **Dashboard counts** — total skills, agents, commands, coverage percentage

### Integration Log
Append an entry to the Integration Log section of INDEX.md:
```
### {date} — Audit after sync
- Sources evaluated: {list}
- Changes found: {count new}, {count modified}, {count removed}
- Recommendations: {count immediate}, {count plan}, {count backlog}, {count skip}
```

### Cross-reference verification
- Verify `PATCHES.md` is still accurate — no stale patch references to renamed/removed upstream files
- Verify `COMPATIBILITY.md` reflects current version combinations

---

## Edge Cases

All of these MUST be handled — never silently skip or fail.

### First run (no index exists)
If `.planning/upstream/` directory or `INDEX.md` does not exist:
1. Create `.planning/upstream/` directory
2. Build all per-source files from scratch by scanning `upstream/`
3. Create `INDEX.md` with full structure
4. Message to user: **"First audit — creating full index."**

### Upstream removed
If a source is listed in INDEX.md but no longer exists in `upstream/`:
1. Mark the source as **"ARCHIVED"** in INDEX.md
2. Keep the per-source file with an archived header: `> ⚠️ ARCHIVED — source removed from upstream/ on {date}`
3. Do not delete any tracking files

### Skill renamed in upstream
Detect via content similarity (same SDLC phase + similar description):
1. Match old and new names by comparing skill descriptions and phase coverage
2. Update the name in the per-source file
3. Add a note: `Renamed: {old-name} → {new-name} (detected by content similarity)`

### No changes detected
If no upstream sources have changed since the last audit:
1. Short-circuit — do not rewrite any files
2. Output: **"No upstream changes since last audit on {date}."**
3. Exit the skill

### Malformed or empty skill files
If a skill file exists but cannot be parsed or is empty:
1. Flag in the per-source file as: `⚠️ Unreadable: {file-path} — {reason}`
2. Never silently skip — always surface the issue
3. Continue processing remaining files

### Write failure
After each file write:
1. Verify the write succeeded (file exists with expected content)
2. Report any failures explicitly to the user
3. Do not mark the audit as complete if any writes failed

---

## Workflow Chain

> After running `/fh:sync-upstream`, run `/fh:audit-upstream` to evaluate what changed and update the index. This ensures the upstream capability index stays current with every sync.
>
> Typical flow:
> 1. `/fh:sync-upstream` — pull latest upstream code
> 2. `/fh:audit-upstream` — evaluate changes, update index
> 3. `/fh:plan-work` — plan integration of recommended changes
> 4. `/fh:build` — implement the integrations
