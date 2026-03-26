---
name: fh:new-project
description: Bootstrap a new tracked project with design framework, conventions, and GSD roadmap. Use when the user says 'new project', 'start a project', 'bootstrap', 'set up a new app', or 'initialize'. Creates .planning/ structure and CLAUDE.md.
user-invocable: true
---

Bootstrap a new project with opinionated defaults, design framework, and full GSD tracking.

$ARGUMENTS

You are a **lean orchestrator**. Guide the user through setup, delegate heavy work to framework skills.

> **Dependency check:** All tools are built into this plugin — engineering disciplines, design quality commands, GSD CLI (`gsd-tools.cjs`), and TypeScript LSP. GSD will be initialized per-project in Step 7.

---

## Step 1: Project Vision

Delegate to the GSD new-project questioning flow. Ask the user one question at a time:

1. **What** is this project? (one sentence)
2. **Who** is it for? (target users)
3. **Why** does it need to exist? (problem it solves)
4. **Scope:** What's in v1? What's explicitly out?
5. **Constraints:** Timeline, team size, budget, technical constraints?
6. **Success criteria:** How do you know it worked?

Save answers — they feed into PROJECT.md in Step 7.

---

## Step 2: Tech Stack Confirmation

Present the default stack:

> **Default stack:** Next.js + TypeScript + Tailwind CSS + Shadcn/ui + GitHub + Vercel
>
> These are defaults — override any of them.

Ask: **"Need user authentication or a database?"**
- Yes → add Supabase to the stack
- No → skip

If the user said Yes to auth, ask: **"Want organizations, teams, and roles? (multi-tenant support)"**
- Yes → set `wants_organizations = true`
- No → skip

Track `wants_organizations` alongside `uses_default_stack`.

Ask: **"Any changes to the default stack?"**

Lock the final tech stack decisions. These go into PROJECT.md.

### 2b: shadcn/ui Preset — Brand-Aware Generation

If the tech stack includes Shadcn/ui (the default), generate a custom design system preset from the user's brand identity.

```
╔══════════════════════════════════════════════════════════════╗
║  DESIGN SYSTEM: Let's match your brand                       ║
╚══════════════════════════════════════════════════════════════╝

Share any brand references so I can generate a design system
that matches your identity:

  • Website URLs (e.g. your current site, competitors, inspirations)
  • Images (logos, mood boards, screenshots)
  • Brand guidelines (colors, fonts, tone)

The more context, the better the match. Or skip to use defaults.

──────────────────────────────────────────────────────────────
→ Brand references (URLs, images, descriptions — or Enter to skip):
──────────────────────────────────────────────────────────────
```

**If the user provides references, run the Brand Extraction flow:**

#### Brand Extraction

**Tool fallbacks:** Use the Firecrawl skill to fetch URLs. If Firecrawl is unavailable, fall back to WebFetch. If neither is available, ask the user to describe their brand colors, fonts, and visual style directly — or to paste relevant CSS snippets.

**Error handling:** If a URL is unreachable (404, timeout, blocked), inform the user and ask for an alternative reference or a text description instead. If an image doesn't appear to be a brand asset (e.g., a photograph rather than a logo, color palette, or screenshot), ask the user to confirm which aspects represent their brand.

**Conflicting references:** If multiple references have very different color schemes, prioritize the user's own brand assets over competitor/inspiration references. If ambiguous, ask which reference best represents the target identity.

**For website URLs:** Fetch each URL and extract:
- **Colors:** Look for CSS custom properties (`--primary`, `--accent`, `--brand`), `meta[name="theme-color"]`, prominent background/button colors, and brand-colored elements. Identify the primary brand color and any accent/secondary colors.
- **Typography:** Look for `font-family` declarations, Google Fonts imports, `@font-face` rules. Note the body font and heading font if different.
- **Visual feel:** Assess spacing density (tight vs generous), border radius (sharp vs rounded), contrast level (bold vs subtle), and overall aesthetic (minimal, playful, corporate, technical).

**For images** (logos, screenshots, mood boards): Use the Read tool to view each image. Identify:
- **Dominant colors:** The 1-3 most prominent colors. Note if they're warm/cool, saturated/muted.
- **Typography:** If text is visible, identify the font style (sans-serif, serif, monospace, geometric, humanist).
- **Mood:** Minimal, bold, elegant, playful, technical, organic, etc.

**For text descriptions:** Parse directly for color names, font preferences, and style direction.

#### Color Mapping

