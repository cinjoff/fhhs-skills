# Per-Page Exploration Checklist

Use this checklist at every page visited during a QA session. Work through each section systematically.

## 1. Visual Scan

- Take a screenshot of the page
- Use `agent-browser snapshot -i` for an interactive element map
- Look for: layout breaks, overlapping elements, clipped text, horizontal scrollbar
- Look for: broken or missing images, incorrect z-index
- Look for: font/color inconsistencies, alignment issues
- If `.planning/DESIGN.md` exists, compare against design intent

## 2. Interactive Elements

- Identify all buttons, links, and controls via the snapshot
- Click each one — does it do what it says?
- Check hover states — do they provide visual feedback?
- Check focus states — are they visible for keyboard users?
- Check disabled states — do they look and behave correctly?

## 3. Forms

- Fill and submit with valid data — does it succeed?
- Submit empty — does validation fire?
- Submit with invalid data — are error messages clear?
- Test edge cases: very long text, special characters, paste content
- Check that success/error feedback appears
- Verify data persists after form submission (check by navigating away and back)

## 4. Navigation

- Check all paths into this page (breadcrumbs, nav links, deep links)
- Check all paths out (links, buttons, CTAs)
- Use browser back — does it work correctly?
- Check mobile menu if responsive
- Verify active state in navigation matches current page

## 5. States

- **Empty state** — what shows when there's no data?
- **Loading state** — is there a spinner/skeleton during data fetch?
- **Error state** — what happens when something fails?
- **Overflow** — what happens with too much content? (long titles, many items)
- **Edge cases** — single item, maximum items, boundary conditions

## 6. Console

Run after every interaction:
```bash
agent-browser console
```

- Any new JavaScript errors?
- Any failed network requests (4xx, 5xx)?
- Any CORS errors?
- Any deprecation warnings?
- Any mixed content warnings?

## 7. Responsiveness

Test at least mobile and desktop viewports:
```bash
# Mobile
agent-browser set device "iPhone 14"
agent-browser screenshot "$REPORT_DIR/screenshots/page-mobile.png"

# Tablet
agent-browser set device "iPad"
agent-browser screenshot "$REPORT_DIR/screenshots/page-tablet.png"

# Back to desktop
agent-browser set device "desktop"
```

- Does layout adapt correctly?
- Are touch targets large enough (min 44x44px)?
- Does text remain readable?
- Are images responsive?
- Does horizontal scrolling occur (it shouldn't)?

## 8. Dark Mode

If the app supports dark mode:
```bash
agent-browser set media dark
agent-browser screenshot "$REPORT_DIR/screenshots/page-dark.png"
agent-browser set media light
```

- Are all elements visible in dark mode?
- Is contrast sufficient?
- Are images/icons adapted for dark backgrounds?

## 9. Auth Boundaries

- What happens when accessing this page logged out?
- Are there different views for different user roles?
- Is sensitive data properly hidden from unauthorized users?

## 10. Network / API

Verify backend communication:
```bash
agent-browser network requests --filter "status>=400"
```

- Are API calls succeeding?
- Are there excessive requests (N+1 patterns)?
- Are responses reasonably fast?
- Any unexpected redirects?
