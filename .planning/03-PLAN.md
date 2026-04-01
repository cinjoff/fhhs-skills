---
plan: 03
type: execute
wave: 2
depends_on: [01]
files_modified:
  - .claude/skills/review/SKILL.md
  - .claude/skills/review/references/production-safety-checklist.md
  - .claude/skills/plan-work/SKILL.md
  - .claude/commands/release.md
  - PATCHES.md
autonomous: false

must_haves:
  truths:
    - "The review skill references a production-safety-checklist.md with 2-pass structure (CRITICAL blocks shipping, INFORMATIONAL doesn't) and an explicit suppressions section"
    - "The plan-work skill's Step 3 (Discuss Implementation) now enforces mandatory diagrams, Error/Rescue Maps, and Failure Modes Registry as part of implementation discussion"
    - "The release command includes pre-ship validation steps (test run, review check) and bisectable commit splitting option"
  artifacts:
    - path: ".claude/skills/review/references/production-safety-checklist.md"
      provides: "structured review checklist with suppressions"
      contains: "DO NOT flag"
    - path: ".claude/skills/plan-work/SKILL.md"
      provides: "enhanced planning with eng review patterns"
      contains: "Error/Rescue Map"
    - path: ".claude/commands/release.md"
      provides: "enhanced release with pre-ship validation"
      contains: "bisectable"
  key_links:
    - from: ".claude/skills/review/SKILL.md"
      to: ".claude/skills/review/references/production-safety-checklist.md"
      via: "reference doc loaded by review subagents"
---

<objective>Enhance three existing skills/commands with gstack's strongest patterns: review gets a production safety checklist with suppressions, plan-work gets eng review techniques, release gets pre-ship validation.</objective>

<context>
@file .claude/skills/review/SKILL.md
@file .claude/skills/plan-work/SKILL.md
@file .claude/commands/release.md
@file upstream/gstack-0.3.3/review/SKILL.md
@file upstream/gstack-0.3.3/review/checklist.md
@file upstream/gstack-0.3.3/plan-eng-review/SKILL.md
@file upstream/gstack-0.3.3/ship/SKILL.md
@file .planning/designs/2026-03-14-gstack-upstream-integration.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Add production safety checklist to review</name>
  <files>
    .claude/skills/review/SKILL.md
    .claude/skills/review/references/production-safety-checklist.md
  </files>
  <action>
    1. Create .claude/skills/review/references/production-safety-checklist.md adapted from gstack's review/checklist.md:
       - **Pass 1 CRITICAL** (blocks shipping):
         - SQL & Data Safety: string interpolation, TOCTOU, N+1, update bypassing validations
         - Race Conditions: read-check-write without constraints, non-atomic transitions
         - LLM Output Trust Boundary: LLM values persisted without validation, structured output without type checks
       - **Pass 2 INFORMATIONAL**:
         - Conditional Side Effects, Magic Numbers, Dead Code
         - LLM Prompt Issues (0-indexed lists, token limits)
         - Test Gaps, Crypto & Entropy, Time Window Safety
         - Type Coercion at Boundaries, View/Frontend
       - **Suppressions** (DO NOT flag):
         - Harmless redundancy that aids readability
         - "Add a comment explaining why" on thresholds
         - Consistency-only changes with no behavioral impact
         - Anything already addressed in the diff
         - Eval parameter tuning
       - Make framework-agnostic (remove Rails-specific references, keep patterns universal)

    2. Update .claude/skills/review/SKILL.md:
       - In Step 2 (dispatch subagents), add: "Include `references/production-safety-checklist.md` in the quality+architecture agent's context"
       - Add note: "The checklist has an explicit suppressions section — subagents must honor it to reduce noise"
       - Attribution: "Production safety checklist adapted from gstack review/checklist.md (v0.3.3)"
  </action>
  <verify>grep "CRITICAL" .claude/skills/review/references/production-safety-checklist.md && grep "DO NOT flag" .claude/skills/review/references/production-safety-checklist.md && grep "production-safety-checklist" .claude/skills/review/SKILL.md</verify>
  <done>Review skill references production-safety-checklist.md with 2-pass structure and suppressions</done>
