---
name: fh:new-project
description: Bootstrap a new tracked project with design framework, conventions, and GSD roadmap. Use when the user says 'new project', 'start a project', 'bootstrap', 'set up a new app', or 'initialize'. Creates .planning/ structure and CLAUDE.md.
user-invokable: true
---

Bootstrap a new project with opinionated defaults, design framework, and full GSD tracking.

$ARGUMENTS

You are a **lean orchestrator**. Guide the user through setup, delegate heavy work to framework skills.

> **Dependency check:** All tools are built into this plugin — engineering disciplines, design quality commands, GSD CLI (`gsd-tools.cjs`), and TypeScript LSP. GSD will be initialized per-project in Step 6.

---

## Step 1: Project Vision

Delegate to the GSD new-project questioning flow. Ask the user one question at a time:

1. **What** is this project? (one sentence)
2. **Who** is it for? (target users)
3. **Why** does it need to exist? (problem it solves)
4. **Scope:** What's in v1? What's explicitly out?
5. **Constraints:** Timeline, team size, budget, technical constraints?
6. **Success criteria:** How do you know it worked?

Save answers — they feed into PROJECT.md in Step 6.

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

Invoke `/fh:ui-branding`.

This runs the one-time design context setup:
- Aesthetic direction (tone, style, differentiation)
- Design tokens and constraints
- Typography and color decisions
- Component patterns

Output: `.planning/DESIGN.md` — referenced by all future `/fh:build` and `/fh:verify-ui` runs.

If the user wants to skip this step and set up design later, allow it. They can always run `/fh:ui-branding` manually.

---

## Step 4: CLAUDE.md Generation

Invoke `/fh:revise-claude-md init` — this generates a high-quality CLAUDE.md from the context gathered in Steps 1-3 using the templates co-located in the `revise-claude-md` skill directory.

Pass it:
- Project name and description (from Step 1)
- Tech stack (from Step 2)
- Whether `.planning/DESIGN.md` was created (from Step 3)

The `/fh:revise-claude-md` skill's co-located `templates.md` has the fhhs-skills Project template. CLAUDE.md should include: tech stack, commands adapted to the chosen framework, architecture, code style with conventional commits, testing conventions, planning state reference, and design system reference.

Keep it under 40 lines. Commit: `docs: initialize CLAUDE.md with project conventions`

---

## Step 5: Domain Research (optional)

Check whether the tech stack was **fully specified** in Step 2 (user explicitly chose all stack components) or left partially open (accepted defaults without discussion, said "figure it out", etc.). Track this as `stack_decided`.

Ask the user:

> **Research the domain ecosystem before defining requirements?** This discovers standard features, architecture patterns, and pitfalls for your project type.
>
> 1. Research first (Recommended)
> 2. Skip research

If the user chooses **Skip research** → jump to Step 6.

If the user chooses **Research first:**

```bash
mkdir -p .planning/research
```

**Determine which dimensions to research:**
- **Features** — always spawn (table stakes vs differentiators)
- **Pitfalls** — always spawn (critical for roadmap quality)
- **Stack** — only if `stack_decided` is false
- **Architecture** — only if `stack_decided` is false

**Spawn researchers in parallel:**

```
Task(prompt="Project Research — Features dimension for [domain].
Project: [one-line description from Step 1]. Target users: [from Step 1]. Stack: [from Step 2].
Discover table-stakes features users expect, differentiator opportunities, and anti-features to avoid.
Write to: .planning/research/FEATURES.md",
subagent_type="gsd-project-researcher", description="Features research")

Task(prompt="Project Research — Pitfalls dimension for [domain].
Project: [one-line description from Step 1]. Target users: [from Step 1]. Stack: [from Step 2].
Discover common failure modes, technical pitfalls, and mistakes teams make building this type of project.
Write to: .planning/research/PITFALLS.md",
subagent_type="gsd-project-researcher", description="Pitfalls research")
```

**If `stack_decided` is false, also spawn:**

```
Task(prompt="Project Research — Stack dimension for [domain].
Project: [one-line description from Step 1]. Requirements: [from Step 1].
Evaluate framework and tooling options. Recommend a stack with trade-off analysis.
Write to: .planning/research/STACK.md",
subagent_type="gsd-project-researcher", description="Stack research")

Task(prompt="Project Research — Architecture dimension for [domain].
Project: [one-line description from Step 1]. Stack: [from Step 2].
Recommend architecture patterns, data flow, and project structure for this domain.
Write to: .planning/research/ARCHITECTURE.md",
subagent_type="gsd-project-researcher", description="Architecture research")
```

