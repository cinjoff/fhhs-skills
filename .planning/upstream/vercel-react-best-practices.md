# Upstream: vercel-react-best-practices (64bee5b7)

**Overall Quality: B+**

## Overview

vercel-react-best-practices is a performance optimization ruleset containing 58 specific rules for React and Next.js applications, organized by concern area (rendering, re-renders, bundling, async, server, client, JS fundamentals). Its philosophy is measurable performance: each rule is a concrete, actionable optimization with clear before/after patterns rather than abstract guidance. What makes it distinctive is its granularity — 58 individual rules that can be applied as a code review checklist or optimization sweep, making it the most rule-dense upstream in the catalog.

## File Tree

```
upstream/vercel-react-best-practices-64bee5b7/
├── AGENTS.md                                     ← agent configuration
├── README.md                                     ← project documentation
├── UPSTREAM-SKILL.md                             ← master skill (references all rules)
└── rules/
    ├── rendering-activity.md                     ← React Activity API
    ├── rendering-animate-svg-wrapper.md          ← SVG animation wrapping
    ├── rendering-conditional-render.md           ← conditional rendering
    ├── rendering-content-visibility.md           ← CSS content-visibility
    ├── rendering-hoist-jsx.md                    ← JSX hoisting
    ├── rendering-hydration-no-flicker.md         ← hydration flicker prevention
    ├── rendering-hydration-suppress-warning.md   ← hydration warning suppression
    ├── rendering-svg-precision.md                ← SVG coordinate precision
    ├── rendering-usetransition-loading.md        ← useTransition loading states
    ├── rerender-defer-reads.md                   ← deferred DOM reads
    ├── rerender-dependencies.md                  ← dependency optimization
    ├── rerender-derived-state.md                 ← derived state patterns
    ├── rerender-derived-state-no-effect.md       ← avoid effect for derived state
    ├── rerender-functional-setstate.md           ← functional setState
    ├── rerender-lazy-state-init.md               ← lazy state initialization
    ├── rerender-memo.md                          ← React.memo usage
    ├── rerender-memo-with-default-value.md       ← memo with defaults
    ├── rerender-move-effect-to-event.md          ← effect → event handler
    ├── rerender-simple-expression-in-memo.md     ← simple memo expressions
    ├── rerender-transitions.md                   ← transition API
    ├── rerender-use-ref-transient-values.md      ← useRef for transient values
    ├── bundle-barrel-imports.md                  ← barrel import optimization
    ├── bundle-conditional.md                     ← conditional bundling
    ├── bundle-defer-third-party.md               ← third-party deferral
    ├── bundle-dynamic-imports.md                 ← dynamic import splitting
    ├── bundle-preload.md                         ← resource preloading
    ├── async-api-routes.md                       ← async API route patterns
    ├── async-defer-await.md                      ← defer/await patterns
    ├── async-dependencies.md                     ← async dependency mgmt
    ├── async-parallel.md                         ← parallel async ops
    ├── async-suspense-boundaries.md              ← Suspense boundary placement
    ├── server-after-nonblocking.md               ← non-blocking server patterns
    ├── server-auth-actions.md                    ← auth action optimization
    ├── server-cache-lru.md                       ← LRU cache patterns
    ├── server-cache-react.md                     ← React cache API
    ├── server-dedup-props.md                     ← prop deduplication
    ├── server-hoist-static-io.md                 ← static I/O hoisting
    ├── server-parallel-fetching.md               ← parallel data fetching
    ├── server-serialization.md                   ← serialization optimization
    ├── client-event-listeners.md                 ← event listener optimization
    ├── client-localstorage-schema.md             ← localStorage schema
    ├── client-passive-event-listeners.md         ← passive event listeners
    ├── client-swr-dedup.md                       ← SWR deduplication
    ├── js-batch-dom-css.md                       ← DOM/CSS batching
    ├── js-cache-function-results.md              ← function result caching
    ├── js-cache-property-access.md               ← property access caching
    ├── js-cache-storage.md                       ← storage caching
    ├── js-combine-iterations.md                  ← iteration combining
    ├── js-early-exit.md                          ← early exit patterns
    ├── js-hoist-regexp.md                        ← RegExp hoisting
    ├── js-index-maps.md                          ← index map patterns
    ├── js-length-check-first.md                  ← length check optimization
    ├── js-min-max-loop.md                        ← min/max loop patterns
    ├── js-set-map-lookups.md                     ← Set/Map lookup optimization
    ├── js-tosorted-immutable.md                  ← immutable sorting
    ├── advanced-event-handler-refs.md            ← event handler ref patterns
    ├── advanced-init-once.md                     ← one-time initialization
    └── advanced-use-latest.md                    ← useLatest hook pattern
```

## Capability Flow Diagram

```
             VERCEL-REACT-BEST-PRACTICES RULE CATEGORIES

  ┌────────────────────────────────────────────────────────────────┐
  │                  UPSTREAM-SKILL.md (master)                     │
  │         Dispatches rules based on code context                  │
  └──────────────────────────┬─────────────────────────────────────┘
                             │
     ┌───────────┬───────────┼───────────┬───────────┐
     │           │           │           │           │
  ┌──┴──┐    ┌──┴──┐    ┌──┴──┐    ┌──┴──┐    ┌──┴──┐
  │RENDR│    │RERND│    │BUNDL│    │ASYNC│    │SERVR│
  │(9)  │    │(12) │    │(5)  │    │(5)  │    │(8)  │
  └─────┘    └─────┘    └─────┘    └─────┘    └─────┘

  ┌───────────┬───────────┬───────────┐
  │           │           │           │
  ┌──┴──┐    ┌──┴──┐    ┌──┴──┐    ┌──┴──┐
  │CLINT│    │JS   │    │ADVNC│    │     │
  │(4)  │    │(12) │    │(3)  │    │     │
  └─────┘    └─────┘    └─────┘    └─────┘

  CATEGORY BREAKDOWN (58 rules total):
  ├── rendering-*      (9)  ── React rendering optimization
  ├── rerender-*       (12) ── re-render prevention
  ├── bundle-*         (5)  ── bundle size reduction
  ├── async-*          (5)  ── async pattern optimization
  ├── server-*         (8)  ── server component/action patterns
  ├── client-*         (4)  ── client-side optimization
  ├── js-*             (12) ── vanilla JS performance
  └── advanced-*       (3)  ── advanced React patterns
```

## Skills Table

| Skill | SDLC Phase | Quality | Status | fhhs Equivalent | Notes |
|-------|-----------|---------|--------|-----------------|-------|
| vercel-react-best-practices | Performance | B+ | ✅ Forked | /fh:nextjs-perf (trimmed to 35 rules) | 58 rules trimmed to 35 highest-impact |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| rules/ (58 files) | Rules | vercel-react-best-practices | 🔀 Partial | 35 of 58 retained in /fh:nextjs-perf |
| AGENTS.md | Config | — | 🚫 N/A | Upstream agent config |

## Assessment

vercel-react-best-practices provides the most granular performance optimization knowledge in the catalog. Its 58 individual rules are well-structured with clear before/after patterns. In fhhs, it is trimmed to 35 rules as /fh:nextjs-perf — the 23 dropped rules are either too niche (Canvas SVG precision, localStorage schema), overlap with other fhhs capabilities, or target patterns rarely seen in practice. The trimming is a reasonable trade-off between context budget and coverage. The main weakness is narrow applicability — these rules only apply to React/Next.js projects, unlike most other upstreams which are framework-agnostic. The upstream's overall B+ rating (rather than A) reflects this narrow scope.
