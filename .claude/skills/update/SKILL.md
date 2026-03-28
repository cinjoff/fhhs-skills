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

The plugin itself is current, but this worktree/project may still have environment gaps (missing tools, hooks, env vars, or project files) — especially if the update was applied from a different worktree. Skip to **Step 5½: Environment Reconciliation** to check and fix any gaps.

Set `PREV_VERSION="0.0.0"` and `LATEST_VERSION` to the installed version so reconciliation scans ALL changelog tags.

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

  claude-mem now auto-installed during updates
  Persistent session memory across conversations.
  Post-update reconciliation handles this automatically.
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
# Refresh marketplace right before update — Step 2 refresh may be stale by now
claude plugin marketplace update fhhs-skills 2>/dev/null

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

## Step 5½: Environment Reconciliation (already up to date)

This step is reached when the plugin version already matches the latest. The plugin was likely updated from another worktree, but this project/environment may still have gaps.

```
## fhhs-skills

**Installed:** X.Y.Z
**Latest:** X.Y.Z

Plugin is current. Checking this environment for gaps...
```

Fetch the changelog and run reconciliation with `--from 0.0.0` to scan ALL tags:

```bash
CHANGELOG_CONTENT=$(curl -sL "https://raw.githubusercontent.com/cinjoff/fhhs-skills/main/CHANGELOG.md" 2>/dev/null)
echo "$CHANGELOG_CONTENT" > /tmp/fhhs-changelog.md
```

Then run Steps 5a, 5a½, 5a¾, 5a⅞, and 5b with `PREV_VERSION="0.0.0"` and `LATEST_VERSION` set to the installed version.

**After reconciliation completes:**

- If ALL items were already OK (nothing missing): `You're on the latest version — environment is fully synced.`
- If gaps were found and fixed: show the reconciliation table, then `Environment synced. Restart Claude Code to pick up any hook or plugin changes.`

Then check Step 5c (`.planning/` health suggestion) and exit.

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

### 5a½: Re-apply claude-mem project-env patch

claude-mem derives its project name from the process cwd basename, which causes misattribution in Conductor workspaces and worktrees. This unified patch adds a `CLAUDE_MEM_PROJECT` env var check as the first tier in `gp()`, covering both worktrees and headless sessions. It must be re-applied after every claude-mem update since the update overwrites the patched files.

```bash
# Find the patch script shipped with fhhs-skills
PATCH=$(find "$HOME/.claude/plugins/cache/fhhs-skills" -name patch-claude-mem-project-env.cjs -print -quit 2>/dev/null)
if [ -n "$PATCH" ]; then
  node "$PATCH" 2>&1
else
  echo "⚠ Project-env patch not found (expected in fhhs-skills plugin cache)"
fi
```

If the patch outputs "WARNING: gp() signature changed", claude-mem changed its internals and the patch needs updating — note this in the reconciliation table but don't fail the update.

### 5a¾: Set CLAUDE_MEM_PROJECT env var

For Conductor workspaces and git worktrees, the cwd basename often differs from the actual project name (e.g., "cairo" vs "fhhs-skills"). Set `CLAUDE_MEM_PROJECT` in the project-local `.claude/settings.json` so interactive sessions attribute observations correctly — not just auto-orchestrator spawned sessions.

```bash
# Derive project name from git toplevel basename
PROJECT_NAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null)
if [ -n "$PROJECT_NAME" ]; then
  # Check if .claude/settings.json exists and already has CLAUDE_MEM_PROJECT
  if [ -f ".claude/settings.json" ]; then
    CURRENT=$(python3 -c "
import json, sys
try:
    s = json.load(open('.claude/settings.json'))
    print(s.get('env', {}).get('CLAUDE_MEM_PROJECT', ''))
except: pass
" 2>/dev/null)
    if [ "$CURRENT" = "$PROJECT_NAME" ]; then
      echo "✓ CLAUDE_MEM_PROJECT already set to $PROJECT_NAME"
    else
      python3 -c "
import json
f = '.claude/settings.json'
try:
    s = json.load(open(f))
except: s = {}
s.setdefault('env', {})['CLAUDE_MEM_PROJECT'] = '$PROJECT_NAME'
with open(f, 'w') as fh: json.dump(s, fh, indent=2); fh.write('\n')
print('✓ CLAUDE_MEM_PROJECT set to $PROJECT_NAME')
" 2>/dev/null
    fi
  else
    echo "⚠ No .claude/settings.json — skipping CLAUDE_MEM_PROJECT (run /fh:new-project first)"
  fi
else
  echo "⚠ Not a git repo — skipping CLAUDE_MEM_PROJECT"
fi
```

