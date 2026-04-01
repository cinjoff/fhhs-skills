---
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified:
  - .claude/skills/plan-review/SKILL.md
  - .claude/skills/qa/SKILL.md
  - .claude/skills/qa/references/exploration-checklist.md
  - .claude/skills/qa/references/issue-taxonomy.md
  - .claude/skills/qa/references/report-template.md
  - PATCHES.md
autonomous: false

must_haves:
  truths:
    - "A user invoking /fh:plan-review on a plan gets a founder-level challenge asking whether they're solving the right problem, with 3 scope modes (expand/hold/reduce)"
    - "A user invoking /fh:qa on a feature branch gets diff-aware testing that identifies affected routes, tests them via agent-browser, and produces a health score"
    - "A user invoking /fh:qa with --quick gets a 30-second smoke test"
  artifacts:
    - path: ".claude/skills/plan-review/SKILL.md"
      provides: "founder-level plan challenge skill"
      contains: "plan-ceo-review"
    - path: ".claude/skills/qa/SKILL.md"
      provides: "diff-aware QA testing skill"
      contains: "agent-browser"
    - path: ".claude/skills/qa/references/issue-taxonomy.md"
      provides: "severity and category definitions for QA findings"
      contains: "Visual/UI"
    - path: ".claude/skills/qa/references/exploration-checklist.md"
      provides: "per-page exploration checklist for QA testing"
      contains: "exploration"
    - path: ".claude/skills/qa/references/report-template.md"
      provides: "structured template for QA reports"
      contains: "Health Score"
  key_links:
    - from: ".claude/skills/qa/SKILL.md"
      to: ".claude/skills/qa/references/issue-taxonomy.md"
      via: "reference doc loaded by skill"
    - from: ".claude/skills/qa/SKILL.md"
      to: ".claude/skills/qa/references/report-template.md"
      via: "template for QA reports"
---

<objective>Create two new skills that fill gaps identified in the gstack comparison: /fh:plan-review (founder-level plan challenge) and /fh:qa (diff-aware QA with health scoring using agent-browser).</objective>

