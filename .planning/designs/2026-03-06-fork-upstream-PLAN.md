---
type: execute
files_modified:
  - commands/*.md
  - skills/**/*.md
  - references/*.md
  - upstream/**/*
  - PATCHES.md
  - README.md
  - COMPATIBILITY.md
  - evals/evals.json
autonomous: false
---

<objective>
Fork Superpowers, Impeccable, and GSD into fhhs-skills as a single self-contained plugin.
Adapt forked skills to GSD conventions, fix all known bugs, update composites to reference
internal paths, and create the upstream update workflow.
</objective>

<tasks>

<task type="auto" wave="1">
  <name>Phase 1: Scaffolding + upstream snapshots</name>
  <files>upstream/, skills/, PATCHES.md</files>
  <action>
  1. Create directory structure: skills/, upstream/superpowers-4.3.4/, upstream/impeccable-1.0.0/, upstream/gsd-{version}/
  2. Copy verbatim Superpowers skills from ~/.claude/plugins/cache/superpowers-extended-cc-marketplace/superpowers-extended-cc/4.3.4/skills/ into upstream/superpowers-4.3.4/
  3. Copy verbatim Impeccable commands+skills from ~/.claude/plugins/marketplaces/impeccable/dist/claude-code/.claude/ into upstream/impeccable-1.0.0/
  4. Copy GSD commands+agents from their installed locations into upstream/gsd-{version}/
  5. Create initial PATCHES.md with version headers and empty tables
  6. Update .gitignore if needed
  </action>
  <verify>upstream/ contains clean copies of all three upstreams. PATCHES.md exists.</verify>
  <done>Upstream snapshots in place, directory structure ready.</done>
</task>

<task type="auto" wave="2">
  <name>Phase 2: Fork Superpowers skills</name>
  <files>skills/brainstorming/, skills/test-driven-development/, skills/systematic-debugging/, skills/dispatching-parallel-agents/, skills/verification-before-completion/, skills/requesting-code-review/, skills/finishing-a-development-branch/</files>
  <action>
  1. Copy each Superpowers skill from upstream/ to skills/
  2. Apply patches:
     - brainstorming: output path → .planning/designs/YYYY-MM-DD-topic.md, remove writing-plans terminal state, remove self-commit
     - test-driven-development: add GSD commit convention note
     - systematic-debugging: add .planning/debug/ session file creation for COMPLEX path
     - requesting-code-review: update subagent type references to internal paths
     - verification-before-completion, dispatching-parallel-agents, finishing-a-development-branch: copy as-is
  3. Document each change in PATCHES.md
  </action>
  <verify>All 7 skills exist in skills/. Patches applied. PATCHES.md updated.</verify>
  <done>Superpowers skills forked and adapted.</done>
</task>

<task type="auto" wave="2">
  <name>Phase 3: Fork Impeccable commands + frontend-design skill</name>
  <files>commands/critique.md, commands/polish.md, commands/normalize.md, commands/harden.md, commands/animate.md, commands/teach-impeccable.md, skills/frontend-design/</files>
  <action>
  1. Copy frontend-design skill (SKILL.md + reference/) from upstream/ to skills/frontend-design/
  2. Update internal reference paths in frontend-design
  3. Copy Impeccable commands from upstream/ to commands/
  4. Apply patches:
     - teach-impeccable: output → .planning/DESIGN.md with YAML frontmatter, remove {{config_file}} and {{ask_instruction}} template vars
     - critique: reference skills/frontend-design/ internally
     - animate: reference skills/frontend-design/ internally
     - polish, normalize, harden: copy as-is
  5. Document each change in PATCHES.md
  </action>
  <verify>6 commands + 1 skill exist. teach-impeccable writes to .planning/DESIGN.md. PATCHES.md updated.</verify>
  <done>Impeccable commands and frontend-design skill forked and adapted.</done>
</task>

