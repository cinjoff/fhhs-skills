---
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - upstream/gstack-0.3.3/
  - .planning/designs/2026-03-14-gstack-upstream-integration.md
  - PATCHES.md
  - COMPATIBILITY.md
autonomous: true

must_haves:
  truths:
    - "upstream/gstack-0.3.3/ contains a verbatim snapshot of the gstack repository with all skill SKILL.md files preserved"
    - "COMPATIBILITY.md has a gstack section listing every forked skill and which composite consumes it"
    - "PATCHES.md has a gstack section documenting every modification with rationale"
  artifacts:
    - path: "upstream/gstack-0.3.3/"
      provides: "verbatim upstream snapshot for diff tracking"
      contains: "plan-ceo-review/SKILL.md"
    - path: "COMPATIBILITY.md"
      provides: "version and dependency tracking"
      contains: "## gstack"
    - path: "PATCHES.md"
      provides: "modification documentation"
      contains: "## gstack"
---

<objective>Save gstack as a verbatim upstream snapshot and initialize tracking in PATCHES.md and COMPATIBILITY.md. This establishes the upstream baseline before any forking begins.</objective>

<context>
@file PATCHES.md
@file COMPATIBILITY.md
@file .planning/designs/2026-03-14-gstack-upstream-integration.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Clone gstack and save upstream snapshot</name>
  <files>upstream/gstack-0.3.3/</files>
  <action>
    1. Clone https://github.com/garrytan/gstack.git to a temp directory
    2. Copy the following into upstream/gstack-0.3.3/:
       - All skill directories with subdirectories:
         plan-ceo-review/, plan-eng-review/, review/ (including review/checklist.md, review/greptile-triage.md),
         ship/, qa/ (including qa/references/, qa/templates/), browse/, retro/,
         gstack-upgrade/, setup-browser-cookies/
       - Root files: README.md, BROWSER.md, ARCHITECTURE.md, SKILL.md, SKILL.md.tmpl, VERSION, CHANGELOG.md, conductor.json, package.json, setup
       - browse/src/ directory (source code for reference, not the compiled binary)
       - scripts/ directory
       - Do NOT include: node_modules/, browse/dist/, .git/
    3. Record the git commit hash in upstream/gstack-0.3.3/UPSTREAM_REF.md
  </action>
  <verify>ls upstream/gstack-0.3.3/plan-ceo-review/SKILL.md && ls upstream/gstack-0.3.3/qa/SKILL.md && ls upstream/gstack-0.3.3/qa/references/issue-taxonomy.md && ls upstream/gstack-0.3.3/review/checklist.md</verify>
  <done>Verbatim gstack snapshot exists at upstream/gstack-0.3.3/ with all skill SKILL.md files</done>
</task>

<task type="auto">
  <name>Task 2: Update COMPATIBILITY.md and PATCHES.md</name>
  <files>COMPATIBILITY.md, PATCHES.md</files>
  <action>
    1. Add gstack section to COMPATIBILITY.md following existing format:
       ```
       ## gstack — v0.3.3 — [repo](https://github.com/garrytan/gstack)

       Forked skills:
       | Skill | Used by | Status |
       |-------|---------|--------|
       | plan-ceo-review | /fh:plan-review (new) | To fork |
       | plan-eng-review | /fh:plan-work (enhance) | To absorb |
       | review/checklist.md | /fh:review (enhance) | To absorb |
       | ship | /release (enhance) | To absorb |
       | qa | /fh:qa (new) | To fork |
       | browse | SKIP (using agent-browser) | — |
       | retro | SKIP (user decision) | — |
       | setup-browser-cookies | Absorbed into /fh:qa | To absorb |
       | gstack-upgrade | SKIP (plugin marketplace) | — |

       Upstream snapshot: `upstream/gstack-0.3.3/`
       ```
    2. Add gstack section to PATCHES.md with initial structure (patches to be filled as skills are forked):
       ```
       ## gstack (forked from v0.3.3)

       ### plan-review (from plan-ceo-review)
       (patches to be documented during Plan 02)

       ### qa (from qa)
       (patches to be documented during Plan 02)

       ### review enhancements (from review/checklist.md)
       (patches to be documented during Plan 03)

       ### plan-work enhancements (from plan-eng-review)
       (patches to be documented during Plan 03)

       ### release enhancements (from ship)
       (patches to be documented during Plan 03)
       ```
  </action>
  <verify>grep "## gstack" COMPATIBILITY.md && grep "## gstack" PATCHES.md</verify>
  <done>COMPATIBILITY.md and PATCHES.md both have gstack sections with correct format</done>
</task>
</tasks>

<verification>
ls upstream/gstack-0.3.3/plan-ceo-review/SKILL.md
ls upstream/gstack-0.3.3/qa/SKILL.md
grep "gstack" COMPATIBILITY.md
grep "gstack" PATCHES.md
</verification>

<success_criteria>
- upstream/gstack-0.3.3/ contains verbatim snapshot with all skill files
- COMPATIBILITY.md has gstack section with skill mapping
- PATCHES.md has gstack section with initial structure
</success_criteria>

<output>.planning/01-SUMMARY.md</output>
