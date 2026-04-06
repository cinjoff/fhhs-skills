---
name: fh:ui-test
description: Take screenshots and check if the UI looks right. Use --qa for thorough functional testing.
user-invocable: true
---

Visual verification and QA testing of frontend work.

Target to verify: $ARGUMENTS

If `$ARGUMENTS` contains `--qa`, run **QA Mode** below. Otherwise, run **Visual Verification Mode**.

---

# Visual Verification Mode

## Step 1: Ensure Dev Server

Detect the dev server URL. Check in order:

1. **User-provided URL** — if the user gave you a URL, use it directly.
2. **`$PORT` environment variable** — Conductor sets this when port-forwarding. If set, use `http://localhost:$PORT`.
3. **Common local ports** — scan for a listening server:

```bash
# Check $PORT first (Conductor port forwarding)
if [ -n "$PORT" ]; then
  echo "PORT_ENV=$PORT"
fi
# Then scan common dev ports
for p in 3000 5173 4321 8080 4000 8000; do
  lsof -i :$p -P -n 2>/dev/null | grep -q LISTEN && echo "LISTENING=$p"
done
```

Use the first detected port as `$DEV_PORT`. If nothing is found, detect the package manager and start the dev server:

```bash
# Detect package manager from lockfile
if [ -f "pnpm-lock.yaml" ]; then PM="pnpm"
elif [ -f "yarn.lock" ]; then PM="yarn"
elif [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then PM="bun"
else PM="npm"; fi
echo "PM=$PM"
```

Start with `$PM run dev` (or `$PM dev` for pnpm/bun) in the background and wait for ready.

Store the base URL for use in all subsequent steps:
```bash
DEV_URL="http://localhost:${DEV_PORT}"
```

---

## Step 2: Capture Screenshots

## SETUP (run this check BEFORE any browse command)

```bash
_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
B=""
[ -n "$_ROOT" ] && [ -x "$_ROOT/.claude/skills/browse/dist/browse" ] && B="$_ROOT/.claude/skills/browse/dist/browse"
[ -z "$B" ] && [ -x "$HOME/.claude/skills/browse/dist/browse" ] && B="$HOME/.claude/skills/browse/dist/browse"
if [ -x "$B" ]; then
  echo "READY: $B"
else
  echo "NEEDS_SETUP"
fi
```

If `NEEDS_SETUP`:
1. Tell the user: "browse binary needs a one-time build (~10 seconds). OK to proceed?"
2. Run:
```bash
_FHHS="${FHHS_SKILLS_ROOT:-$(ls -d "$HOME/.claude/plugins/cache/fhhs-skills/fh"/*/ 2>/dev/null | sort -V | tail -1)}"
[ -n "$_FHHS" ] && bash "$_FHHS/.claude/skills/browse/setup"
```

Capture desktop, tablet, and mobile viewports:

```bash
# Desktop (1440x900)
$B viewport 1440x900
$B goto "$DEV_URL"
$B screenshot /tmp/ui-test-desktop.png

# Tablet (768x1024)
$B viewport 768x1024
$B goto "$DEV_URL"
$B screenshot /tmp/ui-test-tablet.png

# Mobile (375x812)
$B viewport 375x812
$B goto "$DEV_URL"
$B screenshot /tmp/ui-test-mobile.png

# Accessibility snapshot
$B snapshot -c > /tmp/ui-test-a11y.txt
```

For authenticated pages, log in first:
```bash
$B viewport 1440x900
$B goto "$DEV_URL/login"
$B fill 'input[type="email"]' "$TEST_USER_EMAIL"
$B fill 'input[type="password"]' "$TEST_USER_PASSWORD"
$B click 'button[type="submit"]'
$B goto "$DEV_URL/protected"
$B screenshot /tmp/ui-test-desktop.png
```

Read each screenshot image to visually inspect the UI.

**Screenshot evidence for critical bugs:** If a CRITICAL visual bug is found, capture before/after screenshots to document the issue.

---

## Step 3: Console Health Check

Check for runtime errors:
```bash
$B eval "JSON.stringify(window.__consoleErrors || [])"
```

Evaluate:
1. **Console errors** — any runtime errors? React errors? Failed API calls?
2. **Console warnings** — deprecation warnings? Missing props?
3. **Network errors** — failed requests? CORS issues?
4. **Page errors** — unhandled exceptions?

