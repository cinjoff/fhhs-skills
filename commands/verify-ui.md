---
description: "Visual verification of frontend work using Playwright browser capture and design critique."
---

Visual verification of frontend work using Playwright browser capture and design critique.

Target to verify: $ARGUMENTS

---

## Step 1: Ensure Dev Server

Check if a dev server is running on port 3000:
```bash
lsof -i :3000 -P -n 2>/dev/null | head -3
```

If not running, start it with `pnpm dev` in the background and wait for ready.

---

## Step 2: Capture with Playwright

Run the browser capture script to get screenshots, console output, and accessibility data:

```bash
node scripts/browser-capture.mjs [url] --wait=3000
```

- Default URL is `http://localhost:3000` — pass a specific URL if verifying a specific page
- For **authenticated pages**, add `--login` to auto-login with the test account before capture:
  ```bash
  node scripts/browser-capture.mjs http://localhost:3000/protected --login --wait=5000
  ```
  This reads `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` from `.env.local`, logs in via the login form, then navigates to the target URL. Use `--wait=5000` for authenticated pages to allow data to load. The main authenticated route is `/protected` (not `/protected/feed`).
- For multiple pages, run the script multiple times with different URLs

The script outputs:
- **Screenshots** at desktop (1440x900), tablet (768x1024), mobile (375x812)
- **Console output** — all logs, warnings, errors
- **Accessibility tree** — JSON snapshot of the page's a11y structure
- **Report JSON** — combined results in `./screenshots/<timestamp>-report.json`

Read the report JSON to check for console errors, page errors, and network failures.
Read each screenshot image to visually inspect the UI.

---

## Step 3: Console Health Check

From the report JSON, evaluate:
1. **Console errors** — any runtime errors? React errors? Failed API calls?
2. **Console warnings** — deprecation warnings? Missing props?
3. **Network errors** — failed requests? CORS issues?
4. **Page errors** — unhandled exceptions?

Flag anything concerning.

---

## Step 4: Design Critique

Read the screenshots and the project's `.planning/DESIGN.md` for design context. Evaluate:

1. **Visual hierarchy** — most important content most prominent?
2. **Typography** — correct fonts, scale, spacing per design system?
3. **Color** — semantic usage, contrast (WCAG AA)?
4. **Spacing** — consistent rhythm, sufficient whitespace, 8px grid?
5. **Responsive** — layout works across all three breakpoints?
6. **Accessibility** — from the a11y JSON: proper heading hierarchy, labeled inputs, descriptive buttons?
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

## Quick Console-Only Check

For fast debugging without screenshots:
```bash
node scripts/browser-capture.mjs [url] --console-only --wait=3000
```

---

## Prerequisites

Requires Playwright with Chromium. The script auto-discovers cached Playwright browsers.
If missing: `npm install -g playwright && npx playwright install chromium`
