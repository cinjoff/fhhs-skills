---
name: fh:update
description: Check for updates and install the latest version. Use when the user says 'update', 'upgrade', 'check for updates', or 'get latest version'.
user-invocable: true
disable-model-invocation: true
---

Update the fhhs-skills plugin to the latest version.

$ARGUMENTS

---

## Step 1: Get Installed Version

Read the installed plugin version:

```bash
# Check installed_plugins.json for fh@fhhs-skills
python3 -c "
import json, pathlib
data = json.loads(pathlib.Path(pathlib.Path.home() / '.claude/plugins/installed_plugins.json').read_text())
entry = data.get('plugins', {}).get('fh@fhhs-skills')
if entry:
    print(entry[0].get('version', 'unknown'))
else:
    print('NOT_INSTALLED')
" 2>/dev/null || echo "NOT_INSTALLED"
```

**If NOT_INSTALLED:**

```
fhhs-skills is not installed. Install with:

  /plugin install fh@fhhs-skills

(First add the marketplace if you haven't: /plugin marketplace add cinjoff/fhhs-skills)
```

Exit.

---

## Step 2: Check Latest Version

Refresh the marketplace and fetch the changelog from GitHub:

```bash
# Refresh marketplace to get latest metadata
claude plugin marketplace update fhhs-skills 2>/dev/null

# Get latest version from refreshed marketplace
python3 -c "
import json, pathlib
data = json.loads(pathlib.Path(pathlib.Path.home() / '.claude/plugins/marketplaces/fhhs-skills/.claude-plugin/marketplace.json').read_text())
print(data['plugins'][0]['version'])
" 2>/dev/null || echo "FETCH_FAILED"
```

```bash
# Get changelog — capture into variable for use in Step 5b reconciliation
CHANGELOG_CONTENT=$(curl -sL "https://raw.githubusercontent.com/cinjoff/fhhs-skills/main/CHANGELOG.md" 2>/dev/null)
echo "$CHANGELOG_CONTENT"
```

**If fetch fails:**
```
Couldn't check for updates (offline or GitHub unavailable).
```
Exit.

**If installed == latest:**

Clear any stale update indicator:

```bash
rm -f "$HOME/.claude/cache/fhhs-update-check.json"
```

```
## fhhs-skills

**Installed:** X.Y.Z
**Latest:** X.Y.Z

You're on the latest version.
```
Exit.

---

## Step 3: Show What's New

Extract changelog entries between the installed and latest versions from the CHANGELOG.md already fetched in Step 2. Transform them into actionable tips — not "what changed" but "what you should do differently now."

**How to build tips:**

1. Read the CHANGELOG.md entries between the user's installed version and the latest version
2. Identify entries that represent:
   - **New skills** — "Added" entries mentioning `/fh:*` skills
   - **Workflow changes** — "Changed" entries about existing skill behavior, new integrations between skills, new setup requirements
3. Transform each into an actionable tip: skill name + one-line what it does + 2-3 lines of when/how to use it
4. Group into "New skills since your version" and "Workflow changes since your version"
5. Skip bug fixes, eval additions, internal refactors, UI tweaks to existing features
6. Show ALL tips regardless of how many versions the user is jumping — no cap
7. If no meaningful new skills or workflow changes exist between the versions: just show the version comparison header

**Format:**

```
## fhhs-skills Update Available

**Installed:** 1.12.0
**Latest:** 1.17.1

### New skills since your version

  /fh:plan-review — Challenge your plan before building
  Run after /fh:plan-work and before /fh:build. Catches failure
  modes, edge cases, and security gaps. Three modes:
  scope expansion, hold scope, scope reduction.

  /fh:qa — Systematic QA testing
  Run after building frontend features. Uses browser
  automation to find bugs, produces structured reports
  with screenshots and repro steps.

  /fh:sync-upstream — Check upstream repos for updates
  Shows changelogs, classifies patch compatibility, and
  guides intelligent reapplication.

### Workflow changes since your version

  /fh:build now runs post-build review automatically
  Code quality + architecture analysis runs after all waves.
  Catches naming issues and structural problems before
  they accumulate.

  /fh:plan-work now suggests /fh:plan-review before /fh:build
  The handoff step recommends plan challenge for non-trivial
  plans. You can still go straight to /fh:build.

  /fh:setup now installs claude-mem automatically
  Persistent session memory across conversations.
  If you haven't run /fh:setup recently, do so to get it.
```

**Formatting rules:**
- Derive tips from CHANGELOG.md entries only (already fetched in Step 2) — do NOT read local `.claude/skills/` files, since the update hasn't happened yet and they'd be stale
- Each tip: skill name + one-line what it does + 2-3 lines of when/how to use it
- Group into "New skills since your version" and "Workflow changes since your version"
- Use plain language, not commit messages
- This is informational — no prompt needed, just display before the update confirmation in Step 4