### 5a⅞: Refresh global tracker

The tracker is installed globally at `~/.claude/tracker/`. Refresh template files from the updated plugin cache so dashboard changes are picked up without requiring a manual `/fh:tracker` re-run.

```bash
TRACKER_DIR="$HOME/.claude/tracker"
mkdir -p "$TRACKER_DIR"

PLUGIN_ROOT=""
LATEST="$(ls -d "$HOME/.claude/plugins/cache/fhhs-skills/fh"/*/ 2>/dev/null | sort | tail -1)"
LATEST="${LATEST%/}"
if [ -n "$LATEST" ] && [ -d "$LATEST/templates/project-tracker" ]; then
  PLUGIN_ROOT="$LATEST"
fi

if [ -n "$PLUGIN_ROOT" ]; then
  PLUGIN_VER=$(python3 -c "import json; print(json.load(open('$PLUGIN_ROOT/.claude-plugin/plugin.json'))['version'])" 2>/dev/null)
  CURRENT_VER=$(cat "$TRACKER_DIR/.version" 2>/dev/null)

  if [ "$PLUGIN_VER" = "$CURRENT_VER" ]; then
    echo "✓ Tracker already at v$PLUGIN_VER"
  else
    # Copy all non-directory files from the template
    for f in "$PLUGIN_ROOT/templates/project-tracker"/*; do
      [ -f "$f" ] && cp "$f" "$TRACKER_DIR/$(basename "$f")"
    done
    echo "$PLUGIN_VER" > "$TRACKER_DIR/.version"
    echo "✓ Tracker refreshed to v$PLUGIN_VER (was: ${CURRENT_VER:-none})"
  fi
else
  echo "⚠ Could not find plugin templates for tracker refresh"
fi
```

