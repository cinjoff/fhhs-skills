---
name: ui-test
description: Take screenshots and check if the UI looks right. Use --qa for thorough functional testing.
user-invokable: true
---

Visual verification and QA testing of frontend work.

Target to verify: $ARGUMENTS

If `$ARGUMENTS` contains `--qa`, run **QA Mode** below. Otherwise, run **Visual Verification Mode**.

---

# Visual Verification Mode

## Step 1: Ensure Dev Server

Check if a dev server is running on a common port (3000, 5173, 4321, 8080):
```bash
lsof -i :3000 -i :5173 -i :4321 -i :8080 -P -n 2>/dev/null | grep LISTEN | head -5
```

If not running, start it with `pnpm dev` (or the project's dev command) in the background and wait for ready.

---

## Step 2: Capture Screenshots

Requires `agent-browser` CLI.

Check availability:
```bash
which agent-browser && echo "available" || echo "not-found"
```

If not installed, **stop and tell the user**: "agent-browser is required for visual verification. Install it with: `npm install -g agent-browser`" — do not proceed without it.

Capture desktop, tablet, and mobile viewports:

```bash
# Desktop (1440x900)
agent-browser open http://localhost:3000 --viewport 1440x900 --wait 3000
agent-browser screenshot /tmp/ui-test-desktop.png

# Tablet (768x1024)
agent-browser open http://localhost:3000 --viewport 768x1024 --wait 2000
agent-browser screenshot /tmp/ui-test-tablet.png

# Mobile (375x812)
agent-browser open http://localhost:3000 --viewport 375x812 --wait 2000
agent-browser screenshot /tmp/ui-test-mobile.png

# Accessibility snapshot
agent-browser snapshot -c > /tmp/ui-test-a11y.txt
```

For authenticated pages, log in first:
```bash
agent-browser open http://localhost:3000/login --viewport 1440x900
agent-browser fill 'input[type="email"]' "$TEST_USER_EMAIL"
agent-browser fill 'input[type="password"]' "$TEST_USER_PASSWORD"
agent-browser click 'button[type="submit"]'
agent-browser open http://localhost:3000/protected --wait 5000
agent-browser screenshot /tmp/ui-test-desktop.png
```

Read each screenshot image to visually inspect the UI.

**Video evidence for critical bugs:** If a CRITICAL visual bug is found, record a video: `agent-browser record start ./evidence.webm`, reproduce the bug, `agent-browser record stop`. Attach the recording path to the report.

---

## Step 3: Console Health Check

Check for runtime errors:
```bash
agent-browser eval "JSON.stringify(window.__consoleErrors || [])"
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

<!-- Forked from gstack qa (v0.3.3). Browser backend: agent-browser (Vercel) -->

You are a QA engineer. Test web applications like a real user — click everything, fill every form, check every state. Produce a structured report with evidence.

## Prerequisites

This skill requires **agent-browser** CLI to be installed globally. If `agent-browser` is not available, stop and tell the user:

> "agent-browser is required for QA testing. Install it with: `npm install -g agent-browser`"

## Setup

**Parse the user's request for these parameters:**

| Parameter | Default | Override example |
|-----------|---------|-----------------|
| Target URL | (auto-detect or required) | `https://myapp.com`, `http://localhost:3000` |
| Mode | full | `--quick`, `--regression .planning/qa-reports/baseline.json` |
| Output dir | `.planning/qa-reports/` | `Output to /tmp/qa` |
| Scope | Full app (or diff-scoped) | `Focus on the billing page` |
| Auth | None | `Sign in to user@example.com` |

**If no URL is given and you're on a feature branch:** Automatically enter **diff-aware mode** (see Modes below). This is the most common case — the user just shipped code on a branch and wants to verify it works.

**Check agent-browser availability:**

```bash
which agent-browser && echo "READY" || echo "NEEDS_INSTALL"
```

If `NEEDS_INSTALL`, stop and ask the user to install agent-browser.

**Create output directories and initialize session:**

```bash
REPORT_DIR=".planning/qa-reports"
mkdir -p "$REPORT_DIR/screenshots"
BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-')
agent-browser --session "qa-${BRANCH:-default}" open about:blank
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
   - API endpoints -> test them directly with `agent-browser eval "await fetch('/api/...')"`
   - Static pages (markdown, HTML) -> navigate to them directly

3. **Detect the running app** — check common local dev ports:
   ```bash
   agent-browser --session "qa-${BRANCH}" open http://localhost:3000 2>/dev/null && echo "Found app on :3000" || \
   agent-browser --session "qa-${BRANCH}" open http://localhost:4000 2>/dev/null && echo "Found app on :4000" || \
   agent-browser --session "qa-${BRANCH}" open http://localhost:8080 2>/dev/null && echo "Found app on :8080"
   ```
   If no local app is found, check for a staging/preview URL in the PR or environment. If nothing works, ask the user for the URL.

4. **Test each affected page/route:**
   - Navigate to the page
   - Take a screenshot
   - Check console for errors
   - If the change was interactive (forms, buttons, flows), test the interaction end-to-end
   - Use `agent-browser snapshot -i` before and after actions to verify the change had the expected effect

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

### Phase 1: Initialize

1. Check agent-browser availability (see Setup above)
2. Create output directories
3. Copy report template from `ui-test/references/report-template.md` to output dir
4. Start timer for duration tracking
5. Initialize isolated browser session: `agent-browser --session "qa-${BRANCH}"`

### Phase 2: Authenticate (if needed)

**If the user specified auth credentials:**

```bash
agent-browser --session "qa-${BRANCH}" open <login-url>
agent-browser --session "qa-${BRANCH}" snapshot -i       # find the login form
agent-browser --session "qa-${BRANCH}" fill @e3 "user@example.com"
agent-browser --session "qa-${BRANCH}" fill @e4 "[REDACTED]"   # NEVER include real passwords in report
agent-browser --session "qa-${BRANCH}" click @e5                # submit
agent-browser --session "qa-${BRANCH}" snapshot -i              # verify login succeeded
```

**Save authenticated state for reuse:**

```bash
agent-browser --session "qa-${BRANCH}" state save ".planning/qa-reports/auth-state.json"
```

**Restore auth state in a new session:**

```bash
agent-browser --session "qa-${BRANCH}" state load ".planning/qa-reports/auth-state.json"
```

**If 2FA/OTP is required:** Ask the user for the code and wait.

**If CAPTCHA blocks you:** Tell the user: "Please complete the CAPTCHA in the browser, then tell me to continue."

### Phase 3: Orient

Get a map of the application:

```bash
agent-browser --session "qa-${BRANCH}" open <target-url>
agent-browser --session "qa-${BRANCH}" snapshot -i
agent-browser --session "qa-${BRANCH}" screenshot "$REPORT_DIR/screenshots/initial.png"
agent-browser --session "qa-${BRANCH}" console                # any errors on landing?
```

**Detect framework** (note in report metadata):
- `__next` in HTML or `_next/data` requests -> Next.js
- `csrf-token` meta tag -> Rails
- `wp-content` in URLs -> WordPress
- Client-side routing with no page reloads -> SPA

**For SPAs:** Navigation is client-side. Use `agent-browser snapshot -i` to find nav elements (buttons, menu items) instead of relying on link extraction.

### Phase 4: Explore

Visit pages systematically. At each page:

```bash
agent-browser --session "qa-${BRANCH}" open <page-url>
agent-browser --session "qa-${BRANCH}" snapshot -i
agent-browser --session "qa-${BRANCH}" screenshot "$REPORT_DIR/screenshots/page-name.png"
agent-browser --session "qa-${BRANCH}" console
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
   agent-browser --session "qa-${BRANCH}" set device "iPhone 14"
   agent-browser --session "qa-${BRANCH}" screenshot "$REPORT_DIR/screenshots/page-mobile.png"
   agent-browser --session "qa-${BRANCH}" set device "desktop"
   ```
8. **Dark mode** — Check dark mode rendering:
   ```bash
   agent-browser --session "qa-${BRANCH}" set media dark
   agent-browser --session "qa-${BRANCH}" screenshot "$REPORT_DIR/screenshots/page-dark.png"
   agent-browser --session "qa-${BRANCH}" set media light
   ```
9. **Network** — Verify API calls:
   ```bash
   agent-browser --session "qa-${BRANCH}" network requests --filter "status>=400"
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
4. Use `agent-browser snapshot -i` to show what changed
5. Write repro steps referencing screenshots

```bash
agent-browser --session "qa-${BRANCH}" screenshot "$REPORT_DIR/screenshots/issue-001-step-1.png"
agent-browser --session "qa-${BRANCH}" click @e5
agent-browser --session "qa-${BRANCH}" screenshot "$REPORT_DIR/screenshots/issue-001-result.png"
agent-browser --session "qa-${BRANCH}" snapshot -i
```

**Critical bugs** — record video evidence:
```bash
agent-browser --session "qa-${BRANCH}" record start
# ... reproduce the bug ...
agent-browser --session "qa-${BRANCH}" record stop "$REPORT_DIR/screenshots/issue-001-video.webm"
```

**Static bugs** (typos, layout issues, missing images):
1. Take a single screenshot showing the problem
2. Describe what's wrong

```bash
agent-browser --session "qa-${BRANCH}" snapshot -i
agent-browser --session "qa-${BRANCH}" screenshot "$REPORT_DIR/screenshots/issue-002.png"
```

**Write each issue to the report immediately** using the template format from `ui-test/references/report-template.md`.

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

## Health Score Rubric

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
- Monitor `_next/data` requests via `agent-browser network requests --filter "_next/data"` — 404s indicate broken data fetching
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
- Use `agent-browser snapshot -i` for navigation — link extraction misses client-side routes
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
10. **Use `agent-browser snapshot -i` for tricky UIs.** Finds interactive elements the accessibility tree might miss.

---

## Output Structure

```
.planning/qa-reports/
  qa-report-{domain}-{YYYY-MM-DD}.md    # Structured report
  screenshots/
    initial.png                          # Landing page screenshot
    issue-001-step-1.png                 # Per-issue evidence
    issue-001-result.png
    issue-001-video.webm                 # Video evidence for critical bugs
    ...
  baseline.json                          # For regression mode
  auth-state.json                        # Saved authentication state
```

Report filenames use the domain and date: `qa-report-myapp-com-2026-03-12.md`
