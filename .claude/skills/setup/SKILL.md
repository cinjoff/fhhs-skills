---
name: fh:setup
description: Welcome to fhhs-skills. Run once after installing for an overview. Use --check to verify setup status.
user-invocable: true
disable-model-invocation: true
---

$ARGUMENTS

Use the UI patterns from `references/gsd/ui-brand.md` for all output in this command, but use `FHHS ►` prefix in stage banners instead of `GSD ►`.

## Quick Check Mode

If the user passes `--check` (or says "check setup", "verify setup", "is setup ok"):

Run all detection commands from Steps 2-10 but DO NOT install anything. Present results
as a single status table:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FHHS ► SETUP STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Component                  | Status                        |
|----------------------------|-------------------------------|
| Platform                   | {platform}                    |
| Node.js                    | ✓ {version} / ✗ missing       |
| TypeScript LSP             | ✓ {version} / ✗ missing       |
| LSP Plugin                 | ✓ installed / ✗ not installed |
| LSP Enabled                | ✓ / ✗ CLAUDE_CODE_ENABLE_LSP not set |
| CLI Tools                  | ✓ linked / ✗ not linked       |
| FHHS_SKILLS_ROOT           | ✓ {path} / ✗ not set          |
| Hooks                      | ✓ configured / ✗ not configured |
| claude-mem                 | ✓ installed / ○ not installed |
| Fallow                     | ✓ installed / ○ not installed |
| shadcn skills              | ✓ installed / ○ not installed |
```

If any required component (Node, LSP, CLI tools, hooks) is missing:
```
⚠ {N} required components need setup.

→ Run /fh:setup — full setup with installation
```

If everything is configured:
```
✓ All components configured. Ready to use.
```

Then STOP — do not proceed to Step 1.

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
for cmd in node npm git gh vercel typescript-language-server docker supabase; do
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
| docker                     | ✓ v27.1.0 (OrbStack) |
| supabase                   | ✓ v2.1.0             |
```

Also check container runtime (macOS only):

```bash
if [ "$PLATFORM" = "macos" ]; then
  if [ -d "/Applications/OrbStack.app" ] || command -v orb >/dev/null 2>&1; then
    echo "OK OrbStack $(orb version 2>/dev/null || echo 'installed')"
  elif [ -d "/Applications/Docker.app" ]; then
    echo "OK Docker Desktop (consider OrbStack for ~2x less power usage)"
  else
    echo "MISSING container runtime (OrbStack recommended: brew install orbstack)"
  fi
fi
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

If `claude plugin install` fails or is not available (e.g. running inside Conductor or a non-interactive environment where `/plugin` slash commands don't work), tell the user:

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Action Required                                 ║
╚══════════════════════════════════════════════════════════════╝

The LSP plugin needs to be installed from your terminal (not
from inside Claude Code). Open a separate terminal and run:

  claude plugin install typescript-lsp@claude-plugins-official

Note: If you're using Conductor, /plugin commands are not
available — you must use the `claude plugin` CLI from a
regular terminal instead.

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
  → Restart Claude Code for changes to activate
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

# Link bin + hooks, then record the resolved root so other skills can use it
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

  node -e "
const fs = require('fs');
const f = process.env.HOME + '/.claude/settings.json';
let s = {};
try { s = JSON.parse(fs.readFileSync(f, 'utf8')); } catch {}
s.env = Object.assign(s.env || {}, { FHHS_SKILLS_ROOT: process.argv[1] });
fs.writeFileSync(f, JSON.stringify(s, null, 2) + '\n');
" "$PLUGIN_ROOT"
  echo "✓ FHHS_SKILLS_ROOT set to $PLUGIN_ROOT"
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

fhhs-skills includes four hooks:

| Hook | Event | What it does |
|------|-------|-------------|
| `fhhs-statusline.js` | Statusline | Shows model, current task, context usage, update indicator |
| `fhhs-check-update.js` | SessionStart | Checks GitHub for new fhhs-skills versions (background, throttled to 6h) |
| `fhhs-learnings.js` | SessionStart | Surfaces improvement areas from past sessions (reads cached digest; applies signal density logic to decide whether to prompt for full analysis) |
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

**SessionStart hook** — add update checker and learnings hook (only if not already present):

Check if `settings.hooks.SessionStart` already contains hooks with commands including `fhhs-check-update` and `fhhs-learnings`. Add any that are missing:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$HOME/.claude/get-shit-done/hooks/fhhs-check-update.js\""
          },
          {
            "type": "command",
            "command": "node \"$HOME/.claude/get-shit-done/hooks/fhhs-learnings.js\""
          }
        ]
      }
    ]
  }
}
```

