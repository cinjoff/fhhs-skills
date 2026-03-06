---
description: "Check for upstream updates to Superpowers, Impeccable, or GSD and generate a diff report. Use when the user says 'check for updates', 'update upstream', 'new version of superpowers/impeccable/gsd', or wants to sync forked skills with upstream changes."
---

Check for upstream updates and generate a diff report against the current snapshots.

Usage: $ARGUMENTS — specify `superpowers`, `impeccable`, `gsd`, or `all`. Optionally add a version: `superpowers 4.5.0`.

---

## Step 1: Identify Target

| Argument | Upstream repo | Current snapshot |
|----------|--------------|-----------------|
| `superpowers` | `pcvelz/superpowers` | `upstream/superpowers-{version}/` |
| `impeccable` | `pbakaus/impeccable` | `upstream/impeccable-{version}/` |
| `gsd` | `gsd-build/get-shit-done` | `upstream/gsd-{version}/` |
| `all` | Check all three | All snapshots |

Read the current snapshot version from the directory name in `upstream/`.

---

## Step 2: Fetch New Version

If a specific version was given, use that. Otherwise, check the latest release:

```bash
# For GitHub repos, check latest tag
gh api repos/{owner}/{repo}/releases/latest --jq '.tag_name' 2>/dev/null
```

If the latest version matches the current snapshot, report "Already up to date" and stop.

If newer, clone/download to a temp directory:

```bash
TEMP_DIR=$(mktemp -d)
gh repo clone {owner}/{repo} "$TEMP_DIR" -- --depth 1 --branch {version}
```

---

## Step 3: Generate Diff Report

Compare the current upstream snapshot against the new version. Focus on files that correspond to forked skills/commands.

### For Superpowers:
Compare `upstream/superpowers-{old}/` against the new `skills/` directory in the downloaded repo.

### For Impeccable:
Compare `upstream/impeccable-{old}/` against the new `commands/` and `skills/` directories.

### For GSD:
Compare `upstream/gsd-{old}/workflows/` against new `workflows/`, `agents/` against new agents, `references/` against new references.

For each changed file:
1. Is it a file we forked? → Flag for review
2. Is it a new file? → Note as "NEW — consider forking"
3. Is it a removed file? → Note as "REMOVED — check if we still use it"

---

## Step 4: Cross-Reference Patches

Read `PATCHES.md`. For each patch entry on the changed upstream:

- **Patch still applies cleanly** — upstream didn't touch the patched area
- **Patch may conflict** — upstream changed the same section we patched
- **Patch may be obsolete** — upstream fixed the same issue differently

---

## Step 5: Present Report

```
Upstream Update Report: {name} {old-version} → {new-version}

Changed files (relevant to your forks):
  {file}  — {N lines changed} {brief description}

New files:
  {file}  — NEW (not yet forked)

Removed files:
  {file}  — REMOVED

Patch status:
  {skill} #{N} ({description}) — CLEAN / CONFLICT / OBSOLETE

Unaffected patches: {N} of {M}

Next steps:
  1. Review conflicts above
  2. Update adapted files in skills/ and commands/
  3. Replace upstream/{name}-{old}/ with {name}-{new}/
  4. Update PATCHES.md version header
  5. Run evals to verify
```

Clean up the temp directory.

**Do not auto-apply any changes.** Present the report and let the user decide what to merge.
