---
name: sync-upstream
description: |
  Check upstream repos for updates, show what changed, and guide patch reapplication.
  Use when the user says 'sync upstream', 'check upstream', 'update upstream',
  'new version of superpowers/impeccable/gsd', or wants to pull latest upstream changes.
user-invokable: false
---

# Sync Upstream

**Usage:** `$ARGUMENTS` — specify an upstream name or `all` (default: `all`).

Valid upstream names: `superpowers`, `impeccable`, `gsd`, `gstack`, `feature-dev`, `vercel-react`, `playwright`, `claude-md`.

---

## Step 0: Load Registry

Read `references/upstream-registry.md` (co-located with this skill).

Read current snapshot versions from the `upstream/` directory. The directory name is the
**source of truth** for the current version — parse version from directory name using
the `snapshot_pattern` for each upstream. For example, `upstream/superpowers-4.3.1/`
means current version is `4.3.1`.

If an upstream has an internal `VERSION` file that disagrees with the directory name,
note the mismatch as a warning but use the directory name as the canonical version.

If `$ARGUMENTS` is blank or `all`, target all 8 upstreams. Otherwise, target only the
named upstream(s) (comma-separated is acceptable).

---

## Step 1: Check for Updates

For each targeted upstream, detect the latest version using the `version_source` from
the registry:

- **`release`**: `gh api repos/{owner}/{repo}/releases/latest --jq '.tag_name'`
  - Strip leading `v` if present (e.g., `v5.0.0` -> `5.0.0`)
- **`tag`**: `gh api repos/{owner}/{repo}/tags --jq '.[0].name'`
  - Strip leading `v` if present
- **`commit`**: `gh api repos/{owner}/{repo}/commits/{default_branch} --jq '.sha[:8]'`
  - Use `main` as default branch; if that 404s, try `master`

**Error handling:** If `gh api` fails for any upstream (auth error, repo not found,
rate limit, network), report that upstream as `CHECK FAILED -- {reason}` in the status
table and **continue to the next one**. Never abort the entire check for one failed
upstream.

Present a summary table:

```
Upstream Status:
  superpowers    4.3.1 -> 5.0.0         UPDATE AVAILABLE
  impeccable     1.2.0 -> 1.2.0         up to date
  gsd            1.22.4 -> 1.23.0       UPDATE AVAILABLE
  gstack         0.3.3 -> 0.4.0         UPDATE AVAILABLE
  feature-dev    55b58ec6 -> a1b2c3d4   UPDATE AVAILABLE
  vercel-react   64bee5b7 -> 64bee5b7   up to date
  playwright     b4b0fd3c -> c5d6e7f8   UPDATE AVAILABLE
  claude-md      1.0.0 -> 1.0.0         up to date
```

If nothing to update, **stop here** with "All upstreams are up to date."

Ask user which upstreams to sync (default: all that have updates).

---

## Step 2: Fetch and Summarize Changes

For each selected upstream:

1. **Clone new version to temp directory:**
   ```bash
   TEMP_DIR=$(mktemp -d)
   gh repo clone {owner}/{repo} "$TEMP_DIR" -- --depth 1 --branch {new_version}
   ```
   - For `commit`-based upstreams, clone default branch then checkout the specific commit:
     ```bash
     gh repo clone {owner}/{repo} "$TEMP_DIR" -- --depth 50
     cd "$TEMP_DIR" && git checkout {new_commit_sha}
     ```

2. **For monorepo upstreams** (where `monorepo_path` is set): after cloning, extract
   only the `monorepo_path` subdirectory — move its contents to a clean temp directory
   and discard the rest:
   ```bash
   EXTRACT_DIR=$(mktemp -d)
   cp -r "$TEMP_DIR/{monorepo_path}/." "$EXTRACT_DIR/"
   rm -rf "$TEMP_DIR"
   TEMP_DIR="$EXTRACT_DIR"
   ```

3. **Get changelog via GitHub compare API:**
   ```bash
   gh api repos/{owner}/{repo}/compare/{old}...{new} --jq '.commits[] | .commit.message' | head -30
   ```
   If compare API fails (too many commits, old ref not found): fall back to
   `gh api repos/{owner}/{repo}/commits --jq '.[].commit.message' | head -20`
   and note "approximate changelog".

4. **Diff only the `compare_paths`** from the registry against the current snapshot in
   `upstream/{snapshot}/`.

