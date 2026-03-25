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

## Deep Capability Description

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **playwright-best-practices** | Activity-based reference guide with decision trees. For any Playwright testing scenario, routes to the appropriate reference guide. Covers foundations (locators, assertions, fixtures), patterns (POM, test data, global setup), quality (flaky tests, error testing, a11y, security), ops (CI/CD, performance, coverage), and advanced scenarios (multi-user, WebSocket, Canvas/WebGL, Electron, browser extensions). 35 individual reference files, each a comprehensive guide for its topic. | Eliminates guessing about test design. Battle-tested patterns for every Playwright scenario. The depth per topic is exceptional — not "how to use locators" but "which locator strategy for which situation, with tradeoffs." | **CONDITIONAL** — wired in `/fh:build` Step 3 (conditional context injection for interactive features), `/fh:fix` Step 2 (when fixing test issues), `/fh:plan-work` Step 6 (E2E test warning for interactive features). Distilled from 35 guides into compact `/fh:playwright-testing`. |

## Skills Table

| Skill | SDLC Phase | Quality | Pipeline Status | fhhs Equivalent | Notes |
|-------|-----------|---------|----------------|-----------------|-------|
| playwright-best-practices | Testing | A | ✅ **Conditional** | /fh:playwright-testing (distilled) | 35 guides → compact skill |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| references/ (35 files) | Reference | playwright-best-practices | ✅ Distilled | Condensed into /fh:playwright-testing |

## Assessment

Fully integrated via distillation. The 35-file reference set is condensed into a compact skill that retains essential patterns while fitting within Claude's context constraints. Some advanced scenarios (Electron, browser extensions, Canvas/WebGL) are less thoroughly covered in the fhhs version, but these are niche and rarely needed.

### Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| **None** | No changes needed | Fully integrated via distillation |