Flag anything concerning.

---

## Step 4: Design Critique

Read the screenshots and the project's `.planning/DESIGN.md` for design context (if no DESIGN.md exists, evaluate against general web design principles). Evaluate:

1. **Visual hierarchy** — most important content most prominent?
2. **Typography** — correct fonts, scale, spacing per design system?
3. **Color** — semantic usage, contrast (WCAG AA)?
4. **Spacing** — consistent rhythm, sufficient whitespace, 8px grid?
5. **Responsive** — layout works across all three breakpoints?
6. **Accessibility** — from the a11y snapshot: proper heading hierarchy, labeled inputs, descriptive buttons?
7. **No emoji in UI** — the project does not use standard emoji in the interface

Report issues with severity: Critical / High / Medium / Low

---

## Step 5: Report

Combine all results into a single report:

### Visual Verification Report
- **Console Health**: errors, warnings, network issues
- **Screenshots**: reference captured files, note what each shows
- **Design Quality**: severity-rated issues from critique
- **Accessibility**: heading structure, labels, contrast
- **Responsive**: issues at specific breakpoints
- **Recommendation**: Ship / Fix critical first / Needs rework

If GSD project is active and verifying a phase, update STATE.md with verification results.

---

# QA Mode (--qa flag)

<!-- Forked from gstack qa (v0.3.3 → v0.4.0). Browser backend: gstack browse -->

You are a QA engineer. Test web applications like a real user — click everything, fill every form, check every state. Produce a structured report with evidence.

## Prerequisites

This skill requires **gstack browse** binary (`$B`). Check availability before proceeding.

## Setup

**Parse the user's request for these parameters:**

| Parameter | Default | Override example |
|-----------|---------|-----------------|
| Target URL | (auto-detect or required) | `https://myapp.com`, `http://localhost:$PORT` |
| Mode | full | `--quick`, `--regression .planning/qa-reports/baseline.json` |
| Output dir | `.planning/qa-reports/` | `Output to /tmp/qa` |
| Scope | Full app (or diff-scoped) | `Focus on the billing page` |
| Auth | None | `Sign in to user@example.com` |
| Tier | standard | `--qa quick`, `--qa exhaustive` |

**If no URL is given and you're on a feature branch:** Automatically enter **diff-aware mode** (see Modes below). This is the most common case — the user just shipped code on a branch and wants to verify it works.

## SETUP (run this check BEFORE any browse command)

```bash
_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
B=""
[ -n "$_ROOT" ] && [ -x "$_ROOT/.claude/skills/browse/dist/browse" ] && B="$_ROOT/.claude/skills/browse/dist/browse"
[ -z "$B" ] && [ -x "$HOME/.claude/skills/browse/dist/browse" ] && B="$HOME/.claude/skills/browse/dist/browse"
if [ -x "$B" ]; then
  echo "READY: $B"
else
  echo "NEEDS_SETUP"
fi
```

If `NEEDS_SETUP`:
1. Tell the user: "browse binary needs a one-time build (~10 seconds). OK to proceed?"
2. Run:
```bash
_FHHS="${FHHS_SKILLS_ROOT:-$(ls -d "$HOME/.claude/plugins/cache/fhhs-skills/fh"/*/ 2>/dev/null | sort -V | tail -1)}"
[ -n "$_FHHS" ] && bash "$_FHHS/.claude/skills/browse/setup"
```

**Create output directories:**

```bash
REPORT_DIR=".planning/qa-reports"
mkdir -p "$REPORT_DIR/screenshots"
BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-')
```

---

## Modes

### Diff-aware (automatic when on a feature branch with no URL)

This is the **primary mode** for developers verifying their work. When the user says `/qa` without a URL and the repo is on a feature branch, automatically:

1. **Analyze the branch diff** to understand what changed:
   ```bash
   git diff main...HEAD --name-only
   git log main..HEAD --oneline
   ```

2. **Identify affected pages/routes** from the changed files:
   - Controller/route files -> which URL paths they serve
   - View/template/component files -> which pages render them
   - Model/service files -> which pages use those models (check controllers that reference them)
   - CSS/style files -> which pages include those stylesheets
   - API endpoints -> test them directly with `$B eval "await fetch('/api/...')"`
   - Static pages (markdown, HTML) -> navigate to them directly

