---
type: execute
wave: 3
depends_on: [1, 2, 3, 4]
files_modified:
  - evals/evals.json
  - evals/fixtures/
autonomous: true

must_haves:
  truths:
    - "E2E evals exercise complete composite workflows from invocation through all pipeline steps to final output"
    - "Eval fixtures include realistic project state: source files with intentional issues, .planning/ structure, git history, and config files"
    - "Evals verify cross-skill integration: build → review → secure → promote as a connected pipeline"
    - "Each eval has multi-step assertions covering ordering, behavioral gates, output artifacts, and guard rails"
    - "Existing evals 1 and 12 are updated to expect /review invocation instead of ad-hoc requesting-code-review + finishing-a-development-branch"
    - "Evals verify that verification-before-completion runs inside /review (evidence verification not dropped)"
    - "Evals verify GSD state updates happen in /build Step 6 BEFORE /review, and /review does NOT touch STATE.md"
  artifacts:
    - path: "evals/evals.json"
      provides: "expanded eval suite with deep E2E tests"
      contains: "review"
    - path: "evals/fixtures/"
      provides: "realistic project state files for eval scenarios"
      contains: "next.config"
  key_links:
    - from: "evals/evals.json"
      to: "evals/fixtures/"
      via: "eval 'files' arrays reference fixture paths"
    - from: "evals/evals.json"
      to: ".claude/skills/review/SKILL.md"
      via: "evals test /review pipeline"
    - from: "evals/evals.json"
      to: ".claude/skills/secure/SKILL.md"
      via: "evals test /secure standalone and as /review component"
---

<objective>Create deep end-to-end eval tests that exercise complete composite workflows with realistic project fixtures, testing the full pipeline from invocation through all gates to final output.</objective>

<context>
@file evals/evals.json (existing format reference)
@file .claude/skills/build/SKILL.md
@file .claude/skills/review/SKILL.md
@file .claude/skills/secure/SKILL.md
@file .claude/skills/fix/SKILL.md
@file .claude/skills/refactor/SKILL.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Create eval fixtures for realistic project scenarios</name>
  <files>evals/fixtures/</files>
  <action>
    Create fixture directories that simulate realistic Next.js/TypeScript projects:

    1. `evals/fixtures/nextjs-app-basic/`:
       - `next.config.js` — basic Next.js config
       - `tsconfig.json` — strict TypeScript config
       - `playwright.config.ts` — Playwright setup
       - `.planning/PROJECT.md` — GSD project stub
       - `.planning/STATE.md` — current phase state
       - `.planning/ROADMAP.md` — phase definitions with requirement IDs
       - `.planning/DESIGN.md` — design tokens stub
       - `CLAUDE.md` — project conventions

    2. `evals/fixtures/nextjs-app-security-issues/`:
       - Extends basic with intentional vulnerabilities:
       - `src/app/api/users/route.ts` — SQL string concatenation (`SELECT * FROM users WHERE id = ${id}`)
       - `src/components/comment.tsx` — `dangerouslySetInnerHTML` with user input
       - `src/lib/auth.ts` — hardcoded JWT secret, session in localStorage
       - `.env.example` with real-looking API key accidentally committed
       - `src/app/api/data/route.ts` — missing CORS headers, no auth check

    3. `evals/fixtures/nextjs-app-typescript-issues/`:
       - Extends basic with TypeScript strictness violations:
       - `src/lib/api.ts` — uses `any` in function params and return types
       - `src/components/form.tsx` — uses `as any` assertions instead of type guards
       - `src/types/index.ts` — non-exhaustive switch on discriminated union
       - `src/hooks/useAuth.ts` — implicit `any` from untyped dependencies

    4. `evals/fixtures/plans/`:
       - `auth-plan.md` — 3-task plan (JWT auth + refresh + login form), 2 waves
       - `dashboard-plan.md` — 2-task plan with Playwright test task
       - `api-refactor-plan.md` — refactoring plan touching API routes
  </action>
  <verify>
    - All fixture directories created with realistic file content
    - Security issues are concrete and grep-able
    - TypeScript issues demonstrate each strictness rule violation
    - Plans have proper YAML frontmatter and XML task structure
  </verify>
  <done>Realistic project fixtures ready for E2E eval scenarios</done>
</task>