**fhhs-learnings.js signal density logic** — the hook reads `~/.claude/cache/learnings-digest.json` and applies this decision matrix before outputting anything:

1. Count pending (unaddressed) items in the digest
2. Check `last_full_analysis` timestamp (if present in digest)
3. Decision matrix:
   - 5+ pending items AND >7 days since `last_full_analysis` → append: "💡 You have {N} unaddressed improvements. Run `/fh:learnings` for a full analysis."
   - 10+ pending items (any time) → append: "⚠️ {N} improvements have accumulated. Consider `/fh:learnings` before starting new work."
   - <5 pending OR <7 days since analysis → show items silently (current behavior)

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
✓ Learnings hook configured (SessionStart)
✓ Context monitor hook configured (PostToolUse)
```

---

## Security Scanning

`/fh:secure` is available as a standalone skill for on-demand security scanning of changed files. Run it directly when you want to check for vulnerabilities before a PR.

---

## Step 6: claude-mem (Persistent Memory)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FHHS ► PERSISTENT MEMORY (claude-mem)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

[claude-mem](https://github.com/thedotmack/claude-mem) automatically captures session context (tool usage, decisions, file changes) and reinjects relevant history into future sessions. It complements the curated MEMORY.md with zero-effort session-to-session continuity.

### 6a: Check if claude-mem is already installed

```bash
node -e "
  var fs = require('fs'), path = require('path');
  var p = path.join(require('os').homedir(), '.claude/plugins/installed_plugins.json');
  try {
    var data = JSON.parse(fs.readFileSync(p, 'utf8'));
    var plugins = data.plugins || {};
    console.log(plugins['claude-mem@thedotmack'] || plugins['claude-mem'] ? 'INSTALLED' : 'NOT_INSTALLED');
  } catch(e) { console.log('NOT_INSTALLED'); }
"
```

If `INSTALLED`:

```
✓ claude-mem already installed
```

Skip to Step 6c.

### 6b: Install claude-mem

```
◆ Installing claude-mem plugin...
```

```bash
claude plugin marketplace add thedotmack/claude-mem
```

```bash
claude plugin install claude-mem
```

If `claude plugin` fails (e.g. running inside Conductor or a non-interactive environment), tell the user:

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Action Required                                 ║
╚══════════════════════════════════════════════════════════════╝

Plugin install commands are not available in this environment.
Open a separate terminal and run:

  claude plugin marketplace add thedotmack/claude-mem
  claude plugin install claude-mem

Then restart Claude Code for hooks to activate.

──────────────────────────────────────────────────────────────
→ Run the commands above in your terminal, then type "done"
──────────────────────────────────────────────────────────────
```

On success:

```
✓ claude-mem installed
  → Restart Claude Code for hooks to activate
```

### 6c: Apply fhhs-skills configuration

claude-mem is central to fhhs-skills — it provides cross-session memory for all skills and captures learnings from parallel agents in `/fh:auto` mode. The defaults are too conservative for this workload.

Read `~/.claude-mem/settings.json` using the **Read tool**. If it doesn't exist, create it. Then use the **Edit tool** to merge the following values (do NOT overwrite other existing settings — only update these keys):

