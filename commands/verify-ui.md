---
description: "Visual verification of frontend work using browser screenshots and design critique. Use when the user says 'check the UI', 'does it look right', 'visual check', 'screenshot', 'verify the design', or after /build completes frontend work."
---

Visual verification of frontend work using browser capture and design critique.

Target to verify: $ARGUMENTS

---

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
agent-browser screenshot /tmp/verify-ui-desktop.png

# Tablet (768x1024)
agent-browser open http://localhost:3000 --viewport 768x1024 --wait 2000
agent-browser screenshot /tmp/verify-ui-tablet.png

# Mobile (375x812)
agent-browser open http://localhost:3000 --viewport 375x812 --wait 2000
agent-browser screenshot /tmp/verify-ui-mobile.png

# Accessibility snapshot
agent-browser snapshot -c > /tmp/verify-ui-a11y.txt
```

For authenticated pages, log in first:
```bash
agent-browser open http://localhost:3000/login --viewport 1440x900
agent-browser fill 'input[type="email"]' "$TEST_USER_EMAIL"
agent-browser fill 'input[type="password"]' "$TEST_USER_PASSWORD"
agent-browser click 'button[type="submit"]'
agent-browser open http://localhost:3000/protected --wait 5000
agent-browser screenshot /tmp/verify-ui-desktop.png
```

Read each screenshot image to visually inspect the UI.

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

Read the screenshots and the project's `.planning/DESIGN.md` for design context. Evaluate:

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
