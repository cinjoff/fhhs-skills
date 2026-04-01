---
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/skills/sync-upstream/SKILL.md
  - .claude/skills/sync-upstream/references/upstream-registry.md
  - README.md
  - .claude/commands/update-upstream.md

must_haves:
  truths:
    - "Running /fh:sync-upstream shows which of the 8 upstreams have newer versions available"
    - "For each updated upstream, user sees summarized changelog and which forked skills are affected"
    - "When user approves an update, patches are reapplied to preserve their meaning on new upstream"
    - "Breaking changes that fundamentally alter patched areas are flagged for user decision"
    - "After sync, upstream/ snapshot is replaced and PATCHES.md + COMPATIBILITY.md + README.md are updated"
  artifacts:
    - path: ".claude/skills/sync-upstream/SKILL.md"
      provides: "sync-upstream skill definition"
      contains: "name: sync-upstream"
    - path: ".claude/skills/sync-upstream/references/upstream-registry.md"
      provides: "upstream repo mapping and forked skill associations"
      contains: "obra/superpowers"
    - path: "README.md"
      provides: "updated Setup & Maintenance table"
      contains: "/fh:sync-upstream"
  key_links:
    - from: ".claude/skills/sync-upstream/SKILL.md"
      to: ".claude/skills/sync-upstream/references/upstream-registry.md"
      via: "Read reference for registry data"
    - from: ".claude/skills/sync-upstream/SKILL.md"
      to: "PATCHES.md"
      via: "Read for patch cross-reference"
    - from: ".claude/skills/sync-upstream/SKILL.md"
      to: "COMPATIBILITY.md"
      via: "Read + update after sync"
---

<objective>
Create the /fh:sync-upstream skill that detects upstream updates across all 8 sources, presents summarized changelogs with affected fork mapping, and guides intelligent patch reapplication. Replace the existing update-upstream command.
</objective>

<context>
@PATCHES.md — all current patches and their rationale
@COMPATIBILITY.md — upstream versions and fork relationships
@.claude/commands/update-upstream.md — existing command to replace
@README.md — needs Setup & Maintenance table update
</context>

