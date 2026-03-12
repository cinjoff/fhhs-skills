# Deep Eval Fixture: Acme Dashboard

## Overview
Single comprehensive Next.js 15 fixture (`evals/fixtures/nextjs-app-deep/`) replacing all 3 shallow fixtures. ~2500 LOC of real application code with intentional issues across every skill category.

## Tech Stack
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS v4
- shadcn/ui components
- Supabase (`@supabase/supabase-js`)
- Vitest (unit) + Playwright (E2E)

## File Map & Planted Issues

### Config Layer (~100 LOC)
| File | Notes |
|------|-------|
| `next.config.ts` | Standard Next.js 15 config |
| `tsconfig.json` | `strict: true` |
| `tailwind.config.ts` | Custom theme extending shadcn defaults |
| `components.json` | shadcn configuration |
| `postcss.config.mjs` | Standard |
| `playwright.config.ts` | E2E config |
| `.env.example` | Supabase URL + anon key placeholders |
| `CLAUDE.md` | Project conventions |

### shadcn UI Components (~250 LOC) — Clean Reference
| File | Purpose |
|------|---------|
| `src/components/ui/button.tsx` | Standard shadcn Button with variants |
| `src/components/ui/card.tsx` | Standard shadcn Card |
| `src/components/ui/dialog.tsx` | Standard shadcn Dialog |
| `src/components/ui/input.tsx` | Standard shadcn Input |
| `src/components/ui/badge.tsx` | Standard shadcn Badge |
| `src/components/ui/dropdown-menu.tsx` | Standard shadcn DropdownMenu |

These are the "correct" baseline. App components that bypass them = issues for `/normalize` and `/extract`.

### Lib Layer (~350 LOC)
| File | Issues |
|------|--------|
| `src/lib/supabase.ts` (~30) | Supabase client setup. Clean. |
| `src/lib/auth.ts` (~80) | **Security:** Hardcoded JWT secret, localStorage token storage, missing token validation on refresh. **TS:** `as` assertion on jwt.verify return |
| `src/lib/api.ts` (~60) | **TS:** All params typed `any`, return types `any`. Duplicated fetch pattern (same as in route handlers). **Refactor:** extract shared fetch wrapper |
| `src/lib/utils.ts` (~80) | `cn()` helper (clean) + 5 unrelated utility functions crammed in (formatDate, truncateText, debounce, parseQueryString, generateId). **Refactor/Simplify:** kitchen sink file, some duplicate `debounce` logic also in hooks/ |
| `src/lib/validators.ts` (~50) | Email/password validation. Duplicated in user-form.tsx and login page. **Refactor/Extract** candidate |
| `src/types/index.ts` (~70) | **TS:** Non-exhaustive switch on `UserRole` (missing 'viewer'), non-exhaustive switch on `ApiAction` (missing 'batch'), `Record<string, any>` usage, missing discriminated union for API responses |

### Hooks (~80 LOC)
| File | Issues |
|------|--------|
| `src/hooks/use-auth.ts` (~50) | **TS:** Implicit `any` params on login/logout, untyped return, missing error states. **Harden:** no loading/error state management |
| `src/hooks/use-debounce.ts` (~30) | Clean. Positive finding for audits. |

