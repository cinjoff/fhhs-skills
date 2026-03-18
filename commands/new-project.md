---
description: "Bootstrap a new tracked project with design framework, conventions, and GSD roadmap. Use when the user says 'new project', 'start a project', 'bootstrap', 'set up a new app', or 'initialize'. Creates .planning/ structure and CLAUDE.md."
---

Bootstrap a new project with opinionated defaults, design framework, and full GSD tracking.

$ARGUMENTS

You are a **lean orchestrator**. Guide the user through setup, delegate heavy work to framework skills.

> **Dependency check:** All tools are built into this plugin — engineering disciplines, design quality commands, GSD CLI (`gsd-tools.cjs`), and TypeScript LSP. GSD will be initialized per-project in Step 5.

---

## Step 1: Project Vision

Delegate to the GSD new-project questioning flow. Ask the user one question at a time:

1. **What** is this project? (one sentence)
2. **Who** is it for? (target users)
3. **Why** does it need to exist? (problem it solves)
4. **Scope:** What's in v1? What's explicitly out?
5. **Constraints:** Timeline, team size, budget, technical constraints?
6. **Success criteria:** How do you know it worked?

Save answers — they feed into PROJECT.md in Step 5.

---

## Step 2: Tech Stack Confirmation

Present the default stack:

> **Default stack:** Next.js + TypeScript + Tailwind CSS + Shadcn/ui + GitHub + Vercel
>
> These are defaults — override any of them.

Ask: **"Need user authentication or a database?"**
- Yes → add Supabase to the stack
- No → skip

Ask: **"Any changes to the default stack?"**

Lock the final tech stack decisions. These go into PROJECT.md.

---

## Step 3: Design Framework

Invoke `/fh:teach-impeccable`.

This runs the one-time design context setup:
- Aesthetic direction (tone, style, differentiation)
- Design tokens and constraints
- Typography and color decisions
- Component patterns

Output: `.planning/DESIGN.md` — referenced by all future `/fh:build` and `/fh:verify-ui` runs.

If the user wants to skip this step and set up design later, allow it. They can always run `/fh:teach-impeccable` manually.

---

## Step 4: CLAUDE.md Generation

Invoke `/fh:revise-claude-md init` — this uses the `skills/claude-md-improver/references/templates.md` fhhs-skills project template to generate a high-quality CLAUDE.md from the context gathered in Steps 1-3.

Pass it:
- Project name and description (from Step 1)
- Tech stack (from Step 2)
- Whether `.planning/DESIGN.md` was created (from Step 3)

The template ensures CLAUDE.md includes: tech stack, commands adapted to the chosen framework, architecture, code style with conventional commits, testing conventions, planning state reference, and design system reference.

Keep it under 40 lines. Commit: `docs: initialize CLAUDE.md with project conventions`

---

## Step 5: Requirements + Roadmap

Derive requirements from the vision in Step 1. Create:

- `.planning/PROJECT.md` — Vision, scope, constraints, tech stack, success criteria
- `.planning/REQUIREMENTS.md` — Scoped work items (REQ-01, REQ-02, ...)
- `.planning/ROADMAP.md` — Phased plan with goals per phase
- `.planning/STATE.md` — Current position (phase 1, plan 0)
- `.planning/config.json` — GSD workflow settings

**Phase 1 must always be "Project scaffolding and core setup"** — this is where the actual Next.js project gets created, dependencies installed, and base configuration applied.

**Set up project-local GSD symlink and initialize:**
```bash
# Create project-local symlink to bundled GSD binary
mkdir -p .claude/get-shit-done
ln -sfn "$HOME/.claude/get-shit-done/bin" .claude/get-shit-done/bin

# Initialize project
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs init new-project
```

