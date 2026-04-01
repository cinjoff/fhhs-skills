---
type: execute
wave: 1
depends_on: []
files_modified:
  - commands/update.md
autonomous: true

must_haves:
  truths:
    - "After /fh:update completes, machine-level tooling (symlinks, hooks, env vars) reflects what the latest setup.md configures"
    - "After /fh:update in a project with .planning/, the user is offered new features from new-project.md that their project doesn't have yet"
    - "Existing GSD hooks in ~/.claude/settings.json are preserved — fhhs hooks are added alongside, never replacing gsd-* hooks"
    - "Project reconciliation presents features in plain language describing what the user gets, not technical implementation details"
    - "The update command does not maintain a separate feature checklist — it derives what's missing by reading setup.md, new-project.md, and the changelog"
    - "After update, users are shown actionable tips about new skills and workflow changes they should know about, derived from changelog entries between old and new version"
  artifacts:
    - path: "commands/update.md"
      provides: "Post-update reconciliation for machine, project, and knowledge drift"
      contains: "Post-Update Reconciliation"
  key_links:
    - from: "commands/update.md"
      to: "commands/setup.md"
      via: "reads as source of truth for machine-level checks"
    - from: "commands/update.md"
      to: "commands/new-project.md"
      via: "reads as source of truth for project-level checks"
    - from: "commands/update.md"
      to: "CHANGELOG.md"
      via: "reads to derive new skills and workflow changes between versions"
---

<objective>
Add post-update reconciliation to /fh:update so that after updating the plugin, existing users automatically get machine-level fixes (symlinks, hooks, env vars), are offered new project-level features they're missing, and learn about new skills and workflow changes they should start using.
</objective>

<context>
@commands/update.md
@commands/setup.md
@commands/new-project.md
@CHANGELOG.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Add Step 5 — Machine Reconciliation</name>
  <files>commands/update.md</files>
  <action>
After the existing Step 4 "Confirm and Update" section, add a new Step 5 with two sub-sections.

**Step 5: Post-Update Reconciliation**

**Step 5a: Machine Reconciliation** (runs automatically after update, no prompt needed)

This step re-applies machine-level setup from `commands/setup.md` to ensure the user's environment matches what the latest version expects. The agent should:

1. Read `commands/setup.md` to understand current machine-level requirements
2. Check each requirement against the user's actual state
3. Fix anything that's missing or stale (all operations are idempotent)

Specifically instruct the agent to check and fix:

- **CLI symlinks** — Re-run the symlink block from setup.md Step 4 (ln -sfn to latest cached version). This is idempotent and fixes stale symlinks pointing to the old version.
- **Hooks** — Read ~/.claude/settings.json and compare against the hooks defined in setup.md Step 5. Add any missing fhhs hooks (statusline, check-update, context-monitor). IMPORTANT: Do NOT remove existing hooks — including gsd-* hooks that may serve other projects. Only append missing fhhs hooks.
- **Env vars** — Check ~/.claude/settings.json env block for vars required by setup.md Step 3c (CLAUDE_CODE_ENABLE_LSP, CLAUDE_CODE_ENABLE_TASKS). Add any missing ones.
- **TypeScript LSP plugin** — Check if typescript-lsp@claude-plugins-official is installed. If not, note it but don't auto-install (requires terminal).

Report what was fixed:
```
✓ CLI tools re-linked to vX.Y.Z
✓ Context monitor hook added (new in vX.Y.Z)
✓ CLAUDE_CODE_ENABLE_TASKS added to settings
○ All hooks up to date
```

Key instruction: Tell the agent to READ setup.md to derive the checklist — don't duplicate the checklist in update.md. This way when setup.md adds new requirements, update.md automatically picks them up.
  </action>
  <verify>
  - Step 5a exists after Step 4
  - Instructions reference reading setup.md as source of truth
  - Symlink refresh uses ln -sfn (idempotent)
  - Hook check explicitly says "do NOT remove existing hooks including gsd-*"
  - Reports what was fixed with ✓/○ symbols
  </verify>
  <done>After update, machine-level tooling is automatically reconciled to match what setup.md configures, without maintaining a separate checklist</done>
</task>

<task type="auto">
  <name>Task 2: Add Step 5b — Project Reconciliation</name>
  <files>commands/update.md</files>
  <action>
