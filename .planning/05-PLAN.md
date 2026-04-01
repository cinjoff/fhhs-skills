---
plan: 05
type: execute
wave: 4
depends_on: [01, 02, 03, 04]
files_modified:
  - evals/evals.json
  - PATCHES.md
  - COMPATIBILITY.md
  - .claude-plugin/marketplace.json
autonomous: false

must_haves:
  truths:
    - "evals.json includes at least 2 evals for /fh:plan-review testing scope modes and Error/Rescue Map generation"
    - "evals.json includes at least 3 evals for /fh:qa testing diff-aware mode, quick mode, and health scoring"
    - "evals.json includes at least 1 eval for enhanced review testing checklist adherence with suppressions"
    - "PATCHES.md has complete documentation of every gstack modification with rationale"
    - "COMPATIBILITY.md has final status for every gstack skill (forked/absorbed/skipped)"
  artifacts:
    - path: "evals/evals.json"
      provides: "eval coverage for new and enhanced gstack-derived skills"
      contains: "plan-review"
    - path: "PATCHES.md"
      provides: "complete modification documentation"
      contains: "gstack"
    - path: "COMPATIBILITY.md"
      provides: "final version and status tracking"
      contains: "gstack"
---

<objective>Add eval coverage for all new and enhanced gstack-derived skills, and finalize PATCHES.md and COMPATIBILITY.md with complete documentation.</objective>

<context>
@file evals/evals.json
@file PATCHES.md
@file COMPATIBILITY.md
@file .claude/skills/plan-review/SKILL.md
@file .claude/skills/qa/SKILL.md
@file .claude/skills/review/SKILL.md
@file .claude/skills/plan-work/SKILL.md
@file .claude/commands/release.md
@file .planning/designs/2026-03-14-gstack-upstream-integration.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Add evals for new skills (plan-review, qa)</name>
  <files>evals/evals.json</files>
  <action>
    Read existing evals.json first and match the exact JSON schema: `{id, command, prompt, expected_output, files, assertions: [{text, type}], scenario_requires?}`. Assertion types used: behavioral, output, guard, ordering. New eval IDs must continue from the highest existing ID.

    Add evals following existing evals.json format and conventions:

    **plan-review evals:**
    1. "plan-review routes to scope challenge" — user presents a plan, verify skill asks whether this is the right problem and offers EXPANSION/HOLD/REDUCTION modes
    2. "plan-review generates Error/Rescue Map" — user confirms a plan direction, verify skill produces Error/Rescue Map table with named exceptions
    3. "plan-review enforces AskUserQuestion discipline" — verify one-issue-per-question format with lettered options

    **qa evals:**
    4. "qa diff-aware mode identifies affected routes" — user on feature branch, verify skill reads git diff and identifies pages to test
    5. "qa quick mode runs smoke test" — user says /fh:qa --quick, verify 30-second scope with homepage + nav targets
    6. "qa produces health score" — verify output includes weighted health score with category breakdown
    7. "qa uses agent-browser commands" — verify skill uses agent-browser CLI (not $B or custom binary)

    **enhanced review eval:**
    8. "review uses production safety checklist" — verify review references checklist and applies suppressions

    **enhanced plan-work eval:**
    9. "plan-work Step 3 produces failure modes" — verify implementation discussion includes Failure Modes Registry

    Match existing eval format precisely. Use semantic assertions where the existing evals use them.
  </action>
  <verify>
    grep "plan-review" evals/evals.json
    grep "qa.*diff" evals/evals.json
    grep "health score\|Health Score" evals/evals.json
  </verify>
  <done>evals.json has comprehensive coverage for plan-review (3), qa (4), enhanced review (1), enhanced plan-work (1)</done>
</task>

<task type="auto">
  <name>Task 2: Finalize PATCHES.md and COMPATIBILITY.md</name>
  <files>PATCHES.md, COMPATIBILITY.md</files>
  <action>
    1. **PATCHES.md**: Complete all placeholder sections with actual changes made:
       - plan-review: list every modification from upstream plan-ceo-review with rationale
       - qa: list every modification from upstream qa with rationale (agent-browser swap, output paths, etc.)
       - review enhancements: document checklist adaptation, suppressions, framework-agnostic changes
       - plan-work enhancements: document diagram/failure-mode additions, scope commitment rule
       - release enhancements: document pre-ship validation, bisectable commits
       - Cross-cutting: document anti-drift rules, priority hierarchies, AskUserQuestion discipline

    2. **COMPATIBILITY.md**: Update gstack section with final status:
       - Change all "To fork" / "To absorb" statuses to "Forked" / "Absorbed"
       - Add "Used by" column with actual composite references
       - Verify every skill listed has correct status

    3. **Cross-reference check**: grep for every new skill name across .claude/skills/ and .claude/commands/ to verify all references are valid

    4. **Update marketplace.json**: Add plan-review and qa to the plugin's capability description in `.claude-plugin/marketplace.json` so users know about the new skills
  </action>
  <verify>
    grep "Forked\|Absorbed\|SKIP" COMPATIBILITY.md | grep gstack
    grep "rationale\|Rationale" PATCHES.md | head -5
  </verify>
  <done>PATCHES.md and COMPATIBILITY.md are complete with all gstack modifications documented</done>
</task>
</tasks>

<verification>
grep "plan-review" evals/evals.json
grep "qa" evals/evals.json | grep -v "quality"
grep "Forked" COMPATIBILITY.md | grep gstack
wc -l PATCHES.md
</verification>

<success_criteria>
- evals.json covers plan-review (3 evals), qa (4 evals), enhanced review (1), enhanced plan-work (1)
- PATCHES.md documents every gstack modification with rationale
- COMPATIBILITY.md has final status for all gstack skills
</success_criteria>

<output>.planning/05-SUMMARY.md</output>
