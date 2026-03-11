---
description: "Welcome to fhhs-skills. Run once after installing this plugin for an overview. Use when the user says 'setup', 'get started', or 'what is this plugin'."
---

$ARGUMENTS

Use the UI patterns from `references/gsd/ui-brand.md` for all output in this command, but use `FHHS ►` prefix in stage banners instead of `GSD ►`.

---

## Step 1: Welcome Banner

Display the welcome banner with the fire horse mark:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

          /           /
         /' .,,,,  ./══════─ ·    FIRE HORSE HACKER SYNDICATE
        /';'     ,/═══════─ ·     fhhs-skills
       / /   ,,//,/'`════─ ·
      ( ,, '_,  ,/,' ``           Unified workflow for
      |  <═◆●◆═>/,,, ;" `         software development
     /    .   ,''/' `,``
    /   .     ./, `,, ` ;
 ,./  .   ,-,',` ,,/''\,'
|   /; ./,,'`,,'' |   |
|     /   ','    /    |
 \___/'   '     |     |
  `,,'   |      /     `\

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

The mark elements: horse head in profile (classic ASCII art style), wide hacker goggles with frame bars (<═◆●◆═>) and diagonal arm (/) going up toward the ear, fire/data traces trailing from the mane (═══─ ·).

---

## Step 2: Detect Platform and Check Prerequisites

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FHHS ► CHECKING PREREQUISITES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Detect the platform:

```bash
case "$(uname -s 2>/dev/null)" in
  Darwin*) PLATFORM="macos" ;;
  Linux*)  PLATFORM="linux" ;;
  MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
  *) PLATFORM="unknown" ;;
esac
echo "PLATFORM: $PLATFORM"
```

### Install Homebrew if missing (macOS / Linux only)

On macOS and Linux, check for `brew` first — it is needed to install any missing tools:

```bash
command -v brew >/dev/null 2>&1 && echo "OK brew $(brew --version 2>/dev/null | head -1)" || echo "MISSING brew"
```

If `brew` is **MISSING** and the platform is `macos` or `linux`, install it now:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After Homebrew installs, it prints shell config instructions. Follow what it says (typically adding `brew` to `PATH`). Then verify:

```bash
brew --version
```

If the platform is `windows`, skip the Homebrew step — Windows uses its own installers handled below.

Check all tools:

```bash
for cmd in node npm git gh vercel typescript-language-server; do
  if command -v "$cmd" >/dev/null 2>&1; then
    VERSION=$("$cmd" --version 2>/dev/null | head -1)
    echo "OK $cmd $VERSION"
  else
    echo "MISSING $cmd"
  fi
done
```

Present results using status symbols:

```
| Tool                       | Status              |
|----------------------------|---------------------|
| node                       | ✓ v22.1.0           |
| npm                        | ✓ v10.8.0           |
| git                        | ✓ v2.45.0           |
| gh                         | ✗ MISSING (optional) |
| vercel                     | ✗ MISSING (optional) |
| typescript-language-server  | ✗ MISSING            |
```

If everything is `✓`, skip to Step 3.

### If MISSING dependencies exist

**macOS / Linux — use Homebrew:**

`brew` was already checked and installed in Step 2 if needed. Install any MISSING tools:

```bash
# Install only what's missing — skip any that are already OK
brew install node       # provides node + npm
brew install gh         # GitHub CLI
brew install vercel-cli # Vercel CLI (or: npm i -g vercel)
```

**Windows:**

If the platform is `windows`, do NOT run the Homebrew steps above. Instead, present:

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Action Required                                 ║
╚══════════════════════════════════════════════════════════════╝

Windows detected. Install these tools using their official installers:

  1. Node.js (node + npm):  https://nodejs.org — LTS installer
  2. GitHub CLI (gh):       winget install GitHub.cli
  3. Vercel CLI:            npm install -g vercel
  4. Git (if missing):      winget install Git.Git

──────────────────────────────────────────────────────────────
→ Restart your terminal and run /fh:setup again after installing
──────────────────────────────────────────────────────────────
```

Stop here on Windows if Node.js is missing — everything else depends on it.

**After installing missing tools**, re-run the dependency check to confirm:

```bash
for cmd in node npm git; do
  command -v "$cmd" >/dev/null 2>&1 && echo "✓ $cmd" || echo "✗ STILL MISSING: $cmd"
done
```

`node` and `npm` are required. `gh` and `vercel` are optional — the plugin works without them.

If `node` is still missing, show error and stop:

```
╔══════════════════════════════════════════════════════════════╗
║  ERROR                                                       ║
╚══════════════════════════════════════════════════════════════╝

Node.js is required but not installed.

**To fix:** Install Node.js from https://nodejs.org (LTS recommended)
```

---

## Step 3: TypeScript LSP Setup

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FHHS ► TYPESCRIPT LSP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

The TypeScript LSP provides precise code navigation (`goToDefinition`, `findReferences`, call hierarchy, hover types) used by codebase mapping, debugging, refactoring, and build subagents.

### 3a: Install the language server binary

```bash
command -v typescript-language-server >/dev/null 2>&1 && echo "✓ INSTALLED: $(typescript-language-server --version)" || echo "✗ NOT_INSTALLED"
```

If `NOT_INSTALLED`:

```
◆ Installing typescript-language-server...
```

```bash
npm install -g typescript-language-server typescript
```

Verify:

```bash
typescript-language-server --version && echo "✓ Language server ready"
```

### 3b: Install the Claude Code LSP plugin

Use `node` (not python3) to check the plugin state, since node is guaranteed available by this step:

```bash
node -e "
  var fs = require('fs'), path = require('path');
  var p = path.join(require('os').homedir(), '.claude/plugins/installed_plugins.json');
  try {
    var data = JSON.parse(fs.readFileSync(p, 'utf8'));
    var plugins = data.plugins || {};
    console.log(plugins['typescript-lsp@claude-plugins-official'] ? 'INSTALLED' : 'NOT_INSTALLED');
  } catch(e) { console.log('NOT_INSTALLED'); }
"
```

If `NOT_INSTALLED`:

```
◆ Installing LSP plugin...
```

```bash
claude plugin install typescript-lsp@claude-plugins-official
```

If the `claude` CLI command is not available (running inside Claude Code rather than from terminal), tell the user:

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Action Required                                 ║
╚══════════════════════════════════════════════════════════════╝

The LSP plugin needs to be installed from the terminal:

  claude plugin install typescript-lsp@claude-plugins-official

──────────────────────────────────────────────────────────────
→ Run the command above in your terminal, then type "done"
──────────────────────────────────────────────────────────────
```

### 3c: Enable LSP in Claude Code

`CLAUDE_CODE_ENABLE_LSP` must be set in `~/.claude/settings.json` under the `env` key — this is how Claude Code picks up global env vars.

Use the **Read tool** to load `~/.claude/settings.json`, then check if `env.CLAUDE_CODE_ENABLE_LSP` is already present.

If not present, use the **Edit tool** to merge into settings.json:

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_LSP": "1"
  }
}
```

Merge carefully — do NOT overwrite other `env` keys that may already exist.

After writing:

```
✓ CLAUDE_CODE_ENABLE_LSP=1 set in ~/.claude/settings.json
  → Restart Claude Code for LSP to activate