---

## Step 4: Confirm and Update

Ask the user:

```yaml
AskUserQuestion:
  question: "Update to the latest version?"
  header: "Update"
  options:
    - label: "Yes, update now"
      description: "Install latest version (restart required)"
    - label: "No, skip"
      description: "Stay on current version"
```

**If "No, skip":** Exit.

**If "Yes, update now":**

```bash
# Get current installed version before updating
PREV_VERSION=$(python3 -c "
import json, pathlib
data = json.loads(pathlib.Path(pathlib.Path.home() / '.claude/plugins/installed_plugins.json').read_text())
entry = data.get('plugins', {}).get('fh@fhhs-skills')
print(entry[0].get('version', 'unknown') if entry else 'unknown')
" 2>/dev/null)
```

```bash
claude plugin update fh@fhhs-skills 2>&1 && echo "UPDATE_OK" || echo "UPDATE_FAILED"
```

**If UPDATE_FAILED** (e.g. running inside Conductor or a non-interactive environment):

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Action Required                                 ║
╚══════════════════════════════════════════════════════════════╝

Plugin update failed — this can happen inside Conductor or
non-interactive environments. Open a separate terminal and run:

  claude plugin update fh@fhhs-skills

Then come back and run /fh:update again to complete reconciliation.

──────────────────────────────────────────────────────────────
→ Run the command above in your terminal, then type "done"
──────────────────────────────────────────────────────────────
```

Stop here and wait. Do NOT proceed to Step 5 until the update succeeds.

**If UPDATE_OK:**

Clear the update indicator from the statusline:

```bash
rm -f "$HOME/.claude/cache/fhhs-update-check.json"
```

```
## Updated

**fhhs-skills** PREV_VERSION → A.B.C

Running post-update reconciliation...
```

Proceed to Step 5.

---

## Step 5: Post-Update Reconciliation

After the plugin is updated, check whether the user's environment needs changes introduced between their old and new version. This uses reconciliation tags in the changelog — no need to read setup.md or new-project.md.

### 5a: Re-link CLI tools

Always re-link CLI tools after update — symlinks may point to the old cached version:

```bash
PLUGIN_ROOT=""
LATEST="$(ls -d "$HOME/.claude/plugins/cache/fhhs-skills/fh"/*/ 2>/dev/null | sort | tail -1)"
LATEST="${LATEST%/}"
if [ -n "$LATEST" ] && [ -f "$LATEST/bin/gsd-tools.cjs" ]; then
  PLUGIN_ROOT="$LATEST"
fi
if [ -n "$PLUGIN_ROOT" ] && [ -d "$PLUGIN_ROOT/bin" ]; then
  mkdir -p "$HOME/.claude/get-shit-done"
  ln -sfn "$PLUGIN_ROOT/bin" "$HOME/.claude/get-shit-done/bin"
  [ -d "$PLUGIN_ROOT/hooks" ] && ln -sfn "$PLUGIN_ROOT/hooks" "$HOME/.claude/get-shit-done/hooks"
  echo "✓ CLI tools re-linked"
else
  echo "⚠ Could not find plugin root for re-linking"
fi
```

### 5b: Changelog-driven reconciliation

Save the changelog (already fetched in Step 2) to a temp file and run the reconciliation check:

```bash
# CHANGELOG_CONTENT was already fetched via curl in Step 2
echo "$CHANGELOG_CONTENT" > /tmp/fhhs-changelog.md
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changelog reconcile \
  --from "$PREV_VERSION" --to "$LATEST_VERSION" \
  --changelog-file /tmp/fhhs-changelog.md \
  --project-root "$PWD"
```

The command outputs JSON with `missing` and `ok` arrays. Each item has `type`, `check`, `id`, `description`, and `version`.

**If `missing` is empty:**

```
✓ Your environment is up to date with all setup changes.
```

**If `missing` has items**, display them grouped by type:

```
## Setup items to reconcile

These setup changes were introduced between your old and new version:

| Status | What | Added in | Description |
|--------|------|----------|-------------|
| ✗ | fallow (CLI tool) | v1.26.0 | Fallow static analysis in setup |
| ✗ | ~/.skills/shadcn (directory) | v1.19.0 | shadcn/ui skills in /fh:setup |
| ✓ | CLAUDE_CODE_ENABLE_TASKS (env) | v1.25.0 | Task tracking in setup |

Run `/fh:setup` to install missing items, or install them manually.
```

Do NOT read setup.md or new-project.md. Do NOT auto-install anything. Just report what's missing and point to `/fh:setup`.

**After reconciliation is complete:**

```
Restart Claude Code to use the new version.
```
