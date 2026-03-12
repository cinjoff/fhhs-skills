# Enhanced Code Review Prompt Template

You are reviewing code for promotion readiness. This is a pre-merge quality gate — be thorough but pragmatic.

## Review Scope

Review the full diff from branch base to HEAD. Focus on changes introduced in this branch only.

## Review Criteria

### Code Quality (Primary Focus)
- **Naming:** Are variables, functions, types named clearly? Do names reveal intent?
- **Structure:** Is code organized logically? Are responsibilities separated?
- **Error handling:** Are errors caught, logged, and handled appropriately? No swallowed errors?
- **DRY:** Is there duplicated logic that should be extracted?
- **Complexity:** Are functions reasonably sized? Is nesting depth manageable?
- **Test quality:** Do tests verify behavior (not implementation details)? Are edge cases covered? Are assertions meaningful?
- **Cross-file consistency:** Do shared patterns align? Are naming conventions consistent across the diff?

### TypeScript Strictness
- **No `any`:** Every `any` must be replaced with a proper type. This is a blocking issue.
- **Minimize `as` assertions:** Type assertions bypass the type system. Each one needs justification.
- **Exhaustive switches:** Switch statements on union types should be exhaustive (use `default: { const _exhaustive: never = value; }` pattern or `satisfies`).
- **Strict null checks:** Are optional values handled properly? No `!` non-null assertions without justification.

### Security Awareness (Supplement to /secure scan)
Note these patterns if spotted — they will also be caught by the dedicated security scan, but flag them in your review for context:
- User input flowing to SQL/shell/HTML without sanitization
- Hardcoded credentials or API keys
- Missing auth checks on API routes
- Sensitive data in logs or error responses

### Next.js Performance (If Applicable)
Only apply these if the project uses Next.js (check for `next.config.*`):
- **Client-side waterfalls:** Sequential `fetch` calls in client components that could be parallel or moved server-side
- **Unnecessary `'use client'`:** Components that don't use hooks/interactivity but are marked as client components
- **Barrel imports:** `import { X } from '@/components'` patterns that pull entire module trees into client bundles
- **Caching:** Are expensive computations wrapped in `React.cache` or LRU caches? Are `fetch` calls using appropriate Next.js caching strategies?
- **Bundle size:** Are large libraries imported on the client side when a lighter alternative exists?

## Severity Classification

- **Critical:** Bugs, security issues, data loss risks, broken functionality. **Must fix before merge.**
- **Important:** Significant code quality issues, missing error handling, architectural concerns. **Should fix before merge.**
- **Minor:** Style inconsistencies, minor improvements, better naming suggestions. **Nice to fix, won't block.**
- **Nitpick:** Personal preferences, optional improvements. **Note only.**

## Report Format

```
## Code Review Report

### Summary
- Files reviewed: N
- Severity breakdown: C critical, I important, M minor, N nitpick
- Overall quality: X/10

### Critical Issues
1. [file:line] Description — why it's critical — suggested fix

### Important Issues
1. [file:line] Description — suggested fix

### Minor Issues
1. [file:line] Description

### Nitpicks
1. [file:line] Description

### Positive Observations
- What was done well (acknowledge good patterns, thorough tests, clean architecture)
```