**After all researchers complete, synthesize:**

```
Task(prompt="Synthesize research outputs into a unified summary.
<files_to_read>
.planning/research/FEATURES.md
.planning/research/PITFALLS.md
.planning/research/STACK.md (if exists)
.planning/research/ARCHITECTURE.md (if exists)
</files_to_read>
Produce a concise summary with: key features to build, pitfalls to avoid, and (if researched) stack recommendation and architecture guidance.
Write to: .planning/research/SUMMARY.md",
subagent_type="gsd-research-synthesizer", description="Synthesize research")
```

Research complete. Proceed to Step 6.

---

## Step 6: Requirements + Roadmap

**If `.planning/research/SUMMARY.md` exists** (created in Step 5), read it first. Use the research findings to inform requirements — incorporate discovered table-stakes features, avoid identified pitfalls, and align the roadmap phases with architecture guidance.

Derive requirements from the vision in Step 1. Create:

- `.planning/PROJECT.md` — Vision, scope, constraints, tech stack, success criteria
- `.planning/REQUIREMENTS.md` — Scoped work items (REQ-01, REQ-02, ...)
- `.planning/ROADMAP.md` — Phased plan with goals per phase
- `.planning/STATE.md` — Current position (phase 1, plan 0)
- `.planning/config.json` — GSD workflow settings

**Phase 1 must always be "Project scaffolding and core setup"** — this is where the actual Next.js project gets created, dependencies installed, and base configuration applied.

**Set up GSD symlink and initialize:**

First, verify the global GSD symlink exists (created by `/fh:setup`):

```bash
[ -f "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" ] && echo "GSD_OK" || echo "GSD_MISSING"
```

If `GSD_MISSING`: the user hasn't run `/fh:setup`. Create the global symlink now by detecting the plugin root and linking:

```bash
# Detect plugin root (dev checkout or installed cache)
PLUGIN_ROOT=""
if [ -f "$(pwd)/bin/gsd-tools.cjs" ]; then
  PLUGIN_ROOT="$(pwd)"
elif [ -d "$HOME/.claude/plugins/fh" ]; then
  PLUGIN_ROOT="$HOME/.claude/plugins/fh"
fi

if [ -n "$PLUGIN_ROOT" ]; then
  mkdir -p "$HOME/.claude/get-shit-done"
  ln -sfn "$PLUGIN_ROOT/bin" "$HOME/.claude/get-shit-done/bin"
fi
```

Then create the project-local symlink and initialize:

```bash
mkdir -p .claude/get-shit-done
ln -sfn "$HOME/.claude/get-shit-done/bin" .claude/get-shit-done/bin

# Initialize project
node ./.claude/get-shit-done/bin/gsd-tools.cjs init new-project
```

Commit: `docs: initialize project planning with GSD structure`

---

## Step 7: Infrastructure Setup

Set up GitHub and Vercel so the project is ready for deployment from day one.

### 7a: Initialize git and commit planning files

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

### 7b: Create GitHub repository

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

### 7c: Create and link Vercel project

Check `vercel` availability:

```bash
command -v vercel >/dev/null 2>&1 && echo "OK" || echo "MISSING"
```

If `vercel` is MISSING: show a warning and skip to Step 8. The user can run `npm install -g vercel && vercel login` to enable this later.

