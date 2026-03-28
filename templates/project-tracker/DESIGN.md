# Project Tracker — Design Document

## Vision

A calm, information-dense dashboard for developers running multiple Claude Code projects — some autonomously. Think Linear meets Vercel's deployment dashboard: every pixel earns its place, data hierarchy is ruthless, and the interface recedes so the information advances.

**The user**: A developer with 3-8 active projects across repos, some running `/fh:auto` unattended. They glance at this dashboard to answer three questions in under 5 seconds:
1. What's the status across all my projects?
2. Is anything stuck, failing, or needing attention?
3. What did auto-mode accomplish while I was away?

**The feel**: Calm confidence. Like a cockpit where all gauges are green — you only notice things when they need attention. Not a terminal. Not a code editor. A *dashboard*.

---

## Design Direction

**Aesthetic**: Linear-inspired — monochrome restraint with selective color for status. Clean, compact, premium. Dark-first but not "hacker dark" — calm dark.

**Anti-aesthetic**: NOT a terminal emulator. NOT monospace-everything. NOT dark-gray-on-darker-gray. NOT a wall of `// comments`. The current implementation is the cautionary tale.

### Core Principles

1. **Content advances, chrome recedes** — Sidebar navigation is dimmer than main content. Data values are the brightest elements. Labels and structure are muted.
2. **Color means something** — Green = done, blue = in progress, amber = attention, red = failed. That's it. No decorative color. No neon. No gradients.
3. **Density without clutter** — Compact 36px rows, 8px grid, tight spacing. But generous section gaps. Rhythm, not uniformity.
4. **Motion confirms, not decorates** — 100-200ms transitions. Staggered entry on load. Value flash on update. No bounce, no elastic, no shimmer on idle elements.
5. **Project-first hierarchy** — Projects are the primary unit, not worktrees. Worktrees are implementation detail — show them as metadata within a project, not as separate top-level items.

---

## Information Architecture

### What matters (ranked)

1. **Portfolio health** — How many projects, how many phases complete, any blocked?
2. **Active auto sessions** — What's running right now, what step, how long, what cost?
3. **Per-project progress** — Phases, completion %, current activity
4. **Decisions & concerns** — What needs human attention?
5. **Cost & time trends** — Are auto sessions getting more efficient?

### What doesn't matter (cut or collapse)

- Individual worktree listings (collapse into project)
- Redundant headers/labels (the data speaks for itself)
- Manual "Refresh Stats" button (auto-refresh every 4 hours, SSE for real-time)
- Empty states that say "no data" (show nothing, or show a ghost prompt)
- `// comment` styled section headers (use proper typography hierarchy)

---

## Layout

### Two-panel layout (not three)

```
+------------------------------------------------------------------+
|  [Logo/Title]          [Auto: 2 running]     [Last sync: 2m ago] |
+------------------------------------------------------------------+
|         |                                                         |
| PROJECT |  MAIN CONTENT                                           |
| LIST    |                                                         |
| (220px) |  ┌─ Portfolio Summary ──────────────────────────────┐   |
|         |  │  3 projects · 12/18 phases · 2 auto sessions     │   |
| cairo   |  │  ████████████████████░░░░░  67%                  │   |
|  ● auto |  └──────────────────────────────────────────────────┘   |
|         |                                                         |
| nerve   |  ┌─ Selected Project: cairo ────────────────────────┐   |
|         |  │                                                  │   |
| habits  |  │  Phase progress, auto pipeline, decisions,       │   |
|         |  │  concerns, cost chart, activity feed              │   |
|         |  │                                                  │   |
|         |  └──────────────────────────────────────────────────┘   |
+------------------------------------------------------------------+
```

- **Left**: Project list — compact, dimmed, one project per line with status dot and optional auto indicator
- **Right**: Main content — selected project detail OR portfolio overview (when no project selected)
- **No third column** — the insights panel content merges into the main content area as sections

### Responsive behavior
- Below 768px: sidebar collapses, project selector becomes a dropdown
- Main content adapts with container queries, not media queries

---

## Component Design

### 1. Project List (Sidebar)

**Linear-style dimmed sidebar:**
- Background: `--bg-raised` (one step lighter than root)
- Text: 60-70% opacity (secondary text color)
- Active project: subtle highlight bg + full opacity text
- Hover: very subtle tint (`rgba(255,255,255,0.04)`)