5. **Group changes by relevance:**
   - **Affects our forks**: files that map to entries in `forked_to` — show prominently
   - **New capabilities**: new files in relevant directories (skills/, agents/, commands/)
     not yet forked — highlight as opportunities
   - **Internal/irrelevant**: other changes (README, CI, tests, etc.) — mention count only

Present per-upstream changelog and affected files. Ask user to confirm proceeding.

---

## Step 3: Cross-Reference Patches

Read `PATCHES.md`. For each patch on the updating upstream:

1. Read the corresponding section of the **new upstream** file
2. Read our **current forked** file
3. Classify the patch into one of 5 categories:

| Category | Meaning | Action |
|----------|---------|--------|
| **CLEAN** | Upstream didn't touch the patched area | Reapply directly |
| **COMPATIBLE** | Upstream changed nearby code but patch meaning still applies | Reapply with adaptation |
| **ENHANCED** | Upstream independently added similar functionality | Patch may be obsolete — opportunity to simplify |
| **CONFLICT** | Upstream fundamentally changed the area we patched | Needs user decision |
| **REMOVED** | Upstream deleted the file we forked | Needs user decision — keep as orphan or drop |

**For CONFLICT and REMOVED patches:** Present both versions side by side, explain what
happened, and ask the user:
- (a) Keep our version
- (b) Adopt upstream's approach (drop our patch)
- (c) Merge both (manual adaptation)

**For ENHANCED patches:** Explain what upstream added and recommend whether to keep,
simplify, or drop our patch.

Present a patch classification summary table per upstream:

```
superpowers patch status:
  brainstorming #1 (output path)         CLEAN
  brainstorming #5 (code-explorer)       COMPATIBLE
  executing-plans #1 (EnterPlanMode)     ENHANCED — upstream added similar guard
  writing-plans #3 (subagent prefix)     CONFLICT — upstream restructured refs
```

---

## Step 4: Apply Updates

For each confirmed upstream:

1. **Copy new snapshot first** (copy-then-delete ordering — safe against abort):
   ```bash
   cp -r "$TEMP_DIR" upstream/{name}-{new_version}/
   ```

2. **Only after successful copy**, delete old snapshot. **Guard the path** before
   running rm:
   ```bash
   OLD_PATH="upstream/{name}-{old_version}"
   # Safety: verify path starts with upstream/ and is not empty
   if [[ "$OLD_PATH" == upstream/* ]] && [[ -n "$OLD_PATH" ]]; then
     rm -rf "$OLD_PATH"
   else
     echo "ERROR: refusing to delete '$OLD_PATH' — does not start with upstream/"
   fi
   ```

3. **For each forked skill/agent/command affected:**
   - Read the new upstream file
   - Read PATCHES.md for patches to reapply
   - Read our current forked file
   - Reapply each CLEAN/COMPATIBLE patch to preserve the **meaning** (not line-level)
     of the patch
   - For ENHANCED patches: incorporate upstream improvement, adjust/drop patch as
     appropriate
   - Write the updated forked file

4. **If patch reapplication fails** for a specific file (file too different to
   meaningfully reapply): **STOP on that file**, show user both versions (new upstream
   + our current fork), and ask them to manually reconcile. Do NOT write a garbled merge.

5. **Clean up temp directory:**
   ```bash
   rm -rf "$TEMP_DIR"
   ```

---

## Step 5: Identify New Opportunities

For new files/skills in the upstream that we haven't forked (filtered to relevant
directories — skills/, agents/, commands/, references/):

- Read the file content and describe what it does
- Suggest which composite commands could benefit from it
- Ask user: fork now or note for later (via `/fh:todos`)?

---

## Step 6: Update Documentation

After all patches are applied, update these three files:

1. **`PATCHES.md`**: Update version header for the upstream, update/remove obsolete
   patches, add notes for any new patches introduced during this sync.

2. **`COMPATIBILITY.md`**: Update version numbers in the upstream attribution table,
   add new forks if any were adopted from Step 5.

3. **`README.md`**: Update version references in the "How It Works" source table
   (if the README contains an upstream version table).

All three files must be updated together — partial updates cause drift.

---

## Step 7: Summary

Present final summary:

```
Sync Complete:
  superpowers 4.3.1 -> 5.0.0
    Patches reapplied: 12/14
    New skills adopted: 1 (advanced-reasoning)
    Patches dropped (upstream enhanced): 2

Files modified: [list]

Next steps:
  - Test affected composites: /build, /plan-work, /fix
  - Run /review to validate changes
  - Run /release when ready
```

Clean up all temp directories (verify none remain).