### App Components (~900 LOC)
| File | Issues |
|------|--------|
| `src/components/sidebar.tsx` (~120) | **Responsive:** Fixed 280px width, breaks below 768px. **A11y:** Touch targets 32px (< 44px min), missing `role="navigation"`, no `aria-current` on active link. **Normalize:** Uses raw `<a>` tags instead of Next.js `<Link>`, hard-coded colors (#1e293b) instead of CSS variables |
| `src/components/data-table.tsx` (~180) | **Performance:** Re-renders entire table on every search keystroke (no debounce, no memoization), inline function definitions in JSX. **Refactor:** God component — 180 lines mixing search, sort, pagination, row rendering. Should split into DataTableHeader, DataTableBody, DataTablePagination. **A11y:** Missing `scope` on `<th>`, no `aria-sort` indicators |
| `src/components/comment-card.tsx` (~60) | **Security:** XSS via `dangerouslySetInnerHTML` with user content. **A11y:** Missing `<time>` element for dates, no `aria-label` on comment container |
| `src/components/user-form.tsx` (~100) | **TS:** `as any` assertions on event handlers (8 instances). **Normalize:** Uses raw `<input>` instead of shadcn `<Input>`, raw `<button>` instead of `<Button>`. **Harden:** No error states shown, no loading state on submit, hard-coded English strings. **A11y:** Missing `aria-describedby` for validation errors |
| `src/components/metric-card.tsx` (~80) | **Anti-pattern/AI slop:** Gradient text (`bg-gradient-to-r bg-clip-text text-transparent`), glassmorphism (`backdrop-blur-xl bg-white/10`), oversized hero numbers (text-5xl), decorative SVG background blobs. **Critique/Distill:** Over-designed, distracting from data |
| `src/components/chart-widget.tsx` (~90) | **Performance:** Animates `width` and `height` CSS properties (should use `transform: scaleX/scaleY`). Reads `offsetWidth` inside resize handler loop (layout thrashing). **Optimize:** Missing `will-change`, no `requestAnimationFrame` batching |
| `src/components/notification-toast.tsx` (~70) | **A11y:** Missing `role="alert"` and `aria-live="polite"`. **Harden:** No auto-dismiss, no way to dismiss via keyboard, toast stacking overflow |
| `src/components/theme-toggle.tsx` (~50) | **Theming:** Toggle works but `--color-surface-elevated` doesn't update in dark mode (CSS variable missing dark variant). Settings page has hard-coded `bg-white` that ignores dark mode. **A11y:** Toggle button has no accessible label |
| `src/components/search-input.tsx` (~50) | Clean component using shadcn Input correctly. Positive finding. |
| `src/components/user-avatar.tsx` (~40) | **A11y:** Decorative image missing `alt=""`, non-decorative images missing meaningful alt text. **Optimize:** No next/image, raw `<img>` tags without lazy loading |

### Pages (~400 LOC)
| File | Issues |
|------|--------|
| `src/app/layout.tsx` (~40) | Root layout with ThemeProvider. Missing `lang` attribute consideration for i18n |
| `src/app/page.tsx` (~100) | **Performance/NextJS:** Client Component with `useEffect` waterfall — fetches metrics, then users, then activity sequentially. Should be Server Component with parallel data loading. **Optimize/NextJS-perf:** Missing `<Suspense>` boundaries, no streaming. **Onboard:** No empty state when data hasn't loaded |
| `src/app/login/page.tsx` (~80) | **A11y:** Form missing `aria-describedby` linking errors to inputs. **Harden:** No rate limiting indication, error messages are generic ("Invalid credentials" — no distinction between wrong email vs wrong password for UX, which is actually correct for security but should clarify copy). **Normalize:** Duplicates validation logic from `lib/validators.ts` |
| `src/app/users/page.tsx` (~90) | **Responsive:** Container has `min-width: 800px` — horizontal scroll on mobile. **A11y:** "Delete" buttons have no confirmation dialog. **Harden:** No empty state for zero users. Missing pagination edge case (page > totalPages shows blank) |
| `src/app/settings/page.tsx` (~80) | **Theming:** Has `bg-white` hard-coded, doesn't respect dark mode. **Quieter:** Overly dense layout, too many options visible. **Adapt:** Single-column layout doesn't use available space on wide screens |

### API Routes (~300 LOC)
| File | Issues |
|------|--------|
| `src/app/api/auth/login/route.ts` (~50) | Uses Supabase auth. Missing rate limiting. Leaks error details in 500 responses |
| `src/app/api/auth/refresh/route.ts` (~40) | **Security:** Accepts refresh token from request body instead of httpOnly cookie |
| `src/app/api/users/route.ts` (~80) | **Security:** SQL injection via string interpolation in `.rpc()` call with raw user input. Missing auth check on DELETE. No input validation. **TS:** Response typed as `any` |
| `src/app/api/data/route.ts` (~60) | **Security:** Table name from query param without allowlist. No CORS headers. No auth. No rate limiting. **TS:** Untyped query results |
| `src/app/api/comments/route.ts` (~50) | **Security:** No input sanitization on comment content (enables stored XSS). **Harden:** Missing pagination, no content length limits |

### Tests (~200 LOC)
| File | Issues |
|------|--------|
| `src/__tests__/auth.test.ts` (~70) | Passes. Tests happy path only — no edge cases (expired tokens, malformed tokens, missing env vars). Shallow coverage for `/fix` to identify |
| `src/__tests__/data-table.test.tsx` (~80) | **Failing test** — expects old prop interface (`columns` prop was renamed to `fields` but test wasn't updated). `/fix` should diagnose and repair via TDD |
| `e2e/login.spec.ts` (~50) | **Playwright anti-patterns:** Uses CSS selectors (`page.click('.btn-primary')`) instead of role/test-id locators. No Page Object Model. Missing assertions on error states. `/playwright-testing` should identify these |

### GSD Planning Layer (~400 LOC)
| File | Content |
|------|---------|
| `.planning/PROJECT.md` | Full tech stack, repo structure, conventions |
| `.planning/STATE.md` | Phase 01 COMPLETE, Phase 02 IN_PROGRESS (task 01 done, task 02 in-progress) |
| `.planning/ROADMAP.md` | 4 phases: Auth, Dashboard, User Mgmt, Settings. Each with requirement IDs (R-001 through R-009) |
| `.planning/DESIGN.md` | Design tokens matching shadcn CSS variables + dark mode spec |
| `.planning/todos/todo-001.md` | Pending: "Add rate limiting to auth endpoints" |
| `.planning/todos/todo-002.md` | Pending: "Extract shared fetch wrapper from API routes" |
| `.planning/todos/todo-003.md` | In-progress: "Fix data-table regression test" |
| `.planning/phases/01-auth/01-01-PLAN.md` | Completed auth plan (adapted from existing fixture) |
| `.planning/phases/01-auth/01-01-SUMMARY.md` | Completion summary with evidence |
| `.planning/phases/02-dashboard/02-01-PLAN.md` | In-progress dashboard plan — task 1 done, task 2 in-progress |

## Issue Density by Skill Category

| Category | Issue Count | Files Affected |
|----------|-------------|----------------|
| Security (OWASP) | 12 | 7 files |
| TypeScript strictness | 15 | 6 files |
| Accessibility (WCAG) | 14 | 8 files |
| Performance | 8 | 4 files |
| Design anti-patterns | 6 | 3 files |
| Responsive/adaptive | 5 | 4 files |
| Refactoring candidates | 6 | 5 files |
| Theming/dark mode | 4 | 3 files |
| Error handling/i18n | 7 | 5 files |
| Test quality | 5 | 3 files |
| **Total** | **82** | **across 30+ files** |

## evals.json Updates

All existing evals referencing old fixtures get updated to point at `nextjs-app-deep/`. Fixture-backed evals get expanded assertions that test against the actual planted issues. New evals added for uncovered skills (design skills, /optimize, /harden, /onboard, etc.).