```

If already present and set to `"1"`:

```
✓ CLAUDE_CODE_ENABLE_LSP already enabled
```

---

## Step 4: CLI Tools and Hooks Setup

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FHHS ► TOOLING + HOOKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

The project CLI (`gsd-tools.cjs`) is bundled with this plugin. Set up symlinks so all commands can find it.

**Important:** Run the entire detection, bin linking, and hooks linking in a **single Bash call** so `PLUGIN_ROOT` persists across all steps. The variable does not survive across separate Bash tool calls.

### Link to latest plugin version

Always run the linking block below — `ln -sfn` is idempotent and will update stale symlinks pointing to older cached versions.

Run this entire block as a **single** Bash command:

```bash
PLUGIN_ROOT=""

# 1. Dev checkout — prefer if running inside the fhhs-skills repo
if [ -f "$(pwd)/bin/gsd-tools.cjs" ] && [ -f "$(pwd)/plugin.json" ]; then
  PLUGIN_ROOT="$(pwd)"
  echo "◆ Using dev checkout"
fi

# 2. Latest version from plugin cache (sort picks newest)
if [ -z "$PLUGIN_ROOT" ]; then
  LATEST="$(ls -d "$HOME/.claude/plugins/cache/fhhs-skills/fh"/*/ 2>/dev/null | sort | tail -1)"
  LATEST="${LATEST%/}"
  if [ -n "$LATEST" ] && [ -f "$LATEST/bin/gsd-tools.cjs" ]; then
    PLUGIN_ROOT="$LATEST"
    echo "◆ Using cached plugin: $(basename "$PLUGIN_ROOT")"
  fi
