# Frontend Review Checklist

Use this when a fix touches `.tsx`, `.css`, components, or styles.

## The AI Slop Test

Would someone believe AI made this immediately? If yes, that is the problem. A fix must not introduce generic "AI aesthetic" patterns.

## Color Anti-Patterns (DON'T introduce)

- Cyan-on-dark color schemes
- Purple-to-blue gradients
- Neon accents on dark backgrounds
- Gradient text for headings or metrics
- Pure black (#000) or pure white (#fff) — always tint
- Gray text on colored backgrounds — use a shade of the background instead

## Layout Anti-Patterns (DON'T introduce)

- Wrapping everything in cards — not everything needs a container
- Identical card grids — same-sized cards with icon + heading + text, repeated endlessly
- Hero metric template — big number, small label, supporting stats, gradient accent
- Centering everything — left-aligned with asymmetric layouts feels more designed
- Same spacing everywhere — without rhythm, layouts feel monotonous

## Visual Anti-Patterns (DON'T introduce)

- Glassmorphism everywhere — blur effects, glass cards, glow borders used decoratively
- Rounded rectangles with generic drop shadows — safe, forgettable
- Sparklines as decoration — tiny charts that convey nothing
- Large icons with rounded corners above every heading — templated appearance

## Accessibility Basics

- **Contrast:** text meets WCAG AA minimums; don't use gray-on-color combos
- **Focus management:** all interactive elements are keyboard-reachable with visible focus rings
- **ARIA:** interactive custom components have appropriate roles, labels, and state attributes
- **Component states:** every interactive component must handle loading, error, empty, and success states

## Responsive Check

- Use container queries (`@container`) for component-level responsiveness
- Adapt the interface for different contexts — don't just shrink it
- Never hide critical functionality on mobile — adapt, don't amputate
- Verify at the specific breakpoint the fix targets (e.g., `page.setViewportSize({width: 375, height: 812})`)
