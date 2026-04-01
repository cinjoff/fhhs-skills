---
type: execute
wave: 1
depends_on: []
files_modified:
  - upstream/playwright-best-practices-{hash}/
  - .claude/skills/playwright-testing/SKILL.md
  - .claude/skills/playwright-testing/references/
  - .claude/skills/build/references/implementer-prompt.md
  - .claude/skills/fix/SKILL.md
  - .claude/skills/test-driven-development/SKILL.md
  - PATCHES.md
  - COMPATIBILITY.md
autonomous: true

must_haves:
  truths:
    - "Build subagents executing TDD tasks that involve test files receive Playwright guidance only when test files are in scope"
    - "Fix skill's TDD step references Playwright patterns when writing tests for frontend bugs"
    - "Detection logic checks for *.test.*, *.spec.*, playwright.config.* to activate Playwright context"
  artifacts:
    - path: "upstream/playwright-best-practices-{hash}/"
      provides: "verbatim upstream snapshot"
      contains: "playwright"
    - path: ".claude/skills/playwright-testing/SKILL.md"
      provides: "forked Playwright testing reference"
      contains: "Playwright"
    - path: ".claude/skills/build/references/implementer-prompt.md"
      provides: "conditional Playwright loading in subagent template"
      contains: "playwright-testing"
  key_links:
    - from: ".claude/skills/build/references/implementer-prompt.md"
      to: ".claude/skills/playwright-testing/SKILL.md"
      via: "conditional reference when test files in task scope"
    - from: ".claude/skills/fix/SKILL.md"
      to: ".claude/skills/playwright-testing/SKILL.md"
      via: "TDD step reference for frontend bug tests"
---

<objective>Adopt Playwright Best Practices as a new upstream with selective wiring — only loaded when test files are in scope, not for every subagent.</objective>

<context>
@file .claude/skills/build/references/implementer-prompt.md
@file .claude/skills/fix/SKILL.md
@file .claude/skills/test-driven-development/SKILL.md
@file PATCHES.md
@file COMPATIBILITY.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Snapshot and fork Playwright Best Practices</name>
  <files>upstream/playwright-best-practices-{hash}/, .claude/skills/playwright-testing/SKILL.md, .claude/skills/playwright-testing/references/</files>
  <action>
    1. Install: `npx skills add currents-dev/playwright-best-practices-skill@playwright-best-practices -g -y`
    2. Find installed content and copy verbatim to `upstream/playwright-best-practices-{hash}/`
    3. Create `.claude/skills/playwright-testing/SKILL.md` — fork with frontmatter (`name: playwright-testing`, `user-invokable: false`)
    4. The upstream has 40+ reference docs — distill into a decision-tree structure:
       - Core patterns: Page Object Model, locator strategies, assertion patterns
       - Test types: E2E, component, API, visual regression
       - Common pitfalls: flaky tests, auth handling, waiting strategies
       - CI/CD: parallel execution, sharding, reporting
    5. Store reference docs that are too large for SKILL.md in `.claude/skills/playwright-testing/references/`
    6. Ensure all content is self-contained within the skill directory
  </action>
  <verify>
    - upstream/ snapshot exists
    - .claude/skills/playwright-testing/SKILL.md has decision-tree structure
    - References cover core patterns, test types, pitfalls, CI/CD
  </verify>
  <done>Upstream snapshot preserved, fork created with distilled Playwright patterns</done>
</task>

<task type="auto">
  <name>Task 2: Selective wiring with detection logic</name>
  <files>.claude/skills/build/references/implementer-prompt.md, .claude/skills/fix/SKILL.md, PATCHES.md, COMPATIBILITY.md</files>
  <action>
    1. Edit `implementer-prompt.md` — add a conditional "Playwright Testing" section after the TDD section:
       ```
       **Playwright** (if task files include `*.test.*`, `*.spec.*`, `playwright.config.*`, or `e2e/`):
       Read `skills/playwright-testing/` for Playwright-specific patterns. Follow its locator strategies,
       assertion patterns, and Page Object Model conventions.
       ```
    2. Edit `fix/SKILL.md` Step 2 (TDD Fix) — add: "If the bug is in frontend code and the project uses Playwright (check for `playwright.config.*`), write the failing test using Playwright patterns from `skills/playwright-testing/`. Use proper locators (aria-label, role, data-testid) over CSS selectors."
    3. Update PATCHES.md — add playwright-best-practices section
    4. Update COMPATIBILITY.md — add playwright-best-practices entry
  </action>
  <verify>
    - implementer-prompt.md has conditional Playwright section with file pattern detection
    - fix/SKILL.md Step 2 references Playwright patterns for frontend bugs
    - PATCHES.md and COMPATIBILITY.md updated
  </verify>
  <done>Playwright guidance activates selectively based on file patterns in task scope</done>
</task>
</tasks>

<verification>
- `grep -l "playwright-testing" .claude/skills/build/references/implementer-prompt.md .claude/skills/fix/SKILL.md`
- `ls .claude/skills/playwright-testing/SKILL.md`
- `ls upstream/playwright-best-practices-*/`
- `grep "playwright-best-practices" PATCHES.md COMPATIBILITY.md`
</verification>

<success_criteria>
- Build subagents get Playwright guidance only when test files are in scope
- Fix skill references Playwright patterns for frontend bug tests
- Detection uses file patterns (*.test.*, *.spec.*, playwright.config.*)
</success_criteria>

<output>.planning/designs/2026-03-12-plan-02-SUMMARY.md</output>