```json
{
  "CLAUDE_MEM_MODEL": "claude-haiku-4-5-20251001",
  "CLAUDE_MEM_CONTEXT_OBSERVATIONS": "0",
  "CLAUDE_MEM_CONTEXT_SESSION_COUNT": "0",
  "CLAUDE_MEM_CONTEXT_FULL_COUNT": "0",
  "CLAUDE_MEM_CONTEXT_FULL_FIELD": "narrative",
  "CLAUDE_MEM_SKIP_TOOLS": "ListMcpResourcesTool,ReadMcpResourceTool,SlashCommand,Skill,TodoWrite,AskUserQuestion,ToolSearch,TaskCreate,TaskUpdate,TaskGet,TaskList,TaskOutput,TaskStop,SendMessage,EnterPlanMode,ExitPlanMode,EnterWorktree,ExitWorktree,LSP,CronCreate,CronDelete,CronList,TeamCreate,TeamDelete,NotebookEdit,mcp__plugin_claude-mem_mcp-search____IMPORTANT,mcp__plugin_claude-mem_mcp-search__search,mcp__plugin_claude-mem_mcp-search__get_observations,mcp__plugin_claude-mem_mcp-search__timeline,mcp__plugin_claude-mem_mcp-search__smart_search,mcp__plugin_claude-mem_mcp-search__smart_unfold,mcp__plugin_claude-mem_mcp-search__smart_outline",
  "CLAUDE_MEM_FOLDER_CLAUDEMD_ENABLED": "false",
  "CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY": "false",
  "CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE": "false",
  "CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS": "true",
  "CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS": "true",
  "CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT": "true",
  "CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT": "true",
  "CLAUDE_MEM_CONTEXT_SHOW_TERMINAL_OUTPUT": "true",
  "CLAUDE_MEM_MAX_CONCURRENT_AGENTS": "8"
}
```

After applying, display:

```
✓ claude-mem configured for fhhs-skills

  Applied settings:
  ┌─────────────────────────────────────┬─────────┬─────────────┐
  │ Setting                             │ Default │ Applied     │
  ├─────────────────────────────────────┼─────────┼─────────────┤
  │ CONTEXT_OBSERVATIONS                │ 50      │ 500         │
  │ CONTEXT_SESSION_COUNT               │ 10      │ 50          │
  │ CONTEXT_FULL_COUNT                  │ 5       │ 15          │
  │ CONTEXT_FULL_FIELD                  │ —       │ narrative   │
  │ FOLDER_CLAUDEMD_ENABLED             │ false   │ false       │
  │ CONTEXT_SHOW_LAST_SUMMARY           │ true    │ true        │
  │ CONTEXT_SHOW_LAST_MESSAGE           │ true    │ false       │
  │ CONTEXT_SHOW_READ/WORK/SAVINGS      │ —       │ true        │
  │ CONTEXT_SHOW_TERMINAL_OUTPUT        │ —       │ true        │
  │ MAX_CONCURRENT_AGENTS               │ 4       │ 8           │
  └─────────────────────────────────────┴─────────┴─────────────┘

  Why: fhhs-skills relies heavily on claude-mem for cross-session
  continuity. /fh:auto runs many parallel agents that all generate
  observations — high limits ensure nothing is lost. "narrative"
  mode gives richer context than "facts" for complex multi-phase
  work. Token stats visible so users can monitor context budget.

  Adjust further via dashboard at localhost:37777 or
  edit ~/.claude-mem/settings.json directly.
```

---

## Step 6b: Disable Native Claude Memory

claude-mem handles cross-session context more efficiently than the built-in memory system. Disable native memory to avoid token waste from duplicate memory injection.

Add to the project's `.claude/settings.json`:
```json
{
  "memory": { "enabled": false }
}
```

Display:
```
✓ Native memory disabled — claude-mem handles cross-session context
```

---

## Step 7: shadcn Skills

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FHHS ► SHADCN SKILLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