If the global symlink is missing (user hasn't run `/fh:setup`), create it first — see `/fh:setup` Step 3.

Commit: `docs: initialize project planning with GSD structure`

**Project Tracker:** Scaffold `.project-tracker/` for the visual dashboard.

1. Find the fhhs-skills plugin directory by globbing for `**/templates/project-tracker/server.cjs` under `~/.claude/plugins/`.
2. Read all 4 template files from `templates/project-tracker/` in the plugin directory (`server.cjs`, `parser.cjs`, `index.html`, `README.md`).
3. Create `.project-tracker/` in the project root and write the 4 files into it.
4. Add `.project-tracker/` to `.gitignore` (create the file if it doesn't exist, or append if the entry is missing).

Mention the tracker in the Step 7 handoff output — the user can run `/fh:tracker` to launch the dashboard.

---

## Step 6: Infrastructure Setup

Set up GitHub and Vercel so the project is ready for deployment from day one.

### 6a: Initialize git and commit planning files

```bash
git rev-parse --is-inside-work-tree 2>/dev/null && echo "GIT_OK" || echo "GIT_MISSING"
```

If not a git repo, initialize it:

```bash
git init
```

Stage and commit all planning files created so far:

```bash
git add -A
git commit -m "chore: initialize project with planning structure"
```

If files are already committed (git was pre-existing), skip the commit.

### 6b: Create GitHub repository

Check `gh` availability:

```bash
command -v gh >/dev/null 2>&1 && echo "OK" || echo "MISSING"
```

If `gh` is MISSING: show a warning and skip to 6c. The user can run `brew install gh && gh auth login` to enable this later.

Check if a remote already exists:

```bash
git remote get-url origin 2>/dev/null && echo "REMOTE_EXISTS" || echo "NO_REMOTE"
```

If no remote exists, create the GitHub repo using the current folder name:

```bash
REPO_NAME="$(basename "$(pwd)")"
gh repo create "$REPO_NAME" --private --source=. --push
```

This creates a private repo, sets `origin`, and pushes the initial commit. Report the repo URL from the output.

If a remote already exists, skip creation but show the existing remote URL.

### 6c: Create and link Vercel project

Check `vercel` availability:

```bash
command -v vercel >/dev/null 2>&1 && echo "OK" || echo "MISSING"
```

If `vercel` is MISSING, install it:

```bash
npm install -g vercel
```

If install fails, show a warning and skip to Step 7.

Check if the user is logged in to Vercel:

```bash
vercel whoami 2>/dev/null && echo "LOGGED_IN" || echo "NOT_LOGGED_IN"
```

If `NOT_LOGGED_IN`, run `vercel login` and follow the prompts.

**Create a `vercel.json` with the framework preset BEFORE linking.** This ensures Vercel creates the project with the correct build settings regardless of whether the Next.js scaffold exists yet:

```bash
cat > vercel.json << 'EOF'
{
  "framework": "nextjs"
}
EOF
```

> Adapt the `"framework"` value if the user chose a different stack in Step 2 (e.g. `"vite"`, `"remix"`, `null` for static).

Now link the project to Vercel:

```bash
vercel link --yes --project "$(basename "$(pwd)")"
```

This writes `.vercel/project.json` with the project and org IDs, and Vercel will know to use the Next.js build preset.

### 6d: Connect GitHub to Vercel for auto-deployments

The Vercel GitHub App must be installed on the user's GitHub account/org for auto-deployments to work. The CLI cannot do this — it requires a one-time browser action.

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: One-time Vercel + GitHub setup                  ║
╚══════════════════════════════════════════════════════════════╝

For automatic deployments on push, the Vercel GitHub App needs
to be installed on your GitHub account (one-time, covers all
future repos):

  1. Go to: https://vercel.com/integrations/github
  2. Click "Add" and authorize for your GitHub account/org
  3. Grant access to your repositories (all or selected)

Already done? Skip this step.
──────────────────────────────────────────────────────────────
→ Type "done" when ready, or "skip" to set this up later
──────────────────────────────────────────────────────────────
```

Once the GitHub App is installed, connect the repo:

```bash
vercel git connect
```

If this succeeds, every push to `main` will trigger a Vercel deployment automatically.

If `vercel git connect` fails (e.g. the GitHub App isn't installed yet), tell the user they can connect later from the Vercel dashboard: Settings → Git → Connect Git Repository.

---

## Step 7: Conductor Configuration

Check if Conductor is installed:

```bash
[ -d "/Applications/Conductor.app" ] && echo "INSTALLED" || echo "NOT_INSTALLED"
```

If `NOT_INSTALLED`, skip to Step 8.

If installed, create `conductor.json` in the project root with scripts tailored to the tech stack chosen in Step 2.

**For Next.js (default stack):**

```json
{
  "scripts": {
    "setup": "npm install && [ -f \"$CONDUCTOR_ROOT_PATH/.env.local\" ] && cp \"$CONDUCTOR_ROOT_PATH/.env.local\" .env.local || true; node -e \"var fs=require('fs'),f='.claude/settings.json',s={};try{s=JSON.parse(fs.readFileSync(f,'utf8'))}catch{}s.env=Object.assign(s.env||{},{CLAUDE_CODE_TASK_LIST_ID:process.env.CONDUCTOR_WORKSPACE_NAME||'default'});fs.writeFileSync(f,JSON.stringify(s,null,2)+'\\n')\"",
    "run": "npm run dev -- --port $CONDUCTOR_PORT",
    "archive": "rm -rf \"$HOME/.claude/tasks/${CONDUCTOR_WORKSPACE_NAME}\" 2>/dev/null; true"
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TASKS": "true"
  }
}
```

> **Why `CLAUDE_CODE_TASK_LIST_ID` in the setup script?** Conductor's `env` block does not interpolate shell variables like `${CONDUCTOR_WORKSPACE_NAME}` — it passes them as literal strings. The setup script runs in a shell where `$CONDUCTOR_WORKSPACE_NAME` resolves correctly, and writes the value into `.claude/settings.json` so Claude Code picks it up. Each workspace gets its own task list so parallel workspaces don't pollute each other's tracking.
>
> **Why `CLAUDE_CODE_ENABLE_TASKS` in env?** This is a static value (no interpolation needed), so the `env` block works fine. It enables native task tracking used by `/fh:plan-work` and `/fh:build`.
>
> **Why `archive` cleans up?** Task lists persist at `~/.claude/tasks/{ID}/`. Without cleanup, old workspace task lists accumulate indefinitely. The archive script removes the directory when the workspace is torn down.

> **Why `cp` instead of `ln -s`?** Conductor workspaces are git worktrees. Symlinks into `$CONDUCTOR_ROOT_PATH` can break when the root's working tree changes. Copying is safer — the setup script runs each time a workspace starts, so the copy stays fresh.

**For other common stacks** — adapt the scripts:

| Stack | Setup script | Run script |
|-------|-------------|------------|
| Next.js | `npm install && cp "$CONDUCTOR_ROOT_PATH/.env.local" .env.local 2>/dev/null; true` | `npm run dev -- --port $CONDUCTOR_PORT` |
| Rails | `bundle install && cp "$CONDUCTOR_ROOT_PATH/.env" .env 2>/dev/null; true` | `bin/rails server -p $CONDUCTOR_PORT` |
| Django | `pip install -r requirements.txt && cp "$CONDUCTOR_ROOT_PATH/.env" .env 2>/dev/null; true` | `python manage.py runserver $CONDUCTOR_PORT` |
| Phoenix | `mix deps.get && cp "$CONDUCTOR_ROOT_PATH/.env" .env 2>/dev/null; true` | `mix phx.server` (uses `PORT=$CONDUCTOR_PORT`) |
| Vite | `npm install && cp "$CONDUCTOR_ROOT_PATH/.env" .env 2>/dev/null; true` | `npm run dev -- --port $CONDUCTOR_PORT` |

The setup script should:
1. Install dependencies (`npm install` handles per-worktree `node_modules` correctly)
2. Copy `.env` (or `.env.local`) from `$CONDUCTOR_ROOT_PATH` if it exists

The run script should:
1. Start the dev server using `$CONDUCTOR_PORT` for port assignment (each Conductor workspace gets a unique port range of 10)

After creating `conductor.json`, tell the user:

```
✓ conductor.json created — Conductor workspaces will auto-configure

  Conductor environment variables available in scripts:
  • $CONDUCTOR_ROOT_PATH      — repo root (shared across workspaces)
  • $CONDUCTOR_WORKSPACE_PATH — this workspace's directory
  • $CONDUCTOR_PORT           — unique port for this workspace
  • $CONDUCTOR_WORKSPACE_NAME — workspace name

  Place shared files (like .env) in the repo root directory.
  Each workspace will symlink them via the setup script.
```

Commit: `chore: add conductor.json for workspace configuration`

---

## Step 8: Handoff

Report to the user:

```
Project initialized:
- .planning/PROJECT.md      — vision and scope
- .planning/DESIGN.md       — design framework (if set up)
- .planning/REQUIREMENTS.md — work items
- .planning/ROADMAP.md      — phased plan
- .planning/STATE.md        — tracking state
- .planning/config.json     — workflow settings
- CLAUDE.md                 — project conventions
- .project-tracker/         — visual dashboard (run /fh:tracker to launch)
- conductor.json            — Conductor workspace scripts (if Conductor detected)
- GitHub repo               — <repo-url> (private)
- vercel.json               — framework preset configured
- Vercel project            — linked (auto-deploys on push to main, if GitHub App installed)

Next: run /plan-work to plan your first phase (scaffolding and core setup).
```
