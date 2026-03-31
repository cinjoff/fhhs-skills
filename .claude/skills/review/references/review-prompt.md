# Code Review Prompt Template

You are reviewing code for quality, architecture, and completeness. Be thorough but pragmatic — flag real problems, not style preferences.

**Note:** Spec verification (implementation vs task specs, unwired code, TS strictness) is handled by a separate agent in Step 1.8 — do not duplicate those checks. Focus on code quality, architecture, and patterns.

## Review Scope

Review the full diff from branch base to HEAD. Focus on changes introduced in this branch only.

---

## Code Quality Criteria

### Naming
- Are variables, functions, types named clearly? Do names reveal intent?
- Are naming conventions consistent across the diff?

### Structure
- Is code organized logically? Are responsibilities separated?
- Are functions reasonably sized? Is nesting depth manageable?

### Error Handling
- Are errors caught, logged, and handled appropriately?
- No swallowed errors (empty catch blocks, `.catch(() => {})`)
- Are error messages actionable?

### DRY
- Is there duplicated logic that should be extracted?
- Are shared utilities used consistently?
- If Fallow duplication data is available, cite exact duplicate locations rather than inferring from the diff

### Complexity
- Are there overly complex conditionals that should be decomposed?
- Are there deeply nested callbacks or promise chains?

### Test Quality
- Do tests verify behavior (not implementation details)?
- Are edge cases covered?
- Are assertions meaningful (not just `toBeTruthy()`)?
- Do test descriptions explain what is being verified?

### Cross-file Consistency
- Do shared patterns align across the diff?
- Are naming conventions consistent between files?
- Do types flow correctly across module boundaries?

---

## Architecture Criteria

### Dependency Direction
- Do dependencies flow in one direction (e.g., UI -> service -> data)?
- Are there circular imports? Check for A imports B imports A patterns.
- If Fallow data is available, circular dependency findings are definitive — cite them directly
- Do lower-level modules depend on higher-level abstractions? (dependency inversion)

### Separation of Concerns
- Is business logic mixed with UI rendering?
- Is data access happening directly in route handlers or components?
- Are side effects isolated from pure logic?

### Abstraction Quality
- Are abstractions pulling their weight or just adding indirection?
- Do wrappers add value (error handling, caching, logging) or just pass through?
- Are there leaky abstractions that expose implementation details?

### API Design
- Are interfaces clean and minimal?
- Do function signatures expose implementation details?
- Are return types consistent across similar operations?
- Are optional parameters used appropriately (not as a sign of doing too many things)?

### Cross-cutting Concerns
- Is error handling consistent across the codebase? Same patterns everywhere?
- Is logging structured and consistent?
- Are auth checks applied uniformly to protected routes?
- Is validation done at the boundary (not scattered throughout)?

---

## Gap Analysis Criteria

### Untested Code Paths
- New branches/conditions without corresponding test cases
- Error paths that are never exercised in tests
- New utility functions without unit tests

### Unhandled Error States
- try/catch blocks that swallow errors or log-and-continue
- Missing error boundaries in React component trees
- Async operations without rejection handling
- Network calls without timeout or retry logic

### Incomplete Features
- TODO / FIXME / PLACEHOLDER / HACK markers in new code
- Stub implementations that return hardcoded values
- Commented-out code that suggests unfinished work
- Feature flags referencing unreleased functionality

### Missing Edge Cases
- **UI:** Empty states, error states, loading states, overflow/truncation
- **Logic:** Boundary conditions (zero, negative, max values), null/undefined inputs
- **Data:** Empty arrays, single-item arrays, malformed input
- **Concurrency:** Race conditions in async operations, stale closures

### API Contract Gaps
- Endpoints without input validation
- Missing error response schemas
- Inconsistent response shapes across similar endpoints
- No rate limiting on public endpoints

---

## TypeScript Strictness

- **No `any`:** Every `any` must be replaced with a proper type. This is a blocking issue.
- **Minimize `as` assertions:** Type assertions bypass the type system. Each one needs justification.
- **Exhaustive switches:** Switch statements on union types should be exhaustive (use `default: { const _exhaustive: never = value; }` pattern or `satisfies`).
- **Strict null checks:** Are optional values handled properly? No `!` non-null assertions without justification.

