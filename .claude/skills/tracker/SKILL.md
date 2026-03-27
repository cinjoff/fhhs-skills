---
name: fh:tracker
description: Visual dashboard of your project's progress — phases, milestones, and status.
user-invocable: true
disable-model-invocation: true
---

Launch the visual project tracker dashboard.

$ARGUMENTS

---

## Step 1: Register project in global registry

1. Ensure `~/.claude/tracker/` directory exists:
   ```bash
   mkdir -p ~/.claude/tracker
   ```
2. Read `~/.claude/tracker/projects.json` if it exists; otherwise treat it as an empty array `[]`.
3. Get the current working directory (CWD) — this is the project path.
4. Derive `projectName` from the last path segment of CWD.
5. Check if CWD matches the Conductor workspace pattern `~/conductor/workspaces/{repo}/{worktree}`:
   - If it matches, set `conductorWorkspace: true` (and optionally record the `repo` and `worktree` segments).
   - Otherwise omit the `conductorWorkspace` field.
6. Upsert an entry in the registry array:
   - If an entry with the same `path` already exists, update its `name` and set `lastSeen` to now (ISO string).
   - If no matching entry exists, append `{ path: CWD, name: projectName, addedAt: now }` (plus `conductorWorkspace: true` if applicable).
7. Write the updated array back to `~/.claude/tracker/projects.json` (pretty-printed JSON).
8. Note the total project count from the registry (call it **N**) for use in later steps.

---

## Step 2: Ensure tracker files are up to date

1. Find the fhhs-skills plugin directory by globbing for `**/templates/project-tracker/server.cjs` under the user's home directory `~/.claude/plugins/`.
2. Read the plugin version from `.claude-plugin/plugin.json` in the plugin directory (the `version` field).
3. Check if `.project-tracker/.version` exists and read it.
4. **If `.project-tracker/.version` exists and its content matches the plugin version**, skip to Step 3 — files are already up to date.
5. **Otherwise**, refresh the template files:
   a. Read all 6 template files from `templates/project-tracker/` in the plugin directory:
      - `server.cjs`
      - `parser.cjs`
      - `index.html`
      - `README.md`
      - `ProjectCard.jsx`
      - `DailyMetrics.jsx`
   b. Create `.project-tracker/` if it doesn't exist.
   c. Write all 6 files into `.project-tracker/`, overwriting any existing versions.
   d. Write the plugin version string into `.project-tracker/.version`.
   e. Check if `.gitignore` exists and contains `.project-tracker/`:
      - If `.gitignore` doesn't exist, create it with `.project-tracker/` as its content.
      - If `.gitignore` exists but doesn't contain `.project-tracker/`, append `.project-tracker/` on a new line.
      - If `.gitignore` already contains `.project-tracker/`, do nothing.

---

## Step 3: Verify `.planning/` exists

```bash
[ -d ".planning" ] && echo "OK" || echo "MISSING"
```

If `.planning/` is MISSING, tell the user:

```
No .planning/ directory found. Run /fh:new-project first to set up project tracking.
```

Stop here — the tracker needs `.planning/` files to display progress.

---

## Step 4: Start the server

Start the tracker server in the background, passing the global registry path so it can load all projects:

```bash
TRACKER_REGISTRY=~/.claude/tracker/projects.json node .project-tracker/server.cjs
```

Run this with `run_in_background: true`.

The server loads the global registry at startup so the dashboard can display all registered projects.

---

## Step 5: Report

Tell the user:

```
Live dashboard at http://localhost:3847 — showing N projects

The dashboard auto-refreshes every 2 seconds and shows:
- Project overview from PROJECT.md
- Phase and plan progress from ROADMAP.md and STATE.md
- All registered projects from ~/.claude/tracker/projects.json

Leave this terminal open to keep the server running.
```

Replace **N** with the actual count from the global registry (Step 1).