<task type="auto">
  <name>Task 2: Create deep E2E eval test cases</name>
  <files>evals/evals.json</files>
  <action>
    Append the following deep E2E eval cases to evals.json (continue ID numbering from existing):

    **E2E 1: /build → /review full pipeline (Next.js project)**
    - Prompt: "Build the auth plan at .planning/phases/01-auth/01-01-PLAN.md"
    - Files: nextjs-app-basic/ fixtures + auth-plan.md
    - Expected flow: Find plan → analyze waves (2 waves) → dispatch subagents with Next.js perf rules in prompt → spec gate per wave → design gates for frontend task → simplify pass → invoke /review → code quality review → security scan → TS strictness check → gate decision → promote
    - Assertions (12+):
      - [behavioral] Loads Next.js performance rules into subagent prompts (grep for "waterfall" or "bundle" in dispatch)
      - [ordering] Spec gates run BEFORE design gates
      - [ordering] Simplify runs BEFORE /review
      - [ordering] /review runs quality → security → gate → promote in sequence
      - [behavioral] Dispatches code-reviewer agent for quality review
      - [behavioral] Dispatches 4 parallel agents for security scan
      - [behavioral] Checks for `any` usage in diff
      - [output] Generates SUMMARY.md with correct frontmatter
      - [output] PR title follows `type(scope): summary` format
      - [guard] Does NOT invoke requesting-code-review directly (uses /review instead)
      - [guard] Does NOT invoke finishing-a-development-branch directly (uses /review instead)
      - [behavioral] Frontend task gets DESIGN.md context

    **E2E 2: /build with security CRITICAL blocking**
    - Prompt: "Execute the API plan"
    - Files: nextjs-app-security-issues/ + api plan with task that writes SQL concat
    - Expected flow: Build completes → /review → security scan finds SQL injection (CRITICAL) → BLOCKS promotion → dispatches fix agent → re-scans → passes → promotes
    - Assertions (8+):
      - [behavioral] Security scan dispatches 4 parallel agents
      - [behavioral] Identifies SQL concatenation as CRITICAL
      - [behavioral] Identifies hardcoded JWT secret as CRITICAL
      - [guard] BLOCKS promotion on CRITICAL
      - [behavioral] Dispatches fix agent for CRITICAL findings
      - [ordering] Re-scans after fix before promoting
      - [output] Review report includes security findings with file:line
      - [behavioral] MEDIUM findings (missing CORS) logged but don't block

    **E2E 3: /build with Playwright test task (selective loading)**
    - Prompt: "Build the dashboard plan"
    - Files: nextjs-app-basic/ + dashboard-plan.md (includes Playwright test task)
    - Expected flow: Wave 1 (component task, no Playwright) → Wave 2 (Playwright test task, loads Playwright guidance) → spec gates → /review → promote
    - Assertions (6+):
      - [guard] Wave 1 subagent prompt does NOT include Playwright guidance
      - [behavioral] Wave 2 subagent prompt DOES include Playwright guidance (detects *.spec.* in task files)
      - [behavioral] Playwright prompt references Page Object Model, locator strategies
      - [ordering] Playwright detection happens per-task, not globally
      - [behavioral] TDD directive references Playwright patterns for test task
      - [output] SUMMARY.md notes Playwright tests written

    **E2E 4: /build with TypeScript strictness violation caught by spec gate**
    - Prompt: "Build the auth plan"
    - Files: nextjs-app-typescript-issues/ + auth plan where subagent might produce `any`
    - Expected flow: Build → spec gate catches `any` usage → BLOCKING → fix agent replaces with proper type → re-verify → continues
    - Assertions (6+):
      - [behavioral] Spec gate checks for `any` type usage
      - [behavioral] Flags `any` as BLOCKING (not just advisory)
      - [behavioral] Fix agent replaces `any` with specific type
      - [ordering] Fix happens before next wave starts
      - [guard] Does not accept `as any` assertions
      - [behavioral] Suggests type guard or `unknown` as alternatives

    **E2E 5: /fix → /review integration (MODERATE bug)**
    - Prompt: "The user profile page crashes when the user has no avatar — TypeError: Cannot read properties of null"
    - Files: nextjs-app-basic/ with src/components/profile.tsx that has null reference bug
    - Expected flow: Triage as MODERATE → systematic debugging → TDD fix (failing test first) → frontend check → simplify → /review (quality + security + TS strictness) → promote
    - Assertions (10+):
      - [behavioral] Triages as MODERATE (2-4 files, one subsystem)
      - [behavioral] Invokes systematic-debugging skill
      - [behavioral] Writes failing test BEFORE fix (TDD red-green-refactor)
      - [behavioral] Frontend check reads DESIGN.md
      - [ordering] Simplify runs before /review
      - [behavioral] /review runs quality review on fix diff
      - [behavioral] /review runs security scan on changed files
      - [behavioral] /review checks for `any` in diff
      - [output] Fix commit message: `fix: [root cause]`
      - [guard] Does NOT fix unrelated pre-existing issues

    **E2E 6: /refactor → /review integration (LSP-backed)**
    - Prompt: "Refactor the auth module to extract token management into a separate service"
    - Files: nextjs-app-basic/ with src/lib/auth.ts (multi-concern module)
    - Expected flow: Scope with LSP → capture baseline → plan atomic steps → execute (green at every step) → simplify → /review (quality + security + TS strictness + Next.js perf) → promote
    - Assertions (10+):
      - [behavioral] Uses LSP findReferences to scope blast radius
      - [behavioral] Captures baseline test suite (GREEN)
      - [behavioral] Plans atomic steps ordered safest-first
      - [guard] Reverts immediately if tests go red (iron law)
      - [ordering] Simplify before /review
      - [behavioral] /review quality focus includes "behavior preservation"
      - [behavioral] /review security scan checks extracted auth service
      - [behavioral] /review checks for `any` introduced during refactoring
      - [behavioral] If Next.js files touched, review includes perf patterns
      - [output] Atomic commits with `refactor(scope):` prefix

    **E2E 7: /fh:secure standalone on codebase with mixed severity**
    - Prompt: "/fh:secure — scan the whole codebase"
    - Files: nextjs-app-security-issues/ (SQL injection, XSS, hardcoded secret, missing CORS)
    - Expected flow: Scope full codebase → dispatch 4 parallel agents → collect → deduplicate → classify → report
    - Assertions (8+):
      - [behavioral] Dispatches exactly 4 parallel scanning agents
      - [behavioral] Agent 1 finds SQL injection (CRITICAL) and XSS (CRITICAL)
      - [behavioral] Agent 2 finds hardcoded JWT secret (CRITICAL) and localStorage session (HIGH)
      - [behavioral] Agent 3 finds .env.example with API key (CRITICAL)
      - [behavioral] Agent 4 finds missing CORS (MEDIUM) and no auth on data route (HIGH)
      - [output] Report has file:line references for each finding
      - [output] Findings grouped by severity then category
      - [behavioral] Deduplicates overlapping findings from different agents

    **E2E 8: /fh:review standalone (pre-PR workflow)**
    - Prompt: "Review my changes before creating a PR"
    - Files: nextjs-app-basic/ with git diff showing 5 changed files (mix of components, API routes, tests)
    - Expected flow: Code quality review → security scan → TS strictness check → gate decision → report → promote options
    - Assertions (8+):
      - [ordering] Quality review runs first (code-reviewer agent)
      - [ordering] Security scan runs second (4 parallel agents)
      - [ordering] Gate decision aggregates both
      - [behavioral] Checks diff for `any` usage
      - [behavioral] If Next.js project, includes perf patterns in review
      - [output] Review report with quality score, security findings, TS strictness
      - [behavioral] Presents PR/merge/keep/discard options (from finishing-a-development-branch)
      - [output] PR title enforces conventional commit format

    **E2E 9: /release with conventional changelog from git history**
    - Prompt: "Release a new version"
    - Files: CHANGELOG.md, .claude-plugin/plugin.json, .claude-plugin/marketplace.json, git log with mix of feat/fix/refactor commits
    - Expected flow: Gather changes → classify → suggest version → generate conventional changelog → bump both JSON files → commit + tag + push + GitHub release
    - Assertions (6+):
      - [behavioral] Parses conventional commit types from git log
      - [output] Changelog groups: feat→Added, fix→Fixed, refactor→Changed
      - [behavioral] Both plugin.json and marketplace.json get same version
      - [output] GitHub release notes include changelog content
      - [guard] Does NOT include internal chore/docs commits in user-facing changelog
      - [behavioral] Asks user for version bump approval

    **E2E 10: /build with no GSD project (guard rail)**
    - Prompt: "Build the plan at plan.md"
    - Files: No .planning/ directory
    - Expected: Stops immediately, tells user to run /fh:new-project
    - Assertions (3):
      - [behavioral] Detects missing .planning/PROJECT.md
      - [output] Recommends /fh:new-project
      - [guard] Does NOT proceed with any execution

    **E2E 11: /plan-work → /build → /review full lifecycle**
    - Prompt: "Plan and build adding user settings with dark mode toggle"
    - Files: nextjs-app-basic/ with ThemeProvider, tailwind dark: prefix
    - Expected flow: /plan-work skips research (well-known) → brainstorm → discuss → derive must_haves → create PLAN.md → /build → subagents with Next.js perf rules → spec gates → design gates (frontend) → simplify → /review → promote
    - Assertions (14+):
      - [behavioral] Skips research for well-known pattern
      - [behavioral] Brainstorms design options
      - [behavioral] Derives must_haves with user-facing truths
      - [output] Creates PLAN.md with proper frontmatter
      - [behavioral] Build loads Next.js perf rules
      - [behavioral] Spec gate per wave
      - [behavioral] Design gates run (critique → polish → normalize)
      - [ordering] Design gates after spec gates
      - [ordering] Simplify before /review
      - [behavioral] /review quality review on full diff
      - [behavioral] /review security scan
      - [behavioral] /review TS strictness check
      - [output] SUMMARY.md with must_haves verification
      - [output] PR with conventional commit title

    **E2E 12: /fix PARALLEL depth with security-sensitive bug**
    - Prompt: "API returns 500 on /api/users and /api/billing, dashboard shows stale data"
    - Files: nextjs-app-security-issues/ with multiple failing endpoints
    - Expected flow: Triage PARALLEL → dispatch parallel gsd-debugger agents → collect → TDD fix per finding → simplify → /review (catches remaining security issues) → promote
    - Assertions (10+):
      - [behavioral] Triages as PARALLEL (3+ independent failures)
      - [behavioral] Dispatches parallel gsd-debugger agents per subsystem
      - [behavioral] Each debugger uses scientific method (hypothesis → test → conclude)
      - [behavioral] TDD fix for each root cause
      - [ordering] Simplify after fixes
      - [behavioral] /review security scan catches SQL injection in /api/users
      - [behavioral] /review BLOCKS on CRITICAL security finding
      - [behavioral] Fix agent addresses CRITICAL finding
      - [ordering] Re-scan after security fix
      - [output] SUMMARY.md notes all three subsystem fixes + security remediation

    Each eval case includes:
    - `id`: sequential number
    - `command`: skill name
    - `prompt`: realistic user input
    - `expected_output`: detailed expected behavior narrative
    - `files`: array of fixture file paths
    - `assertions`: array with `text` and `type` (behavioral/output/guard/ordering)
  </action>
  <verify>
    - evals.json is valid JSON after additions
    - 12 new E2E eval cases with 100+ total assertions
    - Every eval references fixture files from Task 1
    - Assertions cover all 4 types: behavioral, output, guard, ordering
    - Cross-skill integration tested: build→review, fix→review, refactor→review, plan→build→review
  </verify>
  <done>Deep E2E eval suite exercises complete composite workflows with realistic fixtures and comprehensive assertions</done>
</task>
</tasks>

<verification>
- `python3 -c "import json; d=json.load(open('evals/evals.json')); print(f'{len(d[\"evals\"])} evals'); print(f'{sum(len(e[\"assertions\"]) for e in d[\"evals\"])} total assertions')"` — count should show significant increase
- `ls evals/fixtures/nextjs-app-*/` — all fixture directories exist
- `grep -c "review" evals/evals.json` — many references to /review pipeline
- `grep -c "ordering" evals/evals.json` — ordering assertions verify pipeline sequencing
</verification>

<success_criteria>
- E2E evals exercise complete workflows from invocation through all pipeline steps
- Fixtures include realistic project state with intentional issues
- Cross-skill integration tested (build→review→secure→promote)
- Multi-step assertions cover ordering, behavioral gates, output, and guard rails
</success_criteria>

<output>.planning/designs/2026-03-12-plan-05-SUMMARY.md</output>
