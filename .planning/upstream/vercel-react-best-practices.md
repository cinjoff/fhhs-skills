# Upstream: vercel-react-best-practices (64bee5b7)

**Overall Quality: B+**

## Overview

vercel-react-best-practices is a performance optimization ruleset containing 58 specific rules for React and Next.js applications, organized by concern area (rendering, re-renders, bundling, async, server, client, JS fundamentals). Its philosophy is measurable performance: each rule is a concrete, actionable optimization with clear before/after patterns rather than abstract guidance. What makes it distinctive is its granularity — 58 individual rules that can be applied as a code review checklist or optimization sweep.

## File Tree

```
upstream/vercel-react-best-practices-64bee5b7/
├── AGENTS.md                                     ← agent configuration
├── README.md                                     ← project documentation
├── UPSTREAM-SKILL.md                             ← master skill (references all rules)
└── rules/
    ├── rendering-*       (9 rules)               ← React rendering optimization
    ├── rerender-*        (12 rules)              ← re-render prevention
    ├── bundle-*          (5 rules)               ← bundle size reduction
    ├── async-*           (5 rules)               ← async pattern optimization
    ├── server-*          (8 rules)               ← server component/action patterns
    ├── client-*          (4 rules)               ← client-side optimization
    ├── js-*              (12 rules)              ← vanilla JS performance
    └── advanced-*        (3 rules)               ← advanced React patterns
```

## Deep Capability Description

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **vercel-react-best-practices** | 58 granular optimization rules organized by priority: (1) Eliminating Waterfalls — CRITICAL (async-* rules), (2) Bundle Size — CRITICAL (bundle-* rules), (3) Server-Side Perf — HIGH (server-* rules), (4) Client Data Fetching — MEDIUM-HIGH (client-* rules), (5) Re-render Prevention — MEDIUM (rerender-* rules), (6) Rendering Perf — MEDIUM (rendering-* rules), (7) JS Performance — LOW-MEDIUM (js-* rules), (8) Advanced Patterns — LOW (advanced-* rules). Each rule has: bad example, good example, explanation, performance impact. | Systematic performance optimization, not arbitrary tips. Priority ordering means you fix the highest-impact issues first. Before/after patterns make rules immediately actionable. | **DEAD** — shipped as `/fh:nextjs-perf` (trimmed to 35 of 58 rules) but **never wired into any pipeline**. Available for manual invocation only. |

## Skills Table

| Skill | SDLC Phase | Quality | Pipeline Status | fhhs Equivalent | Notes |
|-------|-----------|---------|----------------|-----------------|-------|
| vercel-react-best-practices | Performance | B+ | ⚠️ **Dead** | /fh:nextjs-perf (trimmed to 35 rules) | Not wired into any pipeline |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| rules/ (58 files) | Rules | vercel-react-best-practices | 🔀 Partial | 35 of 58 retained |
| AGENTS.md | Config | — | 🚫 N/A | Upstream agent config |

## Assessment

Well-structured with clear before/after patterns, but narrow applicability (React/Next.js only) and not wired into any fhhs pipeline. Available for manual invocation but realistically sees little use.

### Honest Assessment

This upstream adds token cost (skill description in session start) without providing automated value. It's only relevant when:
1. The user is working on a React/Next.js project
2. The user manually invokes `/fh:nextjs-perf`

The rules themselves are good, but the narrow scope limits integration opportunities. There's no natural trigger in `/fh:build` or `/fh:review` to conditionally load React performance rules.

### Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| **Low** | Consider wiring into `/fh:review` when reviewing React/Next.js code | Automated perf review for React projects |
| **Low** | Consider conditional loading: only add to skill descriptions when project uses React | Reduce token cost for non-React projects |