3. **Detect the running app** — resolve the dev server URL using the same priority as Visual Verification mode:
   - If the user provided a URL, use it.
   - If `$PORT` is set (Conductor port forwarding), use `http://localhost:$PORT`.
   - Otherwise scan common ports:
   ```bash
   for p in 3000 5173 4321 8080 4000 8000; do
     lsof -i :$p -P -n 2>/dev/null | grep -q LISTEN && echo "LISTENING=$p" && break
   done
   ```
   Store as `DEV_URL` and use throughout. If no local app is found, check for a staging/preview URL in the PR or environment. If nothing works, ask the user for the URL.

4. **Test each affected page/route:**
   - Navigate to the page
   - Take a screenshot
   - Check console for errors
   - If the change was interactive (forms, buttons, flows), test the interaction end-to-end
   - Use `$B snapshot -i` before and after actions to verify the change had the expected effect

5. **Cross-reference with commit messages and PR description** to understand *intent* — what should the change do? Verify it actually does that.

6. **Report findings** scoped to the branch changes:
   - "Changes tested: N pages/routes affected by this branch"
   - For each: does it work? Screenshot evidence.
   - Any regressions on adjacent pages?

**If the user provides a URL with diff-aware mode:** Use that URL as the base but still scope testing to the changed files.

### Full (default when URL is provided)
Systematic exploration. Visit every reachable page. Document 5-10 well-evidenced issues. Produce health score. Takes 5-15 minutes depending on app size.

### Quick (`--quick`)
30-second smoke test. Visit homepage + top 5 navigation targets. Check: page loads? Console errors? Broken links? Produce health score. No detailed issue documentation.

### Regression (`--regression <baseline>`)
Run full mode, then load `baseline.json` from a previous run. Diff: which issues are fixed? Which are new? What's the score delta? Append regression section to report.

---

## Workflow

---

### Test Framework Bootstrap (Pre-QA)

Runs once at the start of a QA session. Only triggers if no test framework is detected.

Detection:
```bash
# Detect runtime
[ -f Gemfile ] && RUNTIME="ruby"
[ -f package.json ] && RUNTIME="node"
[ -f requirements.txt ] || [ -f pyproject.toml ] && RUNTIME="python"
[ -f go.mod ] && RUNTIME="go"
[ -f Cargo.toml ] && RUNTIME="rust"

# Check for existing test framework
[ -f vitest.config.* ] || [ -f jest.config.* ] || [ -d __tests__ ] || [ -d tests ] && TESTS_EXIST=true
```

If no test framework found and `.planning/qa-reports/.no-test-bootstrap` doesn't exist:
- Offer to bootstrap the recommended framework for the runtime
- Built-in recommendations table:
  | Runtime | Primary | Alternative |
  |---------|---------|-------------|
  | Node.js | vitest + @testing-library | jest + @testing-library |
  | Next.js | vitest + @testing-library/react + playwright | jest + cypress |
  | Python | pytest + pytest-cov | unittest |
  | Ruby/Rails | minitest + fixtures + capybara | rspec + factory_bot |
  | Go | stdlib testing + testify | — |
  | Rust | cargo test + mockall | — |
- Install packages, create config, directory structure, one example test
- Generate 3-5 real tests for recently changed files
- Run test suite to verify
- Commit bootstrap files separately: `chore(qa): bootstrap test framework`

Opt-out: create `.planning/qa-reports/.no-test-bootstrap`

---

### Phase 1: Initialize

1. Check gstack browse availability (see Setup above)
2. Create output directories
3. Copy report template from `ui-test/references/qa-report-template.md` to output dir
4. Start timer for duration tracking

### Phase 2: Authenticate (if needed)

**If the user specified auth credentials:**

```bash
$B goto <login-url>
$B snapshot -i       # find the login form
$B fill @e3 "user@example.com"
$B fill @e4 "[REDACTED]"   # NEVER include real passwords in report
$B click @e5                # submit
$B snapshot -i              # verify login succeeded
```

Browse maintains authentication state automatically across calls — no need to save or load state files.

**If 2FA/OTP is required:** Ask the user for the code and wait.

**If CAPTCHA blocks you:** Tell the user: "Please complete the CAPTCHA in the browser, then tell me to continue."

