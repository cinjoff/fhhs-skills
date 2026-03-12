---
type: execute
wave: 2
depends_on: [1]
files_modified:
  - .claude/skills/build/references/implementer-prompt.md
  - .claude/skills/refactor/SKILL.md
  - .claude/skills/fix/SKILL.md
  - .claude/skills/build/SKILL.md
  - .claude/skills/build/references/spec-gate-prompt.md
  - .claude/commands/release.md
autonomous: true

must_haves:
  truths:
    - "Build subagents are instructed to never use 'any' type and follow TypeScript strict patterns"
    - "Spec gate reviewers check for TypeScript strictness violations as a blocking issue"
    - "Build finishing step enforces conventional commit format for PR titles"
    - "Release command generates conventional changelog grouped by type from git log"
  artifacts:
    - path: ".claude/skills/build/references/implementer-prompt.md"
      provides: "TypeScript strictness rules in subagent template"
      contains: "never use `any`"
    - path: ".claude/skills/build/references/spec-gate-prompt.md"
      provides: "TypeScript strictness in spec gate checks"
      contains: "TypeScript strictness"
    - path: ".claude/commands/release.md"
      provides: "enhanced release with conventional changelog"
      contains: "conventional"
  key_links:
    - from: ".claude/skills/build/references/spec-gate-prompt.md"
      to: ".claude/skills/build/references/implementer-prompt.md"
      via: "spec gate verifies rules that implementer was told to follow"
---

<objective>Absorb TypeScript strictness rules into all code-producing skills and add conventional commit/changelog discipline to the build and release pipelines.</objective>

<context>
@file .claude/skills/build/references/implementer-prompt.md
@file .claude/skills/build/references/spec-gate-prompt.md
@file .claude/skills/refactor/SKILL.md
@file .claude/skills/fix/SKILL.md
@file .claude/commands/release.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: TypeScript strictness rules across all code-producing skills</name>
  <files>.claude/skills/build/references/implementer-prompt.md, .claude/skills/build/references/spec-gate-prompt.md, .claude/skills/refactor/SKILL.md, .claude/skills/fix/SKILL.md</files>
  <action>
    1. Edit `implementer-prompt.md` — add "TypeScript Strictness" section after "Implementation Rules":
       ```
       **TypeScript Strictness** (if project uses TypeScript):
       - NEVER use `any`. Use `unknown` + type narrowing, generics, or specific types.
       - Use discriminated unions for state modeling (type field + exhaustive switch).
       - Use type guards (`is` keyword) for runtime narrowing, not type assertions (`as`).
       - Prefer `satisfies` over `as` for type checking without widening.
       - Use `Record<K, V>` over `{[key: string]: V}`.
       - Use `readonly` for data that shouldn't mutate.
       - Exhaustive switches: always include `default: { const _exhaustive: never = val; }`.
       ```
    2. Edit `spec-gate-prompt.md` — add to "What to Check" section:
       ```
       **TypeScript strictness:**
       - Any use of `any` type (including implicit via missing annotations)
       - Type assertions (`as`) that could be replaced with type guards
       - Non-exhaustive switch statements on union types
       ```
    3. Edit `refactor/SKILL.md` Step 5 (Review) — add TypeScript strictness to structural quality focus: "Check for `any` types introduced or propagated, missing type guards, non-exhaustive switches."
    4. Edit `fix/SKILL.md` Step 2 — add note: "When writing tests or fixes in TypeScript, follow TypeScript strictness rules: no `any`, use proper type guards, exhaustive switches."
  </action>
  <verify>
    - implementer-prompt.md has TypeScript Strictness section with 7 rules
    - spec-gate-prompt.md checks for any/assertions/exhaustiveness
    - refactor and fix skills reference TypeScript strictness
  </verify>
  <done>All code-producing skills enforce TypeScript strictness patterns</done>
</task>

<task type="auto">
  <name>Task 2: Conventional commits and changelog enhancement</name>
  <files>.claude/skills/build/SKILL.md, .claude/commands/release.md</files>
  <action>
    1. Edit `build/SKILL.md` Step 10 (Complete) — add PR title enforcement:
       ```
       **PR title format:** `type(scope): summary` where type is feat|fix|refactor|test|docs|style|chore.
       Scope is the phase name or affected subsystem. Summary is imperative, lowercase, no period.
       Example: `feat(auth): add JWT refresh token rotation`

       **PR description:** Must include:
       - Summary: 1-3 bullets of what changed
       - Test plan: how to verify the changes work
       ```
    2. Edit `release.md` Step 3 — enhance changelog generation:
       - Parse commit messages using conventional commit format
       - Auto-group by type: feat→Added, fix→Fixed, refactor→Changed, etc.
       - Filter out internal commits (docs, chore) unless they're user-visible
       - Generate cleaner bullets from commit messages (strip type prefix, humanize)
    3. Edit `release.md` Step 6 — enhance GitHub release notes:
       - Include highlight section for the most impactful change
       - Add "Install/Update" section with `npx skills add` command
  </action>
  <verify>
    - build/SKILL.md Step 10 has PR title format and description template
    - release.md Step 3 parses conventional commits for changelog
    - release.md Step 6 has enhanced GitHub release format
  </verify>
  <done>Conventional commit format enforced in PRs, changelog auto-generated from commit types</done>
</task>
</tasks>

<verification>
- `grep "never use.*any" .claude/skills/build/references/implementer-prompt.md`
- `grep "TypeScript strictness" .claude/skills/build/references/spec-gate-prompt.md`
- `grep "type(scope)" .claude/skills/build/SKILL.md`
- `grep "conventional" .claude/commands/release.md`
</verification>

<success_criteria>
- Build subagents never use 'any' type
- Spec gates catch TypeScript strictness violations
- PR titles follow conventional commit format
- Release changelog auto-groups by commit type
</success_criteria>

<output>.planning/designs/2026-03-12-plan-04-SUMMARY.md</output>