fi

# 3. Fallback: search current directory tree
if [ -z "$PLUGIN_ROOT" ]; then
  FOUND="$(find "$(pwd)" -maxdepth 3 -name 'gsd-tools.cjs' -path '*/bin/*' -exec dirname {} \; 2>/dev/null | head -1)"
  if [ -n "$FOUND" ]; then
    PLUGIN_ROOT="$(dirname "$FOUND")"
    echo "◆ Using local checkout"
  fi
fi

# Link bin + hooks
if [ -n "$PLUGIN_ROOT" ] && [ -d "$PLUGIN_ROOT/bin" ]; then
  mkdir -p "$HOME/.claude/get-shit-done"
  ln -sfn "$PLUGIN_ROOT/bin" "$HOME/.claude/get-shit-done/bin"
  [ -f "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" ] && echo "✓ CLI tools linked" || echo "⚠ Symlink created but target not found"

  if [ -d "$PLUGIN_ROOT/hooks" ]; then
    ln -sfn "$PLUGIN_ROOT/hooks" "$HOME/.claude/get-shit-done/hooks"
    echo "✓ Hooks linked"
  else
    echo "⚠ Hooks directory not found — statusline and update check will not be configured"
  fi
else
  echo "ERROR: Could not find fhhs-skills plugin root"
fi
```

If the plugin root can't be found:

```
╔══════════════════════════════════════════════════════════════╗
║  ERROR                                                       ║
╚══════════════════════════════════════════════════════════════╝

Could not find fhhs-skills plugin root. Is fhhs-skills installed?

**To fix:** Reinstall with `claude plugin install fhhs-skills`
```

---

## Step 5: Configure Hooks and Statusline

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FHHS ► CONFIGURING HOOKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

fhhs-skills includes three hooks:

| Hook | Event | What it does |
|------|-------|-------------|
| `fhhs-statusline.js` | Statusline | Shows model, current task, context usage, update indicator |
| `fhhs-check-update.js` | SessionStart | Checks GitHub for new fhhs-skills versions (background, throttled to 6h) |
| `fhhs-context-monitor.js` | PostToolUse | Warns the agent when context window is running low |

### 5a: Read current settings

Read `~/.claude/settings.json` using the **Read tool** (not cat/bash). If the file does not exist, note that it needs to be created.

### 5b: Configure settings.json

Use the **Read tool** to load `~/.claude/settings.json`, then apply changes with the **Edit tool** (or **Write tool** if creating from scratch). This avoids shell escaping issues with `node -e` where characters like `!` get mangled by bash.

**Statusline** — set `statusLine` to run the statusline hook:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"$HOME/.claude/get-shit-done/hooks/fhhs-statusline.js\""
  }
}
```

**If statusLine already exists** in settings.json (user has a custom statusline), ask before replacing:

Use AskUserQuestion:
- header: "Statusline"
- question: "You have an existing statusline configured. Replace it with the fhhs-skills statusline?"
- options:
  - "Replace" — Use fhhs-skills statusline (shows model, task, context, updates)
  - "Keep existing" — Don't change your statusline

**SessionStart hook** — add update checker (only if not already present):

Check if `settings.hooks.SessionStart` already contains a hook with command including `fhhs-check-update`. If not, add:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$HOME/.claude/get-shit-done/hooks/fhhs-check-update.js\""
          }
        ]
      }
    ]
  }
}
```

**PostToolUse hook** — add context monitor (only if not already present):

Check if `settings.hooks.PostToolUse` already contains a hook with command including `fhhs-context-monitor`. If not, add:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$HOME/.claude/get-shit-done/hooks/fhhs-context-monitor.js\""
          }
        ]
      }
    ]
  }
}
```