---

## Next.js Performance (if applicable)

Only apply if the project uses Next.js (`next.config.*` present):

- **Client-side waterfalls:** Sequential `fetch` calls in client components that could be parallel or moved server-side
- **Unnecessary `'use client'`:** Components that don't use hooks/interactivity but are marked as client components
- **Barrel imports:** `import { X } from '@/components'` patterns that pull entire module trees into client bundles
- **Caching:** Are expensive computations wrapped in `React.cache` or LRU caches? Are `fetch` calls using appropriate Next.js caching strategies?
- **Bundle size:** Are large libraries imported on the client side when a lighter alternative exists?

---

## Static Analysis Findings (if provided)

If this section contains Fallow output, treat it as **ground truth** — these findings are deterministic, based on full codebase import graph analysis.

### How to use Fallow data in your review:

**Dead code (unused exports/files):** Flag as Important. Cite the exact export name and file from Fallow output. Note: some unused exports are intentional public API — check if the export is documented or in an `index.ts` barrel file before flagging.

**Circular dependencies:** Flag as Important or Critical (depending on whether it causes runtime issues). Cite the exact cycle chain from Fallow output. Reference the "Dependency Direction" criteria above.

**Code duplication:** Flag as Minor or Important (depending on duplication size). Cite exact file:line ranges from Fallow output. Reference the "DRY" criteria above.

**Complexity hotspots:** Flag functions exceeding cyclomatic complexity 15 or cognitive complexity 20 as Important. Cite the exact metric from Fallow output. Reference the "Complexity" criteria above.

If no Fallow data is provided, use your existing analysis approach for these areas.

---

## Quality Refinement Category Flags

At the end of your report, include a `### Quality Refinement Signals` section. For each category below, indicate whether findings from your review trigger it. This section is consumed by Step 2.5 (Quality Refinement) — be accurate and concise.

| Category | Flag as triggered if... |
|---|---|
| `simplify` | You found 2+ DRY violations, code duplication, or redundant patterns |
| `harden` | You found any unhandled error path in changed code (swallowed errors, missing rejection handling, no-op catch blocks) |
| `adapt` | Frontend files were changed AND you found cross-device, responsive, or accessibility gaps |
| `normalize` | Frontend files were changed AND you found design system drift (inconsistent tokens, spacing, component usage) |
| `ui-critique` | Visual file ratio exceeds 30% of changed files OR you found explicit UI quality concerns (layout issues, AI-generated aesthetic slop) |

Output format (add at the end of your report):

```
### Quality Refinement Signals
- simplify: YES — [brief reason] / NO
- harden: YES — [brief reason] / NO
- adapt: YES — [brief reason] / NO
- normalize: YES — [brief reason] / NO
- ui-critique: YES — [brief reason] / NO
```

If none are triggered, write: `Quality Refinement Signals: none — no sub-skill triggers met.`

---

## Severity Classification

- **Critical:** Bugs, security issues, data loss risks, broken functionality. **Must fix before merge.**
- **Important:** Significant code quality issues, missing error handling, architectural concerns. **Should fix before merge.**
- **Minor:** Style inconsistencies, minor improvements, better naming suggestions. **Nice to fix, won't block.**
- **Nitpick:** Personal preferences, optional improvements. **Note only.**

---

## Report Format

```
## Code Review Report

### Summary
- Files reviewed: N
- Severity breakdown: C critical, I important, M minor, N nitpick
- Overall quality: X/10

### Critical Issues
1. [file:line] Description — why critical — suggested fix — **Next: /fix**

### Important Issues
1. [file:line] Description — suggested fix — **Next: /fix** or **/refactor**

### Minor Issues
1. [file:line] Description

### Nitpicks
1. [file:line] Description

### Gap Analysis
1. [file:line or area] Gap description — impact — **Next: /plan-work** or **/fix**

### Positive Observations
- What was done well (acknowledge good patterns, thorough tests, clean architecture)
```
