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
- Yes → add Supabase to the stack, proceed to Step 2c after 2b
- No → skip Step 2c entirely

Ask: **"Any changes to the default stack?"**

Lock the final tech stack decisions. These go into PROJECT.md.

### 2b: shadcn/ui Preset

If the tech stack includes Shadcn/ui (the default), offer the user a chance to configure their design system preset:

```
╔══════════════════════════════════════════════════════════════╗
║  OPTIONAL: Custom shadcn/ui Preset                           ║
╚══════════════════════════════════════════════════════════════╝

You can design a custom shadcn/ui preset — colors, theme, fonts,
radius — all in one config code.

  1. Open https://ui.shadcn.com/create
  2. Customize your design system and preview it live
  3. Copy the preset code (e.g. "a1Dg5eFl")
  4. Paste it here

Or press Enter to use defaults.

──────────────────────────────────────────────────────────────
→ Preset code (or Enter to skip):
──────────────────────────────────────────────────────────────
```

**If the user provides a preset code:**
- Save it for use during Phase 1 scaffolding: `npx shadcn@latest init --preset <CODE>`
- Note: The preset's icon library setting will be overridden — we always use **Phosphor Icons** regardless of what the preset specifies. After init, verify and fix the icon library if needed.

**If the user skips (presses Enter):**
- Phase 1 will run `npx shadcn@latest init` with default settings
- Phosphor Icons will still be configured as the icon library

**Store the preset decision** in `.planning/PROJECT.md` under the tech stack section, e.g.:
```
- shadcn/ui preset: a1Dg5eFl (custom) — Phosphor Icons enforced
```
or:
```
- shadcn/ui preset: default — Phosphor Icons
```

**Icon library enforcement:** Regardless of preset, the project always uses Phosphor Icons. After `shadcn init` runs in Phase 1, check `components.json` (or the shadcn config file) and ensure the icon library is set to `phosphor`. If the preset specified a different icon pack (e.g. Lucide), override it. Add a note in Phase 1 requirements:

```
After shadcn init: verify components.json uses Phosphor Icons.
If preset specified a different icon library, switch to phosphor:
  npx shadcn@latest add phosphor-icons
```

### 2c: Supabase Project Setup

**Skip this step entirely if the user said no to auth/database in Step 2.**

This step creates a Supabase project, configures auth, email templates, and redirect URLs — fully automated from the CLI. No dashboard visits required.

#### 2c-i: Install and authenticate Supabase CLI

```bash
command -v supabase >/dev/null 2>&1 && echo "OK $(supabase --version 2>/dev/null)" || echo "MISSING"
```

If `MISSING`:

```bash
brew install supabase/tap/supabase
```

On Windows: `npx supabase` (runs without global install).

Check login status:

```bash
supabase projects list 2>/dev/null && echo "LOGGED_IN" || echo "NOT_LOGGED_IN"
```

If `NOT_LOGGED_IN`:

```
◆ Log in to Supabase (opens browser)...
```

```bash
supabase login
```

#### 2c-ii: Create Supabase project

List available orgs so the user can pick:

```bash
supabase orgs list
```

Then create the project:

```bash
supabase projects create "<project-name>" --org-id <org-id> --region <region>
```

The CLI will prompt for a database password if not provided. **Save this password** — it's needed for `supabase link`.

After creation, get the project ref:

```bash
supabase projects list
```

Find the newly created project and note the `REF` column (20-char alphanumeric string).

#### 2c-iii: Initialize and link

```bash
supabase init
supabase link --project-ref <ref>
```

`supabase init` creates exactly two files:
- `supabase/config.toml` — project configuration (auth, API, storage, etc.)
- `supabase/.gitignore` — excludes `.branches`, `.temp`, `.env.keys`

It does **not** create `migrations/`, `templates/`, or `seed.sql` — those are created as needed below.

#### 2c-iv: Configure auth in config.toml

Read the generated `supabase/config.toml` using the **Read tool**, then use **Edit tool** to update these sections. The file already has these sections with defaults — update them in place, don't duplicate.

**`[auth]` section** — update `site_url` and add `additional_redirect_urls`:

```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = [
  "http://localhost:3000/**",
  "https://<project-name>.vercel.app/**",
  "https://*-<vercel-user>.vercel.app/**"
]
```

**Redirect URL details:**
- `http://localhost:3000/**` — local dev
- `https://<project-name>.vercel.app/**` — production Vercel domain (use the actual project name from Step 1)
- `https://*-<vercel-user>.vercel.app/**` — Vercel preview deployments (run `vercel whoami` to get the username, or ask the user)
- If the user has a custom domain planned, ask and add it too