### Phase 2.5: Codebase Health Baseline

Before QA begins, capture a codebase health baseline:

```bash
bash .claude/skills/ui-test/bin/qa-health.sh > /tmp/qa-health-baseline.json
cat /tmp/qa-health-baseline.json
```

Store the `score` field as `CODEBASE_HEALTH_BASELINE`. This will be compared after the fix loop.

> **Note on health metrics:** There are two distinct health scores in this workflow:
> - **Codebase Health Score** — tool-based (tsc, lint, unit tests, e2e). Computed by `qa-health.sh`. Tracks whether the code passes its own checks.
> - **UI Health Score** — browser-based, computed during Phase 6 and Phase 9 using the rubric below. Tracks how well the deployed UI works from a user perspective.
> These are independent metrics. A codebase can have clean types + passing tests but a broken UI, or vice versa.

---

### Phase 3: Orient

Get a map of the application:

```bash
$B goto <target-url>
$B snapshot -i -a -o "$REPORT_DIR/screenshots/initial-annotated.png"
$B screenshot "$REPORT_DIR/screenshots/initial.png"
$B console --errors                # any errors on landing?
```

**Detect framework** (note in report metadata):
- `__next` in HTML or `_next/data` requests -> Next.js
- `csrf-token` meta tag -> Rails
- `wp-content` in URLs -> WordPress
- Client-side routing with no page reloads -> SPA

**For SPAs:** Navigation is client-side. Use `$B snapshot -i` to find nav elements (buttons, menu items) instead of relying on link extraction.

### Phase 4: Explore

Visit pages systematically. At each page:

```bash
$B goto <page-url>
$B snapshot -i
$B screenshot "$REPORT_DIR/screenshots/page-name.png"
$B console --errors
```

Then follow the **per-page exploration checklist** (see `ui-test/references/exploration-checklist.md`):

1. **Visual scan** — Look at the screenshot for layout issues
2. **Interactive elements** — Click buttons, links, controls. Do they work?
3. **Forms** — Fill and submit. Test empty, invalid, edge cases
4. **Navigation** — Check all paths in and out
5. **States** — Empty state, loading, error, overflow
6. **Console** — Any new JS errors after interactions?
7. **Responsiveness** — Check mobile viewport:
   ```bash
   $B viewport 375x812
   $B screenshot "$REPORT_DIR/screenshots/page-mobile.png"
   $B viewport 1280x720
   ```
8. **Dark mode** — Check dark mode rendering. gstack browse does not support media emulation — use system dark mode or toggle in the app if available.
9. **Network** — Verify API calls:
   ```bash
   $B network
   ```

**Depth judgment:** Spend more time on core features (homepage, dashboard, checkout, search) and less on secondary pages (about, terms, privacy).

**Design evaluation:** If `.planning/DESIGN.md` exists, reference it during visual inspection to verify the implementation matches the design intent.

**Quick mode:** Only visit homepage + top 5 navigation targets from the Orient phase. Skip the per-page checklist — just check: loads? Console errors? Broken links visible?

### Phase 5: Document

Document each issue **immediately when found** — don't batch them.

**Two evidence tiers:**

**Interactive bugs** (broken flows, dead buttons, form failures):
1. Take a screenshot before the action
2. Perform the action
3. Take a screenshot showing the result
4. Use `$B snapshot -i` to show what changed
5. Write repro steps referencing screenshots

```bash
$B screenshot "$REPORT_DIR/screenshots/issue-001-step-1.png"
$B click @e5
$B screenshot "$REPORT_DIR/screenshots/issue-001-result.png"
$B snapshot -i
```

**Critical bugs** — capture before/after screenshot evidence (video recording is not supported by gstack browse):
```bash
$B screenshot "$REPORT_DIR/screenshots/issue-001-before.png"
# ... reproduce the bug ...
$B screenshot "$REPORT_DIR/screenshots/issue-001-after.png"
```

**Static bugs** (typos, layout issues, missing images):
1. Take a single screenshot showing the problem
2. Describe what's wrong

```bash
$B snapshot -i
$B screenshot "$REPORT_DIR/screenshots/issue-002.png"
```

**Write each issue to the report immediately** using the template format from `ui-test/references/qa-report-template.md`.

### Phase 6: Wrap Up