**Per project row (36px height):**
```
● cairo                    67%
```
- Status dot (8px, colored by worst-phase-status)
- Project name (Inter, 13px, medium weight)
- Completion % (mono, 12px, muted, right-aligned)
- Auto indicator: small pulsing dot if auto session active

**No worktree sub-items.** Project name is derived from the project, not the folder path.

### 2. Portfolio Summary (top of main content)

**Not hero metrics with big numbers.** Instead: a compact, scannable summary bar.

```
3 projects · 12/18 phases done · 2 auto sessions · $4.20 today
━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░  67%
```

- One line of key stats as inline text (Inter, 13px, secondary color)
- Thin progress bar below (3px, rounded, animated width transitions)
- Numbers in monospace with `tabular-nums` so they don't jump on update
- Animated number counters when values change

### 3. Project Detail View

When a project is selected, show these sections in order:

#### a. Project Header
```
cairo                                          Phase 7 of 10
Last activity: 2 minutes ago                   ████████░░  70%
```
- Project name: Inter, 20px, semibold
- Phase indicator: mono, 13px, secondary
- Thin progress bar with animated width
- Last activity as relative timestamp

#### b. Auto Pipeline (only when auto is active)

A compact, live view of the current auto session:

```
AUTO RUNNING                                   12m 34s · $1.85
  ✓ plan    → ✓ review  → ● build   → ○ verify
  Phase 7: Context-sharing improvements
  Current: Implementing unified patch...
```

- Status badges as a horizontal pipeline (dots/checks, not full cards)
- Current step description
- Live duration counter + cost (mono, tabular-nums)
- Subtle pulse animation on the active step

#### c. Phase Grid

Compact phase rows, not cards:

```
PHASES                                              12/18 done
─────────────────────────────────────────────────────────────
  ✓ Phase 1   Foundation & CLI                           5/5
  ✓ Phase 2   Skill composition                          3/3
  ✓ Phase 3   Testing framework                          4/4
  ● Phase 7   Context sharing                     [building]  3/5
  ○ Phase 8   Auto improvements                          0/4
  ○ Phase 10  Startup skills                             0/6
```

- Status icon: ✓ (green), ● (blue, active), ○ (gray, pending)
- Phase name: Inter, 13px, primary text for active/done, secondary for pending
- Right-aligned: task count or status badge
- Active phase row gets subtle highlight background
- Click to expand: shows tasks within that phase

#### d. Concerns & Decisions (collapsed by default)

Two collapsible sections with count badges:

```
▸ Concerns (8)     ▸ Pending Decisions (3)
```

When expanded:
```
▾ Concerns (8)
  Tech Debt ·················· 3
  Security ·················· 1
  Performance ················ 2
  Test Coverage ·············· 2
```

- Dot leaders between label and count (a classic compact pattern)
- Severity indicated by text color (red for critical, amber for high, default for medium)

#### e. Cost & Activity Chart

A small area chart showing cost or activity over time:

- shadcn chart component with dark theme tokens
- Muted gridlines (8% opacity)
- Subtle area fill (10% opacity of line color)
- Tooltip on hover with date, cost, session count
- Time range selector: 24h | 7d | 30d

#### f. Recent Activity Feed

Compact activity log, newest first:

```
RECENT ACTIVITY
  2m ago   build    Phase 7: unified patch created         cairo
  5m ago   review   Plan approved with 2 conditions        cairo
  1h ago   auto     Session completed: 3 phases            nerve
```

- Relative timestamps (mono, muted)
- Activity type as colored badge (tiny pill)
- Description truncated to one line
- Project name shown when in portfolio view

### 4. Empty States

**No project selected**: Show portfolio summary + recent activity across all projects

**No data yet**:
```
No projects registered yet.
Run /fh:tracker register to add your first project.
```
Ghost text, centered, with a subtle command highlight. Not "nothing here" — tell them what to do.

**Auto not running**:
Simply don't show the auto section. No "auto is not running" placeholder.

---

## Color System

Based on OKLCH for perceptual uniformity. Tinted toward cool blue-gray, never pure gray.