After Step 5a, add Step 5b: Project Reconciliation.

**Step 5b: Project Reconciliation** (only runs if .planning/ exists in cwd)

This step checks whether the user's existing project has all the features that /fh:new-project would set up for a new project. The agent should:

1. Check if `.planning/` exists in the current working directory. If not, skip Step 5b entirely with: "No project detected in this directory. Run /fh:update from your project root to check for new features."
2. Read `commands/new-project.md` to understand what project-level features exist
3. Check which features are present vs missing in the current project
4. Present missing features in a single grouped prompt using plain language

**Detection approach:**

Instruct the agent to read new-project.md and check for each project-level feature it describes. For each, check the characteristic files/directories that would exist if the feature was set up. Examples the agent would derive from reading new-project.md:
- Observability → check for `lib/sentry-local.ts`
- Project tracker → check for `.project-tracker/`
- Conductor config → check for `conductor.json` (only if /Applications/Conductor.app exists)
- GSD CLI symlink → check for `.claude/get-shit-done/bin`
- claude-mem → check installed_plugins.json (derived from reading setup.md Step 6)

**Presenting missing features:**

If nothing is missing: "Your project is up to date with all available features." Skip the prompt.

If features are missing, present them in a grouped prompt. Use plain human language describing the benefit, not the technical implementation. Format:

```
## New features available for this project

This update includes features that your project doesn't have yet.
Pick which ones to add:

  1. ◻ Catch runtime errors automatically
     Captures browser and server errors to a local database that
     /fh:fix and /fh:build query during debugging.

  2. ◻ Project dashboard
     Visual progress tracker showing phases, plans, and status
     at a glance. Launch anytime with /fh:tracker.

  3. ◻ Conductor workspace scripts
     Auto-configures dev server, env vars, and task tracking
     for each parallel workspace.

  4. ◻ Persistent memory (claude-mem)
     Automatically captures session context and reinjects
     relevant history into future sessions.

Which would you like to add? (e.g. "1 and 2", "all", or "none")
```

Use AskUserQuestion or equivalent to get the user's choice.

**Applying selected features:**

For each selected feature, instruct the agent to follow the relevant section of new-project.md to scaffold it. Reference the specific step:
- Observability → follow new-project.md Step 5b
- Project tracker → follow new-project.md Step 5 (project tracker section)
- Conductor → follow new-project.md Step 7
- claude-mem → follow setup.md Step 6
- GSD CLI symlink → follow new-project.md Step 5 (symlink section)

After applying, report what was added:

```
✓ Local error tracking added (lib/sentry-local.ts + query tool)
✓ Project tracker scaffolded (.project-tracker/)
```

Suggest running `/fh:revise-claude-md` afterward if any features were added, so CLAUDE.md reflects the new capabilities.

Key instruction: Tell the agent to READ new-project.md and setup.md to derive the feature list and scaffold steps — don't duplicate them in update.md. This is the core "holistic" design: update.md is a meta-instruction that points at the source of truth.
  </action>
  <verify>
  - Step 5b exists after Step 5a
  - Gated on .planning/ existing
  - Instructions reference reading new-project.md and setup.md as source of truth
  - Feature descriptions use plain human language (benefits, not technical details)
  - Grouped prompt format with numbered items
  - Scaffolding delegates back to the relevant step in new-project.md/setup.md
  - Suggests /fh:revise-claude-md after adding features
  </verify>
  <done>After update in a project directory, users are offered new features in plain language and can selectively add them, with detection and scaffolding derived from new-project.md</done>
</task>

<task type="auto">
  <name>Task 3: Add Step 5c — Knowledge Reconciliation</name>
  <files>commands/update.md</files>
  <action>
After Step 5b, add Step 5c: What's New — Skills and Workflows.

**Step 5c: Knowledge Reconciliation** (always runs after update)

The changelog (Step 3) already showed version-by-version release notes. But users skim changelogs and miss actionable workflow changes. This step transforms changelog entries into **actionable tips** about new skills and changed workflows.

The agent should:

1. Read the CHANGELOG.md entries between the user's old version and the new version (already fetched in Step 2)
2. Read the `.claude/skills/` directory to get the current list of all available skills with their descriptions (from SKILL.md frontmatter)
3. Identify entries that represent:
   - **New skills** — a command/skill that didn't exist before (look for "Added" entries mentioning `/fh:*`)
   - **Workflow changes** — existing skills that work differently now (look for "Changed" entries about skill behavior)
   - **New integrations** — features that connect skills together in new ways (e.g., "/fix now queries error store before triage")

4. For each identified item, present it as an actionable tip — not "what changed" but "what you should do differently now." Format:

```
## What's New in Your Workflow

### New skills

  /fh:plan-review — Challenge your plan before building
  Run after /plan-work and before /build. Catches failure
  modes, edge cases, and security gaps. Three modes:
  scope expansion, hold scope, scope reduction.

  /fh:qa — Systematic QA testing
  Run after building frontend features. Uses browser
  automation to find bugs, produces structured reports
  with screenshots and repro steps.

  /fh:observability — Query runtime errors
  Check what errors your app is throwing during development.
  /fh:fix and /fh:build now use this automatically.

### Workflow changes

  /fh:fix now checks runtime errors first
  Before triaging from code alone, /fix queries the local
  error store for recent exceptions and stack traces.

  /fh:build now detects runtime errors after each wave
  If errors appear during execution, they're surfaced
  alongside the spec gate results.

  /fh:plan-work now suggests /fh:plan-review before /fh:build
  The handoff step recommends plan challenge for non-trivial
  plans. You can still go straight to /build if the plan
  is straightforward.
```

**Deriving tips holistically:**

The agent should derive these tips by:
- Reading CHANGELOG.md for "Added" and "Changed" entries between versions
- Cross-referencing with `.claude/skills/*/SKILL.md` descriptions to write accurate "when to use" guidance
- NOT maintaining a hardcoded tips list in update.md — derive fresh each time from changelog + skill descriptions

**Presentation rules:**
- Only show tips for changes between the user's old and new version
- Group into "New skills" and "Workflow changes"
- Each tip: skill name + one-line what it does + 2-3 lines of when/how to use it
- Skip internal/technical changes (eval additions, refactors, fix typos)
- Skip changes the user already saw (if they're only jumping one minor version, this might be just 2-3 tips)
- If no meaningful new skills or workflow changes: skip this section entirely

This is informational only — no prompt, no action needed. Just display and continue.
  </action>
  <verify>
  - Step 5c exists after Step 5b
  - Instructions derive tips from CHANGELOG.md + skill descriptions, not a hardcoded list
  - Tips are actionable ("run after /plan-work") not descriptive ("added plan-review skill")
  - Grouped into "New skills" and "Workflow changes"
  - Filters out internal/technical changes
  - Informational only — no user prompt needed
  </verify>
  <done>After update, users see actionable tips about new skills and workflow changes derived from changelog entries, so they know what to start using differently</done>
</task>
</tasks>

<verification>
1. Read commands/update.md — Step 5 exists with 5a, 5b, and 5c sub-sections
2. Grep for "setup.md" in update.md — confirms source-of-truth reference for machine checks
3. Grep for "new-project.md" in update.md — confirms source-of-truth reference for project checks
4. Grep for "CHANGELOG" in update.md — confirms source-of-truth reference for knowledge tips
5. Grep for "do NOT remove" in update.md — confirms GSD hook preservation
6. Grep for "plain language\|human language\|benefit" in update.md — confirms UX framing
7. Grep for "actionable\|when to use\|workflow" in update.md — confirms knowledge tips are actionable
8. Verify no hardcoded feature checklist or tips list duplicated from source files
</verification>

<success_criteria>
- After /fh:update completes, machine-level tooling (symlinks, hooks, env vars) reflects what the latest setup.md configures
- After /fh:update in a project with .planning/, the user is offered new features from new-project.md that their project doesn't have yet
- Existing GSD hooks in ~/.claude/settings.json are preserved — fhhs hooks are added alongside, never replacing gsd-* hooks
- Project reconciliation presents features in plain language describing what the user gets, not technical implementation details
- The update command does not maintain a separate feature checklist — it derives what's missing by reading setup.md, new-project.md, and the changelog
- After update, users see actionable tips about new skills and workflow changes derived from changelog entries between their old and new version
</success_criteria>

<output>.planning/SUMMARY.md</output>
