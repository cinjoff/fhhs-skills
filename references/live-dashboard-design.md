# Live Dashboard Design Reference

Actionable patterns for building stunning dark-mode dashboards with monospace typography, real-time data visualization, and polished animations. Drawn from Linear, Vercel, Raycast, Railway, and GitHub Actions patterns.

---

## 1. Dark Mode Color System

### Background Layers (darkest to lightest)
Use layered surfaces to create depth without borders:

```
--bg-root:       oklch(0.145 0.005 285);   /* #0a0a0f — deepest background */
--bg-surface:    oklch(0.175 0.005 285);   /* #111118 — card/panel surface */
--bg-surface-2:  oklch(0.205 0.006 285);   /* #1a1a22 — hover/active state */
--bg-surface-3:  oklch(0.235 0.006 285);   /* #222230 — elevated panels */
--bg-overlay:    oklch(0.145 0.005 285 / 0.8); /* modal/dropdown overlay */
```

### Text Hierarchy
```
--text-primary:    oklch(0.95 0.005 285);   /* #eeeef0 — headings, values */
--text-secondary:  oklch(0.65 0.005 285);   /* #9898a0 — labels, descriptions */
--text-tertiary:   oklch(0.45 0.005 285);   /* #606068 — timestamps, metadata */
--text-muted:      oklch(0.35 0.005 285);   /* #454550 — disabled, decorative */
```

### Accent Colors (sparingly — one per semantic meaning)
```
--accent-success:  oklch(0.72 0.19 155);    /* #34d399 — green, completed */
--accent-warning:  oklch(0.80 0.16 85);     /* #fbbf24 — amber, in-progress */
--accent-error:    oklch(0.65 0.22 25);     /* #f87171 — red, failed */
--accent-info:     oklch(0.70 0.15 250);    /* #60a5fa — blue, running */
--accent-primary:  oklch(0.65 0.20 280);    /* #a78bfa — purple, primary CTA */
```

