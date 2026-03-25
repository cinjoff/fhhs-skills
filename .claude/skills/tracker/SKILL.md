---
name: fh:tracker
description: Visual dashboard of your project's progress — phases, milestones, and status.
user-invokable: true
---

Launch the visual project tracker dashboard.

$ARGUMENTS

---

## Step 1: Ensure tracker files are up to date

1. Find the fhhs-skills plugin directory by globbing for `**/templates/project-tracker/server.cjs` under the user's home directory `~/.claude/plugins/`.
2. Read the plugin version from `.claude-plugin/plugin.json` in the plugin directory (the `version` field).
3. Check if `.project-tracker/.version` exists and read it.
4. **If `.project-tracker/.version` exists and its content matches the plugin version**, skip to Step 2 — files are already up to date.
5. **Otherwise**, refresh the template files:
   a. Read all 4 template files from `templates/project-tracker/` in the plugin directory:
      - `server.cjs`
      - `parser.cjs`
      - `index.html`
      - `README.md`
   b. Create `.project-tracker/` if it doesn't exist.
   c. Write all 4 files into `.project-tracker/`, overwriting any existing versions.
   d. Write the plugin version string into `.project-tracker/.version`.
   e. Check if `.gitignore` exists and contains `.project-tracker/`:
      - If `.gitignore` doesn't exist, create it with `.project-tracker/` as its content.
      - If `.gitignore` exists but doesn't contain `.project-tracker/`, append `.project-tracker/` on a new line.
      - If `.gitignore` already contains `.project-tracker/`, do nothing.

---

## Step 2: Verify `.planning/` exists

```bash
[ -d ".planning" ] && echo "OK" || echo "MISSING"
```

If `.planning/` is MISSING, tell the user:

```
No .planning/ directory found. Run /fh:new-project first to set up project tracking.
```

Stop here — the tracker needs `.planning/` files to display progress.

---

## Step 3: Start the server

Start the tracker server in the background:

```bash
node .project-tracker/server.cjs
```

Run this with `run_in_background: true`.

---

## Step 4: Report

Tell the user:

```
Project tracker is running at http://localhost:3847

The dashboard auto-refreshes every 2 seconds and shows:
- Project overview from PROJECT.md
- Phase and plan progress from ROADMAP.md and STATE.md

Leave this terminal open to keep the server running.
```