**Important:** Merge into existing settings — do NOT overwrite existing hooks arrays. Append to them.

**Also remove any old GSD hooks** if present (commands referencing `gsd-check-update` or `gsd-statusline` or `gsd-context-monitor` in settings.json). fhhs-skills hooks replace the GSD equivalents.

After writing settings.json:

```
✓ Statusline configured
✓ Update check hook configured (SessionStart)
✓ Context monitor hook configured (PostToolUse)
```

---

## Step 6: Conductor Configuration

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FHHS ► CONDUCTOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

[Conductor](https://conductor.build) lets you run multiple Claude Code agents in parallel workspaces. Each workspace gets a copy of your git files plus isolated setup/run scripts. This step checks whether Conductor is installed and reminds the user to configure it per-project.

### 6a: Detect Conductor

```bash
# Check if the Conductor app exists
[ -d "/Applications/Conductor.app" ] && echo "INSTALLED" || echo "NOT_INSTALLED"
```

If `NOT_INSTALLED`:

```
○ Conductor not detected (optional)
  Conductor runs parallel coding agents in isolated workspaces.
  Download from https://conductor.build if interested.
```

Skip to Step 7.

### 6b: Conductor awareness

If installed, display:

```
✓ Conductor detected

  Conductor uses conductor.json in your repo root to configure workspaces.
  When you start a new project with /fh:new-project, a conductor.json
  will be created automatically with setup + run scripts for your stack.

  Key environment variables available in Conductor scripts:
  ┌────────────────────────────┬──────────────────────────────────┐
  │ $CONDUCTOR_ROOT_PATH       │ Repository root directory        │
  │ $CONDUCTOR_WORKSPACE_PATH  │ Current workspace directory      │
  │ $CONDUCTOR_PORT            │ Assigned port (range of 10)      │
  │ $CONDUCTOR_WORKSPACE_NAME  │ Workspace name                   │
  │ $CONDUCTOR_DEFAULT_BRANCH  │ Default branch (usually main)    │
  └────────────────────────────┴──────────────────────────────────┘

  If you have an existing project, create conductor.json manually:

    {
      "scripts": {
        "setup": "npm install && ln -s \"$CONDUCTOR_ROOT_PATH/.env\" .env",
        "run": "npm run dev -- --port $CONDUCTOR_PORT"
      }
    }
```

---

## Step 7: Summary

Display the summary banner as **direct text output** (not via Bash — Bash output gets collapsed by Claude Code and users won't see it). Output this exactly:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FHHS ► SETUP COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

          /           /
         /' .,,,,  ./══════─ ·
        /';'     ,/═══════─ ·     Ready to ride.
       / /   ,,//,/'`════─ ·
      ( ,, '_,  ,/,' ``
      |  <═◆●◆═>/,,, ;" `
     /    .   ,''/' `,``
    /   .     ./, `,, ` ;
 ,./  .   ,-,',` ,,/''\,'
|   /; ./,,'`,,'' |   |
|     /   ','    /    |
 \___/'   '     |     |
  `,,'   |      /     `\
```

Then present the status table and next steps as regular markdown text:

```
| Component                  | Status                   |
|----------------------------|--------------------------|
| Platform                   | {macos/linux/windows}    |
| Node.js                    | ✓ {version}              |
| npm                        | ✓ {version}              |
| git                        | ✓ {version}              |
| GitHub CLI (gh)            | ✓ {version} / ○ optional |
| Vercel CLI                 | ✓ {version} / ○ optional |
| TypeScript LSP             | ✓ {version}              |
| LSP Plugin                 | ✓ installed              |
| LSP Enabled (env)          | ✓ CLAUDE_CODE_ENABLE_LSP=1 |
| CLI Tools                  | ✓ linked                 |
| Hooks                      | ✓ statusline + update check + context monitor |
| Conductor                  | ✓ detected / ○ not installed (optional) |

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Start a project** — set up vision, tech stack, design language, and roadmap

`/fh:new-project`

<sub>`/clear` first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- `/fh:help` — full command reference and architecture guide
- `/fh:resume` — pick up an existing project with `.planning/`

───────────────────────────────────────────────────────────────
```