</task>

<task type="auto">
  <name>Task 2: Enhance plan-work with eng review patterns</name>
  <files>.claude/skills/plan-work/SKILL.md</files>
  <action>
    Enhance plan-work's Step 3 (Discuss Implementation) with gstack plan-eng-review techniques:

    1. **Add to Step 3** after "Deep-dive selected areas":
       - "For each gray area discussed, produce:"
       - **Mandatory ASCII diagram** showing the system/data flow for that area
       - **Lightweight Error/Rescue Map** table (3-5 rows for the gray areas discussed): OPERATION | ERROR | NAMED EXCEPTION | RESCUE ACTION | USER SEES. Note: "This is a lightweight ERM scoped to the discussed gray areas. If the user runs `/fh:plan-review` afterward, it will produce a comprehensive ERM across the entire plan and extend this one."
       - **Failure Modes Registry**: CODEPATH | FAILURE MODE | RESCUED? | TEST? | USER SEES? | LOGGED? — any row with all N's = CRITICAL GAP that must be addressed in the plan

    2. **Add to Step 3** scope commitment rule:
       - "Once the user selects which gray areas to discuss, commit fully to that selection. Do not lobby for different areas or silently expand scope."

    3. **Add to Step 4** (Derive must_haves):
       - "Include failure modes from the Failure Modes Registry as must_haves.truths — each rescued failure mode should have a corresponding truth"

    4. **Add priority hierarchy** at the end of the skill:
       - "If context pressure is high: Step 0 (phase matching) > Step 3 (diagrams + failure modes) > Step 5 (plan creation) > Step 4 (must_haves) > Step 2 (brainstorm) > Step 1 (research). Never skip Step 0 or Step 5."

    Attribution: "Eng review patterns adapted from gstack plan-eng-review (v0.3.3)"
  </action>
  <verify>grep "Error/Rescue Map" .claude/skills/plan-work/SKILL.md && grep "Failure Modes Registry" .claude/skills/plan-work/SKILL.md && grep "ASCII diagram" .claude/skills/plan-work/SKILL.md && grep "commit fully" .claude/skills/plan-work/SKILL.md</verify>
  <done>plan-work Step 3 enforces diagrams, Error/Rescue Maps, and Failure Modes Registry</done>
</task>

<task type="auto">
  <name>Task 3: Enhance release with pre-ship validation</name>
  <files>.claude/commands/release.md</files>
  <action>
    Add gstack /ship patterns to release command:

    1. **Add Step 0: Pre-ship validation** (before existing Step 1):
       - Check branch is not main
       - Run `git fetch origin main && git merge origin/main` (abort on conflicts)
       - Run test suite (detect test runner: npm test / bun test / pytest / etc.)
       - If tests fail: STOP, show failures, do not proceed
       - Run `/fh:review --quick` if not already reviewed
       - If CRITICAL findings: STOP, show findings, suggest fixes

    2. **Add bisectable commit option** to Step 5:
       - "If the branch has mixed changes (infra + features + docs), offer to split into bisectable commits:"
       - Order: infrastructure/config first → models/services → controllers/views → tests → VERSION+CHANGELOG last
       - "Each commit must be independently valid (builds and passes tests)"
       - This is optional — offer it, don't force it

    3. Attribution: "Pre-ship validation and bisectable commits adapted from gstack /ship (v0.3.3)"
  </action>
  <verify>grep "Pre-ship\|pre-ship" .claude/commands/release.md && grep "bisectable" .claude/commands/release.md && grep "test suite\|Run test" .claude/commands/release.md</verify>
  <done>Release command includes pre-ship validation and bisectable commit splitting option</done>
</task>
</tasks>

<verification>
grep "production-safety-checklist" .claude/skills/review/SKILL.md
grep "Error/Rescue Map" .claude/skills/plan-work/SKILL.md
grep "bisectable" .claude/commands/release.md
</verification>

<success_criteria>
- Review skill uses production safety checklist with suppressions
- Plan-work enforces diagrams and failure modes in implementation discussion
- Release includes pre-ship test/review gates and bisectable commit option
</success_criteria>

<output>.planning/03-SUMMARY.md</output>
