---
name: fh:new-project
description: Bootstrap a new tracked project with design framework, conventions, and GSD roadmap. Use when the user says 'new project', 'start a project', 'bootstrap', 'set up a new app', or 'initialize'. Creates .planning/ structure and CLAUDE.md. Supports --auto flag for fully autonomous project creation.
user-invocable: true
---

Bootstrap a new project with opinionated defaults, design framework, and full GSD tracking.

$ARGUMENTS

You are a **lean orchestrator**. Guide the user through setup, delegate heavy work to framework skills.

## Auto Mode Detection

Parse `$ARGUMENTS` for `--auto` flag:
- If present: set `AUTO_PROJECT = true`, extract the remaining text as the project description
- If absent: proceed normally (no behavioral change)

Example: `/fh:new-project --auto "A SaaS platform for managing pet grooming appointments"`

> **Dependency check:** All tools are built into this plugin — engineering disciplines, design quality commands, GSD CLI (`gsd-tools.cjs`), and TypeScript LSP. GSD will be initialized per-project in Step 7.

---

## Step 0: Brownfield Detection

Before starting, check if this is an existing project:

```bash
[ -d ".planning" ] && echo "EXISTING_PROJECT" || echo "NEW_PROJECT"
```

### If `EXISTING_PROJECT`: run Sync Mode

This project already has `.planning/` state — likely from a previous `/fh:new-project` run. Instead of refusing, audit what exists and fill gaps. This is the expected path after `/fh:update` brings new plugin capabilities.

**Audit checklist — check each item and only act on what's missing or outdated:**

#### Planning files

| Check | How | If missing |
|-------|-----|------------|
| `.planning/PROJECT.md` | `[ -f .planning/PROJECT.md ]` | Create from existing codebase context (read CLAUDE.md, package.json, etc.) |
| `.planning/REQUIREMENTS.md` | `[ -f .planning/REQUIREMENTS.md ]` | Create from ROADMAP.md phases if available |
| `.planning/ROADMAP.md` | `[ -f .planning/ROADMAP.md ]` | Create from existing phases in `.planning/` |
| `.planning/STATE.md` | `[ -f .planning/STATE.md ]` | Create with current phase position |
| `.planning/config.json` | `[ -f .planning/config.json ]` | Run `node ./.claude/get-shit-done/bin/gsd-tools.cjs config-ensure-section` |
| `.planning/DECISIONS.md` | `[ -f .planning/DECISIONS.md ]` | Create empty with header — decisions accumulate over time |
| `.planning/DESIGN.md` | `[ -f .planning/DESIGN.md ]` | Note as optional — user can run `/fh:ui-branding` when ready |

#### GSD tooling

| Check | How | If missing |
|-------|-----|------------|
| GSD global symlink | `[ -f "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" ]` | Create symlink (same as Step 7) |
| GSD project symlink | `[ -d .claude/get-shit-done/bin ]` | `mkdir -p .claude/get-shit-done && ln -sfn "$HOME/.claude/get-shit-done/bin" .claude/get-shit-done/bin` |
| `config.json` freshness | Always run | `node ./.claude/get-shit-done/bin/gsd-tools.cjs config-ensure-section` — creates config with defaults if missing; skips if already present (runtime defaults cover missing keys) |

#### Template identity cleanup

| Check | How | If stale |
|-------|-----|----------|
| `package.json` name | `node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8'));console.log(p.name==='fh-starter-project'?'STALE':'OK')"` | Update `name` to `$(basename "$(pwd)")` — the project was scaffolded from the starter template but never customized |
| `supabase/config.toml` project_id | `grep -q 'fh-starter-project\|fh_starter_project' supabase/config.toml 2>/dev/null` | Update `project_id` to match the project name |
| Remaining template refs | `grep -rl "fh-starter-project" --include="*.ts" --include="*.json" --include="*.toml" . 2>/dev/null \| grep -v node_modules` | Replace with actual project name |

#### Project config

| Check | How | If missing |
|-------|-----|------------|
| `CLAUDE.md` | `[ -f CLAUDE.md ]` | Run `/fh:revise-claude-md init` |
| `.claude/rules/` | `[ -d .claude/rules ]` | Will be created by `/fh:map-codebase` below |

#### Codebase mapping (context-mode)

| Check | How | If missing |
|-------|-----|------------|
| `.planning/codebase/` | `[ -d .planning/codebase ]` | Run `/fh:map-codebase` — spawns 4 mapper agents, writes codebase docs, creates `.claude/rules/`, indexes into FTS5 |
| Mapping freshness | Check if `.planning/codebase/` exists but is stale (significant commits since last map) | Re-run `/fh:map-codebase` to refresh |

#### Agent skills (global)

| Check | How | If missing |
|-------|-----|------------|
| shadcn skills | `[ -d "$HOME/.skills/shadcn" ]` | `cd "$HOME" && npx skills add shadcn/ui` |

#### Observability

| Check | How | If missing |
|-------|-----|------------|
| `lib/sentry-local.ts` | `[ -f lib/sentry-local.ts ]` | Scaffold from `/fh:observability` skill templates (Section 2) |
| `lib/sentry-local-query.mjs` | `[ -f lib/sentry-local-query.mjs ]` | Scaffold alongside sentry-local.ts |
| `.sentry-local/.gitignore` | `[ -d .sentry-local ]` | `mkdir -p .sentry-local && echo '*' > .sentry-local/.gitignore` |
| `instrumentation.ts` | `[ -f instrumentation.ts ]` | Scaffold from `/fh:observability` skill templates |
| Sentry env vars in `.env.local` | `grep -q SENTRY_LOCAL .env.local 2>/dev/null` | Append `SENTRY_LOCAL=true` and `NEXT_PUBLIC_SENTRY_LOCAL=true` |

#### Infrastructure (check only — do NOT re-create)

These are one-time external integrations. Sync mode only checks and reports status, it does not re-run setup.

| Check | How | Report |
|-------|-----|--------|
| Git repo | `git rev-parse --is-inside-work-tree 2>/dev/null` | `✓ git` or `⚠ not a git repo` |
| GitHub remote | `git remote get-url origin 2>/dev/null` | `✓ origin: <url>` or `⊘ no remote` |
| Vercel project | `[ -d .vercel ] \|\| [ -d "$CONDUCTOR_ROOT_PATH/.vercel" ]` | `✓ vercel linked` or `⊘ not linked (run vercel link)`. If found at `$CONDUCTOR_ROOT_PATH` but not locally, create symlink: `ln -sf "$CONDUCTOR_ROOT_PATH/.vercel" .vercel` |
| Supabase (cloud) | `grep -q 'supabase\.co' .env.local 2>/dev/null` | `✓ supabase cloud configured` or `⊘ no cloud supabase` |
| Supabase (local) | `[ -d supabase ] && docker ps 2>/dev/null \| grep -q supabase` | `✓ supabase local running` or `⊘ supabase local stopped (run $PM run db:start)` or `⊘ no local supabase` |
| Container runtime | `docker info >/dev/null 2>&1 && docker context show` | `✓ docker via {context}` or `⊘ no container runtime` |
| `components.json` | `[ -f components.json ]` | `✓ shadcn/ui configured` or `⊘ no shadcn/ui init` |

