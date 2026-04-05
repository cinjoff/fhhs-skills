# Linear App Design Patterns Reference

Research compiled from Linear's official blog posts, design system documentation, and third-party design analyses.

---

## 1. Visual Design Language

### Color System
- **LCH color space** (not HSL) — perceptually uniform, handles elevation surfaces (background, foreground, panels, dialogs, modals) consistently
- **Contrast variable** defines theme contrast levels; automatically generates high-contrast accessibility themes
- **2025 refresh**: cut back on color — swapped monochrome blue for monochrome black/white, fewer bold accent colors
- **Dark theme**: deep near-black backgrounds (`#0A0A0B` range), not pure `#000`
- **Light theme**: warm off-whites, never harsh pure white
- **Accent colors**: desaturated, muted tones — purple/violet for brand, status colors for issues (green=done, yellow=in-progress, red=cancelled)
- **Surface elevation**: subtle luminance shifts between layers rather than shadows — background < sidebar < card < dialog < modal
- **Design tokens**: 146 brand colors defined as tokens, theme-aware via CSS custom properties
- Only need to set a few colors (background, text, accent) — system generates complementary shades for borders and elevated boxes

### Typography
- **Font**: Inter (dark gray on dark backgrounds, high readability sans-serif)
- **39 typography styles** in the design system
- **Weights**: Regular (400) for body, Medium (500) for labels/metadata, Semibold (600) for headings, Bold (700) sparingly for emphasis
- **Sizes**: Compact scale — body ~13-14px, metadata/labels ~11-12px, headings 16-20px
- **Monospace**: JetBrains Mono or similar for identifiers, issue IDs, code references
- **Principle**: Bold typography as a design principle — clear hierarchy through weight and size, not color

### Spacing
- **8px base grid** with denominations: 4, 8, 12, 16, 24, 32, 48, 64px
- Consistent internal padding on cards/panels (typically 12-16px)
- Tight vertical rhythm — list items use 32-36px row height for density
- Generous horizontal padding on main content area for readability

---

## 2. Layout Patterns

### Overall Structure
- **Three-column potential**: collapsible sidebar (left) + main content (center) + detail panel (right)
- Sidebar width: ~220-240px, collapsible to icon-only (~48px)
- Main content: fluid, takes remaining space
- Detail/properties panel: ~320px, slides in from right

### Content Display Modes
- **List view**: Default, highest data density — rows with inline metadata chips
- **Board view**: Kanban columns by status
- **Timeline view**: Gantt-style horizontal bars
- **Split view**: List + detail pane side by side
- **Fullscreen**: Issue detail takes entire viewport

### Grid and Cards
- Bento-style grid for dashboards — modular blocks of varying sizes
- Cards use subtle border (1px, very low opacity) rather than shadows
- Rounded corners: 6-8px on cards, 4px on buttons/inputs, 12-16px on modals

---

## 3. Data Density Approach

### Visual Weight Hierarchy
- **Core principle**: Not every element carries equal visual weight. Task-central elements stay in focus; navigation and orientation elements recede
- Navigation sidebar is **dimmer** than main content area — lower opacity text, muted icons
- Metadata displayed inline as compact chips/badges (status dot + label, priority icon, assignee avatar)

### Compact Row Design
- Issue rows: ~32-36px height
- Left: status icon (colored dot/checkmark) + issue ID (monospace, muted)
- Center: title (medium weight) + labels as tiny colored pills
- Right: priority icon + assignee avatar (24px circle) + date (muted)
- Hover reveals additional actions (context menu, quick-assign)

### Information Layering
- **Level 1** (always visible): status, title, assignee, priority
- **Level 2** (on hover/expand): labels, project, cycle, estimate, due date
- **Level 3** (detail view): full description, comments, activity, sub-issues, relations

### Filtering and Grouping
- Persistent filter bar below header — active filters shown as removable chips
- Group by: status, assignee, priority, label, project — with collapsible sections
- Each group shows count badge

---

## 4. Animation and Transitions

### Core Principles
- **Speed over spectacle**: Animations are fast (100-200ms) and purposeful
- Every transition serves orientation — helps users understand spatial relationships
- No decorative animations that slow perceived performance