### Key Rules
- **Never pure black** (#000000). Use dark gray with slight blue-purple tint (like Linear).
- **Desaturate accent colors 10-15%** on dark backgrounds — bright colors appear more saturated on dark than light.
- **4.5:1 contrast ratio minimum** for body text, 3:1 for large text (WCAG AA).
- **Linear's approach**: define only 3 theme variables (base, accent, contrast) and generate the full palette algorithmically using LCH color space for perceptual uniformity.

---

## 2. Typography: The Monospace/Monosans Aesthetic

### Font Stack
```css
/* Primary UI — geometric sans with monospace proportions */
--font-sans: 'Geist', 'Inter', 'SF Pro', system-ui, sans-serif;

/* Data values, code, metrics — true monospace */
--font-mono: 'Geist Mono', 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

/* Alternative: Berkeley Mono for premium feel, Commit Mono for open-source */
```

### Type Scale (compact dashboard)
```css
--text-xs:   0.6875rem;  /* 11px — timestamps, badges */
--text-sm:   0.8125rem;  /* 13px — secondary labels, metadata */
--text-base: 0.875rem;   /* 14px — body text, descriptions */
--text-lg:   1rem;       /* 16px — section headers */
--text-xl:   1.25rem;    /* 20px — page title */
--text-2xl:  1.75rem;    /* 28px — hero metrics, KPI numbers */
--text-3xl:  2.25rem;    /* 36px — primary dashboard number */
```

### Hierarchy Pattern
```
KPI number:    font-mono, text-3xl, font-semibold (600), text-primary, tracking-tight (-0.02em)
KPI label:     font-sans, text-xs, font-medium (500), text-tertiary, tracking-wide (0.05em), uppercase
Section head:  font-sans, text-sm, font-semibold (600), text-secondary, tracking-wide (0.03em)
Body text:     font-sans, text-base, font-normal (400), text-secondary, leading-relaxed (1.6)
Timestamp:     font-mono, text-xs, font-normal (400), text-muted, tabular-nums
Status badge:  font-mono, text-xs, font-medium (500), tracking-wide (0.03em), uppercase
```

### Key Rules
- **Use `tabular-nums`** on all numeric data so columns align as values change.
- **Increase line-height 5-10%** vs light mode — dark text on dark bg benefits from more breathing room.
- **Semi-bold (600) minimum** for headings — thin weights disappear on dark backgrounds.
- **Letter-spacing**: tighter for large numbers (`-0.02em`), wider for small labels (`0.05em`).

---

## 3. Data Hierarchy for 5-10 Concurrent Items

### Layout Pattern: Z-Pattern with Progressive Disclosure
```
+--------------------------------------------------+
|  [Hero KPI 1]   [Hero KPI 2]   [Hero KPI 3]     |  <- Top: 2-3 most critical metrics
+--------------------------------------------------+
|  [Item 1] ████████░░  status   12s ago           |
|  [Item 2] ██████░░░░  status   34s ago           |  <- Middle: list of concurrent items
|  [Item 3] ████░░░░░░  status   1m ago            |     with inline progress + status
|  [Item 4] ██░░░░░░░░  status   2m ago            |
|  [Item 5] ░░░░░░░░░░  status   3m ago            |
+--------------------------------------------------+
|  [Expandable detail panel]                        |  <- Bottom: drill-down on click
+--------------------------------------------------+
```

### Item Row Design (the core repeating unit)
Each item should contain, left to right:
1. **Status indicator** — colored dot (8px), not an icon. Green/amber/red/blue.
2. **Primary label** — font-sans, text-base, text-primary, truncate with ellipsis.
3. **Progress bar** — inline, thin (3-4px height), rounded, with gradient fill.
4. **Numeric value** — font-mono, text-sm, text-secondary, tabular-nums, right-aligned.
5. **Timestamp** — font-mono, text-xs, text-muted, relative ("12s ago").

### Compact Spacing
```css
--row-height: 2.5rem;      /* 40px — tight but tappable */
--row-gap: 1px;             /* subtle separator via background color */
--section-gap: 1.5rem;      /* 24px between sections */
--card-padding: 1rem;       /* 16px internal padding */
--card-radius: 0.5rem;      /* 8px rounded corners */
```

### Key Rules
- **5-9 items visible** without scrolling. 10+ items: show top 7 + "and 3 more" collapse.
- **No borders between rows** — use 1px gap with bg-root showing through, or alternate bg-surface/bg-surface-2.
- **Status dot > status icon** for compact views. Icons take 3x the space.
- **Right-align all numeric columns** so decimal points align.
- **Relative timestamps** update live ("12s ago" not "14:32:05").

---

## 4. Animation Patterns

### 4a. Staggered Entry Animation
Items enter sequentially with 40-60ms delay between each:

```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dashboard-item {
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  /* ease-out-expo — fast start, gentle settle */
}

/* Stagger using CSS custom property set via style attribute */
.dashboard-item {
  animation-delay: calc(var(--index) * 50ms);
}
```

In JSX:
```jsx
{items.map((item, i) => (
  <div class="dashboard-item" style={`--index: ${i}`}>
    {item.name}
  </div>
))}
```

### 4b. Animated Number Counter (CSS @property)
Numbers count up from previous value to new value:

```css
@property --num {
  syntax: '<integer>';
  initial-value: 0;
  inherits: false;
}

.counter {
  transition: --num 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  counter-reset: num var(--num);
  font-variant-numeric: tabular-nums;
}

.counter::after {
  content: counter(num);
}
```

For JS-driven counters (Preact/React):
```js
function AnimatedNumber({ value, duration = 600 }) {
  const ref = useRef(null);
  const prevValue = useRef(value);

  useEffect(() => {
    const el = ref.current;
    const start = prevValue.current;
    const end = value;
    const startTime = performance.now();

    function update(now) {
      const t = Math.min((now - startTime) / duration, 1);
      // ease-out-expo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = Math.round(start + (end - start) * eased);
      if (t < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
    prevValue.current = value;
  }, [value, duration]);

  return <span ref={ref} class="font-mono tabular-nums">{value}</span>;
}
```

### 4c. Progress Bar Animation
```css
.progress-bar {
  height: 3px;
  border-radius: 1.5px;
  background: var(--bg-surface-3);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 1.5px;
  background: var(--accent-info);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  /* Optional: subtle pulse for active items */
}

.progress-fill[data-active="true"] {
  animation: progressPulse 2s ease-in-out infinite;
}

@keyframes progressPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### 4d. Skeleton Loading
```css
.skeleton {
  background: var(--bg-surface-2);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    oklch(0.3 0.005 285 / 0.3) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
}
```

### 4e. Live Update Flash
When a value changes, briefly highlight it:
```css
@keyframes valueFlash {
  0%   { background-color: oklch(0.65 0.20 280 / 0.15); }
  100% { background-color: transparent; }
}

.value-updated {
  animation: valueFlash 0.8s ease-out;
}
```

### Timing Function Reference
```
Entry/exit:         cubic-bezier(0.16, 1, 0.3, 1)     /* ease-out-expo */
Hover states:       cubic-bezier(0.4, 0, 0.2, 1)      /* ease-in-out (Material) */
Progress bars:      cubic-bezier(0.16, 1, 0.3, 1)     /* ease-out-expo */
Fade:               ease-out, 150-200ms
Slide:              ease-out-expo, 250-350ms
Number count:       ease-out-expo, 400-600ms
Skeleton shimmer:   ease-in-out, 1500ms, infinite
Stagger delay:      40-60ms per item
```

---

## 5. shadcn Chart Theming (Dark Mode)

### CSS Variable Pattern
shadcn charts use CSS custom properties with OKLCH in Tailwind v4:

```css
:root {
  --chart-1: oklch(0.646 0.222 41.116);   /* warm orange */
  --chart-2: oklch(0.6 0.118 184.714);    /* teal */
  --chart-3: oklch(0.398 0.07 227.392);   /* muted blue */
  --chart-4: oklch(0.828 0.189 84.429);   /* yellow */
  --chart-5: oklch(0.769 0.188 70.08);    /* amber */
}

.dark {
  --chart-1: oklch(0.488 0.243 264.376);  /* vibrant blue */
  --chart-2: oklch(0.696 0.17 162.48);    /* green */
  --chart-3: oklch(0.769 0.188 70.08);    /* amber */
  --chart-4: oklch(0.627 0.265 303.9);    /* purple */
  --chart-5: oklch(0.645 0.246 16.439);   /* red-orange */
}
```

### ChartConfig Pattern
```tsx
const chartConfig = {
  running: {
    label: "Running",
    color: "var(--chart-1)",   /* or: "hsl(var(--chart-1))" in v3 */
  },
  completed: {
    label: "Completed",
    color: "var(--chart-2)",
  },
  failed: {
    label: "Failed",
    color: "var(--accent-error)",
  },
} satisfies ChartConfig;
```

### Dark Mode Chart Guidelines
- **Reduce grid line opacity** to 0.08-0.12 (barely visible, just enough structure).
- **Axis labels**: text-muted color, font-mono, text-xs.
- **Tooltip**: bg-surface-2, border: 1px solid oklch(0.25 0.005 285), backdrop-blur(8px).
- **Area fills**: use 10-20% opacity of the line color.
- **No chart backgrounds** — let the card surface show through.

---

## 6. Preact/React Performance for Live Dashboards

### Avoid Re-render Storms
```tsx
// BAD: useState triggers full component re-render every frame
const [pos, setPos] = useState(0);

// GOOD: useRef + direct DOM mutation for animations
const ref = useRef<HTMLDivElement>(null);
useEffect(() => {
  let frame: number;
  function tick() {
    ref.current!.style.transform = `translateX(${computePos()}px)`;
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}, []);
```

### Batch State Updates for Live Data
```tsx
// Receive websocket updates, batch into single render
const pendingUpdates = useRef<Update[]>([]);
const [items, setItems] = useState<Item[]>(initialItems);

useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = (e) => {
    pendingUpdates.current.push(JSON.parse(e.data));
  };

  // Flush at most every 100ms — human perception threshold
  const interval = setInterval(() => {
    if (pendingUpdates.current.length > 0) {
      setItems(prev => applyUpdates(prev, pendingUpdates.current));
      pendingUpdates.current = [];
    }
  }, 100);

  return () => { ws.close(); clearInterval(interval); };
}, []);
```

### CSS Transitions vs JS Animations Decision Tree
- **CSS transitions**: value changes (width, opacity, transform), hover states, progress bars. GPU-composited, zero JS overhead.
- **JS + requestAnimationFrame**: number counters, complex orchestration, physics-based motion. Use refs, not state.
- **Avoid**: JS-driven layout property animations (top, left, width, height). These trigger reflow.
- **Only animate**: `transform` and `opacity` for guaranteed 60fps compositing.

### Preact-Specific Notes
- Preact's `requestAnimationFrame` fires on the same tick as render (differs from React). For transition animations, use `setTimeout(fn, 0)` or `queueMicrotask` to ensure DOM has committed.
- Use `memo()` aggressively on list items — each row should only re-render when its own data changes.
- Prefer CSS transitions over JS for anything that doesn't need interpolated values in JS.

---

## 7. Reference Implementations

### Vercel Deployment Dashboard Pattern
- Each deploy is a row: status dot + branch name + commit message (truncated) + duration + timestamp
- Active deploys pulse with a blue dot animation
- Logs stream in monospace, auto-scroll with "pause on hover"
- Analytics charts: area charts with gradient fill, no gridlines, minimal axes

### Linear Issue Board Pattern
- Compact rows: icon + title + assignee avatar + status badge + priority indicator
- Keyboard-navigable: j/k to move, Enter to expand
- Drag handles appear on hover only
- Custom themes via 3 variables (base, accent, contrast) using LCH

### GitHub Actions Pattern
- Workflow runs: collapsible tree with step-level status indicators
- Live log streaming with ANSI color support in monospace
- Duration counters tick up in real-time for running jobs
- Failed steps auto-expand, successful steps stay collapsed

### Railway Dashboard Pattern
- Service cards with inline sparklines for CPU/memory
- Deploy status as colored sidebar stripe (not just a dot)
- Metric values update with subtle fade transitions
- Dark purple-tinted backgrounds, not pure gray

---

## Sources

- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [shadcn/ui Charts](https://ui.shadcn.com/docs/components/radix/chart)
- [Dark Mode Color Palettes 2025](https://colorhero.io/blog/dark-mode-color-palettes-2025)
- [Inclusive Dark Mode - Smashing Magazine](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)
- [Dark Mode Dashboard Principles](https://www.qodequay.com/dark-mode-dashboards)
- [Linear UI Redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [The Rise of Linear Style Design](https://medium.com/design-bootcamp/the-rise-of-linear-style-design-origins-trends-and-techniques-4fd96aab7646)
- [CSS Staggered Animations - CSS-Tricks](https://css-tricks.com/different-approaches-for-creating-a-staggered-animation/)
- [Animating Number Counters - CSS-Tricks](https://css-tricks.com/animating-number-counters/)
- [Dashboard Design Best Practices - UXPin](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [Information Hierarchy in Dashboards](https://clusterdesign.io/information-hierarchy-in-dashboards/)
- [CSS/JS Animation Performance - MDN](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)
- [React Animation Performance](https://www.streaver.com/blog/posts/react-animations-how-a-simple-component-can-affect-your-performance)
- [Preact requestAnimationFrame Issue](https://github.com/preactjs/preact/issues/4826)
