---
description: "Check for updates and install the latest version. Use when the user says 'update', 'upgrade', 'check for updates', or 'get latest version'."
---

Update the fhhs-skills plugin to the latest version.

$ARGUMENTS

---

## Step 1: Get Installed Version

Read the installed plugin version from the cache:

```bash
# Check cache for installed version
CACHE_PLUGIN=$(find "$HOME/.claude/plugins/cache/fhhs-skills" -name "plugin.json" -path "*/.claude-plugin/*" 2>/dev/null | head -1)
if [ -n "$CACHE_PLUGIN" ]; then
  cat "$CACHE_PLUGIN"
else
  echo "NOT_FOUND"
fi
```

Parse the `version` field. If NOT_FOUND, the plugin isn't installed yet — tell the user:

```
fhhs-skills is not installed. Install with:

  /plugin install fh@fhhs-skills
```

Exit.

---

## Step 2: Check Latest Version

Fetch the latest plugin.json and CHANGELOG.md from GitHub:

```bash
# Get latest version
curl -sL "https://raw.githubusercontent.com/cinjoff/fhhs-skills/main/.claude-plugin/plugin.json" 2>/dev/null

# Get changelog
curl -sL "https://raw.githubusercontent.com/cinjoff/fhhs-skills/main/CHANGELOG.md" 2>/dev/null
```

Parse the `version` field from the fetched plugin.json.

**If fetch fails:**
```
Couldn't check for updates (offline or GitHub unavailable).
```
Exit.

**If installed == latest:**
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

```bash
claude plugin update fh@fhhs-skills
```

**After update:**

```
## Updated

**fhhs-skills** X.Y.Z → A.B.C

Restart Claude Code to use the new version.
```