### Specific Patterns
- **View transitions**: Crossfade between list/board/timeline views (~150ms)
- **Sidebar collapse**: Smooth width transition (~200ms ease-out)
- **Panel slide-in**: Detail panel slides from right (~180ms)
- **Issue creation**: Optimistic — appears instantly in list, syncs in background
- **Drag and drop**: Smooth reorder with spring-like settle animation
- **Hover states**: Instant background color change (no transition delay on hover-in, slight fade on hover-out)
- **Modal/dialog**: Fade + slight scale-up from 98% to 100% (~150ms)
- **Toasts/notifications**: Slide in from bottom-right, auto-dismiss with progress

### Performance Techniques
- **Optimistic UI**: Updates appear before server confirmation — creates perception of instant response
- **CSS transforms only**: Movement/scaling via `transform`, opacity changes — avoids layout thrashing
- **`will-change`**: Applied to frequently animated elements
- **`prefers-reduced-motion`**: Respects user accessibility preferences

---

## 5. Sidebar Navigation

### Structure (top to bottom)
1. **Workspace switcher** — avatar + workspace name + dropdown chevron
2. **Quick actions** — Search (Cmd+K), Inbox/notifications with badge
3. **Primary nav** — My Issues, Favorites, Views (each with icon + label)
4. **Teams section** — collapsible, each team expands to show: Issues, Active cycle, Backlog, Projects
5. **Bottom** — Settings gear, Help, User avatar

### Design Characteristics
- **Dimmed palette**: Sidebar uses lower contrast text (~60-70% opacity) vs main content
- **Active state**: Subtle background highlight (semi-transparent white/blue) + full opacity text
- **Hover state**: Very subtle background tint
- **Icons**: 16px, stroke-style, consistent weight — custom icon set, not a standard library
- **Section headers**: All-caps, tiny (10-11px), letter-spaced, muted color — pure wayfinding
- **Customizable**: Users can reorder, hide items, choose notification display (count vs dot)
- **Borders softened**: Rounded edges, low-contrast separators — structure without clutter
- **Cross-platform**: Works as Electron app (macOS/Windows) and in browsers

---

## 6. Charts and Data Visualization

### Dashboard Approach
- Charts structured top-down: most important metrics at top, global overview middle, detailed breakdown bottom
- Minimal chart chrome — no heavy gridlines, no excessive labels
- Muted gridlines (very low opacity), data lines/bars use accent colors

