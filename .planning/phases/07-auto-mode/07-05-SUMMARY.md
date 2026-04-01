---
phase: 07-auto-mode
plan: 05
subsystem: dashboard
tags: [dashboard, recharts, preact, auto-mode, live-monitoring]
requires: []
provides:
  - "Live auto-mode dashboard panels (AutoPipeline, DecisionFeed, CostChart, StepTimeline)"
  - "Enriched .auto-state.json with step_history, errors, timing, cost tracking"
  - "Parser functions parseAutoState() and parseDecisions() for server consumption"
  - "Recharts via preact-compat aliasing in single-file HTML build"
  - "Auto-open browser on orchestrator startup"
  - "shadcn-style chart theming with ChartContainer and ChartTooltipContent"
affects: []
tech-stack:
  added: [recharts, "@preact/compat"]
  patterns: [shadcn-chart-theming, sse-live-updates, memo-optimization, config-driven-colors]
key-files:
  created:
    - templates/project-tracker/src/lib/chart-theme.js
    - templates/project-tracker/src/components/AutoPipeline.jsx
    - templates/project-tracker/src/components/DecisionFeed.jsx
    - templates/project-tracker/src/components/CostChart.jsx
    - templates/project-tracker/src/components/StepTimeline.jsx
  modified:
    - .claude/skills/auto/auto-orchestrator.cjs
    - templates/project-tracker/package.json
    - templates/project-tracker/build.js
    - templates/project-tracker/parser.cjs
    - templates/project-tracker/server.cjs
    - templates/project-tracker/src/app.jsx
    - templates/project-tracker/index.html
    - evals/evals.json
key-decisions:
  - "Preact + @preact/compat for Recharts compatibility — avoids full React switch while enabling shadcn-style charts"
  - "Unified dashboard extending /fh:tracker rather than separate auto-mode dashboard"
  - "Enriched .auto-state.json as single data source for all dashboard auto-mode panels"
  - "memo() on DecisionCard for render optimization with frequent updates"
  - "Config-driven chart theming (chartConfig + ChartContainer) replicating shadcn pattern"
requirements-completed:
  - "Auto-orchestrator writes enriched status JSON with step_history, timing, costs, errors"
  - "Dashboard shows live pipeline view with phase/step progress and activity"
  - "Dashboard displays autonomous decisions with confidence badges"
  - "Dashboard shows Recharts time-series for cost and step duration"
  - "Tracker auto-detects auto-mode via .auto-state.json presence"
  - "Orchestrator auto-opens dashboard URL on start"
issues-encountered: []
---

# Plan 07-05 Summary: Live Auto-Orchestrator Dashboard

## What Was Built

Extended the project tracker dashboard with live auto-orchestrator monitoring panels. When `/fh:auto` runs, users see real-time pipeline progress, autonomous decisions, cost/token charts, and step timelines in the browser dashboard.

## Components

- **AutoPipeline.jsx** — Horizontal step indicator (plan-work → plan-review → build → review) with pulsing active step, progress bar, and live elapsed time
- **DecisionFeed.jsx** — Scrollable feed of autonomous decisions with confidence badges (HIGH/MEDIUM/LOW), NEEDS REVIEW highlighting, and expand-on-click detail
- **CostChart.jsx** — Recharts AreaChart showing cumulative cost over steps with budget ceiling reference line and summary stats
- **StepTimeline.jsx** — Recharts horizontal BarChart showing step durations grouped by phase with status-based coloring
- **chart-theme.js** — shadcn-style chart configuration with ChartContainer, ChartTooltipContent, and config-driven color tokens

## Infrastructure

- Enriched `.auto-state.json` written by orchestrator at every step transition (20 call sites)
- `parseAutoState()` and `parseDecisions()` parser functions for server-side data extraction
- Server includes autoState and decisions in SSE state updates
- Recharts integrated via npm aliasing (`react → npm:@preact/compat`) and esbuild alias config
- Auto-open browser via macOS `open` command at orchestrator startup

## Verification

- Build passes: `node build.js` produces 474KB index.html with Recharts bundle
- Parser tests pass: parseAutoState returns structured object, parseDecisions parses and sorts
- Server endpoint includes autoState and decisions fields
- 3 evals added (IDs 257-259) covering auto-mode dashboard behavior