1. **Compute health score** using the rubric below
2. **Write "Top 3 Things to Fix"** — the 3 highest-severity issues
3. **Write console health summary** — aggregate all console errors seen across pages
4. **Update severity counts** in the summary table
5. **Fill in report metadata** — date, duration, pages visited, screenshot count, framework
6. **Save baseline** — write `baseline.json` with:
   ```json
   {
     "date": "YYYY-MM-DD",
     "url": "<target>",
     "healthScore": 0,
     "issues": [{ "id": "ISSUE-001", "title": "...", "severity": "...", "category": "..." }],
     "categoryScores": { "console": 0, "links": 0 }
   }
   ```

**Regression mode:** After writing the report, load the baseline file. Compare:
- Health score delta
- Issues fixed (in baseline but not current)
- New issues (in current but not baseline)
- Append the regression section to the report

---

## Tier System

The tier controls which severity levels are in scope for the fix loop (Phase 8). Issues outside scope are documented but not fixed.

| Tier | Flag | In Scope |
|------|------|----------|
| quick | `--qa quick` | Critical + High only |
| standard | `--qa` or `--qa standard` | Critical + High + Medium (default) |
| exhaustive | `--qa exhaustive` | Critical + High + Medium + Low + Cosmetic |

**Deferred issues:** Any issue outside the current tier's scope is marked `status: deferred` — it appears in the report with full documentation but is not entered into the fix loop.

---

### Phase 7: TRIAGE

After Phase 6 (Wrap Up), classify every found issue by severity before starting the fix loop.

1. **Assign severity** to each issue (if not already assigned during Phase 5):
   - **Critical** — app broken, data loss, security hole, crash on main flow
   - **High** — major feature broken, blocking user goal
   - **Medium** — degraded UX, non-blocking functional issue, form edge case fails
   - **Low** — minor cosmetic, inconsistency, rare edge case
   - **Cosmetic** — pixel-level polish, copy nits, aesthetic preferences

2. **Sort issues** by severity: Critical → High → Medium → Low → Cosmetic

3. **Apply tier gating:** Based on the `--qa` tier flag (default: standard):
   - Mark any issue outside scope as `status: deferred`
   - Only in-scope issues proceed to Phase 8

4. **Output triage table** to the report:
   ```
   | ID | Title | Severity | Tier Status |
   |----|-------|----------|-------------|
   | ISSUE-001 | Login fails on Safari | Critical | in-scope |
   | ISSUE-002 | Tooltip misaligned | Low | deferred (quick tier) |
   ```

5. **Announce** the fix plan: "N issues in scope for this tier. Starting fix loop."

---

### Phase 8: FIX LOOP

**Operational rules (enforced before starting):**
- Require a clean working tree: `git status --porcelain`. If dirty → commit, stash, or abort. Never start with uncommitted changes.
- One commit per fix. Never bundle multiple fixes in one commit.
- Only create new test files — never modify existing test files.
- Revert on regression immediately (`git revert HEAD`).
- Show screenshots to user inline (Read tool on output files) after each fix verification.
- Never refuse to use the browser — even backend/config changes need browser verification.

**Loop:** Repeat steps 8a–8i until all in-scope issues are fixed or the tier threshold is satisfied.

#### 8a. Pick the highest-severity unfixed in-scope issue
Select the next unresolved issue from the triage table (Critical first, then High, Medium, etc.).

#### 8b. Locate the source
```bash
# Search for error messages, component names, route definitions
grep -r "error text or component name" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l
grep -r "route path" src/ --include="*.ts" --include="*.tsx" -n
```
Read only the files directly implicated. Do not explore broadly.

#### 8c. Fix in source code
- Make the minimal change to resolve the issue.
- Do not refactor unrelated code.
- Do not change formatting, imports, or style outside the fix scope.

#### 8d. Commit atomically
```bash
git add <only the changed files>
git commit -m "fix(qa): ISSUE-NNN — short description"
```
Message format: `fix(qa): ISSUE-NNN — {what was broken and how it was fixed}`

#### 8e. Re-verify the fix
```bash
# Navigate back to the affected page
$B goto <affected-url>
$B screenshot "$REPORT_DIR/screenshots/issue-NNN-before-fix.png"
# Perform the action that previously failed
$B screenshot "$REPORT_DIR/screenshots/issue-NNN-after-fix.png"
$B console --errors
$B snapshot -D
```
Read both screenshots inline and show them to the user.