<context>
@file upstream/gstack-0.3.3/plan-ceo-review/SKILL.md
@file upstream/gstack-0.3.3/qa/SKILL.md
@file upstream/gstack-0.3.3/qa/references/issue-taxonomy.md
@file upstream/gstack-0.3.3/qa/templates/qa-report-template.md
@file .claude/skills/plan-work/SKILL.md
@file .claude/skills/verify-ui/SKILL.md
@file .planning/designs/2026-03-14-gstack-upstream-integration.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Create /fh:plan-review skill</name>
  <files>.claude/skills/plan-review/SKILL.md</files>
  <action>
    Fork gstack's plan-ceo-review/SKILL.md into .claude/skills/plan-review/SKILL.md with these adaptations:

    1. **Frontmatter**: name: plan-review, description referencing founder-level plan challenge, allowed-tools matching fhhs conventions
    2. **Attribution**: Add "Forked from gstack plan-ceo-review (v0.3.3)" header
    3. **Keep from gstack**:
       - The 3 scope modes (EXPANSION/HOLD/REDUCTION) with mode commitment enforcement
       - Dream State Mapping (CURRENT → THIS PLAN → 12-MONTH IDEAL)
       - Temporal Interrogation (hour-by-hour implementation timeline)
       - Error/Rescue Map technique (named exceptions, rescue actions, user-visible outcomes)
       - Failure Modes Registry (CODEPATH × FAILURE × RESCUED? × TEST? × USER SEES?)
       - 9 Prime Directives
       - AskUserQuestion discipline (one issue per call, lettered options, recommendation-first)
       - Anti-drift rules ("commit to selected mode")
       - Priority hierarchy under context pressure
       - Pre-review system audit (git log, diff, TODOs)
    4. **Adapt for fhhs**:
       - Output path: findings go to `.planning/designs/` not arbitrary locations
       - Remove gstack-upgrade check preamble
       - Reference `.planning/DESIGN.md` for taste calibration (instead of finding patterns in codebase)
       - Reduce from 10 review sections to 6 most impactful: Architecture, Error/Rescue Map, Security, Data Flow, Tests, Long-Term Trajectory (drop Observability, Deployment, Performance, Code Quality — covered by other skills)
       - Add "Challenge against must_haves" step: if a PLAN.md exists, challenge its truths
       - Integrate with plan-work flow: suggest running this BETWEEN `/fh:plan-work` and `/fh:build`
       - Keep lean orchestrator pattern (stay under 20% context for this skill since it's interactive)
       - Note: This skill produces a COMPREHENSIVE Error/Rescue Map across the entire plan. If `/fh:plan-work` already produced a lightweight ERM during discussion, reference and extend it rather than starting from scratch.
       - All cross-references to this skill in other skills must use `/fh:plan-review` (the `fh:` prefix is auto-applied by the plugin system)
    5. **Remove**:
       - Greptile references
       - gstack-specific file paths
       - Rails-specific examples (make framework-agnostic)

    Update PATCHES.md gstack section with all changes and rationale.
  </action>
  <verify>grep "plan-ceo-review" .claude/skills/plan-review/SKILL.md && grep "EXPANSION" .claude/skills/plan-review/SKILL.md && grep "Error.*Rescue" .claude/skills/plan-review/SKILL.md && grep "AskUserQuestion" .claude/skills/plan-review/SKILL.md</verify>
  <done>plan-review skill exists with founder-level challenge, 3 scope modes, Error/Rescue Maps, and AskUserQuestion discipline</done>
</task>

<task type="auto">
  <name>Task 2: Create /fh:qa skill with agent-browser backend</name>
  <files>
    .claude/skills/qa/SKILL.md
    .claude/skills/qa/references/exploration-checklist.md
    .claude/skills/qa/references/issue-taxonomy.md
    .claude/skills/qa/references/report-template.md
  </files>
  <action>
    Fork gstack's qa/SKILL.md into .claude/skills/qa/ with these adaptations:

    1. **SKILL.md frontmatter**: name: qa, allowed-tools: [Bash(agent-browser:*), Read, Write, Grep, Glob, AskUserQuestion]
       NOTE: `Bash(agent-browser:*)` matches the pattern used by the globally-installed agent-browser skill. Verify at runtime that agent-browser commands work when invoked from a plugin skill context. If not, use `Bash` (unscoped) and document the agent-browser dependency in the skill's preamble.
    2. **Attribution**: "Forked from gstack qa (v0.3.3). Browser backend: agent-browser (Vercel)"
    3. **Keep from gstack**:
       - 4 modes: diff-aware (default on feature branches), full, quick (--quick), regression (--regression)
       - Health Score system (weighted 8-category, deductions per severity)
       - Framework-specific guidance (Next.js, Rails, SPA strategies)
       - "Never read source code. Test as a user" principle
       - Issue taxonomy with per-page exploration checklist
       - QA report template with metadata + health score + top 3 issues
       - Incremental writing (append as you find, don't batch)
       - Verify before documenting (retry once)
       - Console check after every interaction
    4. **Adapt for fhhs**:
       - Replace ALL `$B` commands with `agent-browser` CLI commands
       - Replace gstack snapshot flags with agent-browser equivalents:
         - `$B snapshot -i` → `agent-browser snapshot -i`
         - `$B goto URL` → `agent-browser open URL`
         - `$B click @e1` → `agent-browser click @e1`
         - `$B screenshot` → `agent-browser screenshot`
         - `$B console` → `agent-browser console`
         - `$B text` → `agent-browser get text`
       - Add agent-browser features gstack lacks:
         - `agent-browser set device "iPhone 14"` for responsive testing
         - `agent-browser set media dark` for dark mode testing
         - `agent-browser network requests --filter` for API verification
         - `agent-browser record start/stop` for video evidence on critical bugs
       - Report output: `.planning/qa-reports/` (not .gstack/)
       - Reference `.planning/DESIGN.md` for design evaluation (from verify-ui)
       - Add authentication workflow using agent-browser's state save/load
       - Session management: `agent-browser --session qa-{branch}` for isolation
    5. **Reference docs**: Fork gstack's issue-taxonomy.md and qa-report-template.md into .claude/skills/qa/references/
    6. **Add**: Per-page exploration checklist as references/exploration-checklist.md (named to avoid confusion with review's production-safety-checklist.md)
    7. **Remove**:
       - All references to gstack binary, $B variable, compiled Bun
       - Cookie import from real browsers (agent-browser handles sessions differently)
       - gstack-upgrade preamble

    Update PATCHES.md gstack section with all changes.
  </action>
  <verify>grep "agent-browser" .claude/skills/qa/SKILL.md && grep "diff-aware\|git diff" .claude/skills/qa/SKILL.md && grep "Health Score" .claude/skills/qa/SKILL.md && grep "quick" .claude/skills/qa/SKILL.md && ls .claude/skills/qa/references/issue-taxonomy.md</verify>
  <done>/fh:qa skill exists with 4 testing modes, health scoring, agent-browser backend, and reference docs</done>
</task>
</tasks>

<verification>
grep "plan-review" .claude/skills/plan-review/SKILL.md
grep "agent-browser" .claude/skills/qa/SKILL.md
grep "Health Score" .claude/skills/qa/SKILL.md
ls .claude/skills/qa/references/
</verification>

<success_criteria>
- /fh:plan-review challenges plans with 3 scope modes and Error/Rescue Maps
- /fh:qa does diff-aware testing via agent-browser with health scoring
- /fh:qa --quick provides 30-second smoke tests
</success_criteria>

<output>.planning/02-SUMMARY.md</output>
