---
name: tracker
description: "Launch the project tracker dashboard. Use when the user says 'tracker', 'dashboard', 'show progress', or wants to see a visual project overview."
user-invokable: true
---

Launch the visual project tracker dashboard.

$ARGUMENTS

---

## Step 1: Check for `.project-tracker/`

Check if `.project-tracker/` exists in the current working directory:

```bash
[ -d ".project-tracker" ] && echo "EXISTS" || echo "MISSING"
```

**If MISSING**, scaffold it:

1. Find the fhhs-skills plugin directory by globbing for `**/templates/project-tracker/server.cjs` under the user's home directory `~/.claude/plugins/`.
2. Read all 4 template files from `templates/project-tracker/` in the plugin directory:
   - `server.cjs`
   - `parser.cjs`
   - `index.html`
   - `README.md`
3. Create `.project-tracker/` and write the 4 files into it.
4. Check if `.gitignore` exists and contains `.project-tracker/`:
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