### 5b: Changelog-driven reconciliation — auto-fix gaps

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
✓ Your environment is up to date — no gaps to close.
```

Skip to the final message.

**If `missing` has items — auto-remediate each one.** Do NOT tell the user to run `/fh:setup` or `/fh:new-project`. Instead, fix every gap inline using the remediation map below. Work through each missing item sequentially.

#### Remediation map

For each missing item, match on `check` type and apply the fix:

**`setup:tool:*`** — Install the CLI tool:

| ID | Install command |
|----|----------------|
| `fallow` | `pnpm install -g fallow` |
| `typescript-language-server` | `npm install -g typescript-language-server typescript` |
| Any other tool | `pnpm install -g $ID` (best-effort) |

```bash
pnpm install -g fallow 2>&1 && echo "✓ fallow installed" || echo "⚠ fallow install failed"
```

Verify after install: `command -v $ID >/dev/null 2>&1`

**`setup:dir:*`** — Install the directory/tool that creates it:

| ID | Install command |
|----|----------------|
| `~/.agents/skills/shadcn` or `~/.skills/shadcn` | `cd "$HOME" && npx -y skills add -g -y --all shadcn/ui` |
| Any other dir | `mkdir -p "$EXPANDED_PATH"` |

```bash
# For shadcn skills
cd "$HOME" && npx -y skills add -g -y --all shadcn/ui 2>&1 && echo "✓ shadcn skills installed" || echo "⚠ shadcn skills install failed"
```

**`setup:env:*`** — Add the env var to `~/.claude/settings.json`:

Use the **Read tool** to load `~/.claude/settings.json`, then use the **Edit tool** to merge the missing key into the `env` object. Known values:

| ID | Value |
|----|-------|
| `CLAUDE_CODE_ENABLE_LSP` | `"1"` |
| `CLAUDE_CODE_ENABLE_TASKS` | `"true"` |
| `CLAUDE_CWD` | `"true"` |
| `CLAUDE_MEM_PROJECT` | Derive from `basename $(git rev-parse --show-toplevel)` — NOT a static value |
| Any other env | `"true"` (safe default) |

Do NOT overwrite existing keys. Merge carefully.

**`setup:hook:*`** — Add the hook to `~/.claude/settings.json`:

Use the **Read tool** to load `~/.claude/settings.json`. Determine the correct event type and command for the hook ID, then use the **Edit tool** to append it to the appropriate hooks array. Known hooks:

| ID substring | Event | Command |
|---|---|---|
| `fhhs-statusline` | `statusLine` (top-level, not in hooks array) | `node "$HOME/.claude/get-shit-done/hooks/fhhs-statusline.js"` |
| `fhhs-check-update` | `SessionStart` | `node "$HOME/.claude/get-shit-done/hooks/fhhs-check-update.js"` |
| `fhhs-learnings` | `SessionStart` | `node "$HOME/.claude/get-shit-done/hooks/fhhs-learnings.js"` |
| `fhhs-context-monitor` | `PostToolUse` | `node "$HOME/.claude/get-shit-done/hooks/fhhs-context-monitor.js"` |

For `fhhs-statusline`: set the top-level `statusLine` field in settings.json (NOT inside the hooks array):
```json
{ "statusLine": { "command": "node \"$HOME/.claude/get-shit-done/hooks/fhhs-statusline.js\"" } }
```

For all others: append to the existing hooks arrays — do NOT replace them. Skip if already present.

**`setup:plugin:*`** — Install the plugin:

| ID | Install commands |
|----|-----------------|
| `claude-mem@thedotmack` | `claude plugin marketplace add thedotmack/claude-mem && claude plugin install claude-mem` |
| `context-mode@context-mode` | `claude plugin marketplace add mksglu/context-mode && claude plugin install context-mode@context-mode` |
| Any other | `claude plugin install $ID` |

```bash
claude plugin marketplace add thedotmack/claude-mem 2>/dev/null
claude plugin install claude-mem 2>&1 && echo "✓ claude-mem installed" || echo "PLUGIN_INSTALL_FAILED"
```

This works in all environments including Conductor. If it fails, collect the failed plugin installs and show ONE consolidated manual-install block at the end — not per-item.

After installing `claude-mem@thedotmack` successfully, also apply fhhs-skills configuration to `~/.claude-mem/settings.json` — Read the file (create if missing), then Edit/Write to merge these keys without overwriting others:

```json
{
  "CLAUDE_MEM_CONTEXT_OBSERVATIONS": "500",
  "CLAUDE_MEM_CONTEXT_SESSION_COUNT": "50",
  "CLAUDE_MEM_CONTEXT_FULL_COUNT": "15",
  "CLAUDE_MEM_CONTEXT_FULL_FIELD": "narrative",
  "CLAUDE_MEM_FOLDER_CLAUDEMD_ENABLED": "true",
  "CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY": "true",
  "CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE": "false",
  "CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS": "true",
  "CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS": "true",
  "CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT": "true",
  "CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT": "true",
  "CLAUDE_MEM_CONTEXT_SHOW_TERMINAL_OUTPUT": "true",
  "CLAUDE_MEM_MAX_CONCURRENT_AGENTS": "8"
}
```

**`project:file:*`** / **`project:dir:*`** — Create the missing project path:

For directories: `mkdir -p "$PROJECT_ROOT/$ID"`
For files: note these for the user — file content can't be inferred from the tag alone. Collect and show at the end.

#### Execution flow

1. Work through each missing item, applying the remediation
2. After all remediations, re-run the reconciliation check to verify:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changelog reconcile \
  --from "$PREV_VERSION" --to "$LATEST_VERSION" \
  --changelog-file /tmp/fhhs-changelog.md \
  --project-root "$PWD"
```

3. Display the final status table showing what was fixed and what still needs attention:

```
## Post-update reconciliation

| Status | What | Action taken |
|--------|------|-------------|
| ✓ | fallow | Installed via pnpm |
| ✓ | shadcn skills | Installed globally |
| ✓ | CLAUDE_CODE_ENABLE_TASKS | Added to settings.json |
| ⚠ | claude-mem | Requires manual install (see below) |
```