#### Conductor (conditional)

| Check | How | If missing |
|-------|-----|------------|
| `conductor.json` | `[ -f conductor.json ]` and `[ -n "$CONDUCTOR_WORKSPACE_NAME" ]` | Create from Step 8½ logic |

**Sync mode behavior:**
1. Run the audit silently — do NOT ask the user about project vision, tech stack, or brand. Those decisions are already made.
2. For each missing item, create it by inferring from existing project context (read `CLAUDE.md`, `package.json`, `.planning/` files, and the codebase).
3. For `config.json`: run `gsd-tools config-ensure-section` — creates with defaults if missing, skips if already present. Users can keep a minimal config (e.g. just `plan_limits`) since `loadConfig()` provides runtime defaults for anything omitted.
4. For codebase mapping: if `.planning/codebase/` is missing, run `/fh:map-codebase`. This is important for context-mode to work well.
5. For observability: if any sentry-local files are missing, scaffold the full set from `/fh:observability` templates. Partial scaffolding causes runtime errors.
6. Report what was added/updated and what was already present.

**Sync mode output:**

```
Project sync complete:

  Planning:
  ✓ .planning/PROJECT.md       — already present
  ✓ .planning/REQUIREMENTS.md  — already present
  ✓ .planning/ROADMAP.md       — already present
  ✓ .planning/STATE.md         — already present
  ✓ .planning/config.json      — updated (new fields merged)
  ✓ .planning/DECISIONS.md     — already present

  Tooling:
  + GSD project symlink         — created
  ✓ CLAUDE.md                  — already present
  + .planning/codebase/         — mapped (4 agents, indexed)
  + .claude/rules/              — created from codebase map

  Skills:
  ✓ shadcn skills              — already installed

  Observability:
  ✓ lib/sentry-local.ts        — already present
  ✓ lib/sentry-local-query.mjs — already present
  ✓ .sentry-local/             — already present

  Infrastructure:
  ✓ git                        — origin: git@github.com:user/repo.git
  ✓ vercel                     — linked
  ⊘ supabase                   — not configured
  ⊘ .planning/DESIGN.md        — not set up (run /fh:ui-branding when ready)
  ⊘ conductor.json             — skipped (not in Conductor)

  Legend: ✓ = present  + = created/fixed  ⊘ = optional, skipped
```

After reporting, stop. Do NOT continue to Step 1 or any subsequent steps.

### If `NEW_PROJECT`: continue to Step 0.5

---

## Step 0.5: Startup Artifact Detection

Check if startup validation artifacts exist:

```bash
[ -d ".planning/startup" ] && echo "STARTUP_ARTIFACTS" || echo "NO_STARTUP"
```

### If `STARTUP_ARTIFACTS`: Pre-populate from startup data

Read available startup artifacts and use them to auto-populate project vision. This saves the user from re-answering questions already covered by `/fh:startup-design`.

