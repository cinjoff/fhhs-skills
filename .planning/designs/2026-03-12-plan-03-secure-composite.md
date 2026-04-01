---
type: execute
wave: 2
depends_on: [1]
files_modified:
  - .claude/skills/secure/SKILL.md
  - .claude/skills/secure/references/owasp-checklist.md
  - .claude/skills/review/SKILL.md
  - .claude/skills/review/references/review-prompt.md
  - .claude/skills/build/SKILL.md
  - .claude/skills/refactor/SKILL.md
  - .claude/skills/fix/SKILL.md
  - .claude-plugin/plugin.json
autonomous: true

must_haves:
  truths:
    - "Running /fh:review on a branch orchestrates code quality review, security scan, evidence verification (tests+build+lint), and TypeScript strictness check before presenting PR/merge options"
    - "Running /fh:secure standalone scans for OWASP Top 10 vulnerabilities with parallel agents and severity classification"
    - "/build, /refactor, and /fix route through /fh:review instead of ad-hoc review + finishing skills"
    - "CRITICAL security findings block promotion — must fix before PR/merge"
    - "/fh:review includes verification-before-completion (tests, build, lint with fresh output) — no composite drops evidence verification"
    - "GSD state updates happen in /build Step 6 BEFORE /review — /review does NOT touch GSD state"
  artifacts:
    - path: ".claude/skills/secure/SKILL.md"
      provides: "OWASP security scanning skill"
      contains: "OWASP"
    - path: ".claude/skills/secure/references/owasp-checklist.md"
      provides: "concrete vulnerability patterns per category"
      contains: "SQL injection"
    - path: ".claude/skills/review/SKILL.md"
      provides: "pre-promotion review workflow orchestrator"
      contains: "pre-promotion"
    - path: ".claude/skills/review/references/review-prompt.md"
      provides: "structured review prompt template"
      contains: "code-reviewer"
  key_links:
    - from: ".claude/skills/review/SKILL.md"
      to: ".claude/skills/secure/SKILL.md"
      via: "Step 2 invokes security scan"
    - from: ".claude/skills/review/SKILL.md"
      to: "skills/requesting-code-review/"
      via: "Step 1 wraps code quality review"
    - from: ".claude/skills/review/SKILL.md"
      to: "skills/verification-before-completion/"
      via: "Step 3 invokes evidence verification (tests, build, lint)"
    - from: ".claude/skills/review/SKILL.md"
      to: "skills/finishing-a-development-branch/"
      via: "Step 7 wraps finishing workflow"
    - from: ".claude/skills/build/SKILL.md"
      to: ".claude/skills/review/SKILL.md"
      via: "Steps 8-10 replaced with /review invocation"
    - from: ".claude/skills/refactor/SKILL.md"
      to: ".claude/skills/review/SKILL.md"
      via: "Steps 5-7 replaced with /review invocation"
---

<objective>Create a dedicated pre-promotion review workflow (/fh:review) that gates code quality, security, and TypeScript strictness before changes can be promoted. Create /fh:secure as its security scanning component. Rewire /build, /refactor, and /fix to use /review instead of ad-hoc review + finishing.</objective>