4. **Only if there are items that couldn't be auto-fixed**, show ONE consolidated block:

```
╔══════════════════════════════════════════════════════════════╗
║  Manual steps needed                                         ║
╚══════════════════════════════════════════════════════════════╝

These items could not be installed automatically. Run in a
terminal:

  claude plugin marketplace add thedotmack/claude-mem
  claude plugin install claude-mem

  claude plugin marketplace add mksglu/context-mode
  claude plugin install context-mode@context-mode

──────────────────────────────────────────────────────────────
```

5. If everything was fixed automatically:

```
✓ All gaps closed — your environment is fully up to date.
```

### 5b½: Local Supabase environment check

If the project has a `supabase/` directory (indicating local Supabase was configured), check for drift:

```bash
if [ -d "supabase" ] && [ -f "supabase/config.toml" ]; then
  echo "HAS_LOCAL_SUPABASE"

  # Check container runtime
  if command -v docker >/dev/null 2>&1; then
    DOCKER_CONTEXT=$(docker context show 2>/dev/null || echo "unknown")
    DOCKER_RUNNING=$(docker info >/dev/null 2>&1 && echo "true" || echo "false")
    echo "DOCKER_CONTEXT=$DOCKER_CONTEXT DOCKER_RUNNING=$DOCKER_RUNNING"
  else
    echo "NO_DOCKER"
  fi

  # Check OrbStack DOCKER_HOST on macOS
  if [ "$(uname -s)" = "Darwin" ]; then
    if [ -d "/Applications/OrbStack.app" ] || command -v orb >/dev/null 2>&1; then
      if [ -z "$DOCKER_HOST" ] || ! echo "$DOCKER_HOST" | grep -q "orbstack"; then
        # Check if /var/run/docker.sock points to OrbStack
        if ! docker info 2>/dev/null | grep -q "orbstack"; then
          echo "DOCKER_HOST_DRIFT — OrbStack installed but DOCKER_HOST not set"
        fi
      fi
    fi
  fi

  # Check if Supabase containers are running
  if command -v supabase >/dev/null 2>&1; then
    supabase status >/dev/null 2>&1 && echo "SUPABASE_RUNNING" || echo "SUPABASE_STOPPED"
  else
    echo "SUPABASE_CLI_MISSING"
  fi

  # Check for migration drift — new migrations on disk that haven't been applied
  if command -v supabase >/dev/null 2>&1 && supabase status >/dev/null 2>&1; then
    DISK_MIGRATIONS=$(ls supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
    # Get applied migration count from the local database
    APPLIED_MIGRATIONS=$(supabase migration list 2>/dev/null | grep -c "applied" || echo "0")
    if [ "$DISK_MIGRATIONS" -gt "$APPLIED_MIGRATIONS" ] 2>/dev/null; then
      UNAPPLIED=$((DISK_MIGRATIONS - APPLIED_MIGRATIONS))
      echo "MIGRATION_DRIFT — $UNAPPLIED unapplied migration(s) on disk"
    else
      echo "MIGRATIONS_OK — $DISK_MIGRATIONS migration(s), all applied"
    fi
  fi

  # Check for seed.sql existence (common gap in brownfield projects)
  [ -f "supabase/seed.sql" ] && echo "SEED_OK" || echo "NO_SEED_FILE"
else
  echo "NO_LOCAL_SUPABASE"
fi
```

**If `DOCKER_HOST_DRIFT`:** Fix it inline:

```bash
export DOCKER_HOST="unix://$HOME/.orbstack/run/docker.sock"
SHELL_NAME="$(basename "$SHELL")"
case "$SHELL_NAME" in
  fish) fish -c 'set -Ux DOCKER_HOST "unix://$HOME/.orbstack/run/docker.sock"' 2>/dev/null ;;
  zsh) grep -q 'DOCKER_HOST.*orbstack' "$HOME/.zshrc" 2>/dev/null || echo 'export DOCKER_HOST="unix://$HOME/.orbstack/run/docker.sock"' >> "$HOME/.zshrc" ;;
  bash) grep -q 'DOCKER_HOST.*orbstack' "$HOME/.bashrc" 2>/dev/null || echo 'export DOCKER_HOST="unix://$HOME/.orbstack/run/docker.sock"' >> "$HOME/.bashrc" ;;
esac
```

