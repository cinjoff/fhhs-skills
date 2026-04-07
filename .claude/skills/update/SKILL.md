---
name: fh:update
description: Check for updates and install the latest version. Use when the user says 'update', 'upgrade', 'check for updates', or 'get latest version'. Supports --global to update all projects at once.
user-invocable: true
disable-model-invocation: true
---

Update the fhhs-skills plugin to the latest version.

$ARGUMENTS

### Flags

| Flag | Behavior |
|------|----------|
| `--global` | After updating the plugin, run `manifest check --all` across ALL known projects. |
| *(no flags)* | Update plugin and run `manifest check` for the current project only. |

---

## Step 1: Get Installed Version

Find the installed version by resolving the GSD symlink to the plugin cache directory:

```bash
_FHHS_BIN="$HOME/.claude/get-shit-done/bin"
if [ -L "$_FHHS_BIN" ]; then
  _REAL="$(readlink -f "$_FHHS_BIN")"
  _PLUGIN_ROOT="$(dirname "$_REAL")"
  _PJ="$_PLUGIN_ROOT/.claude-plugin/plugin.json"
  if [ -f "$_PJ" ]; then
    python3 -c "import json; print(json.load(open('$_PJ'))['version'])"
  else
    echo "unknown"
  fi
else
  echo "unknown"
fi
```

Save as `INSTALLED_VERSION`.

## Step 2: Get Latest Version

Fetch latest version from the CHANGELOG:

```bash
curl -fsSL "https://raw.githubusercontent.com/cinjoff/fhhs-skills/main/CHANGELOG.md" 2>/dev/null | head -20
```

Extract the first version heading (`## [x.y.z]`). Save as `LATEST_VERSION`.

Also extract user-facing changelog entries between `INSTALLED_VERSION` and `LATEST_VERSION`: lines starting with `feat:`, `fix:`, or skill/workflow improvements. Skip lines that are `chore:`, `refactor:`, or `docs:` (internal changes).

## Step 3: Check if Update Available

If `INSTALLED_VERSION == LATEST_VERSION`:
- Already up to date. Skip to Step 5 (current project only).

If update available, show:

```
/fh:update — v{INSTALLED_VERSION} → v{LATEST_VERSION}

What's new for you:
• {user-facing changelog entries, one bullet per entry}
```

Then ask for confirmation before proceeding.

## Step 4: Install Update

Refresh the marketplace index first, then run the plugin update:

```bash
claude skills marketplace update
```

```bash
claude plugin update fh@fhhs-skills
```

Re-link the GSD CLI symlink to pick up the new version:

```bash
_FHHS="$(ls -d "$HOME/.claude/plugins/cache/fhhs-skills/fh"/*/ 2>/dev/null | sort -V | tail -1)"
_FHHS="${_FHHS%/}"
if [ -n "$_FHHS" ] && [ -d "$_FHHS/bin" ]; then
  mkdir -p "$HOME/.claude/get-shit-done"
  ln -sfn "$_FHHS/bin" "$HOME/.claude/get-shit-done/bin"
  [ -d "$_FHHS/hooks" ] && ln -sfn "$_FHHS/hooks" "$HOME/.claude/get-shit-done/hooks"
fi
```

```bash
# Rebuild browse binary if source changed
_FHHS="${FHHS_SKILLS_ROOT:-$(ls -d "$HOME/.claude/plugins/cache/fhhs-skills/fh"/*/ 2>/dev/null | sort -V | tail -1)}"
if [ -n "$_FHHS" ] && [ -f "$_FHHS/.claude/skills/browse/setup" ]; then
  bash "$_FHHS/.claude/skills/browse/setup"
fi
```

## Step 5: Manifest Check

If update was applied (or `--global` flag):

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" manifest check --all
```

If already up to date (no update):

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" manifest check
```

## Step 6: Report Results

Format the JSON output as a status table:

```
What changed in your setup:
┌──────────────────────────┬──────────┬────────────────────────────┐
│ Component                │ Status   │ Details                    │
├──────────────────────────┼──────────┼────────────────────────────┤
│ {items from JSON output} │ ...      │ ...                        │
├──────────────────────────┴──────────┴────────────────────────────┤
│ N fixed · N removed · N errors                                   │
└──────────────────────────────────────────────────────────────────┘
```

If any items have status `"error"`, show them prominently with actionable hints immediately after the table.

If no changes (all items OK), show: `✓ Everything is up to date — no changes needed.`