**`[auth.email]` section** — update defaults:

```toml
[auth.email]
enable_signup = true
enable_confirmations = true
double_confirm_changes = true
max_frequency = "60s"
otp_length = 6
otp_expiry = 3600
```

> The default config has `enable_confirmations = false` and `max_frequency = "1s"` — both need updating. Email confirmation should be on for production. 60s rate limit prevents abuse.

**Email template sections** — these are commented out in the default config. Uncomment and set:

```toml
[auth.email.template.confirmation]
subject = "Confirm your email"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.recovery]
subject = "Reset your password"
content_path = "./supabase/templates/recovery.html"

[auth.email.template.magic_link]
subject = "Your sign-in link"
content_path = "./supabase/templates/magic_link.html"

[auth.email.template.email_change]
subject = "Confirm your email change"
content_path = "./supabase/templates/email_change.html"
```

> `content_path` is relative to the **project root** (not `supabase/`), so paths start with `./supabase/templates/`.

#### 2c-v: Scaffold email templates

Create `supabase/templates/` with clean, minimal email templates. These use Go template variables that Supabase replaces at send time. Inline styles ensure rendering across all email clients.

**`supabase/templates/confirmation.html`:**
```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
  <h2 style="margin: 0 0 16px;">Confirm your email</h2>
  <p style="line-height: 1.6; color: #4a4a4a;">Click the button below to confirm your email address.</p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; margin: 24px 0; padding: 12px 32px; background: #171717; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">Confirm email</a>
  <p style="font-size: 13px; color: #888;">If you didn't create an account, ignore this email.</p>
</body>
</html>
```

**`supabase/templates/recovery.html`:**
```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
  <h2 style="margin: 0 0 16px;">Reset your password</h2>
  <p style="line-height: 1.6; color: #4a4a4a;">Click the button below to reset your password.</p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; margin: 24px 0; padding: 12px 32px; background: #171717; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">Reset password</a>
  <p style="font-size: 13px; color: #888;">If you didn't request a password reset, ignore this email.</p>
</body>
</html>
```

**`supabase/templates/magic_link.html`:**
```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
  <h2 style="margin: 0 0 16px;">Your sign-in link</h2>
  <p style="line-height: 1.6; color: #4a4a4a;">Click the button below to sign in.</p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; margin: 24px 0; padding: 12px 32px; background: #171717; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">Sign in</a>
  <p style="font-size: 13px; color: #888;">If you didn't request this link, ignore this email.</p>
</body>
</html>
```

**`supabase/templates/email_change.html`:**
```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
  <h2 style="margin: 0 0 16px;">Confirm your new email</h2>
  <p style="line-height: 1.6; color: #4a4a4a;">Click the button below to confirm changing your email to {{ .NewEmail }}.</p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; margin: 24px 0; padding: 12px 32px; background: #171717; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">Confirm email change</a>
  <p style="font-size: 13px; color: #888;">If you didn't request this change, ignore this email.</p>
</body>
</html>
```

#### 2c-vi: Get API keys from CLI

```bash
supabase projects api-keys --project-ref <ref>
```

This returns the project's API keys. Extract:
- **Project URL:** `https://<ref>.supabase.co`
- **anon / publishable key:** the key labeled `anon` (starts with `eyJ...`)

> The project URL follows a fixed pattern: `https://<ref>.supabase.co` — construct it from the ref directly.

#### 2c-vii: Write environment variables

