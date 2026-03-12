---
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/dashboard/widget-grid.tsx
  - src/components/dashboard/stats-widget.tsx
  - src/components/dashboard/chart-widget.tsx
  - src/app/dashboard/page.tsx
  - e2e/dashboard.spec.ts
autonomous: true

must_haves:
  truths:
    - "Dashboard renders a responsive grid of widgets that adapts from 1 to 3 columns"
    - "StatsWidget fetches data server-side and streams via Suspense boundaries"
    - "ChartWidget uses dynamic import to avoid loading chart library in initial bundle"
    - "E2E tests verify widget rendering, data loading states, and responsive breakpoints"
  artifacts:
    - path: "src/components/dashboard/widget-grid.tsx"
      provides: "responsive grid layout for dashboard widgets"
    - path: "e2e/dashboard.spec.ts"
      provides: "Playwright E2E tests for dashboard"
  key_links:
    - from: "src/app/dashboard/page.tsx"
      to: "src/components/dashboard/widget-grid.tsx"
      via: "imports WidgetGrid"
---

<objective>Build the dashboard page with widget grid and comprehensive E2E tests.</objective>

<context>
@file .planning/PROJECT.md
@file .planning/DESIGN.md
@file CLAUDE.md
</context>

<tasks>
<task type="auto" wave="1">
  <name>Task 1: Dashboard Widget Components</name>
  <files>src/components/dashboard/widget-grid.tsx, src/components/dashboard/stats-widget.tsx, src/components/dashboard/chart-widget.tsx, src/app/dashboard/page.tsx</files>
  <action>
    Build the dashboard layout and widget components:
    - `WidgetGrid` — CSS Grid layout, responsive (1 col mobile, 2 col tablet, 3 col desktop)
    - `StatsWidget` — Server Component, fetches data with Suspense fallback skeleton
    - `ChartWidget` — Client Component, dynamically imported (`next/dynamic`) to code-split chart library
    - Dashboard page composes widgets in WidgetGrid with proper Suspense boundaries
    - Use design tokens from DESIGN.md for colors, spacing, border-radius
  </action>
  <verify>
    - Grid renders responsively at all breakpoints
    - StatsWidget shows loading skeleton then data
    - ChartWidget is code-split (not in main bundle)
    - Design tokens applied correctly
  </verify>
  <done>Dashboard with responsive widget grid, streaming data, and code-split charts</done>
</task>

<task type="auto" wave="2">
  <name>Task 2: Dashboard E2E Tests</name>
  <files>e2e/dashboard.spec.ts</files>
  <action>
    Write Playwright E2E tests for the dashboard:
    - Create Page Object: `DashboardPage` with locators for grid, widgets, loading states
    - Test: dashboard renders all widgets after data loads
    - Test: responsive layout switches columns at breakpoints (use viewport resize)
    - Test: loading skeletons appear before data resolves
    - Test: chart widget lazy-loads (verify network request for chunk)
    - Use `page.waitForSelector` and Playwright best practices for async assertions
  </action>
  <verify>
    - All tests use Page Object Model pattern
    - Tests cover loading, loaded, and responsive states
    - No hardcoded timeouts (use Playwright auto-waiting)
    - Tests are independent and can run in parallel
  </verify>
  <done>Comprehensive Playwright E2E tests for dashboard with Page Object Model</done>
</task>
</tasks>
