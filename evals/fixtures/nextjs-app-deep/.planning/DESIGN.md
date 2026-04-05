# Design Tokens

## Colors
- `--color-primary`: #2563EB (blue-600)
- `--color-primary-hover`: #1D4ED8 (blue-700)
- `--color-surface`: var(--background)
- `--color-surface-elevated`: var(--color-surface-elevated)
- `--color-text-primary`: var(--foreground)
- `--color-text-secondary`: hsl(var(--muted-foreground))
- `--color-border`: hsl(var(--border))
- `--color-error`: #DC2626 (red-600)
- `--color-success`: #16A34A (green-600)

## Typography
- **Headings:** Inter, system-ui fallback, font-weight 600
- **Body:** Inter, system-ui fallback, font-weight 400

## Spacing
- Base unit: 4px (Tailwind default)
- Component padding: 12px / 16px / 24px
- Section gaps: 24px / 32px

## Border Radius
- Small (inputs, badges): 6px (`rounded-md`)
- Medium (cards, buttons): 8px (`rounded-lg`)
- Large (modals): 12px (`rounded-xl`)

## Dark Mode
- Tailwind `dark:` variant via `.dark` class on `<html>`
- All CSS variables have dark equivalents in globals.css
- ThemeProvider stores preference in localStorage
