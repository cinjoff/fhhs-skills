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
| `--global` | After updating the plugin, discover ALL projects using fhhs-skills and reconcile each one (env gaps, health repair, tracker registration). |
| *(no flags)* | Update plugin and reconcile current project only (existing behavior). |

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

Then check Step 5c (`.planning/` health suggestion).

After Step 5c, also check how many other projects exist (same logic as the post-reconciliation tip in the main flow) and show the `--global` tip if applicable. Then exit.

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

### 5a½ + 5a¾ + 5a⅞: Run post-update reconciliation script

Steps 5a½ (claude-mem patch), 5a¾ (CLAUDE_MEM_PROJECT), and 5a⅞ (tracker refresh) are handled by a script in `bin/` which was just re-linked in Step 5a. This ensures the NEW version's logic runs even when the SKILL.md prompt was loaded from the old cached version.

```bash
sh "$HOME/.claude/get-shit-done/bin/post-update-reconcile.sh" --project-root "$PWD"
```

If the output includes "WARNING: gp() signature changed", claude-mem changed its internals and the patch needs updating — note this in the reconciliation table but don't fail the update.

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
| `CLAUDE_CWD` | Derive from `process.cwd()` or `$CONDUCTOR_ROOT_PATH` — NOT a static value |
| `CLAUDE_MEM_PROJECT` | Derive from `git rev-parse --git-common-dir` (worktree-safe) — NOT a static value |
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

  MEM=$(orb config show 2>/dev/null | grep memory_mib | sed 's/.*: *//')
  MEM="${MEM:-0}"
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

Run health repair automatically:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" validate health --repair
```

Parse the JSON output and display results:

```
### .planning/ health check

Status: HEALTHY | DEGRADED | BROKEN
Errors: N | Warnings: N
```

**If repairs were performed**, list them:

```
Repairs performed:
  ✓ config.json: Created with defaults
  ✓ STATE.md: Regenerated from roadmap
  ✓ workflow.nyquist_validation: Added to config
```

**If errors remain that couldn't be auto-fixed:**

```
Remaining issues (manual fix needed):
  [E002] PROJECT.md not found — run /fh:new-project
  [W005] Phase directory "setup" doesn't follow NN-name format
```

**If NO_PLANNING:** Skip silently.

---

**After reconciliation is complete (current project):**

If `--global` flag is NOT set:

Check how many other projects exist in the tracker registry:

```bash
python3 -c "
import json, pathlib, os
registry = pathlib.Path(os.path.expanduser('~/.claude/tracker/projects.json'))
if registry.exists():
    projects = json.loads(registry.read_text())
    other = [p for p in projects if os.path.exists(p['path']) and p['path'] != os.getcwd()]
    print(len(other))
else:
    print('0')
" 2>/dev/null
```

If the count is greater than 0, show:

```
Restart Claude Code to use the new version.

Tip: You have N other active worktrees using fhhs-skills. Run /fh:update --global
to fix all of them at once (env sync, tool installs, health repair, tracker cleanup).
```

If 0 or check fails:

```
Restart Claude Code to use the new version.
```

If `--global` flag IS set, proceed to Step 6.

---

## Step 6: Global Project Reconciliation (`--global` only)

Discover and reconcile ALL active projects using fhhs-skills. Projects are grouped by GitHub repo — multiple Conductor worktrees under the same repo are instances of one project, not separate projects.

**Discovery logic:**
1. **Conductor DB** (`~/Library/Application Support/com.conductor.app/conductor.db`) — only workspaces with `state = 'ready'` (archived workspaces are excluded)
2. **Tracker registry** (`~/.claude/tracker/projects.json`) — only non-Conductor projects (prevents archived workspaces from sneaking back in)

**Auto-remediation:** The global reconcile now fixes everything itself — installing tools, setting env vars, adding hooks, repairing health. It does NOT suggest manual steps or tell the user to run `/fh:update` individually.

### 6a: Pre-update scan

Before making any changes, scan all projects to show their current state:

```bash
# Fetch the fhhs-skills plugin changelog (used for env gap detection across all projects)
if [ ! -f /tmp/fhhs-changelog.md ] || [ ! -s /tmp/fhhs-changelog.md ]; then
  curl -sL "https://raw.githubusercontent.com/cinjoff/fhhs-skills/main/CHANGELOG.md" > /tmp/fhhs-changelog.md 2>/dev/null
fi

CHANGELOG_FLAG=""
if [ -s /tmp/fhhs-changelog.md ]; then
  CHANGELOG_FLAG="--changelog-file /tmp/fhhs-changelog.md"
fi

# Scan without making changes — only active workspaces from Conductor DB
node "$HOME/.claude/get-shit-done/bin/global-reconcile.cjs" \
  --scan-only --from "$PREV_VERSION" --to "$LATEST_VERSION" \
  $CHANGELOG_FLAG
```

Parse the JSON and display an ASCII project status map. Group worktrees by repo (the `repos` field in the JSON output):

```
## Projects to reconcile

N worktrees across M repos (active only — archived excluded)

  platform (5 worktrees)
  ├─ vancouver      ■■■■■■■■■■  healthy   0 gaps
  ├─ chicago-v1     ■■■□□□□□□□  broken    4 gaps
  ├─ osaka-v1       ■■■■■■□□□□  degraded  2 gaps
  ├─ cape-town-v1   ■■■■■■□□□□  degraded  2 gaps
  └─ rabat          ■■■■■■■■□□  degraded  1 gap

  fhhs-skills (2 worktrees)
  ├─ tunis-v2       ■■■■■■□□□□  degraded  2 gaps
  └─ los-angeles    ■■■■■■□□□□  degraded  2 gaps

  soul (1 worktree)
  └─ santo-domingo  ■■■■■■■■■■  healthy   0 gaps

  sonica (1 worktree)
  └─ louisville-v1  ■■■■■■□□□□  degraded  2 gaps

  konstantout (1 worktree)
  └─ san-juan       ■■■■■■■■■■  healthy   0 gaps

  nerve-os (1 worktree)
  └─ addis-ababa-v1 ■■■■■■□□□□  degraded  2 gaps

  fh-starter-project (1 worktree)
  └─ paris-v2       ■■■□□□□□□□  broken    4 gaps

  Legend: ■ = ok  □ = needs fix
