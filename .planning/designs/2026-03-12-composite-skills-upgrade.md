# Composite Skills Upgrade — Production-Grade Next.js/TypeScript Workflow

**Date:** 2026-03-12
**Status:** Approved
**Scope:** Improve fhhs-skills composite skills for production-grade Next.js/TypeScript development

## Problem

Current composites cover planning, building, fixing, refactoring, and verification but lack:
- Framework-specific performance guidance (Next.js/React)
- Testing framework guidance (Playwright)
- Security scanning (OWASP)
- TypeScript strictness enforcement
- Conventional commit/changelog discipline
- Eval test coverage for critical orchestration paths

## Design Decisions (Locked)

### Upstream Wiring Strategy
- **Vercel React Best Practices**: Always loaded — cooked into `build/references/implementer-prompt.md` and `refactor/SKILL.md` review criteria. Every subagent building Next.js code gets these rules.
- **Playwright Best Practices**: Selective — referenced only when test files are touched or TDD tasks are executing. Detection logic checks for `*.test.*`, `*.spec.*`, `playwright.config.*` in task file lists.

### Security Scanning & Pre-Promotion Review
- `/fh:secure` is standalone and part of a dedicated `/fh:review` pre-promotion workflow
- NOT embedded in `/build` — security review happens before promoting changes (PR/merge), not during build
- `/fh:review` orchestrates 7 steps: code quality review → security scan → **evidence verification (tests+build+lint)** → TS strictness check → gate decision → review report → promote
- `/fh:review` wraps `skills/requesting-code-review/`, `skills/verification-before-completion/`, and `skills/finishing-a-development-branch/` into a single pre-promotion gate
- **verification-before-completion is NON-NEGOTIABLE** — every promotion must have fresh test/build/lint evidence
- Mandatory/blocking for CRITICAL severity findings (hardcoded secrets, SQL injection, auth bypass)
- Advisory for MEDIUM/LOW (logged in review report, don't block)
- Uses parallel subagents per OWASP category for thoroughness
- **GSD state isolation:** `/review` does NOT touch STATE.md or ROADMAP.md. GSD state updates are the caller's responsibility (/build Step 6, done BEFORE /review)

### TypeScript Strictness
- Rules absorbed into `build/references/implementer-prompt.md`, `refactor/SKILL.md`, and `fix/SKILL.md`
- Not a separate upstream — inline rules: no `any`, use `unknown`, type guards, discriminated unions, exhaustive switches
- Applies to ALL code paths (new code, refactors, bug fixes)

### Eval Tests
- Deep end-to-end orchestration tests that exercise full composite workflows
- Each eval sets up realistic project state (files, .planning/, git history) and verifies the entire pipeline
- Test complete flows: `/build` with all gates → `/review` with security scan → PR creation
- Test cross-skill integration: `/fix` triage → TDD → security check → finishing
- Format: existing `evals/evals.json` structure with comprehensive file fixtures and multi-step assertions

### Conventional Commits
- `/release` enhanced with conventional changelog generation from git log
- `/build` finishing step enforces `type(scope): summary` PR titles
- PR descriptions auto-include test plan section

## Execution Plans

### Plan 1: Adopt Vercel React Best Practices Upstream
Snapshot → fork → wire into build/refactor.

### Plan 2: Adopt Playwright Best Practices Upstream
Snapshot → fork → selective wiring with detection logic.

### Plan 3: Create `/fh:review` Pre-Promotion Workflow + `/fh:secure`
New dedicated code review workflow that orchestrates quality review, security scan, and TypeScript strictness verification before promoting changes. Includes `/fh:secure` as a component. Updates `/build` and `/refactor` to route through `/review` instead of ad-hoc review + finishing.

### Plan 4: TypeScript Strictness + Conventional Commits
Enhance existing skill instructions with inline rules.

### Plan 5: Deep E2E Eval Tests
Full end-to-end orchestration tests with realistic project fixtures, covering complete workflows across all enhanced composites.
