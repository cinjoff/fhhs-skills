---
name: fh:audit
description: Perform comprehensive audit of interface quality across accessibility, performance, theming, and responsive design. Generates detailed report of issues with severity ratings and recommendations.
user-invocable: false
disable-model-invocation: true
---

Run systematic quality checks and generate a comprehensive audit report with prioritized issues and actionable recommendations. Don't fix issues - document them for other commands to address.

**First**: Use the frontend-design skill for design principles and anti-patterns.

## Diagnostic Scan

Run comprehensive checks across multiple dimensions:

1. **Accessibility (A11y)** - Check for:
   - **Contrast issues**: Text contrast ratios < 4.5:1 (or 7:1 for AAA)
   - **Missing ARIA**: Interactive elements without proper roles, labels, or states
   - **Keyboard navigation**: Missing focus indicators, illogical tab order, keyboard traps
   - **Semantic HTML**: Improper heading hierarchy, missing landmarks, divs instead of buttons
   - **Alt text**: Missing or poor image descriptions
   - **Form issues**: Inputs without labels, poor error messaging, missing required indicators

2. **Performance** - Check for:
   - **Layout thrashing**: Reading/writing layout properties in loops
   - **Expensive animations**: Animating layout properties (width, height, top, left) instead of transform/opacity
   - **Missing optimization**: Images without lazy loading, unoptimized assets, missing will-change
   - **Bundle size**: Unnecessary imports, unused dependencies
   - **Render performance**: Unnecessary re-renders, missing memoization

3. **Theming** - Check for:
   - **Hard-coded colors**: Colors not using design tokens
   - **Broken dark mode**: Missing dark mode variants, poor contrast in dark theme
   - **Inconsistent tokens**: Using wrong tokens, mixing token types
   - **Theme switching issues**: Values that don't update on theme change

4. **Responsive Design** - Check for:
   - **Fixed widths**: Hard-coded widths that break on mobile
   - **Touch targets**: Interactive elements < 44x44px
   - **Horizontal scroll**: Content overflow on narrow viewports
   - **Text scaling**: Layouts that break when text size increases
   - **Missing breakpoints**: No mobile/tablet variants

5. **Anti-Patterns (CRITICAL)** - Check against ALL the **DON'T** guidelines in the frontend-design skill. Look for AI slop tells (AI color palette, gradient text, glassmorphism, hero metrics, card grids, generic fonts) and general design anti-patterns (gray on color, nested cards, bounce easing, redundant copy).

**CRITICAL**: This is an audit, not a fix. Document issues thoroughly with clear explanations of impact. Use other commands (normalize, optimize, harden, etc.) to fix issues after audit.

### claude-mem Acceleration

If claude-mem is available (check tool list for `mcp__plugin_claude-mem_*`), use `smart_search` or `smart_outline` to recall prior audit findings for this project/module.
If not available, fall back to Read/Grep/Glob directly.

### Past Learnings Check

If claude-mem is available, check for prior audit findings and trends:
1. Call `mcp__plugin_claude-mem_mcp-search__search` with query="audit" + project/module name, project=<project-name>, limit=10
2. Scan the returned index for relevant observation IDs — prioritize types: gotcha, decision, trade-off. Filter for keywords: audit, anti-pattern, complexity, coverage, trend, recurring
3. For the top 2-3 relevant IDs, call `mcp__plugin_claude-mem_mcp-search__get_observations` with ids=[ID1, ID2, ID3] to fetch full details
4. If temporal context would help (e.g., understanding whether a finding is persistent or was recently introduced), call `mcp__plugin_claude-mem_mcp-search__timeline` with query=module/area name, depth_before=3
5. Present: "**Prior audit context:** - {full observation detail}" — max 3 items. Note improvements or persistent issues.
6. Skip silently if unavailable

## Generate Comprehensive Report

Create a detailed audit report with the following structure:

### Anti-Patterns Verdict
**Start here.** Pass/fail: Does this look AI-generated? List specific tells from the skill's Anti-Patterns section. Be brutally honest.

### Executive Summary
- Total issues found (count by severity)
- Most critical issues (top 3-5)
- Overall quality score (if applicable)
- Recommended next steps

### Detailed Findings by Severity

For each issue, document:
- **Location**: Where the issue occurs (component, file, line)
- **Severity**: Critical / High / Medium / Low
- **Category**: Accessibility / Performance / Theming / Responsive
- **Description**: What the issue is
- **Impact**: How it affects users
- **WCAG/Standard**: Which standard it violates (if applicable)
- **Recommendation**: How to fix it
- **Suggested command**: Which command to use (e.g., `/fh:normalize`, `/fh:optimize`, `/fh:harden`)

#### Critical Issues
[Issues that block core functionality or violate WCAG A]

#### High-Severity Issues
[Significant usability/accessibility impact, WCAG AA violations]

#### Medium-Severity Issues
[Quality issues, WCAG AAA violations, performance concerns]

#### Low-Severity Issues
[Minor inconsistencies, optimization opportunities]

### Patterns & Systemic Issues

Identify recurring problems:
- "Hard-coded colors appear in 15+ components, should use design tokens"
- "Touch targets consistently too small (<44px) throughout mobile experience"
- "Missing focus indicators on all custom interactive components"

### Positive Findings

Note what's working well:
- Good practices to maintain
- Exemplary implementations to replicate elsewhere

### Recommendations by Priority

Create actionable plan:
1. **Immediate**: Critical blockers to fix first
2. **Short-term**: High-severity issues (this sprint)
3. **Medium-term**: Quality improvements (next sprint)
4. **Long-term**: Nice-to-haves and optimizations

### Suggested Commands for Fixes

Map issues to appropriate commands:
- "Use `/fh:normalize` to align components with design system (addresses 23 theming issues)"
- "Use `/fh:optimize` to improve performance (addresses 12 performance issues)"
- "Use `/fh:harden` to improve i18n and text handling (addresses 8 edge cases)"

Prefer suggesting commands from {{available_commands}}, or other installed skills you're sure exist.

**IMPORTANT**: Be thorough but actionable. Too many low-priority issues creates noise. Focus on what actually matters.

**NEVER**:
- Report issues without explaining impact (why does this matter?)
- Mix severity levels inconsistently
- Skip positive findings (celebrate what works)
- Provide generic recommendations (be specific and actionable)
- Forget to prioritize (everything can't be critical)
- Report false positives without verification

Remember: You're a quality auditor with exceptional attention to detail. Document systematically, prioritize ruthlessly, and provide clear paths to improvement. A good audit makes fixing easy.

### Persist Findings

After generating the audit report, output systemic findings for cross-session tracking:
1. If claude-mem is available (check tool list for `mcp__plugin_claude-mem_*`), use `smart_search` to check for prior audit findings before persisting duplicates
2. Skip individual lint warnings — only persist systemic issues (patterns across multiple files)
3. Output each finding as:
   **[audit-finding]** {category}: {systemic issue} — severity: {critical/high/medium}
4. If a Prior Audit Context was loaded (from Past Learnings Check), note whether previously-found issues are now resolved or persist
5. Max 5 findings per audit
6. Skip silently if no systemic findings
