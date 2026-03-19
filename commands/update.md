---
description: "Check for updates and install the latest version. Use when the user says 'update', 'upgrade', 'check for updates', or 'get latest version'."
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

Fetch the latest version from GitHub and the changelog:

```bash
# Get latest version from GitHub raw
curl -sL "https://raw.githubusercontent.com/cinjoff/fhhs-skills/main/.claude-plugin/plugin.json" 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(data['version'])
" 2>/dev/null || echo "FETCH_FAILED"
```

```bash
# Get changelog
curl -sL "https://raw.githubusercontent.com/cinjoff/fhhs-skills/main/CHANGELOG.md" 2>/dev/null
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
  Run after /plan-work and before /build. Catches failure
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
  plans. You can still go straight to /build.

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
      description: "Install latest version"
    - label: "No, skip"
      description: "Stay on current version"
```

**If "No, skip":** Exit.

**If "Yes, update now":**

Run these two commands in sequence. Both are required.

**Step 4a — Refresh the marketplace index** so Claude Code sees the latest version:

```bash
claude plugin marketplace update fhhs-skills
```

> **IMPORTANT:** The marketplace name is `fhhs-skills` (NOT `fh@fhhs-skills` — that's the plugin name, not the marketplace name). There is NO `claude marketplace refresh` command — that does not exist.

**Step 4b — Update the plugin:**

```bash
claude plugin update fh@fhhs-skills
```

**Step 4c — Clear the update indicator** from the statusline:

```bash
rm -f "$HOME/.claude/cache/fhhs-update-check.json"
```

**After update:**

```
## Updated

**fhhs-skills** X.Y.Z → A.B.C

Running post-update reconciliation...
```

Proceed to Step 5.

---

## Step 5: Post-Update Reconciliation

After the plugin is updated, reconcile the user's environment and project to pick up new features.

### Resolve Plugin Root

Before reading source files, find the plugin installation directory:

```bash
# Find the latest cached version of fhhs-skills
PLUGIN_ROOT=$(ls -d ~/.claude/plugins/fh@fhhs-skills/*/  2>/dev/null | sort -V | tail -1)

# Fallback: check for dev checkout
if [ -z "$PLUGIN_ROOT" ]; then
  for dir in ~/Documents/github*/fhhs-skills ~/code/fhhs-skills; do
    [ -d "$dir/commands" ] && PLUGIN_ROOT="$dir/" && break
  done
fi
```

If PLUGIN_ROOT cannot be resolved, skip Steps 5a and 5b with: "Could not find plugin files for reconciliation. Run `/fh:setup` manually to ensure your environment is up to date."

### Step 5a: Machine Reconciliation

Re-apply machine-level setup to ensure the user's environment matches what the latest version expects. This runs automatically — no prompt needed.

1. Read `${PLUGIN_ROOT}commands/setup.md` to understand current machine-level requirements
2. Check each requirement against the user's actual environment
3. Fix anything missing or stale — all operations are idempotent

What to check and fix (derived from reading setup.md each time — do NOT use a hardcoded checklist):
- **CLI symlinks** — re-run the symlink block (ln -sfn to latest cached version). Fixes stale symlinks pointing to the old version.
- **Hooks** — read `~/.claude/settings.json` and compare against hooks defined in setup.md. Add any missing fhhs hooks. **IMPORTANT: Do NOT remove existing hooks — including gsd-* hooks that may serve other projects. Only append missing hooks.**
- **Env vars** — check settings.json env block for vars required by setup.md. Add any missing ones.
- **Plugins** — check if plugins mentioned in setup.md (e.g., typescript-lsp, claude-mem) are installed. Note missing ones but don't auto-install (may require terminal).

Report what was fixed:
```
✓ CLI tools re-linked to vX.Y.Z
✓ Context monitor hook added (new in vX.Y.Z)
✓ CLAUDE_CODE_ENABLE_TASKS added to settings
○ All hooks up to date
```

### Step 5b: Project Reconciliation

**Only run if `.planning/` exists in the current working directory.** If not, skip with: "No project detected in this directory. Run `/fh:update` from your project root to check for new features."

This step checks whether the user's existing project has all the features that a new project would get.

1. Read `${PLUGIN_ROOT}commands/new-project.md` to understand what project-level features exist
2. Read `${PLUGIN_ROOT}commands/setup.md` for any project-relevant setup (e.g., claude-mem)
3. For each feature, check the characteristic files/directories that would exist if it was set up
4. If a feature in new-project.md is stack-specific (e.g., Next.js API routes, instrumentation.ts), check whether the project uses that stack before offering it
5. Present missing features in a grouped prompt

**If nothing is missing:** "Your project is up to date with all available features." Skip the prompt.

**If features are missing**, present them grouped with plain human language describing the benefit:

```
## New features available for this project

This update includes features that your project doesn't have yet.
Pick which ones to add:

  1. ◻ Catch runtime errors automatically
     Captures browser and server errors to a local database that
     /fh:fix and /fh:build query during debugging.

  2. ◻ Project dashboard
     Visual progress tracker showing phases, plans, and status
     at a glance. Launch anytime with /fh:tracker.

  3. ◻ Conductor workspace scripts
     Auto-configures dev server, env vars, and task tracking
     for each parallel workspace.

  4. ◻ Persistent memory (claude-mem)
     Automatically captures session context and reinjects
     relevant history into future sessions.

Which would you like to add? (e.g. "1 and 2", "all", or "none")
```

For each selected feature, follow the relevant section of new-project.md or setup.md to scaffold it. Do not duplicate the scaffold instructions here — read and follow the source commands.

After applying, report what was added:
```
✓ Local error tracking added (lib/sentry-local.ts + query tool)
✓ Project tracker scaffolded (.project-tracker/)
```

Suggest running `/fh:revise-claude-md` afterward if any features were added, so CLAUDE.md reflects the new capabilities.

**After reconciliation is complete:**

```
Restart Claude Code to use the new version.
```