```

**Build the progress bar** from the scan data:
- `health: healthy` + 0 env gaps = full bar (10 filled)
- `health: degraded` = 6 filled
- `health: broken` = 3 filled
- No `.planning/` = 0 filled
- Each env gap subtracts 1 from the bar

### 6b: Run global reconcile with auto-remediation

The global reconcile discovers projects, detects env gaps, AND fixes them automatically. It installs missing tools, sets env vars, adds hooks, repairs health — the same fixes that per-project `/fh:update` would do.

```bash
# Run global reconcile — discovers active projects from Conductor DB + tracker
node "$HOME/.claude/get-shit-done/bin/global-reconcile.cjs" \
  --from "$PREV_VERSION" --to "$LATEST_VERSION" \
  $CHANGELOG_FLAG
```

Parse the JSON output. The script runs per worktree:
- `post-update-reconcile.sh` (claude-mem patch, CLAUDE_MEM_PROJECT env var, tracker registration)
- `changelog reconcile` (detect env gaps using the fhhs-skills plugin changelog)
- **Auto-remediation** of detected gaps (tool installs, env vars, hooks, dirs)
- `validate health --repair` (planning directory health)

### 6c: Display aggregate results

Format the JSON report grouped by repo:

```
## Global Update Report

Reconciled N worktrees across M repos

  platform
  │ vancouver      ✓  all ok
  │ chicago-v1     ✓  4 gaps fixed (fallow, CLAUDE_CODE_ENABLE_TASKS, ...)
  │ osaka-v1       ✓  2 gaps fixed
  │ cape-town-v1   ✓  2 gaps fixed
  │ rabat          ✓  1 gap fixed, 1 health repair
  │
  fhhs-skills
  │ tunis-v2       ✓  2 gaps fixed, STATE.md regenerated
  │ los-angeles    ✓  2 gaps fixed
  │
  soul
  │ santo-domingo  ✓  all ok
  │
  (... remaining repos ...)
```

**Status per worktree:**
- `✓` — fully reconciled (env gaps fixed + health repaired)
- `⚠` — partially fixed (some items couldn't be auto-fixed — show what failed)

**If any remediations failed** (e.g., plugin installs in non-interactive environments):

Show ONE consolidated block with only the items that actually failed:

```
### Items that couldn't be auto-fixed

  plugin: claude-mem — requires interactive terminal
  plugin: context-mode — requires interactive terminal

  Fix: Open a terminal and run:
    claude plugin marketplace add thedotmack/claude-mem
    claude plugin install claude-mem
    claude plugin marketplace add mksglu/context-mode
    claude plugin install context-mode@context-mode
```

**If any projects had health repairs**, show what was fixed:

```
### Health repairs

  tunis-v2: STATE.md regenerated, config.json created
  rabat: nyquist_validation added to config
  Total: 4 repairs across 2 worktrees
```

**If any projects still have health errors after repair:**

```
### Remaining health issues

  chicago-v1: BROKEN — PROJECT.md not found
  paris-v2: BROKEN — PROJECT.md not found

  These worktrees need /fh:new-project run inside them to initialize.
```

**If any worktrees have stale git-tracked files:**

Git-tracked files (conductor.json, CLAUDE.md) are shared across worktrees in the same repo. Show one note per repo, not per worktree:

```
### Stale git-tracked files

  platform: conductor.json missing post-update-reconcile step
    (Fix in any worktree — others get it on pull/rebase)
```

### 6d: Stale registry cleanup

Auto-remove tracker entries for paths that no longer exist on disk, and also remove Conductor paths for archived workspaces:

```bash
python3 -c "
import json, os, pathlib, subprocess
registry_path = pathlib.Path(os.path.expanduser('~/.claude/tracker/projects.json'))
if not registry_path.exists():
    print('NO_REGISTRY')
    exit()
registry = json.loads(registry_path.read_text())

# Get active Conductor workspace names from DB
active_ws = set()
db_path = os.path.expanduser('~/Library/Application Support/com.conductor.app/conductor.db')
if os.path.exists(db_path):
    try:
        out = subprocess.check_output(['sqlite3', db_path, \"SELECT directory_name FROM workspaces WHERE state = 'ready'\"], text=True)
        active_ws = set(out.strip().split('\n')) if out.strip() else set()
    except: pass

cleaned = []
removed = 0
for e in registry:
    p = e.get('path', '')
    # Remove if path doesn't exist
    if not os.path.exists(p):
        removed += 1
        continue
    # Remove if it's a Conductor workspace that's archived
    if '/conductor/workspaces/' in p:
        ws_name = os.path.basename(p)
        if ws_name not in active_ws:
            removed += 1
            continue
    cleaned.append(e)

if removed > 0:
    registry_path.write_text(json.dumps(cleaned, indent=2) + '\n')
    print(f'Removed {removed} stale/archived entries')
else:
    print('NO_STALE')
"
```

### 6e: Final summary

```
## Summary

Updated fhhs-skills to vX.Y.Z
Reconciled N worktrees across M repos (active only)
  ✓ K worktrees fully fixed
  ⚠ J items couldn't be auto-fixed (see above)
  🗑 R stale/archived entries cleaned from registry

Restart Claude Code to use the new version.
```