[shadcn/skills](https://ui.shadcn.com/docs/skills) gives coding agents the context they need to work with shadcn/ui components, Radix and Base UI primitives, the shadcn CLI, and registry workflows. Agents make fewer mistakes and produce code that matches your design system.

### 7a: Check if shadcn skills are already installed

shadcn skills are installed **globally** so they don't pollute individual project directories. The `skills` CLI installs to `~/.agents/skills/` by default with `-g`.

```bash
if [ -d "$HOME/.agents/skills/shadcn" ] || [ -d "$HOME/.skills/shadcn" ]; then
  echo "INSTALLED"
else
  echo "NOT_INSTALLED"
fi
```

If `INSTALLED`:

```
✓ shadcn skills already installed
```

Skip to Step 8.

### 7b: Install shadcn skills globally

```
◆ Installing shadcn/ui skills globally...
```

**Important:** Use `-g` (global), `-y` (skip prompts), and `--all` (all skills + agents) to avoid interactive mode:

```bash
npx -y skills add -g -y --all shadcn/ui 2>&1 | tail -5
```

On success:

```
✓ shadcn skills installed globally (~/.agents/skills/shadcn)
  → Agents now have context for shadcn/ui components, CLI, and registry
  → Available to all projects — no per-project install needed
```

If the install fails (e.g. network issue, npx not available), show a warning but don't block setup:

```
⚠ Could not install shadcn skills automatically.
  You can install them manually later:

    npx -y skills add -g -y --all shadcn/ui
```

---

## Step 8: Fallow (Static Analysis)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FHHS ► FALLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

[Fallow](https://docs.fallow.tools/) provides deterministic static analysis — dead-code detection, circular dependency analysis, code duplication, and complexity metrics. Used by `/fh:review` and `/fh:map-codebase` to inject ground truth findings into agents.

### Check and install

```bash
command -v fallow >/dev/null 2>&1 && echo "INSTALLED $(fallow --version 2>/dev/null)" || echo "NOT_INSTALLED"
```

If `INSTALLED`:

```
✓ Fallow installed
```

If `NOT_INSTALLED`:

Detect the project's package manager to install with the right tool:

```bash
if [ -f pnpm-lock.yaml ]; then
  PKG_MGR="pnpm"
elif [ -f yarn.lock ]; then
  PKG_MGR="yarn"
else
  PKG_MGR="npm"
fi
echo "PKG_MGR=$PKG_MGR"
```

```
◆ Installing Fallow via $PKG_MGR...
```

```bash
$PKG_MGR install -g fallow
```

Verify:

```bash
fallow --version && echo "✓ Fallow ready"
```

If the install fails, show a warning but don't block setup:

```
⚠ Could not install Fallow automatically.
  You can install it manually later:

    pnpm install -g fallow   # or: npm install -g fallow

  Without Fallow, /fh:review and /fh:map-codebase still work but use
  LLM-only analysis instead of deterministic static analysis.
```

---

## Step 9: Conductor Configuration

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FHHS ► CONDUCTOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```


[Conductor](https://conductor.build) lets you run multiple Claude Code agents in parallel workspaces. Each workspace gets a copy of your git files plus isolated setup/run scripts. This step checks whether Conductor is installed and reminds the user to configure it per-project.

### 9a: Detect Conductor

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

Skip to Step 11.

### 9b: Conductor awareness

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

  Native task tracking is disabled (CLAUDE_CODE_ENABLE_TASKS="0").
  Progress is tracked via claude-mem timeline instead.
  /fh:new-project configures this automatically.

  If you have an existing project, create conductor.json manually:

    {
      "scripts": {
        "setup": "npm install && ln -sf \"$CONDUCTOR_ROOT_PATH/.env.local\" .env.local 2>/dev/null; true; ln -sf \"$CONDUCTOR_ROOT_PATH/.vercel\" .vercel 2>/dev/null; true",
        "run": "npm run dev -- --port $CONDUCTOR_PORT"
      },
    }
```

---

## Step 10: Summary

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
| claude-mem                 | ✓ installed / ○ skipped (optional)       |
| Native memory              | ✓ disabled / ⚠ still enabled             |
| Fallow                     | ✓ installed / ⚠ manual install needed    |
| shadcn skills              | ✓ installed / ⚠ manual install needed    |
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