<tasks>
<task type="auto">
  <name>Task 1: Create sync-upstream skill and upstream registry</name>
  <files>
    .claude/skills/sync-upstream/SKILL.md
    .claude/skills/sync-upstream/references/upstream-registry.md
  </files>
  <action>
    1. Create `.claude/skills/sync-upstream/references/upstream-registry.md` with the complete upstream mapping:

       For each of the 8 upstreams, document:
       - `name` (argument name for targeting a single upstream)
       - `repo` (GitHub owner/repo)
       - `snapshot_pattern` (how to find the directory in upstream/, e.g. `superpowers-{version}`)
       - `version_source` (how to detect version — `tag`, `sha`, or `version-file`)
       - `compare_paths` (which subdirectories to diff — e.g. `skills/`, `agents/`)
       - `forked_to` (list of our skill/agent/command paths that were forked from this upstream)

       The 8 upstreams:
       | Name | Repo | Current | Forked to |
       |------|------|---------|-----------|
       | superpowers | obra/superpowers | 4.3.1 | skills/brainstorming, skills/test-driven-development, skills/systematic-debugging, skills/dispatching-parallel-agents, skills/verification-before-completion, skills/requesting-code-review, skills/finishing-a-development-branch, skills/using-superpowers, skills/using-git-worktrees, skills/writing-skills, skills/simplify, skills/executing-plans, skills/subagent-driven-development, skills/writing-plans |
       | impeccable | pbakaus/impeccable | 1.2.0 | skills/frontend-design, skills/critique (as command), skills/polish, skills/normalize, skills/harden, skills/animate, skills/teach-impeccable, skills/distill, skills/adapt, skills/bolder, skills/quieter, skills/extract, skills/colorize, skills/audit, skills/clarify, skills/onboard, skills/optimize, skills/delight |
       | gsd | gsd-build/get-shit-done | 1.22.4 | Multiple commands in commands/, agents in skills/ (gsd-executor, gsd-planner, etc.) |
       | gstack | garrytan/gstack | 0.3.3 | skills/plan-review, skills/qa, skills/review (checklist absorbed), skills/plan-work (eng-review absorbed), commands/release (ship absorbed) |
       | feature-dev | anthropics/claude-code-plugins | 55b58ec6 | agents/code-explorer, agents/code-architect, agents/code-reviewer |
       | vercel-react | vercel-labs/agent-skills | 64bee5b7 | skills/nextjs-perf |
       | playwright | currents-dev/playwright-best-practices-skill | b4b0fd3c | skills/playwright-testing |
       | claude-md | anthropics/claude-code-plugins | 1.0.0 | skills/claude-md-improver, commands/revise-claude-md |

       Note: feature-dev and claude-md are both from anthropics/claude-code-plugins but different subdirectories. The registry should note the subdirectory path within the monorepo for each.

    2. Create `.claude/skills/sync-upstream/SKILL.md` with the following structure:

       Frontmatter:
       ```yaml
       ---
       name: sync-upstream
       description: |
         Check upstream repos for updates, show what changed, and guide patch reapplication.
         Use when the user says 'sync upstream', 'check upstream', 'update upstream',
         'new version of superpowers/impeccable/gsd', or wants to pull latest upstream changes.
       user-invokable: true
       ---
       ```

       Body — 7 steps:

       **Step 0: Load Registry**
       Read `references/upstream-registry.md`. Read current snapshot versions from `upstream/` directory names.

       **Step 1: Check for Updates**
       Usage: `$ARGUMENTS` — specify an upstream name or `all` (default: `all`).

       For each targeted upstream:
       - Fetch latest version: `gh api repos/{owner}/{repo}/releases/latest --jq '.tag_name'`
       - For repos without releases (feature-dev, claude-md, vercel-react, playwright), use: `gh api repos/{owner}/{repo}/commits/{branch} --jq '.sha[:8]'` with the default branch
       - Compare against current snapshot version
       - Report: up-to-date or new version available

       Present a summary table:
       ```
       Upstream Status:
         superpowers    4.3.1 → 5.0.0   UPDATE AVAILABLE
         impeccable     1.2.0 → 1.2.0   up to date
         gsd            1.22.4 → 1.23.0  UPDATE AVAILABLE
         ...
       ```

       If nothing to update, stop here.
       Ask user which upstreams to sync (default: all that have updates).

       **Step 2: Fetch and Summarize Changes**
       For each selected upstream:
       - Clone new version to temp directory: `gh repo clone {owner}/{repo} "$TEMP_DIR" -- --depth 1 --branch {new_version}`
       - Use GitHub compare API for commit-level changelog: `gh api repos/{owner}/{repo}/compare/{old}...{new} --jq '.commits[] | .commit.message' | head -30`
       - Diff only the `compare_paths` from the registry against current snapshot
       - Group changes by relevance:
         - **Affects our forks**: files that map to entries in `forked_to` — show these prominently
         - **New capabilities**: new files/skills not yet forked — highlight as opportunities
         - **Internal/irrelevant**: changes to files we don't use — mention count only

       Present per-upstream:
       ```
       ## superpowers 4.3.1 → 5.0.0

       Changelog (12 commits):
         - Added new skill: advanced-reasoning
         - Improved brainstorming with multi-perspective synthesis
         - Fixed TDD cycle detection bug
         - ...

       Affects your forks (5 files):
         skills/brainstorming/SKILL.md — significant rewrite of synthesis step
         skills/test-driven-development/SKILL.md — bug fix in cycle detection
         ...

       New opportunities (2 files):
         skills/advanced-reasoning/SKILL.md — NEW (not yet forked)
         ...

       Other changes: 8 files (internal, no impact on forks)
       ```

       Ask user to confirm proceeding with the update for each upstream, or select specific ones.

       **Step 3: Cross-Reference Patches**
       Read `PATCHES.md`. For each patch on the updating upstream:
       - Read the corresponding section of the new upstream file
       - Read our current forked file
       - Classify the patch:
         - **CLEAN**: upstream didn't touch the area we patched — reapply directly
         - **COMPATIBLE**: upstream changed nearby code but patch meaning still applies — reapply with adaptation
         - **ENHANCED**: upstream independently added similar functionality — patch may be obsolete (opportunity!)
         - **CONFLICT**: upstream fundamentally changed the area we patched — needs user decision

       Present patch status:
       ```
       Patch Status for superpowers:
         brainstorming #1 (output path)          CLEAN — reapply
         brainstorming #2 (removed terminal)     CLEAN — reapply
         brainstorming #5 (code-explorer agents) COMPATIBLE — upstream restructured but meaning preserved
         brainstorming #6 (code-architect agents) ENHANCED — upstream now includes similar multi-lens architecture
         ...

       ⚠ Conflicts requiring decision: 0
       ✓ Auto-reapplicable patches: 12 of 14
       ? Enhanced by upstream (review recommended): 2
       ```

       For CONFLICT patches, present the upstream change and our patch side-by-side, explain what broke, and ask the user whether to:
       a) Keep our version (ignore upstream change in that area)
       b) Adopt upstream's approach (drop our patch)
       c) Merge both (manual adaptation needed)

       **Step 4: Apply Updates**
       For each confirmed upstream:
       1. Delete old snapshot: `rm -rf upstream/{name}-{old_version}/`
       2. Move new snapshot: `mv "$TEMP_DIR" upstream/{name}-{new_version}/`
         - For tag-versioned upstreams, use the tag as version
         - For SHA-versioned upstreams, use first 8 chars of SHA
       3. For each forked skill/agent/command affected:
         - Read the new upstream file
         - Read PATCHES.md for the list of patches to reapply
         - Read our current forked file
         - Reapply each CLEAN/COMPATIBLE patch to the new upstream content, preserving the *meaning* (not line-level) of the patch
         - For ENHANCED patches: incorporate the upstream improvement, adjust or drop the patch as appropriate
         - Write the updated forked file
       4. Clean up temp directory

       **Step 5: Identify New Opportunities**
       For each new file/skill in the upstream that we haven't forked:
       - Describe what it does (read its content)
       - Suggest which composite commands could benefit from it
       - Ask user if they want to fork it now or note it for later (via `/fh:add-todo`)

       **Step 6: Update Documentation**
       1. Update `PATCHES.md`:
         - Change version header (e.g., "forked from v4.3.1" → "forked from v5.0.0")
         - Update/remove patches that are now obsolete
         - Add notes for any new patches introduced during reapplication
       2. Update `COMPATIBILITY.md`:
         - Update version numbers
         - Add new forked skills if any were adopted from Step 5
       3. Update `README.md`:
         - Update version references in the "How It Works" source table

       **Step 7: Summary**
       Present final summary:
       ```
       Sync Complete:
         superpowers 4.3.1 → 5.0.0
           Patches reapplied: 12/14
           New skills adopted: 1 (advanced-reasoning)
           Patches dropped (upstream enhanced): 2

       Files modified: [list]

       Next steps:
         - Test affected composites: /build, /plan-work, /fix
         - Run /review to validate changes
         - Run /release when ready
       ```

       Clean up all temp directories.
  </action>
  <verify>
    - SKILL.md has correct frontmatter (name, description, user-invokable)
    - Registry covers all 8 upstreams with repo URLs, version detection method, compare paths, and forked-to mappings
    - All steps reference the registry rather than hardcoding upstream details
    - Step 3 patch classification covers all cases (CLEAN, COMPATIBLE, ENHANCED, CONFLICT)
    - Step 4 replaces snapshots (no old version kept)
    - Step 6 updates all three docs (PATCHES.md, COMPATIBILITY.md, README.md)
  </verify>
  <done>
    /fh:sync-upstream skill exists and covers: version checking, changelog summary, patch cross-reference, intelligent reapplication, opportunity identification, and documentation updates
  </done>