**Read these files (skip any that don't exist):**
- `.planning/startup/brief.md` → project description, problem, target users, founder context
- `.planning/startup/validation/scorecard.md` → validation results, go/no-go verdict
- `.planning/startup/strategy/lean-canvas.md` → business model, value proposition
- `.planning/startup/strategy/positioning.md` → market positioning, competitive alternatives
- `.planning/startup/financial/revenue-model.md` → pricing, revenue projections
- `.planning/startup/discovery/market-analysis.md` → market size, trends
- `.planning/startup/discovery/target-audience.md` → user personas, pain points
- `.planning/startup/positioning/positioning-doc.md` → Dunford positioning (if deeper analysis was run)
- `.planning/startup/competitors/competitors-report.md` → competitive landscape (if deeper analysis was run)

**Auto-derive Step 1 answers:**
1. **What** → from brief.md (the idea/solution)
2. **Who** → from brief.md + target-audience.md (target users)
3. **Why** → from brief.md + lean-canvas.md (problem + value proposition)
4. **Scope** → from lean-canvas.md + scorecard.md (MVP features, validated scope)
5. **Constraints** → from brief.md (founder context, budget, timeline)
6. **Success criteria** → from scorecard.md + revenue-model.md (validation metrics, revenue targets)

Present the derived answers to the user: "I found startup validation artifacts from a previous `/fh:startup-design` session. Here's what I've derived for your project:"

Show all 6 derived answers and ask: "Does this look right? Anything to adjust?"

If the user confirms, skip Step 1 and proceed to Step 2 with these answers locked.

### If `NO_STARTUP`: continue to Step 1

Proceed with the full greenfield flow below.

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

### Auto Mode

If `AUTO_PROJECT` is true, derive all 6 answers from the project description. Do not ask questions interactively. Auto-answer using best judgment. Log each derived answer as a decision in `.planning/DECISIONS.md` (create if needed, following the format in `.claude/skills/build/references/decisions-template.md`).

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

### Auto Mode

If `AUTO_PROJECT` is true, use default stack. Auto-decide auth/organizations based on whether the description implies user accounts, login, teams, etc. Log decisions to `.planning/DECISIONS.md`.

### 2a: Detect Package Manager

Detect the project's package manager from the lockfile in the working directory. This determines all install/run commands for the rest of the setup.

```bash
if [ -f pnpm-lock.yaml ]; then echo "pnpm"
elif [ -f yarn.lock ]; then echo "yarn"
elif [ -f bun.lockb ] || [ -f bun.lock ]; then echo "bun"
else echo "npm"
fi
```

Track the result as `$PM` for the rest of the flow. Use `$PM install`, `$PM run`, `$PM add`, `$PM add -D` (or equivalent) instead of hardcoded `npm` commands. For pnpm: `pnpm add` / `pnpm add -D`. For yarn: `yarn add` / `yarn add -D`. For bun: `bun add` / `bun add -d`.

If no lockfile exists yet (brand new project), ask the user which package manager to use, defaulting to **pnpm**.

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

#### Auto Mode

If `AUTO_PROJECT` is true, skip brand extraction. Use defaults (no preset customization). Proceed directly to the "user skips entirely" path below.

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
npx shadcn@latest init --yes --preset "{generated URL}"
```
For example:
```bash
npx shadcn@latest init --yes --preset "https://ui.shadcn.com/create?style=nova&baseColor=neutral&theme=blue&font=inter&iconLibrary=phosphor"
```
Store the full URL and parameter set in `.planning/PROJECT.md` for reproducibility. Note: the CLI does NOT have individual flags like `--style` or `--font` — all design parameters must go through `--preset`.

**If user chooses 2 (tweaked):** They paste back a preset code from the customizer. Use that code for `npx shadcn@latest init --yes --preset <CODE>`.

**If user chooses 3 (start over):** Re-run the Brand Extraction flow with new references.

**If the user skips entirely (no references, presses Enter):**
- Phase 1 will run `npx shadcn@latest init --yes` with default settings
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
  2. Install: $PM add @phosphor-icons/react
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

**Create a new repository from the template.** This gives us a clean git history, proper GitHub template linkage, and avoids the messy rsync-into-existing-repo pattern.

Derive the project name from the current directory:

```bash
PROJECT_NAME="$(basename "$(pwd)")"
```

**Determine the scaffolding strategy based on the current directory state:**

```bash
# Check if we're in an empty directory or an existing repo
IS_GIT=$(git rev-parse --is-inside-work-tree 2>/dev/null && echo "true" || echo "false")
IS_EMPTY=$([ -z "$(ls -A . 2>/dev/null | grep -v '^\.\(git\|planning\|claude\)$')" ] && echo "true" || echo "false")
HAS_REMOTE=$(git remote get-url origin 2>/dev/null && echo "true" || echo "false")
echo "IS_GIT=$IS_GIT IS_EMPTY=$IS_EMPTY HAS_REMOTE=$HAS_REMOTE"
```

#### Strategy A: Fresh start (no git or empty directory — the common case)

This is the cleanest path. Create a new GitHub repo from the template, then clone it into the current directory:

```bash
# Remove any existing empty .git (fresh git init with no commits)
if [ "$IS_GIT" = "true" ]; then
  COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
  if [ "$COMMIT_COUNT" = "0" ]; then
    rm -rf .git
  fi
fi

# Create a new private repo from the template
gh repo create "$PROJECT_NAME" --private --template cinjoff/fh-starter-project

# Clone into a temp location (gh repo create --template doesn't support --clone into non-empty dirs)
TMPDIR=$(mktemp -d)
gh repo clone "cinjoff/$PROJECT_NAME" "$TMPDIR/$PROJECT_NAME"

# Move everything (including .git and dotfiles) into the project directory — POSIX-portable
find "$TMPDIR/$PROJECT_NAME" -maxdepth 1 -mindepth 1 -exec mv {} . \;

# Clean up
rm -rf "$TMPDIR"

scaffold_strategy="template_repo"
echo "✓ Created repo from template — origin set to cinjoff/$PROJECT_NAME"
```

> **Why `--template` instead of `--clone`?** GitHub's template repos create a NEW repo with a single "Initial commit" (clean history), set the "generated from" badge on GitHub, and don't carry the template's commit history. This is better than forking (which carries all history and implies upstream tracking) or rsync (which loses git provenance).

**If `gh repo create --template` fails** (e.g., the template repo isn't marked as a GitHub template, or the user doesn't have create permissions), fall back to the clone+rsync approach:

```bash
# Fallback: clone and copy files
TMPDIR=$(mktemp -d)
gh repo clone cinjoff/fh-starter-project "$TMPDIR/starter" -- --depth 1
rsync -a --exclude='.git' "$TMPDIR/starter/" ./
rm -rf "$TMPDIR"
scaffold_strategy="rsync_copy"
echo "⚠ Fell back to rsync (template creation failed) — you'll need to create a GitHub repo manually in Step 8b"
```

#### Strategy B: Existing repo with remote (e.g., Conductor worktree)

When running inside a Conductor workspace or an existing repo that already has a remote, we can't replace .git. Use the rsync approach but with a cleaner commit message:

```bash
TMPDIR=$(mktemp -d)
gh repo clone cinjoff/fh-starter-project "$TMPDIR/starter" -- --depth 1
rsync -a --exclude='.git' "$TMPDIR/starter/" ./
rm -rf "$TMPDIR"
scaffold_strategy="rsync_copy"
echo "✓ Template files copied into existing repo"
```

> **Note:** Strategy B skips Steps 8a and 8b since the repo and remote already exist. The template commit in this case is just a regular commit on the existing branch.

**Track which strategy was used** as `scaffold_strategy` (`template_repo` or `rsync_copy`) — this determines whether Steps 8a/8b are needed later.

### 3a: Customize Template for This Project

The starter template ships with generic placeholder names. Update them to match the actual project before installing dependencies.

Derive the project name from the directory name (kebab-case):

```bash
PROJECT_NAME="$(basename "$(pwd)")"
```

#### 1. Update package.json

Read `package.json` and update these fields:

```bash
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const name = '${PROJECT_NAME}'.toLowerCase().replace(/[^a-z0-9-]/g, '-');
pkg.name = name;
pkg.version = '0.1.0';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✓ package.json name: ' + name);
"
```

#### 2. Update supabase/config.toml project_id

The Supabase CLI uses `project_id` for container naming and `.orb.local` domains. Update it from the template default:

```bash
if [ -f supabase/config.toml ]; then
  # Replace the project_id with the project name (must be alphanumeric + hyphens)
  SAFE_NAME=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')
  sed -i '' "s/^project_id = \".*\"/project_id = \"$SAFE_NAME\"/" supabase/config.toml
  echo "✓ supabase project_id: $SAFE_NAME"
fi
```

#### 3. Replace template README

The starter template's README describes the template itself. Replace it with a minimal project-specific one:

```bash
cat > README.md <<EOF
# ${PROJECT_NAME}

> TODO: Add project description

## Getting Started

\`\`\`bash
pnpm install
pnpm run setup   # starts local Supabase, seeds database
pnpm run dev     # starts Next.js dev server
\`\`\`

## Scripts

| Command | Description |
|---------|-------------|
| \`pnpm dev\` | Start development server |
| \`pnpm build\` | Production build |
| \`pnpm test\` | Run unit tests |
| \`pnpm test:e2e\` | Run Playwright E2E tests |
| \`pnpm run db:start\` | Start local Supabase |
| \`pnpm run db:stop\` | Stop local Supabase |
| \`pnpm run db:reset\` | Reset DB + re-seed |
| \`pnpm run db:studio\` | Open Supabase Studio |
EOF
echo "✓ README.md replaced with project-specific version"
```

#### 4. Remove template CLAUDE.md

The starter template includes its own `CLAUDE.md` describing template conventions. Remove it — Step 5 generates a fresh one tailored to this project's actual vision and stack:

```bash
rm -f CLAUDE.md
echo "✓ Template CLAUDE.md removed (Step 5 will generate project-specific one)"
```

#### 5. Scrub remaining template references

Search for and replace any remaining "fh-starter-project" references in non-binary files:

```bash
# Find files still referencing the template name (excluding node_modules, .git)
REFS=$(grep -rl "fh-starter-project" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.md" --include="*.toml" --include="*.yaml" --include="*.yml" . 2>/dev/null | grep -v node_modules | grep -v .git)

if [ -n "$REFS" ]; then
  echo "Updating template references in:"
  echo "$REFS" | while read -r file; do
    sed -i '' "s/fh-starter-project/$PROJECT_NAME/g" "$file"
    echo "  ✓ $file"
  done
else
  echo "✓ No remaining template references found"
fi
```

#### 6. Update .env.example (if present)

If the template includes `.env.example`, update the `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` comments to use the project name:

```bash
if [ -f .env.example ]; then
  sed -i '' "s/fh-starter-project/$PROJECT_NAME/g" .env.example
  echo "✓ .env.example updated"
fi
```

---

Pin Node version so all environments (shell, Conductor, CI) agree. This prevents native module version mismatches:

```bash
# Use the current major version — .node-version is respected by nvm, fnm, and Conductor
node -e "console.log(process.versions.node.split('.')[0])" > .node-version
```

Install dependencies using the detected package manager (`$PM`):

```bash
$PM install
```

Rebuild native modules (better-sqlite3 needs compiled bindings for the local platform):

```bash
cd node_modules/better-sqlite3 && npx --yes prebuild-install && cd ../.. || $PM rebuild better-sqlite3 || true
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

Commit the template scaffolding (only for Strategy B — Strategy A already has the initial commit from `gh repo create --template`):

```bash
if [ "$scaffold_strategy" = "rsync_copy" ]; then
  git add -A
  git commit -m "feat: scaffold from fh-starter-project template"
fi
```

Do NOT push yet — later steps (Supabase, planning files) will commit on top.

---

## Step 4: Design Framework (optional)

### Auto Mode

If `AUTO_PROJECT` is true, skip design framework setup entirely. Design setup deferred to first build phase.

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

### Auto Mode

If `AUTO_PROJECT` is true, always run research (option 1). Auto mode needs domain context for quality roadmap creation. Skip the user prompt and proceed directly to the research flow.

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

### Auto Mode

If `AUTO_PROJECT` is true, use **SCOPE EXPANSION** thinking to produce an ambitious multi-milestone roadmap. This is the ONE place where scope expansion applies — dream big, envision the platonic ideal. Subsequent `/fh:plan-review` calls will use HOLD SCOPE to keep execution disciplined.

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

# Gather project context (outputs JSON to stdout — does NOT write files)
node ./.claude/get-shit-done/bin/gsd-tools.cjs init new-project

# Create config.json with defaults (or merge new keys if it already exists)
node ./.claude/get-shit-done/bin/gsd-tools.cjs config-ensure-section
```

**Ask the user to choose a model profile:**

```
AskUserQuestion([
  {
    question: "Which model profile should agents use?",
    header: "Model Profile",
    multiSelect: false,
    options: [
      { label: "Balanced (Recommended)", description: "Opus for planning, Sonnet for execution. Good balance of quality and cost." },
      { label: "Budget", description: "Sonnet for execution, Haiku for research/verification. Uses far fewer tokens — best if you're hitting usage limits." },
      { label: "Quality", description: "Opus for most agents. Highest quality but uses ~3-5x more tokens than Balanced — you'll hit your daily limit much faster." }
    ]
  }
])
```

Map the selection to a profile value:
- "Balanced (Recommended)" → `"balanced"`
- "Budget" → `"budget"`
- "Quality" → `"quality"`

Read `.planning/config.json`, set the `model_profile` field to the mapped value, and write it back.

### 7b: Ensure `.claude/settings.json` exists

The global update (`/fh:update --global`) and post-update reconciliation depend on `.claude/settings.json` to store per-project env vars like `CLAUDE_MEM_PROJECT`. Create it if missing:

```bash
mkdir -p .claude
if [ ! -f .claude/settings.json ]; then
  echo '{}' > .claude/settings.json
  echo "SETTINGS_CREATED"
else
  echo "SETTINGS_EXISTS"
fi
```

Then run the post-update-reconcile script to populate `CLAUDE_MEM_PROJECT` and register the project in the tracker:

```bash
[ -f "$HOME/.claude/get-shit-done/bin/post-update-reconcile.sh" ] && \
  sh "$HOME/.claude/get-shit-done/bin/post-update-reconcile.sh" --project-root "$PWD" || true
```

Commit: `docs: initialize project planning with GSD structure`

---

## Step 8: Infrastructure Setup

Set up GitHub and Vercel so the project is ready for deployment from day one.

### 8a: Initialize git (if needed)

**If `scaffold_strategy` is `template_repo`:** Git is already initialized with a remote — skip to 8b verification.

**Otherwise:**

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

**If `scaffold_strategy` is `template_repo`:** The repo was already created on GitHub in Step 3. Verify the remote is set:

```bash
git remote get-url origin 2>/dev/null && echo "REMOTE_EXISTS: $(git remote get-url origin)" || echo "NO_REMOTE"
```

If `REMOTE_EXISTS`, show the URL and skip creation. If `NO_REMOTE` (shouldn't happen with Strategy A), fall through to creation below.

**Otherwise:** Check if a remote already exists:

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

  # Move .vercel to main repo and symlink back so all worktrees share it
  if [ -d .vercel ] && [ ! -L .vercel ]; then
    MAIN_REPO=$(git rev-parse --git-common-dir | sed 's|/\.git.*|/|')
    cp -r .vercel "$MAIN_REPO/.vercel"
    rm -rf .vercel
    ln -sf "$MAIN_REPO/.vercel" .vercel
  fi
fi
```

This writes `.vercel/project.json` with the project and org IDs. In worktree environments, the directory is moved to the main repo and symlinked back so future worktrees get it via the conductor setup script.

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

#### Choose local vs cloud Supabase

Ask:

```
╔══════════════════════════════════════════════════════════════╗
║  SUPABASE: Development Environment                           ║
╚══════════════════════════════════════════════════════════════╝

How would you like to set up Supabase for local development?

  1. Local only (Recommended) — Supabase runs in Docker containers
     on your machine. No account needed. Best for development.

  2. Cloud only — Create a hosted Supabase project. Requires a
     Supabase account. Good for team collaboration.

  3. Both — Local containers for dev + cloud project for staging/prod.

──────────────────────────────────────────────────────────────
```

Track the choice as `supabase_mode` (local, cloud, both).

#### Auto Mode

If `AUTO_PROJECT` is true, default to `local` — local development is self-contained and requires no accounts.

---

#### 8e-local: Local Supabase via OrbStack/Docker

**Run this section if `supabase_mode` is `local` or `both`.**

##### 1. Detect container runtime

```bash
# Detect platform and macOS version (OrbStack requires macOS 13+)
PLATFORM="$(uname -s)"
MACOS_OK=false
if [ "$PLATFORM" = "Darwin" ]; then
  MACOS_VER=$(sw_vers -productVersion 2>/dev/null | cut -d. -f1)
  [ "${MACOS_VER:-0}" -ge 13 ] && MACOS_OK=true
  echo "macOS version: $(sw_vers -productVersion 2>/dev/null) (OrbStack compatible: $MACOS_OK)"
fi

# Check for OrbStack (macOS preferred runtime — ~2x less power, dynamic memory, auto .orb.local domains)
HAS_ORBSTACK=false
if [ -d "/Applications/OrbStack.app" ] || command -v orb >/dev/null 2>&1; then
  HAS_ORBSTACK=true
fi

# Check for Docker (Docker Desktop or standalone)
HAS_DOCKER=false
if command -v docker >/dev/null 2>&1; then
  HAS_DOCKER=true
fi

# Check if any Docker daemon is running
DOCKER_RUNNING=false
if docker info >/dev/null 2>&1; then
  DOCKER_RUNNING=true
fi

# Check active Docker context
DOCKER_CONTEXT="none"
if [ "$HAS_DOCKER" = true ]; then
  DOCKER_CONTEXT=$(docker context show 2>/dev/null || echo "default")
fi

echo "PLATFORM=$PLATFORM MACOS_OK=$MACOS_OK HAS_ORBSTACK=$HAS_ORBSTACK HAS_DOCKER=$HAS_DOCKER DOCKER_RUNNING=$DOCKER_RUNNING DOCKER_CONTEXT=$DOCKER_CONTEXT"
```

##### 2. Install or configure container runtime

Follow this decision tree:

**macOS — OrbStack preferred (requires macOS 13+):**

| State | Action |
|-------|--------|
| Neither installed, macOS 13+ | Install OrbStack: `brew install orbstack`, wait for it to start, verify with `docker info` |
| Neither installed, macOS <13 | Install Docker Desktop: direct user to docker.com/products/docker-desktop (OrbStack requires macOS 13+) |
| OrbStack installed, not running | Start it: `open -a OrbStack` or `orb start`, wait up to 30s for `docker info` to succeed |
| OrbStack installed and running | Proceed — no action needed |
| Docker Desktop only, no OrbStack, macOS 13+ | Ask: "OrbStack uses ~2x less power than Docker Desktop, returns memory to macOS when idle, and gives containers automatic `.orb.local` domains. Install it? (Y/n)". If yes: `brew install orbstack` — existing Docker data can be migrated with `orb docker migrate` (copies, doesn't move). If no: use Docker Desktop as-is |
| Docker Desktop only, macOS <13 | Use Docker Desktop as-is (OrbStack requires macOS 13+) |
| Both installed | Check active context with `docker context show`. If not `orbstack`, suggest: `docker context use orbstack`. **Credential store note:** OrbStack uses `osxkeychain`, Docker Desktop uses `desktop` — user may need to `docker login` again after switching. Proceed with whichever is active |

**Linux / CI:**

| State | Action |
|-------|--------|
| Docker installed and running | Proceed |
| Docker installed, not running | `sudo systemctl start docker` or equivalent |
| Docker not installed | Show install instructions for the distro and exit |

##### 3. Configure DOCKER_HOST for OrbStack (macOS only)

If OrbStack is the active runtime, the Supabase CLI may not find its Docker socket. Check and fix:

```bash
if [ "$HAS_ORBSTACK" = true ] && [ "$PLATFORM" = "Darwin" ]; then
  # Check if DOCKER_HOST is already set correctly
  if [ -z "$DOCKER_HOST" ] || ! echo "$DOCKER_HOST" | grep -q "orbstack"; then
    # Check if /var/run/docker.sock is OrbStack's symlink
    if [ -S "/var/run/docker.sock" ] && docker info 2>/dev/null | grep -q "orbstack"; then
      echo "DOCKER_HOST not needed — /var/run/docker.sock points to OrbStack"
    else
      export DOCKER_HOST="unix://$HOME/.orbstack/run/docker.sock"
      echo "DOCKER_HOST set to OrbStack socket"

      # Persist to shell profile
      SHELL_NAME="$(basename "$SHELL")"
      case "$SHELL_NAME" in
        fish)
          fish -c 'set -Ux DOCKER_HOST "unix://$HOME/.orbstack/run/docker.sock"' 2>/dev/null
          echo "Added DOCKER_HOST to fish universal variables"
          ;;
        zsh)
          if ! grep -q 'DOCKER_HOST.*orbstack' "$HOME/.zshrc" 2>/dev/null; then
            echo 'export DOCKER_HOST="unix://$HOME/.orbstack/run/docker.sock"' >> "$HOME/.zshrc"
            echo "Added DOCKER_HOST to ~/.zshrc"
          fi
          ;;
        bash)
          if ! grep -q 'DOCKER_HOST.*orbstack' "$HOME/.bashrc" 2>/dev/null; then
            echo 'export DOCKER_HOST="unix://$HOME/.orbstack/run/docker.sock"' >> "$HOME/.bashrc"
            echo "Added DOCKER_HOST to ~/.bashrc"
          fi
          ;;
      esac
    fi
  fi