#### 8f. Classify outcome
Mark the issue with one of:
- `verified` — fix works, no regressions seen
- `best-effort` — partially resolved, residual issue remains
- `reverted` — fix made things worse, reverted (see 8h)

#### 8f.5. Generate regression test (for `verified` fixes only)

1. **Read project conventions:** Find 2–3 existing test files near the fixed code and read them to learn naming, structure, and assertion style.
   ```bash
   find src/ -name "*.test.*" -o -name "*.spec.*" | head -20
   ```

2. **Trace the bug's codepath:** Identify input → codepath → failure point → edge cases that triggered the bug.

3. **Write the test:**
   - Exact precondition that reproduces the bug
   - The action that triggered it
   - A meaningful assertion that would have caught it
   - Attribution comment: `// Regression: ISSUE-NNN — {what broke}`
   - Test type selection:
     - Console/logic error → unit test
     - Broken form/API interaction → integration test
     - Broken UI component → component test
     - Pure CSS/layout issue → skip (visual regression outside scope)

4. **Run the new test file only:**
   ```bash
   # Run only the new file, not the full suite
   npx jest path/to/new.test.ts --no-coverage
   # or
   npx vitest run path/to/new.test.ts
   ```
   - Pass → keep it.
   - Fail once → fix the test (not the source code).
   - Still failing → delete the test file silently and continue.

5. **Never modify existing test files.** If the regression test requires changes to shared fixtures, skip it instead.

#### 8g. Check WTF-likelihood
See **WTF-Likelihood Self-Regulation** section below. Compute every 5 fixes (or after any revert). Stop if WTF > 20% and ask the user.

#### 8h. Revert on regression
If the fix makes things worse (new errors, broken pages, failing tests):
```bash
git revert HEAD --no-edit
```
Mark the issue as `reverted` and `status: deferred`. Do not attempt a second fix in this session.

#### 8i. Loop
Return to 8a with the next highest-severity unfixed in-scope issue.

**Exit conditions:**
- All in-scope issues are `verified`, `best-effort`, or `reverted`
- Tier threshold reached (all Critical+High fixed → `--qa quick` is satisfied)

---

### Phase 9: FINAL QA

After the fix loop completes:

1. **Re-run full QA** on all pages that had at least one verified fix:
   - Re-navigate each affected page
   - Take fresh screenshots
   - Check console for new errors
   - Verify adjacent pages for regressions

2. **Compute final health score** using the rubric below (same formula as Phase 6).

3. **Compare against baseline:**
   - Load the `baseline.json` saved in Phase 6
   - Compute delta: `final_score - baseline_score`
   - Report: "Health score: {final} (baseline: {baseline}, delta: {+/-N})"

4. **Regression warning:** If `final_score < baseline_score`:
   ```
   ⚠️  REGRESSION: Final health score ({final}) is WORSE than baseline ({baseline}).
   Delta: {delta}. Review reverted issues and any side effects from applied fixes.
   ```

5. **Update the report** with:
   - Final health score
   - Score delta
   - Fix summary table:
     ```
     | ID | Title | Severity | Outcome | Regression Test |
     |----|-------|----------|---------|-----------------|
     | ISSUE-001 | Login fails on Safari | Critical | verified | yes |
     | ISSUE-003 | Tooltip misaligned | Medium | reverted | no |
     ```
   - Deferred issues list (documented but not fixed this session)

6. **Save updated baseline.json** with the final state.

7. **Codebase health delta:**
   ```bash
   bash .claude/skills/ui-test/bin/qa-health.sh > /tmp/qa-health-final.json
   ```
   Compare against `/tmp/qa-health-baseline.json`:
   - Extract `score` from both files
   - Report: `Codebase Health: {baseline} → {final} ({delta:+.1f})`
   - Example: `Codebase Health: 6.2 → 7.8 (+1.6)`
   - If final < baseline, surface a warning alongside any regression warnings.

---

### WTF-Likelihood Self-Regulation

Computed every 5 fixes (or after any revert):

```
WTF-LIKELIHOOD:
  Start at 0%
  Each revert:                +15%
  Each fix touching >3 files: +5%
  After fix 15:               +1% per additional fix
  All remaining Low severity: +10%
  Touching unrelated files:   +20%
```