</task>

<task type="auto">
  <name>Task 2: Update README and remove old command</name>
  <files>
    README.md
    .claude/commands/update-upstream.md
  </files>
  <action>
    1. Delete `.claude/commands/update-upstream.md` — replaced by the new skill

    2. In `README.md`, add `/fh:sync-upstream` to the Setup & Maintenance table:
       ```
       | `/fh:sync-upstream` | Check upstreams for updates, sync changes, reapply patches |
       ```
       Add it after the `/fh:update` row.

    3. In the "Updating" section (line ~493), add a note about upstream syncing:
       ```
       ## Updating

       ```
       /fh:update           update the plugin itself
       /fh:sync-upstream    check upstream repos for new versions and sync changes
       ```
       ```
  </action>
  <verify>
    - `.claude/commands/update-upstream.md` no longer exists
    - README.md Setup & Maintenance table includes `/fh:sync-upstream`
    - README.md Updating section mentions both commands
    - No stale references to `update-upstream` command remain
  </verify>
  <done>
    README.md references the new skill, old command is removed, no broken references
  </done>
</task>
</tasks>

<verification>
  - `grep -r 'update-upstream' .claude/` returns no hits (old command removed, no stale references)
  - `.claude/skills/sync-upstream/SKILL.md` exists with correct frontmatter
  - `.claude/skills/sync-upstream/references/upstream-registry.md` lists all 8 upstreams
  - `grep 'sync-upstream' README.md` returns hits in both the table and Updating section
</verification>

<success_criteria>
  - Running /fh:sync-upstream shows which upstreams have newer versions
  - Changelog is summarized with affected fork mapping
  - Patches are reapplied to preserve meaning on new upstream
  - Breaking changes are flagged for user decision
  - After sync, upstream/ snapshot is replaced and docs are updated
</success_criteria>

<output>.planning/designs/2026-03-18-sync-upstream-SUMMARY.md</output>
