---
description: "Install all dependencies required by fhhs-skills. Run once after installing this plugin. Use when the user says 'setup', 'install dependencies', 'set up fhhs', or gets a missing dependency error from any composite command."
---

Install all dependencies for fhhs-skills composite commands.

$ARGUMENTS

---

## Step 1: Check Current State

Detect which dependencies are already installed:

```bash
# Check Superpowers
SUPERPOWERS_INSTALLED=false
if ls ~/.claude/plugins/cache/superpowers-extended-cc* 2>/dev/null | head -1 > /dev/null; then
  SUPERPOWERS_INSTALLED=true
fi

# Check Impeccable
IMPECCABLE_INSTALLED=false
if ls ~/.claude/plugins/cache/impeccable* 2>/dev/null | head -1 > /dev/null; then
  IMPECCABLE_INSTALLED=true
fi

# Check GSD (project-level, optional at this stage)
GSD_INSTALLED=false
if [ -d ".claude/get-shit-done" ]; then
  GSD_INSTALLED=true
fi
```

Report status:

```
Dependency Status:
- Superpowers: [installed | missing]
- Impeccable:  [installed | missing]
- GSD:         [installed | not yet — installed per-project via /new-project]
```

---

## Step 2: Install Missing Plugins

For each missing plugin, tell the user to run the install command. These are Claude Code slash commands — they must be typed by the user in the CLI, not executed via bash.

**Superpowers** (if missing):
Tell the user: "Please type this command and press enter:"
```
/install-plugin superpowers-extended-cc from pcvelz/superpowers
```

**Impeccable** (if missing):
Tell the user: "Please type this command and press enter:"
```
/install-plugin impeccable from pbakaus/impeccable
```

Wait for the user to confirm each install succeeded before proceeding to the next.

---

## Step 3: GSD Note

GSD is not a global plugin — it's installed per-project. Explain to the user:

"GSD (Get Shit Done) is installed per-project, not globally. When you run `/new-project`, it will set up GSD tracking for that project. If you want to set up GSD manually, see: https://github.com/gsd-build/get-shit-done"

---

## Step 4: Verify

After installs complete, re-check that the skills are available:

1. Confirm `superpowers-extended-cc:verification-before-completion` is in the available skills list
2. Confirm `impeccable:critique` is in the available skills list

Report final status:

```
Setup complete:
- Superpowers: installed (v{version})
- Impeccable:  installed (v{version})
- GSD:         ready (installs per-project via /new-project)

You're all set. Start with /new-project to bootstrap a project, or /skills-guide for an overview.
```

If any install failed, report the error and suggest the user check their network connection or try the install command manually.
