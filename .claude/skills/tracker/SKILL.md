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

The tracker is installed globally at `~/.claude/tracker/` — shared across all projects.

1. Find the fhhs-skills plugin directory by globbing for `**/templates/project-tracker/server.cjs` under `~/.claude/plugins/`.
2. Read the plugin version from `.claude-plugin/plugin.json` in the plugin directory.
3. Check if `~/.claude/tracker/.version` exists and read it.
4. **If `~/.claude/tracker/.version` exists and its content matches the plugin version**, skip to Step 3 — files are already up to date.
5. **Otherwise**, refresh the template files:
   a. List all non-directory files in `templates/project-tracker/` in the plugin directory.
   b. Copy all listed files into `~/.claude/tracker/`, overwriting any existing versions.
   c. Write the plugin version string into `~/.claude/tracker/.version`.

---

## Step 3: Check `.planning/` in current project

```bash
[ -d ".planning" ] && echo "OK" || echo "MISSING"
```

If `.planning/` is MISSING, note it but **do not stop** — other registered projects may have `.planning/` and the dashboard can still show those:

```
Note: This project has no .planning/ directory. Run /fh:new-project to enable tracking for it.
The dashboard will still show other registered projects.
```

---

## Step 4: Start the server

First, kill any stale tracker process that may be occupying the port:

```bash
lsof -ti :4111 -s TCP:LISTEN | xargs kill 2>/dev/null; echo "port cleared"
```

Then start the tracker server in the background using the **full absolute path** to the global install:

```bash
TRACKER_REGISTRY=~/.claude/tracker/projects.json node ~/.claude/tracker/server.cjs
```

Run this with `run_in_background: true`.

**IMPORTANT:** Always use the full path `~/.claude/tracker/server.cjs` — never `node server.cjs` from a repo directory. The server resolves `index.html` relative to `__dirname`, so running from the wrong directory causes "index.html not found" errors.

---

## Step 5: Report

Tell the user:

```
Live dashboard at http://localhost:4111 — showing N projects

The dashboard auto-refreshes every 2 seconds and shows:
- Project overview from PROJECT.md
- Phase and plan progress from ROADMAP.md and STATE.md
- All registered projects from ~/.claude/tracker/projects.json

Leave this terminal open to keep the server running.
```

Replace **N** with the actual count from the global registry (Step 1).