<context>
@file .claude/skills/build/SKILL.md (Steps 8-10 for current review/finishing flow)
@file .claude/skills/refactor/SKILL.md (Steps 5-7 for current review/finishing flow)
@file .claude/skills/fix/SKILL.md (Steps 4-6 for current review/finishing flow)
@file skills/requesting-code-review/SKILL.md
@file skills/finishing-a-development-branch/SKILL.md
@file PATCHES.md
@file COMPATIBILITY.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Create /fh:secure and /fh:review composite skills</name>
  <files>.claude/skills/secure/SKILL.md, .claude/skills/secure/references/owasp-checklist.md, .claude/skills/review/SKILL.md, .claude/skills/review/references/review-prompt.md, .claude-plugin/plugin.json</files>
  <action>
    1. Create `.claude/skills/secure/SKILL.md`:
       - Frontmatter: `name: secure`, `description: Scan for OWASP Top 10 security vulnerabilities. Use when the user says 'security scan', 'check security', 'audit security', or before promoting changes.`, `user-invokable: true`
       - Step 1: Scope — determine scan target: `git diff` for changed files (default), or full codebase if `--full` flag
       - Step 2: Dispatch 4 parallel `general-purpose` subagents, each with the owasp-checklist.md reference:
         - Agent 1: Injection + XSS (SQL concat, command injection, dangerouslySetInnerHTML, unescaped output)
         - Agent 2: Auth + Session (broken auth, JWT misuse, session fixation, CSRF, missing token validation)
         - Agent 3: Data Exposure (hardcoded secrets/keys/tokens in source, PII in logs, insecure storage)
         - Agent 4: Access Control + Config (IDOR, permissive CORS, missing security headers, debug endpoints)
       - Step 3: Collect results, deduplicate, classify severity (CRITICAL/HIGH/MEDIUM/LOW)
       - Step 4: Report — structured output with file:line, severity, category, fix suggestion
       - Context budget: orchestrator stays lean, each scanner gets changed files + checklist only
    2. Create `.claude/skills/secure/references/owasp-checklist.md`:
       - Concrete grep-able patterns per category (regex for API keys, SQL concat patterns, innerHTML patterns)
       - Next.js-specific: `getServerSideProps` leaking secrets to client, middleware bypass, API route auth gaps
       - Each pattern has: what to look for, why it's dangerous, severity, fix example
    3. Create `.claude/skills/review/SKILL.md`:
       - Frontmatter: `name: review`, `description: Pre-promotion code review workflow. Orchestrates quality review, security scan, evidence verification, and TypeScript strictness check before PR/merge. Use when the user says 'review', 'ready to merge', 'create PR', 'promote', or 'ship it'.`, `user-invokable: true`
       - Step 1: **Code Quality Review** — dispatch `code-reviewer` agent via `skills/requesting-code-review/`. Scope: full diff from branch base. Focus: code quality, naming, structure, DRY, test quality, cross-file consistency. If Next.js project: include `skills/nextjs-perf/` patterns as review criteria.
       - Step 2: **Security Scan** — invoke `skills/secure/` on changed files. Pass results to Step 5.
       - Step 3: **Evidence Verification** — invoke `skills/verification-before-completion/` — run tests, build, linter with FRESH output. Read full output, check exit codes. No claims without proof. This is NON-NEGOTIABLE — every promotion must have evidence backing.
       - Step 4: **TypeScript Strictness Check** — grep diff for `any` usage, type assertions (`as`), non-exhaustive switches. Report violations.
       - Step 5: **Gate Decision** — aggregate all findings from Steps 1-4:
         - CRITICAL security findings → BLOCK. Must fix before proceeding. Dispatch fix agents.
         - Code review Critical/Important → BLOCK. Must fix.
         - Verification failures (tests/build/lint red) → BLOCK. Must fix.
         - TypeScript `any` usage → BLOCK.
         - HIGH security + code review Minor → WARN. Log in review report, recommend fixing.
         - MEDIUM/LOW → PASS with notes.
       - Step 6: **Review Report** — generate structured report: quality score, security findings, verification evidence, TS strictness, recommendations
       - Step 7: **Promote** — if all gates pass (or user overrides warnings), invoke `skills/finishing-a-development-branch/` with conventional commit PR title enforcement: `type(scope): summary`
       - **IMPORTANT:** /review does NOT touch GSD state (STATE.md, ROADMAP.md). GSD state updates are the caller's responsibility (/build Step 6). /review is a pure quality gate.
    4. Create `.claude/skills/review/references/review-prompt.md`:
       - Enhanced review template that includes: Next.js perf patterns, TypeScript strictness checks, security awareness (don't duplicate /secure, but note patterns for reviewer awareness)
    5. Register both skills in plugin.json

  </action>
  <verify>
    - .claude/skills/secure/SKILL.md exists with 4-step process and parallel agent dispatch
    - .claude/skills/secure/references/owasp-checklist.md has concrete patterns per category
    - .claude/skills/review/SKILL.md exists with 7-step pipeline (quality → security → verification → TS check → gate → report → promote)
    - .claude/skills/review/references/review-prompt.md has enhanced review template
    - plugin.json includes both skills
  </verify>
  <done>/fh:review orchestrates quality+security+strictness gates before promotion. /fh:secure scans OWASP Top 10 with parallel agents.</done>
</task>

<task type="auto">
  <name>Task 2: Rewire /build, /refactor, /fix to use /review</name>
  <files>.claude/skills/build/SKILL.md, .claude/skills/refactor/SKILL.md, .claude/skills/fix/SKILL.md</files>
  <action>
    1. Edit `build/SKILL.md`:
       **KEEP:** Steps 1-7 (find plan, analyze waves, execute waves, spec gates, design gates, self-check + SUMMARY, GSD state updates, phase completion detection)
       **KEEP:** Step 8b (Simplify) — renumber as Step 8
       **REPLACE:** Steps 8 (Quality Review) + 9 (Verify) + 10 (Complete) with:
         ```
         ## Step 9: Pre-Promotion Review

         Invoke `skills/review/` — it orchestrates:
         - Code quality review (code-reviewer agent on full implementation diff)
         - Security scan (parallel OWASP scanning on changed files)
         - Evidence verification (tests, build, lint — fresh output with exit codes)
         - TypeScript strictness check (no `any` in diff)
         - Gate decision (blocks on CRITICAL/Important, warns on rest)
         - Promotion (PR creation with conventional commit title, or merge/keep/discard)

         **Context for /review:** Pass the plan's must_haves.truths and the SUMMARY.md path
         so the reviewer can verify against original intent.

         If /review reports BLOCKED findings: fix them (dispatch fix agents or handle directly),
         then re-invoke /review.

         **NOTE:** GSD state updates already happened in Step 6. /review does NOT touch STATE.md or ROADMAP.md.
         ```
       **REMOVE:** Old Steps 9 and 10 (verification-before-completion + finishing-a-development-branch are now inside /review)
    2. Edit `refactor/SKILL.md`:
       **KEEP:** Steps 1-4 (scope, baseline, plan, execute) + Step 5b (Simplify)
       **REPLACE:** Step 5 (Review) + 6 (Verify) + 7 (Complete) with:
         ```
         ## Step 5: Pre-Promotion Review

         After simplify pass, invoke `skills/review/`. It handles:
         - Quality review (behavior preservation + structural quality + design consistency)
         - Security scan on changed files
         - Evidence verification (full test suite — iron law compliance proof)
         - TypeScript strictness check
         - Promotion

         Context: refactoring scope, characterization tests baseline, iron law compliance evidence.
         ```
    3. Edit `fix/SKILL.md`:
       **KEEP:** Steps 1-3 (triage, TDD fix, frontend check)
       **REPLACE:** Step 4 (Spec Review) + 4b (Simplify) + 5 (Verify) + 6 (Complete) with:
         ```
         ## Step 4: Pre-Promotion Review

         For MODERATE+ fixes, invoke simplify first (`skills/simplify/`), then `skills/review/`.
         For SIMPLE fixes, invoke `skills/review/` directly (skip simplify).

         /review handles: quality check, security scan, evidence verification (tests+build+lint),
         TypeScript strictness, and promotion.

         Context: root cause, fix applied, test added, triage depth.
         ```
  </action>
  <verify>
    - build/SKILL.md Steps 8-10 replaced with single /review invocation
    - refactor/SKILL.md Steps 5-7 replaced with /review invocation
    - fix/SKILL.md Steps 4-6 replaced with /review invocation
    - All three skills no longer directly invoke requesting-code-review or finishing-a-development-branch
    - Simplify pass is preserved (runs before /review)
  </verify>
  <done>/build, /refactor, /fix route through /review for pre-promotion gating instead of ad-hoc review + finishing</done>
</task>
</tasks>

<verification>
- `grep -l "skills/review/" .claude/skills/build/SKILL.md .claude/skills/refactor/SKILL.md .claude/skills/fix/SKILL.md`
- `grep -L "requesting-code-review" .claude/skills/build/SKILL.md .claude/skills/refactor/SKILL.md .claude/skills/fix/SKILL.md` (should list all 3 — they no longer reference it directly)
- `grep "OWASP" .claude/skills/secure/SKILL.md .claude/skills/secure/references/owasp-checklist.md`
- `grep "pre-promotion" .claude/skills/review/SKILL.md`
</verification>

<success_criteria>
- /fh:review orchestrates quality review + security scan + evidence verification + TS strictness before PR/merge
- /fh:secure scans OWASP Top 10 with parallel agents and severity classification
- /build, /refactor, /fix use /review instead of ad-hoc review + finishing
- verification-before-completion is preserved inside /review (no composite drops evidence verification)
- CRITICAL findings block promotion
- GSD state updates remain in /build Step 6, not duplicated by /review
</success_criteria>

<output>.planning/designs/2026-03-12-plan-03-SUMMARY.md</output>