**If `SUPABASE_CLI_MISSING`:** Install it: `brew install supabase/tap/supabase`

**If `SUPABASE_STOPPED`:** Note in the reconciliation table — this is expected if the user stopped it intentionally. Don't auto-start.

**If `MIGRATION_DRIFT`:** Warn the user and suggest applying:

```
⚠ {N} unapplied migration(s) detected. Run: supabase db reset
  (This drops and recreates the local DB, applies all migrations, and runs seed.sql)
```

Do NOT auto-apply — `db reset` is destructive to local data. Let the user decide.

**If `NO_SEED_FILE`:** Note as informational — not all projects use seed.sql.

##### OrbStack auto-config drift (macOS only, when OrbStack is active)

```bash
if docker context show 2>/dev/null | grep -q orbstack; then
  # Compute RAM-aware recommended memory (same logic as /fh:new-project Step 10)
  TOTAL_RAM_MIB=$(( $(sysctl -n hw.memsize 2>/dev/null || echo "0") / 1048576 ))
  if [ "$TOTAL_RAM_MIB" -le 8192 ] 2>/dev/null; then
    RECOMMENDED=4096
  elif [ "$TOTAL_RAM_MIB" -le 16384 ] 2>/dev/null; then
    RECOMMENDED=8192
  else
    RECOMMENDED=8192
  fi

  MEM=$(orb config show 2>/dev/null | grep memory_mib | sed 's/.*: *//' || echo "0")
  [ "$MEM" -lt "$RECOMMENDED" ] 2>/dev/null && echo "ORBSTACK_MEM_LOW — memory_mib=$MEM (recommended: $RECOMMENDED for ${TOTAL_RAM_MIB} MiB RAM)" || echo "ORBSTACK_MEM_OK — $MEM MiB"

  # Check package.json for smart db:studio (uses open-studio.sh helper)
  if [ -f "package.json" ]; then
    grep '"db:studio"' package.json 2>/dev/null | grep -q 'open-studio' && echo "DB_STUDIO_SMART" || echo "DB_STUDIO_BASIC"
    grep -q '"db:clean"' package.json 2>/dev/null && echo "DB_CLEAN_OK" || echo "DB_CLEAN_MISSING"
  fi
fi
```

**If `ORBSTACK_MEM_LOW`:** Fix inline: `orb config set memory_mib $RECOMMENDED`

**If `DB_STUDIO_BASIC`:** Update `package.json` db:studio to `"sh scripts/open-studio.sh"` and create `scripts/open-studio.sh` with OrbStack detection (same as `/fh:new-project` Step 8e-local section 9).

**If `DB_CLEAN_MISSING`:** Add to package.json: `"db:clean": "docker builder prune -f"`, `"db:clean:all": "docker builder prune -af"`

Add results to the reconciliation table:

```
| ✓ | OrbStack DOCKER_HOST     | Fixed — persisted to shell profile |
| ✓ | Supabase CLI             | Already installed |
| ⊘ | Supabase containers      | Stopped (run $PM run db:start to restart) |
| ⚠ | Migration drift          | 2 unapplied migration(s) — run supabase db reset |
| ✓ | OrbStack memory          | Raised to {RECOMMENDED} MiB (was: {MEM}, machine has {TOTAL_RAM_MIB} MiB) |
| ✓ | db:studio                | Updated to OrbStack-aware version |
| ✓ | db:clean                 | Added to package.json |
```

### 5c: Suggest .planning/ health check

Check if the user has an existing `.planning/` directory in the current project:

```bash
[ -d ".planning" ] && echo "HAS_PLANNING" || echo "NO_PLANNING"
```

**If HAS_PLANNING:**

```
### .planning/ health check

Your project has a .planning/ directory. If it was created with an
older version of this plugin (or plain GSD), it may have structural
issues. Run:

  /fh:health --repair

This will detect and auto-fix common problems like missing config,
invalid state references, or outdated directory layouts.
```

**If NO_PLANNING:** Skip silently.

---

**After reconciliation is complete:**

```
Restart Claude Code to use the new version.
```