**If WTF > 20%:** STOP immediately. Show user what's been done. Ask whether to continue.
**Hard cap:** 50 fixes total. After 50 fixes, stop regardless of remaining issues.
**Regression test commits don't count** toward the WTF-likelihood heuristic.

Display: `WTF-likelihood: 18% (3 reverts, 2 multi-file) — continuing`

---

## Health Score Rubric

> **UI Health Score** (this rubric) — browser-based. Measures how well the deployed UI works from a user perspective. Computed during Phase 6 and Phase 9 using screenshots, console errors, and browser interactions.
>
> **Codebase Health Score** (`qa-health.sh`) — tool-based. Measures whether the code passes tsc, lint, unit tests, and e2e. Computed by `bash .claude/skills/ui-test/bin/qa-health.sh`. These are independent metrics.

Compute each category score (0-100), then take the weighted average.

### Console (weight: 15%)
- 0 errors -> 100
- 1-3 errors -> 70
- 4-10 errors -> 40
- 10+ errors -> 10

### Links (weight: 10%)
- 0 broken -> 100
- Each broken link -> -15 (minimum 0)

### Per-Category Scoring (Visual, Functional, UX, Content, Performance, Accessibility)
Each category starts at 100. Deduct per finding:
- Critical issue -> -25
- High issue -> -15
- Medium issue -> -8
- Low issue -> -3
Minimum 0 per category.

### Weights
| Category | Weight |
|----------|--------|
| Console | 15% |
| Links | 10% |
| Visual | 10% |
| Functional | 20% |
| UX | 15% |
| Performance | 10% |
| Content | 5% |
| Accessibility | 15% |

### Final Score
`score = sum(category_score * weight)`

---

## Framework-Specific Guidance

### Next.js
- Check console for hydration errors (`Hydration failed`, `Text content did not match`)
- Monitor `_next/data` requests via `$B network` — 404s indicate broken data fetching
- Test client-side navigation (click links, don't just `open`) — catches routing issues
- Check for CLS (Cumulative Layout Shift) on pages with dynamic content

### Rails
- Check for N+1 query warnings in console (if development mode)
- Verify CSRF token presence in forms
- Test Turbo/Stimulus integration — do page transitions work smoothly?
- Check for flash messages appearing and dismissing correctly

### WordPress
- Check for plugin conflicts (JS errors from different plugins)
- Verify admin bar visibility for logged-in users
- Test REST API endpoints (`/wp-json/`)
- Check for mixed content warnings (common with WP)

### General SPA (React, Vue, Angular)
- Use `$B snapshot -i` for navigation — link extraction misses client-side routes
- Check for stale state (navigate away and back — does data refresh?)
- Test browser back/forward — does the app handle history correctly?
- Check for memory leaks (monitor console after extended use)

---

## Important Rules

1. **Repro is everything.** Every issue needs at least one screenshot. No exceptions.
2. **Verify before documenting.** Retry the issue once to confirm it's reproducible, not a fluke.
3. **Never include credentials.** Write `[REDACTED]` for passwords in repro steps.
4. **Write incrementally.** Append each issue to the report as you find it. Don't batch.
5. **Never read source code.** Test as a user, not a developer.
6. **Check console after every interaction.** JS errors that don't surface visually are still bugs.
7. **Test like a user.** Use realistic data. Walk through complete workflows end-to-end.
8. **Depth over breadth.** 5-10 well-documented issues with evidence > 20 vague descriptions.
9. **Never delete output files.** Screenshots and reports accumulate — that's intentional.
10. **Use `$B snapshot -i` for tricky UIs.** Finds interactive elements the accessibility tree might miss.

---

## Output Structure

```
.planning/qa-reports/
  qa-report-{domain}-{YYYY-MM-DD}.md    # Structured report
  screenshots/
    initial.png                          # Landing page screenshot
    initial-annotated.png                # Annotated screenshot from orient phase
    issue-001-step-1.png                 # Per-issue evidence
    issue-001-result.png
    issue-001-before.png                 # Before/after screenshots for critical bugs
    issue-001-after.png
    ...
  baseline.json                          # For regression mode
```

Report filenames use the domain and date: `qa-report-myapp-com-2026-03-12.md`