fi
```

##### 4. Install Supabase CLI

```bash
command -v supabase >/dev/null 2>&1 && echo "OK supabase $(supabase --version 2>/dev/null)" || echo "MISSING supabase"
```

If `MISSING`:

```bash
# macOS
brew install supabase/tap/supabase

# Or via npm (cross-platform fallback)
# npm install -g supabase
```

##### 5. Initialize Supabase locally

If the starter template was used (Step 3), `supabase/` already exists with `config.toml` and migrations. Skip initialization:

```bash
if [ -d "supabase" ] && [ -f "supabase/config.toml" ]; then
  echo "✓ supabase/ already exists (from starter template) — skipping init"
else
  # Initialize Supabase project structure (creates supabase/ directory)
  supabase init 2>/dev/null || true
fi
```

Edit `supabase/config.toml` to configure local development (if not already configured by the starter template):
- Postgres on port 54322 (default)
- Keep Studio enabled on port 54323 (useful for inspecting data)
- Keep other services at defaults

##### 6. Start local Supabase

```bash
supabase start
```

This pulls Docker images and starts containers. First run takes 2-5 minutes. The output includes local credentials (API URL, anon key, service_role key, DB URL).

Capture the output and extract credentials:

```bash
# Get local credentials from supabase status
SUPABASE_STATUS=$(supabase status -o json 2>/dev/null || supabase status 2>/dev/null)

