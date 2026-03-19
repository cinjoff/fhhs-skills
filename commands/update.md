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

Extract changelog entries between the installed and latest versions. Show them in a human-friendly format:

```
## fhhs-skills Update Available

**Installed:** 1.0.0
**Latest:** 1.1.0

### What's New

**1.1.0**
- Code explorer and architect agents for deeper codebase understanding
- Confidence scoring in code review — fewer false positives
- Deep exploration mode in brainstorming for complex features
- Routing fixes — composites recommended instead of raw GSD commands

[... any intermediate versions ...]
```

**Formatting rules:**
- Summarize each version in 3-5 bullet points max
- Use plain language, not commit messages
- Group Added/Changed/Fixed into a single list per version
- Skip internal/technical details users don't care about

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

Restart Claude Code to use the new version.
```