<task type="auto" wave="2">
  <name>Phase 4: Fork GSD commands + agents</name>
  <files>commands/{gsd-structural}.md, skills/gsd-*/ </files>
  <action>
  1. Identify all GSD user-facing commands (from system skills list): add-phase, remove-phase, insert-phase, add-todo, check-todos, complete-milestone, audit-milestone, new-milestone, progress, debug, quick, health, cleanup, pause-work, settings, update (renamed to update-gsd)
  2. Copy command files from upstream/ to commands/, removing gsd: prefix
  3. Identify all GSD agent definitions: gsd-executor, gsd-planner, gsd-verifier, gsd-debugger, gsd-plan-checker, gsd-codebase-mapper, gsd-phase-researcher, gsd-research-synthesizer, gsd-roadmapper, gsd-integration-checker, gsd-nyquist-auditor
  4. Copy agent definitions to skills/ as SKILL.md files
  5. Document any adaptations in PATCHES.md
  </action>
  <verify>GSD commands exist in commands/ without gsd: prefix. GSD agents exist in skills/.</verify>
  <done>GSD commands and agents forked.</done>
</task>

<task type="auto" wave="3">
  <name>Phase 5: Update composites + fix bugs</name>
  <files>commands/build.md, commands/plan.md, commands/fix.md, commands/refactor.md, commands/verify.md, commands/resume.md, commands/new-project.md, commands/research.md, commands/verify-ui.md, commands/setup.md, commands/skills-guide.md, references/dependency-check.md</files>
  <action>
  1. Update ALL superpowers:* references in composites to internal skill paths
  2. Update ALL impeccable:* references in composites to internal command/skill paths
  3. Update GSD agent type references to internal skill paths
  4. Fix bug #1: teach-impeccable path (already fixed by Phase 3 patch)
  5. Fix bug #2: brainstorming flow (already fixed by Phase 2 patch)
  6. Fix bug #3: /new-project GSD check — remove circular dep, just check gsd-tools availability or handle inline
  7. Fix bug #5: Renumber decimal steps in fix.md (3.5→4, shift rest) and verify.md (5.5→6, shift rest)
  8. Fix bug #6: /research — remove "usable standalone" claim, GSD is always required
  9. Fix bug #7: /verify-ui — note that browser-capture.mjs is created by /new-project scaffolding or must exist in project
  10. Fix bug #8: /skills-guide — update skill count and add forked commands to guide
  11. Simplify setup.md — no dependency checks, just welcome + /new-project
  12. Simplify dependency-check.md — only check .planning/PROJECT.md
  13. Update COMPATIBILITY.md to reflect internal ownership
  14. Update README.md — single install, no deps
  </action>
  <verify>No superpowers: or impeccable: references remain in commands/. All bugs fixed. grep confirms.</verify>
  <done>All composites reference internal skills. All known bugs fixed.</done>
</task>

<task type="auto" wave="4">
  <name>Phase 6: Create /update-upstream + update evals</name>
  <files>commands/update-upstream.md, evals/evals.json</files>
  <action>
  1. Write commands/update-upstream.md implementing the diff-and-report workflow
  2. Update evals.json:
     - Update existing evals to remove superpowers:/impeccable: references in expected_output
     - Add eval for /update-upstream
     - Add eval for /critique (direct invocation)
     - Add eval for /teach-impeccable (output to .planning/DESIGN.md)
  3. Verify eval count covers all commands
  </action>
  <verify>update-upstream.md exists. evals.json covers all user-facing commands.</verify>
  <done>Update workflow in place. Evals comprehensive.</done>
</task>

</tasks>

<verification>
- grep -r "superpowers:" commands/ returns nothing
- grep -r "impeccable:" commands/ returns nothing
- All skills/ directories have SKILL.md
- upstream/ has clean snapshots of all 3 upstreams
- PATCHES.md documents every modification
- evals.json covers all user-facing commands
</verification>

<success_criteria>
- fhhs-skills is fully self-contained — no external plugin dependencies
- All known bugs from the review are fixed
- Upstream update workflow is documented and has a command
- PATCHES.md enables selective merge of future upstream changes
</success_criteria>