# Parse from JSON output if available
LOCAL_API_URL=$(echo "$SUPABASE_STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('API_URL','http://127.0.0.1:54321'))" 2>/dev/null || echo "http://127.0.0.1:54321")
LOCAL_ANON_KEY=$(echo "$SUPABASE_STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ANON_KEY',''))" 2>/dev/null)
LOCAL_SERVICE_KEY=$(echo "$SUPABASE_STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('SERVICE_ROLE_KEY',''))" 2>/dev/null)
LOCAL_DB_URL=$(echo "$SUPABASE_STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('DB_URL','postgresql://postgres:postgres@127.0.0.1:54322/postgres'))" 2>/dev/null || echo "postgresql://postgres:postgres@127.0.0.1:54322/postgres")
```

##### 7. Run existing migrations and seeds

Check for and run any existing migrations and seed data. The starter template uses a TypeScript seed script (`scripts/seed.ts`) via `tsx` instead of `supabase/seed.sql`, so check for both:

```bash
# Check for migration files
MIGRATION_COUNT=$(ls supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
echo "Found $MIGRATION_COUNT migration(s)"

# Check for seed files (SQL and TypeScript)
HAS_SQL_SEED=false
HAS_TS_SEED=false
HAS_SEED_SCRIPT=false
[ -f "supabase/seed.sql" ] && HAS_SQL_SEED=true
[ -f "scripts/seed.ts" ] && HAS_TS_SEED=true

# Check for db:seed or db:reset script in package.json
if [ -f "package.json" ]; then
  HAS_SEED_SCRIPT=$(node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8'));console.log(p.scripts?.['db:seed']||p.scripts?.['db:reset']?'true':'false')" 2>/dev/null || echo "false")
fi

echo "SQL seed (supabase/seed.sql): $HAS_SQL_SEED"
echo "TS seed (scripts/seed.ts): $HAS_TS_SEED"
echo "Seed script in package.json: $HAS_SEED_SCRIPT"

if [ "$MIGRATION_COUNT" -gt 0 ]; then
  # Apply migrations to local database
  supabase db reset
  echo "✓ Migrations applied"
  [ "$HAS_SQL_SEED" = true ] && echo "✓ SQL seed data loaded via supabase db reset"
fi

# Run TypeScript seed if present (starter template pattern)
if [ "$HAS_TS_SEED" = true ]; then
  echo "Running TypeScript seed script..."
  npx tsx scripts/seed.ts && echo "✓ TypeScript seed data loaded (test users, orgs, members)" || echo "⚠ Seed script failed — run '$PM run db:seed' manually after fixing"
elif [ "$HAS_SQL_SEED" = false ] && [ "$MIGRATION_COUNT" -eq 0 ]; then
  echo "No migrations or seed data found — database is empty"
  echo "Tip: Create migrations with 'supabase migration new <name>'"
fi
```

The starter template's `scripts/seed.ts` creates Better Auth tables (`user`, `account`, `session`, `verification`) and seeds test data (3 users, 3 orgs, members, customers). It uses the `DATABASE_URL` from `.env.local` — ensure that file exists before running the seed.

**For brownfield projects** (existing codebase with migrations): The `supabase db reset` command drops and recreates the database, applies all migrations in order, then runs `seed.sql`. This is the correct approach for local dev — it guarantees schema matches the migration history. If the project also has `scripts/seed.ts`, it runs after `supabase db reset` to populate Better Auth data.

##### 8. Generate local .env.local

**Security check first** — verify `.gitignore` includes `.env*.local`:

```bash
grep -q '\.env\*\.local\|\.env\.local' .gitignore 2>/dev/null && echo "GITIGNORE_OK" || echo "GITIGNORE_MISSING"
```

If `GITIGNORE_MISSING`, append `.env*.local` to `.gitignore` before writing secrets.

Write the local environment file:

```bash
cat >> .env.local <<EOF

# Supabase (local development via OrbStack/Docker)
NEXT_PUBLIC_SUPABASE_URL=${LOCAL_API_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${LOCAL_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${LOCAL_SERVICE_KEY}
DATABASE_URL=${LOCAL_DB_URL}
EOF
```

**Security rules:**
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be prefixed with `NEXT_PUBLIC_` — it bypasses Row Level Security
- `.env.local` must be gitignored before any secrets are written
- Local credentials are safe for dev but should never reach production

##### 9. Add package.json scripts and helper

If the starter template was used (Step 3), `package.json` already has `db:*` scripts and a `setup` script. Check before adding:

```bash
node -e "
const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
const has = (k) => !!pkg.scripts?.[k];
console.log('HAS_SETUP=' + has('setup'));
console.log('HAS_DB_START=' + has('db:start'));
console.log('HAS_DB_SEED=' + has('db:seed'));
"
```

If scripts already exist, skip adding them. If missing, add convenience scripts for local Supabase management. Read `package.json`, then add to the `scripts` section:

```json
{
  "setup": "scripts/setup.sh || (supabase start && echo 'Ready')",
  "db:start": "supabase start",
  "db:stop": "supabase stop",
  "db:seed": "npx tsx scripts/seed.ts",
  "db:reset": "supabase db reset && npx tsx scripts/seed.ts",
  "db:studio": "sh scripts/open-studio.sh",
  "db:clean": "docker builder prune -f",
  "db:clean:all": "docker builder prune -af"
}
```

Create the Studio helper script at `scripts/open-studio.sh` (set `chmod +x`):

```bash
#!/bin/sh
# Open Supabase Studio — detects OrbStack for .orb.local domain, falls back to localhost
PROJECT_ID=$(grep '^project_id' supabase/config.toml 2>/dev/null | sed 's/.*= *"//;s/".*//')
if [ -n "$PROJECT_ID" ] && docker context show 2>/dev/null | grep -q orbstack; then
  URL="http://supabase_studio_${PROJECT_ID}.orb.local"
else
  URL="http://localhost:54323"
fi
open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || echo "Studio: $URL"
```

Use the Edit tool to merge scripts into existing entries — do NOT overwrite existing script entries.

##### 10. Auto-configure OrbStack efficiency (macOS only)

**Run this section only if OrbStack is the active container runtime.** Skip for Docker Desktop and Linux.

OrbStack's `memory_mib` is a hard ceiling — exceeding it triggers Linux OOM kills. Supabase uses ~1.5-2 GB typical, up to ~4 GB under load. The recommendation scales with physical RAM to avoid starving macOS:

```bash
if docker context show 2>/dev/null | grep -q orbstack; then
  # Detect physical RAM and compute recommended OrbStack memory
  TOTAL_RAM_MIB=$(( $(sysctl -n hw.memsize 2>/dev/null || echo "0") / 1048576 ))
  CURRENT_MEM=$(orb config show 2>/dev/null | grep memory_mib | sed 's/.*: *//')
  CURRENT_MEM="${CURRENT_MEM:-0}"

  # Scale recommendation: 50% of RAM, min 4096, max 8192
  # Supabase needs ~2GB typical, ~4GB peak — leave headroom for macOS
  if [ "$TOTAL_RAM_MIB" -le 8192 ] 2>/dev/null; then
    RECOMMENDED=4096    # 8GB machine: 4GB for OrbStack, 4GB for macOS
  elif [ "$TOTAL_RAM_MIB" -le 16384 ] 2>/dev/null; then
    RECOMMENDED=8192    # 16GB machine: 8GB for OrbStack
  else
    RECOMMENDED=8192    # 32GB+: 8GB is plenty, OrbStack default
  fi

  # Only RAISE the limit, never lower
  if [ "$CURRENT_MEM" -lt "$RECOMMENDED" ] 2>/dev/null; then
    orb config set memory_mib "$RECOMMENDED"
    echo "✓ OrbStack memory raised to ${RECOMMENDED} MiB (was: ${CURRENT_MEM} MiB, machine has ${TOTAL_RAM_MIB} MiB)"
  else
    echo "✓ OrbStack memory at ${CURRENT_MEM} MiB — sufficient for Supabase (machine has ${TOTAL_RAM_MIB} MiB)"
  fi
else
  echo "Not using OrbStack — skipping auto-configuration"
fi
```

##### 11. Report local setup status

Derive the project_id for `.orb.local` URLs:

```bash
PROJECT_ID=$(grep '^project_id' supabase/config.toml 2>/dev/null | sed 's/.*= *"//;s/".*//')
IS_ORBSTACK=$(docker context show 2>/dev/null | grep -q orbstack && echo "true" || echo "false")
```

```
✓ Local Supabase running via {OrbStack|Docker}
  API:     http://127.0.0.1:54321
  Studio:  http://127.0.0.1:54323
  DB:      postgresql://postgres:postgres@127.0.0.1:54322/postgres
  {N} migration(s) applied
  Seed data: {loaded|not found — will be created in Phase 1}

  Commands:
  • $PM run db:start     — start Supabase containers
  • $PM run db:stop      — stop Supabase containers
  • $PM run db:reset     — reset DB and re-apply migrations + seed
  • $PM run db:studio    — open Supabase Studio
  • $PM run db:clean     — free Docker build cache
  • $PM run db:clean:all — aggressive cleanup (all build cache)
```

**If using OrbStack, also show:**
```
  OrbStack auto-configured:
  • Memory: {CURRENT_MEM} MiB (Supabase needs ~4-8 GB for its 15 containers)
  • Studio: http://supabase_studio_{PROJECT_ID}.orb.local
  • All containers: http://orb.local
```

**If `supabase_mode` is `local` only:** Skip to Step 8f.

---

#### 8e-cloud: Cloud Supabase Setup

**Run this section if `supabase_mode` is `cloud` or `both`.**

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

Note in `.planning/REQUIREMENTS.md` that Phase 1 scaffolding must include (using `$PM` from Step 2a):
```bash
$PM add @sentry/browser @sentry/node @sentry/core better-sqlite3
$PM add -D @types/better-sqlite3
```

After installing, **ensure native bindings are present** for `better-sqlite3`. The package requires a platform-specific `.node` binary. Run both steps:
```bash
cd node_modules/better-sqlite3 && npx prebuild-install && cd ../..
$PM rebuild better-sqlite3
```

`prebuild-install` downloads a pre-compiled binary for the current platform (fastest, no build tools needed). The `rebuild` step ensures the package manager links it correctly. If `prebuild-install` fails (e.g. no matching prebuilt binary), the rebuild will compile from source — this requires build tools: `xcode-select --install` (macOS) or `sudo apt-get install build-essential python3` (Linux).

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

  # Copy .env.local to main repo and symlink back
  if [ -f .env.local ] && [ ! -L .env.local ]; then
    cp .env.local "$MAIN_REPO/.env.local"
    rm .env.local
    ln -sf "$MAIN_REPO/.env.local" .env.local
  fi

  # Copy .vercel to main repo and symlink back
  if [ -d .vercel ] && [ ! -L .vercel ]; then
    cp -r .vercel "$MAIN_REPO/.vercel"
    rm -rf .vercel
    ln -sf "$MAIN_REPO/.vercel" .vercel
  fi
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
    "setup": "$PM install && (node -e \"require('better-sqlite3')\" 2>/dev/null || (cd node_modules/better-sqlite3 && npx --yes prebuild-install 2>/dev/null || $PM rebuild better-sqlite3 2>/dev/null || true)) && [ -f \"$CONDUCTOR_ROOT_PATH/.env.local\" ] && ln -sf \"$CONDUCTOR_ROOT_PATH/.env.local\" .env.local || true; [ -d \"$CONDUCTOR_ROOT_PATH/.vercel\" ] && ln -sf \"$CONDUCTOR_ROOT_PATH/.vercel\" .vercel || true; node -e \"var fs=require('fs'),p=require('path'),cp=require('child_process'),f='.claude/settings.json',s={};try{s=JSON.parse(fs.readFileSync(f,'utf8'))}catch{}var pn='';try{var cd=cp.execSync('git rev-parse --git-common-dir',{encoding:'utf8'}).trim();var r=p.resolve(cd);pn=p.basename(r.replace(/\\/\\.git(\\/worktrees\\/[^/]+)?$/,''))}catch{pn=p.basename(process.cwd())}s.env=Object.assign(s.env||{},{CLAUDE_CODE_TASK_LIST_ID:process.env.CONDUCTOR_WORKSPACE_NAME||'default',CLAUDE_CWD:process.env.CONDUCTOR_ROOT_PATH||process.cwd(),CLAUDE_MEM_PROJECT:pn});fs.writeFileSync(f,JSON.stringify(s,null,2)+'\\n')\"; PATCH=$(find \"$HOME/.claude/plugins/cache/fhhs-skills\" -name patch-claude-mem-project-env.cjs -print -quit 2>/dev/null); [ -n \"$PATCH\" ] && node \"$PATCH\" || true; [ -f supabase/config.toml ] && command -v supabase >/dev/null 2>&1 && supabase start 2>/dev/null || true",
    "run": "$PM run dev -- --port $CONDUCTOR_PORT",
    "archive": "rm -rf \"$HOME/.claude/tasks/${CONDUCTOR_WORKSPACE_NAME}\" 2>/dev/null; true"
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TASKS": "true",
    "SENTRY_LOCAL": "true",
    "NEXT_PUBLIC_SENTRY_LOCAL": "true"
  }
}
```

> **Why `CLAUDE_CODE_TASK_LIST_ID` and `CLAUDE_CWD` in the setup script?** Conductor's `env` block does not interpolate shell variables like `${CONDUCTOR_WORKSPACE_NAME}` — it passes them as literal strings. The setup script runs in a shell where these variables resolve correctly, and writes the values into `.claude/settings.json` so Claude Code picks them up. Each workspace gets its own task list so parallel workspaces don't pollute each other's tracking. `CLAUDE_CWD` tells plugins like claude-mem the real project root, so they identify the project by repo name rather than the workspace directory name.
>
> **Why the claude-mem project-env patch?** claude-mem derives its project name from the process cwd basename. In Conductor workspaces and git worktrees, this basename is the workspace name (e.g., "cairo" or "quito"), not the actual project name (e.g., "fhhs-skills" or "nerve-os"), causing observation misattribution. The unified patch at `.claude/skills/patches/patch-claude-mem-project-env.cjs` modifies claude-mem's `gp()` function to check `CLAUDE_MEM_PROJECT` env var first, then fall back to worktree detection, then basename. This covers both Conductor workspaces and plain git worktrees. The patch is idempotent and skips if already applied or if claude-mem is not installed.
>
> **Why `CLAUDE_CODE_ENABLE_TASKS` in env?** This is a static value (no interpolation needed), so the `env` block works fine. It enables native task tracking used by `/fh:plan-work` and `/fh:build`.
>
> **Why `archive` cleans up?** Task lists persist at `~/.claude/tasks/{ID}/`. Without cleanup, old workspace task lists accumulate indefinitely. The archive script removes the directory when the workspace is torn down.

> **Why `ln -sf` for `.env.local` and `.vercel/`?** These are gitignored files, so git operations never touch them — symlinks are safe and keep all worktrees in sync bidirectionally. When the user updates `.env.local` in any worktree, all others see the change immediately. This is different from git-tracked files, where symlinks into `$CONDUCTOR_ROOT_PATH` could break during checkout.

**For other common stacks** — adapt the scripts (replace `$PM` with the detected package manager from Step 2a):

| Stack | Setup script | Run script |
|-------|-------------|------------|
| Next.js | `$PM install && ln -sf "$CONDUCTOR_ROOT_PATH/.env.local" .env.local 2>/dev/null; true` | `$PM run dev -- --port $CONDUCTOR_PORT` |
| Rails | `bundle install && ln -sf "$CONDUCTOR_ROOT_PATH/.env" .env 2>/dev/null; true` | `bin/rails server -p $CONDUCTOR_PORT` |
| Django | `pip install -r requirements.txt && ln -sf "$CONDUCTOR_ROOT_PATH/.env" .env 2>/dev/null; true` | `python manage.py runserver $CONDUCTOR_PORT` |
| Phoenix | `mix deps.get && ln -sf "$CONDUCTOR_ROOT_PATH/.env" .env 2>/dev/null; true` | `mix phx.server` (uses `PORT=$CONDUCTOR_PORT`) |
| Vite | `$PM install && ln -sf "$CONDUCTOR_ROOT_PATH/.env" .env 2>/dev/null; true` | `$PM run dev -- --port $CONDUCTOR_PORT` |

The setup script should:
1. Install dependencies (`$PM install` handles per-worktree `node_modules` correctly)
2. Rebuild native modules if needed — pnpm worktrees may not trigger postinstall scripts. Check `require('better-sqlite3')` and run `prebuild-install` if it fails: `node -e "require('better-sqlite3')" 2>/dev/null || (cd node_modules/better-sqlite3 && npx --yes prebuild-install 2>/dev/null || $PM rebuild better-sqlite3 2>/dev/null || true)`
3. Copy `.env` (or `.env.local`) from `$CONDUCTOR_ROOT_PATH` if it exists

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

## Step 8¾: Map Codebase (conditional)

**Only run this step if `uses_default_stack` is true** (starter template was cloned in Step 3).

The starter template has enough code to produce a useful codebase map. Running it now means context-mode is immediately valuable from the first `/fh:plan-work` call.

Invoke `/fh:map-codebase` — it spawns 4 parallel mapper agents, writes `.planning/codebase/` docs, creates `.claude/rules/`, indexes into FTS5 via `ctx_index` (if context-mode installed), and records the freshness SHA.

If `uses_default_stack` is false (custom stack), skip — the codebase doesn't exist yet and will be scaffolded in Phase 1. The user can run `/fh:map-codebase` after scaffolding.

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
- .planning/codebase/       — codebase mapping indexed (if default stack)
- shadcn skills             — global agent context for components (if installed)
- Vercel project            — linked (auto-deploys on push to main)
- Supabase (local)          — running via OrbStack/Docker (if local setup)
- Supabase (cloud)          — <project-url> (if cloud setup)
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

If Supabase was set up (local or cloud), add this reminder:

```
⚠ Supabase security reminder:
  - Enable Row Level Security (RLS) on every table you create
  - The anon key is safe for client-side use ONLY with RLS enabled
  - The service_role key bypasses RLS — use only in server-side code
  - Local DB containers use default credentials — safe for dev only
```

If local Supabase was set up, add:

```
Local Supabase note:
  - Run `$PM run db:start` to start containers after reboot
  - Run `$PM run db:reset` to reset DB and re-apply migrations + seed
  - OrbStack uses ~2x less power than Docker Desktop for Supabase
```

If Resend was configured, add this reminder:

```
Resend note:
  - Verify your sending domain at resend.com/domains for production use
  - Development emails work immediately with the API key
  - Without RESEND_API_KEY, emails are logged to console (safe for dev)
```

### Auto Mode Continuation

If `AUTO_PROJECT` is true, after handoff:
1. Set `workflow.auto_advance = true` via gsd-tools
2. Shell out to orchestrator: `node .claude/skills/auto/auto-orchestrator.cjs --project-dir "$(pwd)"`
3. The orchestrator takes over and executes all phases autonomously

The user can walk away at this point — the system handles everything.
