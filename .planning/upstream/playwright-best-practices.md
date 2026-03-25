# Upstream: playwright-best-practices (b4b0fd3c)

**Overall Quality: A**

## Overview

playwright-best-practices is a comprehensive testing reference handbook containing 35 topical guides covering every aspect of Playwright end-to-end testing. Its philosophy is reference-first: rather than a workflow or command, it provides deep knowledge that agents can consult when writing or debugging tests. What makes it distinctive is its breadth — covering everything from basic locators to advanced scenarios like WebSocket testing, browser extensions, Canvas/WebGL, and multi-user flows — making it the single most comprehensive testing knowledge base in the upstream catalog.

## File Tree

```
upstream/playwright-best-practices-b4b0fd3c/
├── LICENSE.md                                    ← license
├── README.md                                     ← project documentation
├── UPSTREAM-SKILL.md                             ← master skill (references all guides)
└── references/
    ├── accessibility.md                          ← a11y testing patterns
    ├── annotations.md                            ← test annotations & tags
    ├── assertions-waiting.md                     ← assertion & wait strategies
    ├── browser-apis.md                           ← browser API interaction
    ├── browser-extensions.md                     ← extension testing
    ├── canvas-webgl.md                           ← Canvas/WebGL testing
    ├── ci-cd.md                                  ← CI/CD integration
    ├── clock-mocking.md                          ← time/clock mocking
    ├── component-testing.md                      ← component-level tests
    ├── console-errors.md                         ← console error handling
    ├── debugging.md                              ← test debugging techniques
    ├── electron.md                               ← Electron app testing
    ├── error-testing.md                          ← error scenario testing
    ├── file-operations.md                        ← file upload/download
    ├── fixtures-hooks.md                         ← fixtures & lifecycle hooks
    ├── flaky-tests.md                            ← flakiness mitigation
    ├── global-setup.md                           ← global setup patterns
    ├── i18n.md                                   ← internationalization testing
    ├── iframes.md                                ← iframe testing
    ├── locators.md                               ← element location strategies
    ├── mobile-testing.md                         ← mobile device testing
    ├── multi-context.md                          ← multi-context scenarios
    ├── multi-user.md                             ← multi-user test flows
    ├── network-advanced.md                       ← network interception
    ├── page-object-model.md                      ← POM patterns
    ├── performance-testing.md                    ← performance measurement
    ├── performance.md                            ← test perf optimization
    ├── projects-dependencies.md                  ← project config & deps
    ├── security-testing.md                       ← security test patterns
    ├── service-workers.md                        ← service worker testing
    ├── test-coverage.md                          ← coverage measurement
    ├── test-data.md                              ← test data management
    ├── test-organization.md                      ← test structure & naming
    ├── third-party.md                            ← third-party service testing
    └── websockets.md                             ← WebSocket testing
```

## Capability Flow Diagram

```
              PLAYWRIGHT-BEST-PRACTICES REFERENCE ARCHITECTURE

  ┌─────────────────────────────────────────────────────────────────┐
  │                    UPSTREAM-SKILL.md (master)                    │
  │        Routes to appropriate reference based on context          │
  └──────────────────────────┬──────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────────┐
          │                  │                      │
  ┌───────┴───────┐  ┌──────┴──────┐  ┌────────────┴──────────────┐
  │  FOUNDATIONS  │  │  PATTERNS   │  │  ADVANCED SCENARIOS       │
  ├───────────────┤  ├─────────────┤  ├───────────────────────────┤
  │ locators      │  │ page-object │  │ multi-user                │
  │ assertions-   │  │ fixtures-   │  │ multi-context             │
  │   waiting     │  │   hooks     │  │ iframes                   │
  │ test-org      │  │ test-data   │  │ browser-extensions        │
  │ annotations   │  │ global-     │  │ canvas-webgl              │
  │ debugging     │  │   setup     │  │ electron                  │
  └───────────────┘  │ component-  │  │ service-workers           │
                     │   testing   │  │ websockets                │
  ┌───────────────┐  └─────────────┘  │ clock-mocking             │
  │  QUALITY      │                   └───────────────────────────┘
  ├───────────────┤  ┌─────────────┐
  │ flaky-tests   │  │  OPS/CI     │
  │ error-testing │  ├─────────────┤
  │ console-      │  │ ci-cd       │
  │   errors      │  │ performance │
  │ accessibility │  │ perf-testing│
  │ security-     │  │ test-       │
  │   testing     │  │   coverage  │
  │ i18n          │  │ network-    │
  └───────────────┘  │   advanced  │
                     │ file-ops    │
                     │ browser-    │
                     │   apis      │
                     │ third-party │
                     │ mobile-     │
                     │   testing   │
                     └─────────────┘
```

## Skills Table

| Skill | SDLC Phase | Quality | Status | fhhs Equivalent | Notes |
|-------|-----------|---------|--------|-----------------|-------|
| playwright-best-practices | Testing | A | ✅ Forked | /fh:playwright-testing (distilled) | 35 reference guides distilled |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| references/ (35 files) | Reference | playwright-best-practices | ✅ Forked | Distilled into /fh:playwright-testing |
| All 35 individual reference files | Reference | Contextual lookup | ✅ Forked | Condensed from full guides |

## Assessment

playwright-best-practices is the deepest single-topic reference in the upstream catalog. Its 35 guides cover Playwright testing with exceptional thoroughness. In fhhs, it is distilled into /fh:playwright-testing — the full 35-file reference set is condensed into a more compact skill that retains the essential patterns while fitting within Claude's context constraints. The distillation is well-executed but means some advanced scenarios (Electron testing, browser extensions, Canvas/WebGL) are less thoroughly covered in the fhhs version. No integration gaps — the upstream is fully leveraged, just compressed.