Map extracted brand colors to the closest shadcn theme. Available accent themes and their approximate hue:

| Theme | Hue | Best for |
|-------|-----|----------|
| `red` | Warm red | Urgency, energy, passion |
| `rose` | Pink-red | Warm, approachable, modern |
| `pink` | Pink | Playful, creative, feminine |
| `fuchsia` | Magenta | Bold, creative, vibrant |
| `purple` | Purple | Premium, creative, luxurious |
| `violet` | Blue-purple | Elegant, trustworthy, modern |
| `indigo` | Deep blue | Professional, authoritative |
| `blue` | True blue | Trust, stability, corporate |
| `sky` | Light blue | Friendly, open, fresh |
| `cyan` | Blue-green | Tech, innovation, clean |
| `teal` | Teal | Balanced, calm, sophisticated |
| `emerald` | Green | Growth, health, success |
| `green` | True green | Nature, money, go/success |
| `lime` | Yellow-green | Energy, freshness, youthful |
| `yellow` | Yellow | Optimism, warmth, attention |
| `amber` | Orange-yellow | Warmth, friendly, caution |
| `orange` | Orange | Energy, enthusiasm, fun |
| `neutral` | Gray | Minimal, sophisticated, no accent |
| `stone` | Warm gray | Warm monochrome, earthy minimal |
| `zinc` | Cool gray | Cool monochrome, technical minimal |
| `mauve` | Purple-gray | Soft, refined monochrome |
| `olive` | Green-gray | Natural, organic monochrome |
| `mist` | Blue-gray | Airy, soft monochrome |
| `taupe` | Brown-gray | Warm, grounded monochrome |

If the brand's primary color doesn't map cleanly to one theme, pick the closest hue match. If the brand is intentionally neutral/monochrome, use one of the gray-family themes above — pick based on the undertone of the brand's grays.

**Constraint:** The `theme` (accent color) and `baseColor` are related but independent parameters. The `theme` must NOT be the same as another base color name unless it matches the selected `baseColor`. For example, if `baseColor=zinc`, the theme cannot be `stone` or `mauve` (other base colors), but it CAN be `zinc` (same as baseColor) or any non-base-color theme like `blue`, `purple`, etc. The shadcn URL validator enforces this — invalid combinations silently fall back to defaults.

#### Font Mapping

Map extracted typography to the closest available shadcn font:

| Font | Category | Best for |
|------|----------|----------|
| `geist` | Sans (geometric) | Tech, modern, Vercel-style |
| `inter` | Sans (neutral) | Universal, clean, professional |
| `dm-sans` | Sans (geometric) | Friendly, modern, startups |
| `figtree` | Sans (geometric) | Warm, approachable, rounded |
| `manrope` | Sans (geometric) | Modern, slightly rounded |
| `outfit` | Sans (geometric) | Clean, contemporary |
| `raleway` | Sans (elegant) | Elegant, fashion, luxury |
| `montserrat` | Sans (geometric) | Bold, modern, versatile |
| `space-grotesk` | Sans (grotesk) | Tech, developer tools |
| `ibm-plex-sans` | Sans (humanist) | Corporate, IBM-inspired |
| `roboto` | Sans (neo-grotesque) | Google/Android, familiar |
| `noto-sans` | Sans (humanist) | International, accessible |
| `nunito-sans` | Sans (rounded) | Friendly, soft, approachable |
| `public-sans` | Sans (neutral) | Government, institutional |
| `source-sans-3` | Sans (humanist) | Adobe, readable, professional |
| `instrument-sans` | Sans (contemporary) | Editorial, modern |
| `oxanium` | Sans (futuristic) | Gaming, sci-fi, tech |
| `geist-mono` | Mono | Developer tools, terminals |
| `jetbrains-mono` | Mono | Code-heavy, developer tools |
| `playfair-display` | Serif (display) | Editorial, luxury, headlines |
| `lora` | Serif (transitional) | Reading, editorial, classic |
| `merriweather` | Serif (slab) | Readable, serious, traditional |
| `noto-serif` | Serif (classical) | International, traditional |
| `roboto-slab` | Serif (slab) | Strong, modern-traditional |

If the brand uses a custom font, pick the closest structural match. Consider whether body and heading fonts should differ — set `fontHeading` if so (otherwise it inherits body font).

#### Style Mapping

Map the visual feel to a shadcn style:

| Style | Character | When to use |
|-------|-----------|-------------|
| `vega` | Clean, neutral, familiar | Default corporate, SaaS, professional |
| `nova` | Reduced padding, compact | Dense data apps, dashboards, dev tools |
| `maia` | Rounded, generous spacing | Consumer apps, friendly products |
| `lyra` | Boxy, sharp, mono-friendly | Developer tools, technical products |
| `mira` | Compact interfaces | Admin panels, dense UIs |

#### Other Parameters

- **Base color:** Choose from `neutral`, `stone`, `zinc`, `mauve`, `olive`, `mist`, `taupe` based on the warmth/coolness of the brand. Warm brands → `stone` or `taupe`. Cool brands → `zinc` or `mauve`. Nature/organic → `olive`. Soft/muted → `mist`. Default → `neutral`.
- **Radius:** `none` for sharp/technical, `small` for subtle rounding, `default` for balanced, `medium` for friendly, `large` for playful/rounded.
- **Chart color:** For data-heavy apps (dashboards, analytics), set `chartColor` to match the brand accent theme. Options mirror the theme list. For non-data apps, omit — defaults to match the theme.
- **Menu color:** `default` for standard sidebars, `inverted` for dark sidebar aesthetic, `default-translucent` or `inverted-translucent` for glassmorphism/frosted effects.
- **Menu accent:** `subtle` for understated brands, `bold` for brands that emphasize navigation.

#### Generate Preview URL

Construct a `ui.shadcn.com/create` URL with the mapped parameters:

```
https://ui.shadcn.com/create?style={style}&baseColor={baseColor}&theme={theme}&chartColor={chartColor}&font={font}&fontHeading={fontHeading}&iconLibrary=phosphor&radius={radius}&menuColor={menuColor}&menuAccent={menuAccent}
```

Omit parameters that match defaults (style=nova, baseColor=neutral, theme=neutral, chartColor=neutral, font=inter, fontHeading=inherit, radius=default, menuColor=default, menuAccent=subtle) to keep the URL clean. Always include `iconLibrary=phosphor`.

Present the result:

```
╔══════════════════════════════════════════════════════════════╗
║  PRESET GENERATED                                            ║
╚══════════════════════════════════════════════════════════════╝

Based on your brand references, here's your design system:

  Accent color:  {theme} — {reason}
  Base gray:     {baseColor} — {reason}
  Style:         {style} — {reason}
  Body font:     {font} — {reason}
  Heading font:  {fontHeading or "same as body"}
  Radius:        {radius}
  Menu:          {menuColor} / {menuAccent}

  Preview & customize: {generated URL}

──────────────────────────────────────────────────────────────
  1. Looks good — use this preset
  2. I've tweaked it — let me paste the updated preset code
  3. Start over with different references
  4. Skip — use defaults
──────────────────────────────────────────────────────────────
```

**If user chooses 1 (approve):** Pass the generated URL directly as the `--preset` flag value. The shadcn CLI accepts full URLs as presets:
```bash
npx shadcn@latest init --preset "{generated URL}"
```
For example:
```bash
npx shadcn@latest init --preset "https://ui.shadcn.com/create?style=nova&baseColor=neutral&theme=blue&font=inter&iconLibrary=phosphor"
```
Store the full URL and parameter set in `.planning/PROJECT.md` for reproducibility. Note: the CLI does NOT have individual flags like `--style` or `--font` — all design parameters must go through `--preset`.

**If user chooses 2 (tweaked):** They paste back a preset code from the customizer. Use that code for `npx shadcn@latest init --preset <CODE>`.

**If user chooses 3 (start over):** Re-run the Brand Extraction flow with new references.

**If the user skips entirely (no references, presses Enter):**
- Phase 1 will run `npx shadcn@latest init` with default settings
- Phosphor Icons will still be configured as the icon library

**Store the preset decision** in `.planning/PROJECT.md` under the tech stack section, e.g.:
```
- shadcn/ui preset: custom (blue/inter/nova) — generated from brand references — Phosphor Icons enforced
- shadcn/ui preview: https://ui.shadcn.com/create?theme=blue&font=inter&iconLibrary=phosphor
```
or:
```
- shadcn/ui preset: a1Dg5eFl (user-customized from generated base) — Phosphor Icons enforced
```
or:
```
- shadcn/ui preset: default — Phosphor Icons
```

**Icon library enforcement:** Regardless of preset, the project always uses Phosphor Icons. The generated URL already includes `iconLibrary=phosphor`, but if the user customizes and changes it, we override. After `shadcn init` runs in Phase 1, check `components.json` and ensure `"iconLibrary": "phosphor"`. If it's set to something else, edit `components.json` directly and install the package:

