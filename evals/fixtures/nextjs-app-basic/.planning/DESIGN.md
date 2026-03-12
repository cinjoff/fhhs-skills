# Design Tokens

## Colors
- `--color-primary`: #2563EB (blue-600)
- `--color-primary-hover`: #1D4ED8 (blue-700)
- `--color-surface`: #FFFFFF
- `--color-surface-elevated`: #F8FAFC (slate-50)
- `--color-text-primary`: #0F172A (slate-900)
- `--color-text-secondary`: #64748B (slate-500)
- `--color-border`: #E2E8F0 (slate-200)
- `--color-error`: #DC2626 (red-600)
- `--color-success`: #16A34A (green-600)

## Typography
- **Headings:** Inter, system-ui fallback, font-weight 600
- **Body:** Inter, system-ui fallback, font-weight 400
- **Code:** JetBrains Mono, monospace

## Spacing
- Base unit: 4px
- Component padding: 12px / 16px / 24px
- Section gaps: 24px / 32px / 48px

## Border Radius
- Small (inputs, badges): 6px
- Medium (cards, buttons): 8px
- Large (modals, dialogs): 12px

## Dark Mode
- Uses Tailwind `dark:` variant
- ThemeProvider stores preference in localStorage + respects `prefers-color-scheme`
- All color tokens have dark equivalents via CSS custom properties