Add to `.env.local` (create if it doesn't exist, merge if it does):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-api-keys>
```

#### 2c-viii: Push config to remote

```bash
supabase config push
```

This pushes auth settings, redirect URLs, and email template contents to the remote project. The CLI reads the HTML files from `content_path`, inlines their content, and sends it to the Supabase API. It shows a diff before applying — confirm with `y`.

If `config push` fails because the project is still initializing (just created), wait a few seconds and retry.

Display confirmation:

```
✓ Supabase project created and linked (ref: <ref>)
✓ Auth configured (email signup + confirmation enabled)
✓ Email templates pushed (confirmation, recovery, magic link, email change)
✓ Redirect URLs set (localhost + Vercel production + preview)
✓ API keys written to .env.local
```

#### Phase 1 requirements for Supabase

Note the following in `.planning/REQUIREMENTS.md` for Phase 1 scaffolding:

```
Supabase integration (Phase 1):
  npm install @supabase/supabase-js @supabase/ssr

  Scaffold:
    - lib/supabase/client.ts     — browser client (createBrowserClient)
    - lib/supabase/server.ts     — server client (createServerClient with cookies)
    - middleware.ts               — refresh auth session on every request
    - app/auth/callback/route.ts  — code exchange for OAuth/magic-link/email confirm

  Critical: middleware.ts must use supabase.auth.getUser() (NOT getSession())
  to validate tokens server-side. getSession() does not revalidate with the
  auth server and is unsafe for server-side checks.

  Migrations: use `supabase migration new <name>` to create, `supabase db push`
  to deploy to remote. Migrations live in supabase/migrations/ (auto-created
  by the migration command).
```

Record in `.planning/PROJECT.md` under tech stack:
```
- Supabase: auth + database (project ref: <ref>, region: <region>)
```

---

## Step 3: Design Framework

Invoke `/fh:ui-redesign`.

This runs the one-time design context setup:
- Aesthetic direction (tone, style, differentiation)
- Design tokens and constraints
- Typography and color decisions
- Component patterns

Output: `.planning/DESIGN.md` — referenced by all future `/fh:build` and `/fh:ui-test` runs.

If the user wants to skip this step and set up design later, allow it. They can always run `/fh:ui-redesign` manually.

---

## Step 4: CLAUDE.md Generation

Invoke `/fh:revise-claude-md init` — this uses the `skills/claude-md-improver/references/templates.md` fhhs-skills project template to generate a high-quality CLAUDE.md from the context gathered in Steps 1-3.

Pass it:
- Project name and description (from Step 1)
- Tech stack (from Step 2), including whether Supabase is in the stack
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

**shadcn/ui initialization in Phase 1:**
- If a preset code was provided in Step 2b: `npx shadcn@latest init --preset <CODE>`
- If no preset: `npx shadcn@latest init` with defaults
- After init, enforce Phosphor Icons as the icon library (override any preset icon selection)
- Include these steps in the Phase 1 plan within REQUIREMENTS.md

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

## Step 5b: Observability Setup

Scaffold local Sentry-compatible error tracking. This captures browser and server errors to a local SQLite store that agents can query during debugging.

### Dependencies

Add to the project's package.json (these will be installed in Phase 1 when npm install runs):

Note in `.planning/REQUIREMENTS.md` that Phase 1 scaffolding must include:
```
npm install @sentry/browser @sentry/node @sentry/core better-sqlite3
npm install -D @types/better-sqlite3
```

### Scaffold files

Create the following files using the templates documented in the `/fh:observability` skill (Section 2: Scaffolded Files Reference). Read that skill for the complete file contents.

1. **`lib/sentry-local.ts`** — SQLite-backed Sentry transport + init helpers
2. **`lib/sentry-local-query.mjs`** — CLI query tool for agents
3. **`app/api/sentry-local/route.ts`** — browser envelope receiver (tunnel endpoint)
4. **`instrumentation.ts`** — Next.js server-side Sentry init
5. **`.sentry-local/.gitignore`** — contains `*` (exclude db from git)

### Environment setup

Add to `.env.local` (or create it):
```
SENTRY_LOCAL=true
NEXT_PUBLIC_SENTRY_LOCAL=true
```

### Client-side init

Note in the Phase 1 plan that `app/layout.tsx` needs to call `initSentryClient()` from `lib/sentry-local`. This happens during scaffolding, not here — we just create the library files.

### Conductor integration

If `conductor.json` is being created (Step 7), add `SENTRY_LOCAL` and `NEXT_PUBLIC_SENTRY_LOCAL` to the env block — see Step 7.

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
    "CLAUDE_CODE_ENABLE_TASKS": "true",
    "SENTRY_LOCAL": "true",
    "NEXT_PUBLIC_SENTRY_LOCAL": "true"
  }
  // If Supabase is in the stack, the setup script already copies .env.local
  // from $CONDUCTOR_ROOT_PATH, which contains NEXT_PUBLIC_SUPABASE_URL and
  // NEXT_PUBLIC_SUPABASE_ANON_KEY. No need to duplicate them in the env block.
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
- lib/sentry-local.ts       — local error tracking (Sentry SDK → SQLite)
- lib/sentry-local-query.mjs — error query CLI for agents
- .sentry-local/             — error store (gitignored, per-worktree)
- supabase/config.toml      — auth, redirects, email templates (if Supabase)
- supabase/templates/        — signup/recovery/magic-link emails (if Supabase)
- conductor.json            — Conductor workspace scripts (if Conductor detected)
- GitHub repo               — <repo-url> (private)
- vercel.json               — framework preset configured
- Vercel project            — linked (auto-deploys on push to main, if GitHub App installed)

Error tracking is active in dev by default. Run `node lib/sentry-local-query.mjs recent` to see captured errors, or let `/fh:fix` query them automatically.

Next: run /fh:plan-work to plan your first phase (scaffolding and core setup).
```