Link the project to Vercel (creates a new project if one doesn't exist):

```bash
vercel link --yes --project "$(basename "$(pwd)")"
```

This writes `.vercel/project.json` with the project and org IDs.

### 7d: Connect GitHub to Vercel for auto-deployments

Connect the GitHub repo to the Vercel project:

```bash
vercel git connect
```

If this succeeds, every push to `main` will trigger a Vercel deployment automatically.

If `vercel git connect` fails or is unavailable, tell the user:

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: One-time Vercel action needed                   ║
╚══════════════════════════════════════════════════════════════╝

To enable automatic GitHub → Vercel deployments:

  1. Go to your Vercel project dashboard
  2. Settings → Git → Connect Git Repository
  3. Select: <repo-name>

This only needs to be done once.
```

### 7e: Set up Supabase (conditional)

**Only run this step if the user chose Supabase in Step 2.** If not, skip to Step 8.

Check `supabase` CLI availability:

```bash
command -v supabase >/dev/null 2>&1 && echo "OK" || echo "MISSING"
```

If `MISSING`: show a warning and skip. The user can run `brew install supabase/tap/supabase` (macOS) or `npm install -g supabase` to install later.

#### Login

Check if already authenticated:

```bash
supabase projects list >/dev/null 2>&1 && echo "LOGGED_IN" || echo "NOT_LOGGED_IN"
```

If `NOT_LOGGED_IN`:

```bash
supabase login
```

This opens the browser for OAuth — no dashboard navigation needed. Wait for the user to complete authentication.

#### Create project

Get the user's org (auto-select if only one):

```bash
supabase orgs list
```

If multiple orgs, ask the user which one to use.

Ask the user for a preferred region. Common options: `us-east-1`, `eu-west-1`, `eu-central-1`, `ap-southeast-1`.

Generate a strong database password and create the project:

```bash
DB_PASSWORD="$(openssl rand -base64 32)"
supabase projects create "<project-name>" \
  --org-id "<org-id>" \
  --region "<region>" \
  --db-password "$DB_PASSWORD"
```

Save the `DB_PASSWORD` — it's needed for linking.

#### Wait for project readiness and retrieve keys

The project takes ~60-90 seconds to become available after creation. Poll until keys are retrievable:

```bash
PROJECT_REF=$(supabase projects list | grep "<project-name>" | awk '{print $5}')

# Poll for readiness (max 2 minutes)
for i in $(seq 1 12); do
  KEYS=$(supabase projects api-keys --project-ref "$PROJECT_REF" 2>/dev/null) && break
  sleep 10
done
```

Extract the keys:

```bash
ANON_KEY=$(echo "$KEYS" | grep "anon" | awk '{print $NF}')
SERVICE_ROLE_KEY=$(echo "$KEYS" | grep "service_role" | awk '{print $NF}')
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
```

#### Write `.env.local`

**Security check first** — verify `.gitignore` includes `.env*.local`:

```bash
grep -q '\.env\*\.local\|\.env\.local' .gitignore 2>/dev/null && echo "GITIGNORE_OK" || echo "GITIGNORE_MISSING"
```

If `GITIGNORE_MISSING`, append `.env*.local` to `.gitignore` before writing secrets.

Write the environment file (append if it already exists, don't overwrite):

```bash
cat >> .env.local <<EOF

# Supabase
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
EOF
```

**Security rules:**
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be prefixed with `NEXT_PUBLIC_` — it bypasses Row Level Security
- Never echo the service_role key value in user-facing output
- `.env.local` must be gitignored before any secrets are written

#### Initialize and link

```bash
supabase init
supabase link --project-ref "$PROJECT_REF" --password "$DB_PASSWORD"
```

This creates the `supabase/` directory with `config.toml` and links it to the cloud project.

#### Sync environment variables to Vercel

Push the Supabase env vars to Vercel so deployments work out of the box:

```bash
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --yes
echo "$ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes
echo "$SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes
```

If the `vercel` CLI is unavailable (Step 6c was skipped), show a checkpoint:

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Add Supabase env vars to Vercel                 ║
╚══════════════════════════════════════════════════════════════╝

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

  NEXT_PUBLIC_SUPABASE_URL       = https://<ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY  = <your anon key>
  SUPABASE_SERVICE_ROLE_KEY      = <your service_role key>

Mark SUPABASE_SERVICE_ROLE_KEY as "Sensitive" in Vercel.
```

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
- GitHub repo               — <repo-url> (private)
- Vercel project            — linked (auto-deploys on push to main)
- Supabase project          — <project-url> (if set up)
- .env.local                — API keys configured (if Supabase)

Next: run /fh:plan to plan your first phase (scaffolding and core setup).
```

If Supabase was set up, add this reminder:

```
⚠ Supabase security reminder:
  - Enable Row Level Security (RLS) on every table you create
  - The anon key is safe for client-side use ONLY with RLS enabled
  - The service_role key bypasses RLS — use only in server-side code
```