```
After shadcn init: verify components.json uses Phosphor Icons.
If preset specified a different icon library:
  1. Edit components.json: set "iconLibrary": "phosphor"
  2. Install: npm install @phosphor-icons/react
```

**Track `uses_default_stack`:** If the user accepted the default stack as-is (no framework/tooling substitutions — adding Supabase doesn't count as a change), set `uses_default_stack = true`. This determines whether the starter template is used in Step 3.

---

## Step 3: Scaffold from Starter Template (conditional)

**Only run this step if `uses_default_stack` is true.**

If `uses_default_stack` is false, skip to Step 4.

Check `gh` availability:

```bash
command -v gh >/dev/null 2>&1 && echo "OK" || echo "MISSING"
```

If `gh` is MISSING: show a warning and skip. The user can run `brew install gh && gh auth login` to enable this later. The project will be scaffolded manually in Phase 1 instead.

Pull starter template files into the project. The repo likely already exists (with commits and a remote), so we clone the template separately and copy its files in:

```bash
# Clone template into a temp directory
TMPDIR=$(mktemp -d)
gh repo clone cinjoff/fh-starter-project "$TMPDIR/starter" -- --depth 1

# Copy template files into the project (excluding .git)
rsync -a --exclude='.git' "$TMPDIR/starter/" ./

# Clean up
rm -rf "$TMPDIR"
```

Install dependencies:

```bash
npm install
```

### 3b: Install shadcn skills globally (if needed)

**Only run if `uses_default_stack` is true.**

Check if already installed:

```bash
[ -d "$HOME/.skills/shadcn" ] && echo "INSTALLED" || echo "NOT_INSTALLED"
```

If `NOT_INSTALLED`:

```bash
cd "$HOME" && npx skills add shadcn/ui
```

Show: `✓ shadcn skills installed globally (~/.skills/shadcn)` or `✓ shadcn skills already installed`.

Commit the template scaffolding:

```bash
git add -A
git commit -m "feat: scaffold from fh-starter-project template"
```

Do NOT push yet — later steps (Supabase, planning files) will commit on top.

---

## Step 4: Design Framework (optional)

Invoke `/fh:ui-branding`.

**If Step 2b gathered brand references:** Pass the extracted context (colors, fonts, style, and the shadcn preset parameters) to `/fh:ui-branding` as starting context. Tell it to skip the "Brand & Personality" and "Aesthetic Preferences" questions — those were already answered. The design framework should extend the preset choices with higher-level tokens, component patterns, and design principles, not re-ask about colors and fonts.

This runs the one-time design context setup:
- Aesthetic direction (tone, style, differentiation)
- Design tokens and constraints
- Typography and color decisions
- Component patterns

Output: `.planning/DESIGN.md` — referenced by all future `/fh:build` and `/fh:verify-ui` runs.

If the user wants to skip this step and set up design later, allow it. They can always run `/fh:ui-branding` manually.

---

## Step 5: CLAUDE.md Generation

Invoke `/fh:revise-claude-md init` — this generates a high-quality CLAUDE.md from the context gathered in Steps 1-4 using the templates co-located in the `revise-claude-md` skill directory.

Pass it:
- Project name and description (from Step 1)
- Tech stack (from Step 2)
- Whether `.planning/DESIGN.md` was created (from Step 4)

The `/fh:revise-claude-md` skill's co-located `templates.md` has the fhhs-skills Project template. CLAUDE.md should include: tech stack, commands adapted to the chosen framework, architecture, code style with conventional commits, testing conventions, planning state reference, and design system reference.

Keep it under 40 lines. Commit: `docs: initialize CLAUDE.md with project conventions`

---

## Step 6: Domain Research (optional)

Check whether the tech stack was **fully specified** in Step 2 (user explicitly chose all stack components) or left partially open (accepted defaults without discussion, said "figure it out", etc.). Track this as `stack_decided`.

Ask the user:

> **Research the domain ecosystem before defining requirements?** This discovers standard features, architecture patterns, and pitfalls for your project type.
>
> 1. Research first (Recommended)
> 2. Skip research

If the user chooses **Skip research** → jump to Step 7.

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

Research complete. Proceed to Step 7.

---

## Step 7: Requirements + Roadmap

**If `.planning/research/SUMMARY.md` exists** (created in Step 6), read it first. Use the research findings to inform requirements — incorporate discovered table-stakes features, avoid identified pitfalls, and align the roadmap phases with architecture guidance.

Derive requirements from the vision in Step 1. Create:

- `.planning/PROJECT.md` — Vision, scope, constraints, tech stack, success criteria
- `.planning/REQUIREMENTS.md` — Scoped work items (REQ-01, REQ-02, ...)
- `.planning/ROADMAP.md` — Phased plan with goals per phase
- `.planning/STATE.md` — Current position (phase 1, plan 0)
- `.planning/config.json` — GSD workflow settings

**If `uses_default_stack` is true:** Phase 1 should be **"Core app setup"** — the starter template files were pulled into the repo in Step 3 (Next.js, Tailwind, Shadcn/ui, project structure), so Phase 1 focuses on app-specific configuration: routes, layouts, data models, and integrating the chosen design direction.

**If `uses_default_stack` is false:** Phase 1 must be **"Project scaffolding and core setup"** — this is where the actual project gets created, dependencies installed, and base configuration applied.

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

## Step 8: Infrastructure Setup

Set up GitHub and Vercel so the project is ready for deployment from day one.

### 8a: Initialize git (if needed)

```bash
git rev-parse --is-inside-work-tree 2>/dev/null && echo "GIT_OK" || echo "GIT_MISSING"
```

If not a git repo, initialize it:

```bash
git init
```

Stage and commit all files created so far (template scaffolding, planning files, CLAUDE.md):

```bash
git add -A
git commit -m "chore: initialize project"
```

If files are already committed (git was pre-existing), skip the commit.

### 8b: Create GitHub repository

Check if a remote already exists:

```bash
git remote get-url origin 2>/dev/null && echo "REMOTE_EXISTS" || echo "NO_REMOTE"
```

If no remote exists and `gh` is available, create the GitHub repo:

```bash
REPO_NAME="$(basename "$(pwd)")"
gh repo create "$REPO_NAME" --private --source=. --push
```

This creates a private repo, sets `origin`, and pushes the initial commit. Report the repo URL from the output.

If a remote already exists, skip creation but show the existing remote URL.

### 8c: Create and link Vercel project

Check `vercel` availability:

```bash
command -v vercel >/dev/null 2>&1 && echo "OK" || echo "MISSING"
```

If `vercel` is MISSING: show a warning and skip to Step 9. The user can run `npm install -g vercel && vercel login` to enable this later.

**Create `vercel.json` with the framework preset** before linking so Vercel uses the correct build settings:

```bash
cat > vercel.json << 'EOF'
{
  "framework": "nextjs"
}
EOF
```

> Adapt the `"framework"` value if the user chose a different stack in Step 2 (e.g. `"vite"`, `"remix"`, `null` for static).

**Worktree compatibility:** The Vercel CLI requires `.git` to be a directory, but git worktrees (used by Conductor and other tools) use a `.git` file pointing to the main repo. Work around this before linking:

```bash
if [ -f .git ]; then
  # Worktree: temporarily swap .git file for a symlink to the real git dir
  GIT_COMMON_DIR=$(git rev-parse --git-common-dir)
  mv .git .git.worktree.bak
  ln -s "$GIT_COMMON_DIR" .git
  WORKTREE_FIX=true
fi

vercel link --yes --project "$(basename "$(pwd)")"

if [ "$WORKTREE_FIX" = true ]; then
  # Restore the worktree .git file
  rm .git
  mv .git.worktree.bak .git
fi
```

This writes `.vercel/project.json` with the project and org IDs.

### 8d: Connect GitHub to Vercel for auto-deployments

Connect the GitHub repo to the Vercel project:

```bash
vercel git connect
```

If this succeeds, every push to `main` will trigger a Vercel deployment automatically.

If `vercel git connect` fails or is unavailable (common in worktree environments), tell the user:

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

### 8e: Set up Supabase (conditional)

**Only run this step if the user chose Supabase in Step 2.** If not, skip to Step 9.

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

Generate a strong database password and create the project. Default the project name to the repo name:

```bash
DB_PASSWORD="$(openssl rand -base64 32)"
PROJECT_NAME="$(basename "$(pwd)")"
supabase projects create "$PROJECT_NAME" \
  --org-id "<org-id>" \
  --region "<region>" \
  --db-password "$DB_PASSWORD"
```

Save the `DB_PASSWORD` — it's needed for linking.

#### Wait for project readiness and retrieve keys

The project takes ~60-90 seconds to become available after creation. Poll until keys are retrievable:

```bash
PROJECT_REF=$(supabase projects list | grep "$PROJECT_NAME" | awk '{print $5}')

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

#### Reset database password and configure DATABASE_URL

The initial password generated during project creation is ephemeral. Reset it to a known password and configure the pooler connection string for direct database access (used by ORMs like Prisma/Drizzle):

```bash
# Generate a new strong password
NEW_DB_PASSWORD="$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)"

# Reset the database password
supabase db reset-password --project-ref "$PROJECT_REF" --password "$NEW_DB_PASSWORD"
```

Determine the pooler host from the chosen region. Map the region to the Supabase pooler hostname:

| Region | Pooler Host |
|--------|-------------|
| `us-east-1` | `aws-0-us-east-1.pooler.supabase.com` |
| `us-west-1` | `aws-0-us-west-1.pooler.supabase.com` |
| `eu-west-1` | `aws-0-eu-west-1.pooler.supabase.com` |
| `eu-central-1` | `aws-0-eu-central-1.pooler.supabase.com` |
| `ap-southeast-1` | `aws-0-ap-southeast-1.pooler.supabase.com` |
| `ap-northeast-1` | `aws-0-ap-northeast-1.pooler.supabase.com` |

Construct and append the pooler `DATABASE_URL` to `.env.local`:

```bash
POOLER_HOST="aws-0-${REGION}.pooler.supabase.com"
DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${NEW_DB_PASSWORD}@${POOLER_HOST}:6543/postgres"

cat >> .env.local <<EOF

# Supabase Database (pooler — use for ORMs like Prisma/Drizzle)
DATABASE_URL=${DATABASE_URL}
EOF
```

**Security rules:**
- `DATABASE_URL` contains the database password — must NEVER be prefixed with `NEXT_PUBLIC_`
- Never echo the `DATABASE_URL` value in user-facing output
- The pooler connection (port 6543) uses transaction mode by default, which is compatible with serverless environments

#### Sync environment variables to Vercel

Push the Supabase env vars to Vercel so deployments work out of the box:

```bash
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "$ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "$SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "$DATABASE_URL" | vercel env add DATABASE_URL production
```

If the `vercel` CLI is unavailable (Step 8c was skipped), show a checkpoint:

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Add Supabase env vars to Vercel                 ║
╚══════════════════════════════════════════════════════════════╝

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

  NEXT_PUBLIC_SUPABASE_URL       = https://<ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY  = <your anon key>
  SUPABASE_SERVICE_ROLE_KEY      = <your service_role key>
  DATABASE_URL                   = <your pooler connection string>

Mark SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL as "Sensitive" in Vercel.
```

### 8f: Better Auth & Email Setup (conditional)

**Only run this step if the user chose auth in Step 2.** If not, skip to 8g.

#### 1. Generate BETTER_AUTH_SECRET

```bash
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
```

#### 2. Write auth env vars to .env.local

```bash
cat >> .env.local <<EOF

# Better Auth
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
BETTER_AUTH_URL=http://localhost:3000
EOF
```

#### 3. Enable organizations (if selected)

If `wants_organizations` is true, also append:

```bash
cat >> .env.local <<EOF
ENABLE_ORGANIZATIONS=true
EOF
```

#### 4. Transactional email setup (optional)

Ask: **"Want to configure Resend for email verification and password resets? (emails are logged to console without it)"**

- No → skip, emails fall back to console.log in dev
- Yes → proceed with Resend CLI setup:

**4a. Install Resend CLI if needed:**

```bash
command -v resend >/dev/null 2>&1 && echo "OK" || npm install -g resend-cli
```

**4b. Authenticate — prompt user to sign up if needed:**

```
╔══════════════════════════════════════════════════════════════╗
║  Resend Setup                                                ║
╚══════════════════════════════════════════════════════════════╝

Sign up at resend.com if you haven't already, then paste
your API key from the dashboard (resend.com/api-keys).

This is a one-time step — after this, the CLI handles everything.

──────────────────────────────────────────────────────────────
→ Paste your Resend API key (or Enter to skip):
──────────────────────────────────────────────────────────────
```

If user provides a key, authenticate the CLI:

```bash
resend login --key "<pasted-key>"
```

**4c. Create a project-scoped sending key via CLI:**

```bash
PROJECT_NAME="$(basename "$(pwd)")"
RESEND_RESULT=$(resend api-keys create --name "${PROJECT_NAME}-sending" --permission sending_access --json)
RESEND_API_KEY=$(echo "$RESEND_RESULT" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).token))")
```

Append to .env.local:

```bash
cat >> .env.local <<EOF

# Resend (transactional email)
RESEND_API_KEY=${RESEND_API_KEY}
EOF
```

This creates a least-privilege sending-only key scoped to the project, rather than using the user's full-access dashboard key.

#### 5. Sync to Vercel (if available)

```bash
echo "$BETTER_AUTH_SECRET" | vercel env add BETTER_AUTH_SECRET production
```

And `RESEND_API_KEY` if configured. Mark both as Sensitive.

#### 6. Manual checkpoint (if Vercel unavailable)

If the `vercel` CLI is unavailable (Step 8c was skipped), show a checkpoint listing the env vars to add manually:

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Add auth env vars to Vercel                     ║
╚══════════════════════════════════════════════════════════════╝

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

  BETTER_AUTH_SECRET  = <generated secret>
  BETTER_AUTH_URL     = <your production URL>
  RESEND_API_KEY      = <sending key> (if configured)

Mark BETTER_AUTH_SECRET and RESEND_API_KEY as "Sensitive" in Vercel.
```

### 8g: Observability Setup

Scaffold local Sentry-compatible error tracking. This captures browser and server errors to a local SQLite store that agents can query during debugging.

#### Dependencies

Note in `.planning/REQUIREMENTS.md` that Phase 1 scaffolding must include:
```
npm install @sentry/browser @sentry/node @sentry/core better-sqlite3
npm install -D @types/better-sqlite3
```

#### Scaffold files

Create the following files using the templates documented in the `/fh:observability` skill (Section 2: Scaffolded Files Reference). Read that skill for the complete file contents.

1. **`lib/sentry-local.ts`** — SQLite-backed Sentry transport + init helpers
2. **`lib/sentry-local-query.mjs`** — CLI query tool for agents
3. **`app/api/sentry-local/route.ts`** — browser envelope receiver (tunnel endpoint)
4. **`instrumentation.ts`** — Next.js server-side Sentry init
5. **`.sentry-local/.gitignore`** — contains `*` (exclude db from git)

#### Environment setup

Add to `.env.local` (or create it):
```
SENTRY_LOCAL=true
NEXT_PUBLIC_SENTRY_LOCAL=true
```

#### Client-side init

Note in the Phase 1 plan that `app/layout.tsx` needs to call `initSentryClient()` from `lib/sentry-local`. This happens during scaffolding, not here — we just create the library files.

### 8h: Copy gitignored files to main repo (worktree only)

**Only run this step if the project is in a git worktree** (`.git` is a file, not a directory). Gitignored files like `.env.local` and `.vercel/` are not shared across worktrees, so copy them to the main repo so future worktrees can access them.

```bash
if [ -f .git ]; then
  MAIN_REPO=$(git rev-parse --git-common-dir | sed 's|/\.git.*|/|')

  # Copy .env.local
  [ -f .env.local ] && cp .env.local "$MAIN_REPO/.env.local"

  # Copy .vercel project config
  [ -d .vercel ] && cp -r .vercel "$MAIN_REPO/.vercel"
fi
```

---

## Step 8½: Conductor Configuration (conditional)

**Only run this step if Conductor is detected** (`[ -n "$CONDUCTOR_WORKSPACE_NAME" ]` or check for conductor workspace).

```bash
[ -n "$CONDUCTOR_WORKSPACE_NAME" ] && echo "CONDUCTOR" || echo "NO_CONDUCTOR"
```

If `NO_CONDUCTOR`, skip to Step 9.

If Conductor is detected, create `conductor.json` in the project root with scripts tailored to the tech stack chosen in Step 2.

**For Next.js (default stack):**

```json
{
  "scripts": {
    "setup": "npm install && [ -f \"$CONDUCTOR_ROOT_PATH/.env.local\" ] && ln -sf \"$CONDUCTOR_ROOT_PATH/.env.local\" .env.local || true; [ -d \"$CONDUCTOR_ROOT_PATH/.vercel\" ] && ln -sf \"$CONDUCTOR_ROOT_PATH/.vercel\" .vercel || true; node -e \"var fs=require('fs'),f='.claude/settings.json',s={};try{s=JSON.parse(fs.readFileSync(f,'utf8'))}catch{}s.env=Object.assign(s.env||{},{CLAUDE_CODE_TASK_LIST_ID:process.env.CONDUCTOR_WORKSPACE_NAME||'default'});fs.writeFileSync(f,JSON.stringify(s,null,2)+'\\n')\"",
    "run": "npm run dev -- --port $CONDUCTOR_PORT",
    "archive": "rm -rf \"$HOME/.claude/tasks/${CONDUCTOR_WORKSPACE_NAME}\" 2>/dev/null; true"
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TASKS": "true",
    "SENTRY_LOCAL": "true",
    "NEXT_PUBLIC_SENTRY_LOCAL": "true"
  }
}
```

> **Why `CLAUDE_CODE_TASK_LIST_ID` in the setup script?** Conductor's `env` block does not interpolate shell variables like `${CONDUCTOR_WORKSPACE_NAME}` — it passes them as literal strings. The setup script runs in a shell where `$CONDUCTOR_WORKSPACE_NAME` resolves correctly, and writes the value into `.claude/settings.json` so Claude Code picks it up. Each workspace gets its own task list so parallel workspaces don't pollute each other's tracking.
>
> **Why `CLAUDE_CODE_ENABLE_TASKS` in env?** This is a static value (no interpolation needed), so the `env` block works fine. It enables native task tracking used by `/fh:plan-work` and `/fh:build`.
>
> **Why `archive` cleans up?** Task lists persist at `~/.claude/tasks/{ID}/`. Without cleanup, old workspace task lists accumulate indefinitely. The archive script removes the directory when the workspace is torn down.

> **Why `ln -sf` for `.env.local` and `.vercel/`?** These are gitignored files, so git operations never touch them — symlinks are safe and keep all worktrees in sync bidirectionally. When the user updates `.env.local` in any worktree, all others see the change immediately. This is different from git-tracked files, where symlinks into `$CONDUCTOR_ROOT_PATH` could break during checkout.

**For other common stacks** — adapt the scripts:

| Stack | Setup script | Run script |
|-------|-------------|------------|
| Next.js | `npm install && ln -sf "$CONDUCTOR_ROOT_PATH/.env.local" .env.local 2>/dev/null; true` | `npm run dev -- --port $CONDUCTOR_PORT` |
| Rails | `bundle install && ln -sf "$CONDUCTOR_ROOT_PATH/.env" .env 2>/dev/null; true` | `bin/rails server -p $CONDUCTOR_PORT` |
| Django | `pip install -r requirements.txt && ln -sf "$CONDUCTOR_ROOT_PATH/.env" .env 2>/dev/null; true` | `python manage.py runserver $CONDUCTOR_PORT` |
| Phoenix | `mix deps.get && ln -sf "$CONDUCTOR_ROOT_PATH/.env" .env 2>/dev/null; true` | `mix phx.server` (uses `PORT=$CONDUCTOR_PORT`) |
| Vite | `npm install && ln -sf "$CONDUCTOR_ROOT_PATH/.env" .env 2>/dev/null; true` | `npm run dev -- --port $CONDUCTOR_PORT` |

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

## Step 9: Handoff

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
- Starter template          — cinjoff/fh-starter-project (if default stack)
- shadcn skills             — global agent context for components (if installed)
- Vercel project            — linked (auto-deploys on push to main)
- Supabase project          — <project-url> (if set up)
- Better Auth               — secret generated, auth API at /api/auth/[...all] (if auth enabled)
- Resend                    — API key configured for transactional email (if set up)
- Organizations             — multi-tenant support enabled (if enabled)
- .env.local                — API keys + DATABASE_URL configured (if Supabase)
- lib/sentry-local.ts       — local error tracking (Sentry SDK → SQLite)
- lib/sentry-local-query.mjs — error query CLI for agents
- .sentry-local/             — error store (gitignored, per-worktree)
- conductor.json            — Conductor workspace scripts (if Conductor detected)

Error tracking is active in dev by default. Run `node lib/sentry-local-query.mjs recent` to see captured errors, or let `/fh:fix` query them automatically.

Next: run /fh:plan to plan your first phase.
```

If Supabase was set up, add this reminder:

```
⚠ Supabase security reminder:
  - Enable Row Level Security (RLS) on every table you create
  - The anon key is safe for client-side use ONLY with RLS enabled
  - The service_role key bypasses RLS — use only in server-side code
```

If Resend was configured, add this reminder:

```
Resend note:
  - Verify your sending domain at resend.com/domains for production use
  - Development emails work immediately with the API key
  - Without RESEND_API_KEY, emails are logged to console (safe for dev)
```
