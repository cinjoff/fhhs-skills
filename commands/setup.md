---
description: "Welcome to fhhs-skills. Run once after installing this plugin for an overview. Use when the user says 'setup', 'get started', or 'what is this plugin'."
---

Welcome to fhhs-skills.

$ARGUMENTS

---

## Step 1: Welcome

fhhs-skills provides a unified workflow for software development:

- **Composite commands** — `/plan`, `/build`, `/fix`, `/refactor`, `/simplify`, `/verify`, `/resume`, `/research`, `/verify-ui`
- **Engineering discipline** — TDD, two-stage code review, simplify pass, evidence-based verification, fresh subagents, YAGNI
- **Design quality** — `/critique`, `/polish`, `/normalize`, `/harden`, `/animate` for frontend work
- **Code intelligence** — TypeScript LSP integration for precise navigation, call graphs, and type analysis
- **Project tracking** — GSD state management with phases, milestones, roadmaps

Everything is built into this plugin — including GSD project tracking and TypeScript LSP integration.

---

## Step 2: Detect Platform and Check Prerequisites

First, detect the platform and check what's already installed.

```bash
# Detect platform
case "$(uname -s 2>/dev/null)" in
  Darwin*) PLATFORM="macos" ;;
  Linux*)  PLATFORM="linux" ;;
  MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
  *) PLATFORM="unknown" ;;
esac
echo "PLATFORM: $PLATFORM"
```

```bash
# Check all required and recommended tools
echo "=== Dependency Check ==="
for cmd in brew node npm gh vercel typescript-language-server git; do
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "OK: $cmd ($(command -v "$cmd"))"
  else
    echo "MISSING: $cmd"
  fi
done
```

Collect the MISSING items. If everything is `OK`, skip to Step 3.

### If MISSING dependencies exist

**macOS / Linux — use Homebrew:**

If `brew` is MISSING:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After Homebrew installs, it prints shell config instructions. Run what it says (typically adding brew to PATH). Then verify:

```bash
brew --version
```

Once `brew` is available, install any MISSING tools:

```bash
# Install only what's missing — skip any that are already OK
brew install node       # provides node + npm
brew install gh         # GitHub CLI
brew install vercel-cli # Vercel CLI (or: npm i -g vercel)
```

**Windows:**

If the platform is `windows`, do NOT run the Homebrew steps above. Instead, present this guidance:

```
Windows detected. Install these tools using their official installers:

1. Node.js (provides node + npm):
   https://nodejs.org — download the LTS installer

2. GitHub CLI (gh):
   winget install GitHub.cli
   — or download from https://cli.github.com

3. Vercel CLI:
   npm install -g vercel
   — (after Node.js is installed)

4. Git (if missing):
   winget install Git.Git
   — or download from https://git-scm.com

After installing, restart your terminal and run /setup again.
```

Stop here on Windows if Node.js is missing — everything else depends on it.

**After installing missing tools**, re-run the dependency check to confirm:

```bash
echo "=== Verify ==="
for cmd in node npm gh vercel git; do
  command -v "$cmd" >/dev/null 2>&1 && echo "OK: $cmd" || echo "STILL MISSING: $cmd"
done
```

`node` and `npm` are required (GSD CLI and TypeScript LSP need them). `gh` and `vercel` are recommended but not blocking — the plugin works without them, and they can be installed later.

If `node` is still missing, stop and tell the user to fix that first.

---

## Step 3: TypeScript LSP Setup

The TypeScript LSP provides precise code navigation (`goToDefinition`, `findReferences`, call hierarchy, hover types) used by codebase mapping, debugging, refactoring, and build subagents.

### 3a: Install the language server binary

```bash
# Check if already installed
command -v typescript-language-server >/dev/null 2>&1 && echo "INSTALLED: $(typescript-language-server --version)" || echo "NOT_INSTALLED"
```

If `NOT_INSTALLED`:

```bash
npm install -g typescript-language-server typescript
```

Verify:

```bash
typescript-language-server --version
```

### 3b: Install the Claude Code LSP plugin

```bash
# Check if the typescript-lsp plugin is already installed
python3 -c "
import json, pathlib
data = json.loads(pathlib.Path(pathlib.Path.home() / '.claude/plugins/installed_plugins.json').read_text())
if 'typescript-lsp@claude-plugins-official' in data.get('plugins', {}):
    print('INSTALLED')
else:
    print('NOT_INSTALLED')
" 2>/dev/null || echo "NOT_INSTALLED"
```

If `NOT_INSTALLED`:

```bash
claude plugin install typescript-lsp@claude-plugins-official
```

If the `claude` CLI command is not available (running inside Claude Code rather than from terminal), tell the user:

```
/plugin install typescript-lsp@claude-plugins-official
```

---

## Step 4: GSD Binary Setup

The GSD CLI (`gsd-tools.cjs`) is bundled with this plugin. Set up the symlink so all commands can find it.

```bash
# Check if symlink already exists and works
if [ -f "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" ]; then
  echo "ALREADY_CONFIGURED: $(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" --version 2>/dev/null || echo 'symlink exists but broken')"
else
  echo "NOT_CONFIGURED"
fi
```

If `NOT_CONFIGURED` or broken:

```bash
# Find the plugin's bin directory — check installed plugin cache first, then dev checkout
PLUGIN_BIN="$(find ~/.claude/plugins/cache -path '*/fhhs-skills/*/bin/gsd-tools.cjs' -exec dirname {} \; 2>/dev/null | head -1)"

# Fallback: dev checkout (current directory or parent)
if [ -z "$PLUGIN_BIN" ]; then
  PLUGIN_BIN="$(find "$(pwd)" -maxdepth 3 -name 'gsd-tools.cjs' -path '*/bin/*' -exec dirname {} \; 2>/dev/null | head -1)"
fi

if [ -n "$PLUGIN_BIN" ]; then
  mkdir -p "$HOME/.claude/get-shit-done"
  ln -sfn "$PLUGIN_BIN" "$HOME/.claude/get-shit-done/bin"
  echo "GSD binary linked: $HOME/.claude/get-shit-done/bin -> $PLUGIN_BIN"
  # Verify
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" --version 2>/dev/null && echo "GSD CLI ready" || echo "WARNING: symlink created but gsd-tools.cjs failed to run"
else
  echo "ERROR: Could not find gsd-tools.cjs. Is fhhs-skills installed?"
fi
```

---

## Step 5: Summary and Next Steps

Present a final status report:

```
=== fhhs-skills Setup Complete ===

Platform:          {macos/linux/windows}
Node.js:           {version or MISSING}
npm:               {version or MISSING}
GitHub CLI (gh):   {version or MISSING — optional}
Vercel CLI:        {version or MISSING — optional}
TypeScript LSP:    {version or NOT INSTALLED}
LSP Plugin:        {INSTALLED or NOT INSTALLED}
GSD CLI:           {version or NOT CONFIGURED}
```

Then:

- Run `/new-project` to bootstrap a new tracked project with design framework and GSD structure
- Run `/help` for a full overview of all commands and how they work together
- Run `/resume` if you have an existing project with a `.planning/` directory