### Color in Charts
- Status colors map directly: green (completed), blue (in progress), gray (backlog), red (cancelled)
- For dark themes: brighter, more saturated data colors against dark backgrounds
- Softer text colors (#E0E0E0 range) with slightly increased font weight for reversed contrast
- Minimum 4.5:1 contrast ratio (WCAG 2.1) for text on chart backgrounds

### Chart Types Used
- **Burn-up/burn-down**: Line charts for cycle progress
- **Cumulative flow**: Stacked area charts for issue state over time
- **Velocity**: Bar charts comparing cycle-over-cycle throughput
- **Distribution**: Horizontal bar charts for workload by assignee

### Visualization Style
- Thin lines (1.5-2px stroke), rounded line caps
- Subtle area fills under lines (5-10% opacity of line color)
- Tooltips on hover: compact, dark background, appears without delay
- No 3D effects, no gradients on data — flat, clean, information-first

---

## 7. What Makes It Feel "Premium" and "Fast"

### Performance Perception
- **3.7x faster** than Jira, **2.3x faster** than Asana for common operations
- **Optimistic updates**: Actions feel instant because UI updates before server responds
- **Keyboard-first**: Nearly every action available via keyboard shortcut
- **Command palette (Cmd+K)**: Fuzzy search for any action — feels like a code editor
- **Instant search**: No loading spinners for basic operations

### Premium Feel Techniques
1. **Restraint in color**: Mostly monochrome with selective color for status/priority — avoids visual noise
2. **Consistent density**: Everything feels intentionally tight without being cramped — the 8px grid enforced everywhere
3. **Subtle surfaces**: Elevation through luminance, not drop shadows — feels modern and flat
4. **Typography hierarchy**: Clear information architecture through weight/size alone
5. **Micro-interactions**: Hover states, focus rings, selection highlights all respond instantly
6. **Dark mode first**: Designed primarily for dark mode (developer audience) — dark mode isn't an afterthought
7. **No visual debt**: Every pixel serves a purpose — no decorative elements, no placeholder graphics
8. **Sound design**: Optional keyboard sounds and notification sounds add tactile quality
9. **Custom iconography**: Bespoke icon set ensures visual consistency (no mixing icon libraries)
10. **Reduced borders**: 2025 redesign softened and reduced separators — elements breathe without heavy containment

### The "Calm Interface" Philosophy
- The 2025 refresh was explicitly described as "a calmer interface for a product in motion"
- Reduced visual noise so users can focus on their work, not the tool
- Navigation and chrome recede; content and data advance
- Fewer bold colors means status colors (when they appear) carry more meaning

---

## 8. Applying Linear Patterns to a Project Tracker Dashboard

### Direct Transferable Patterns
- **Dark-first design** with LCH-based color system
- **8px spacing grid** with compact row heights (32-36px)
- **Inter font** at 13-14px body, with weight-based hierarchy
- **Dimmed sidebar** with full-brightness main content
- **Status dots** (colored circles) instead of text badges for state
- **Inline metadata chips** (assignee avatar, priority icon, label pills)
- **Optimistic UI** for all mutations
- **Command palette** for power users
- **Subtle borders** (1px, ~10% opacity) instead of shadows for cards
- **Fast transitions** (100-200ms) using CSS transforms only

### CSS Custom Properties Template
```css
:root {
  /* Surfaces — LCH-inspired elevation scale */
  --bg-base: #0A0A0B;
  --bg-raised: #111113;
  --bg-overlay: #1A1A1F;
  --bg-hover: rgba(255,255,255,0.04);
  --bg-active: rgba(255,255,255,0.08);

  /* Text hierarchy */
  --text-primary: rgba(255,255,255,0.92);
  --text-secondary: rgba(255,255,255,0.56);
  --text-tertiary: rgba(255,255,255,0.36);

  /* Status colors — muted, not neon */
  --status-done: #4ADE80;
  --status-progress: #60A5FA;
  --status-todo: rgba(255,255,255,0.36);
  --status-cancelled: #F87171;
  --status-backlog: rgba(255,255,255,0.20);

  /* Borders and separators */
  --border-subtle: rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --border-strong: rgba(255,255,255,0.16);

  /* Accent */
  --accent: #7C5CFC;
  --accent-hover: #8B6FFD;

  /* Spacing (8px grid) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 13px;
  --text-md: 14px;
  --text-lg: 16px;
  --text-xl: 20px;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;

  /* Transitions */
  --transition-fast: 100ms ease-out;
  --transition-normal: 180ms ease-out;
  --transition-slow: 300ms ease-out;
}
```

---

## Sources

- [How we redesigned the Linear UI (part II)](https://linear.app/now/how-we-redesigned-the-linear-ui) — Official blog on LCH color system, spacing, layout
- [A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh) — 2025 design refresh philosophy
- [Linear design: The SaaS design trend (LogRocket)](https://blog.logrocket.com/ux-design/linear-design/) — Comprehensive design analysis
- [The rise of Linear style design (Medium)](https://medium.com/design-bootcamp/the-rise-of-linear-style-design-origins-trends-and-techniques-4fd96aab7646) — Trend analysis
- [Linear Brand Guidelines](https://linear.app/brand) — Official brand reference
- [Linear Design System (Figma Community)](https://www.figma.com/community/file/1222872653732371433/linear-design-system) — 146 colors, 39 typography styles
- [Design Tokens for linear.app (Font of Web)](https://fontofweb.com/tokens/linear.app) — Extracted CSS tokens
- [Linear.style](https://linear.style/) — Unofficial CSS reference
- [Personalized sidebar (Linear Changelog)](https://linear.app/changelog/2024-12-18-personalized-sidebar)
- [Dashboards best practices (Linear)](https://linear.app/now/dashboards-best-practices)
- [Dark Mode Charts Best Practices (CleanChart)](https://www.cleanchart.app/blog/dark-mode-charts)