```css
/* Surfaces */
--bg-root:      oklch(0.13 0.005 260);    /* deepest */
--bg-raised:    oklch(0.16 0.005 260);    /* sidebar, cards */
--bg-overlay:   oklch(0.19 0.005 260);    /* hover, active */
--bg-hover:     oklch(0.13 0.005 260 / 0.5);

/* Text */
--text-primary:   oklch(0.93 0.005 260);  /* headings, values */
--text-secondary: oklch(0.62 0.005 260);  /* labels, body */
--text-tertiary:  oklch(0.42 0.005 260);  /* timestamps, muted */

/* Status (desaturated, not neon) */
--status-done:    oklch(0.70 0.17 155);   /* soft green */
--status-active:  oklch(0.68 0.14 250);   /* soft blue */
--status-warning: oklch(0.78 0.15 85);    /* soft amber */
--status-error:   oklch(0.63 0.20 25);    /* soft red */
--status-pending: oklch(0.42 0.005 260);  /* gray */

/* Borders */
--border-subtle:  oklch(0.93 0.005 260 / 0.06);
--border-default: oklch(0.93 0.005 260 / 0.10);
```

**Rules:**
- Never pure black or pure white
- Status colors are the ONLY saturated colors in the palette
- Sidebar text at 60-70% opacity vs main content
- 4.5:1 minimum contrast ratio for all body text

---

## Typography

```css
--font-sans:  'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono:  'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
```

**Sans-serif (Inter) is the primary font.** Monospace is reserved for:
- Numeric values and counters
- Phase/task IDs
- Timestamps
- Code references and commands

**Scale (compact):**
```
11px  — timestamps, badges, metadata labels
12px  — secondary labels, sidebar items
13px  — body text, table content, project list
14px  — section headers, emphasis
16px  — project name in detail view
20px  — page title (if any)
```

**Weight hierarchy:**
```
400 (Regular)  — body text, descriptions
500 (Medium)   — labels, sidebar items, metadata
600 (Semibold) — section headers, project names
```

**Rules:**
- `tabular-nums` on ALL numeric displays
- `letter-spacing: -0.01em` on numbers > 16px
- `letter-spacing: 0.04em` on uppercase labels
- Line height: 1.5 for body, 1.2 for headings, 1.0 for stats

---

## Animation

All motion serves orientation or confirmation. Nothing decorative.

**Timing:**
- Hover states: instant in, 100ms fade out
- Panel transitions: 180ms ease-out
- Value changes: 400ms ease-out-expo counter animation
- Staggered entry: 300ms per item, 50ms stagger delay
- Progress bar width: 400ms ease-out-expo

**Easing:**
- `cubic-bezier(0.16, 1, 0.3, 1)` for entries and progress (ease-out-expo)
- `ease-out` for simple fades

**Specific animations:**
1. **Page load**: Staggered entry of project list items, then main content sections
2. **Project switch**: Crossfade main content (150ms)
3. **Value update**: Brief highlight flash (800ms fade-out)
4. **Auto pipeline**: Active step has subtle pulse
5. **Number changes**: Animated counter (400ms, ease-out-expo)

**No:** bounce, elastic, spring, shimmer-on-idle, rotating spinners, confetti

---

## Data Refresh

- **SSE (Server-Sent Events)**: Real-time updates for project state changes and auto session events
- **Periodic full refresh**: Every 4 hours, silently re-fetch all project data to catch any missed events
- **No manual refresh button**: The dashboard is always current. Show "Last updated: Xm ago" in the header as a confidence indicator
- **Optimistic UI**: When user triggers an action, update UI immediately before server confirms

---

## Tech Stack

- **Preact** (existing, keep it)
- **No build step** (existing constraint, keep it)
- **shadcn-compatible chart components** — Recharts or lightweight alternative that works without build step
- **Inter font** via Google Fonts CDN
- **CSS custom properties** for theming (no Tailwind — this is a standalone HTML app)
- **CSS animations** preferred over JS; JS only for number counters and complex orchestration

---

## What This Is NOT

- Not a terminal emulator with monospace everything
- Not a code editor with `//` comment headers
- Not a dark theme with neon green accents
- Not a card grid with identical boxes
- Not a hero-metrics dashboard with big numbers
- Not glassmorphism with blur effects
- Not an AI-generated-looking interface

---

## References

- [Linear UI Design Patterns](../references/linear-design-patterns.md) — Color, typography, spacing, animation, data density patterns
- [Live Dashboard Design Reference](../references/live-dashboard-design.md) — Technical implementation patterns for dark dashboards
- [Linear Design System (Figma)](https://www.figma.com/community/file/1222872653732371433)
- [Linear: A Calmer Interface](https://linear.app/now/behind-the-latest-design-refresh)
