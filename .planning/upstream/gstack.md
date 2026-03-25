# Upstream: gstack (v0.3.3)

**Overall Quality: B+**

## Overview

gstack is a production safety and shipping automation toolkit that covers the last mile of development — plan review, QA testing, code review, browser testing, and deployment. Its philosophy is defense-in-depth before shipping: multiple review and testing gates before code reaches production. What makes it distinctive is its integration of browser-based testing (via Playwright), structured QA with issue taxonomies, and a CEO-level plan review that evaluates business alignment alongside technical quality.

## File Tree

```
upstream/gstack-0.3.3/
├── UPSTREAM-SKILL.md                             ← root gstack skill (meta)
├── UPSTREAM_REF.md                               ← upstream reference doc
├── SKILL.md.tmpl                                 ← skill template (for build)
├── ARCHITECTURE.md                               ← system architecture doc
├── BROWSER.md                                    ← browser testing guide
├── CHANGELOG.md                                  ← version changelog
├── README.md                                     ← project readme
├── VERSION                                       ← version tracking
├── conductor.json                                ← conductor config
├── package.json                                  ← Node.js package config
├── setup                                         ← setup script
├── plan-ceo-review/
│   └── UPSTREAM-SKILL.md                         ← CEO-perspective plan review
├── plan-eng-review/
│   └── UPSTREAM-SKILL.md                         ← engineering plan review
├── review/
│   ├── UPSTREAM-SKILL.md                         ← code review skill
│   ├── checklist.md                              ← review checklist
│   └── greptile-triage.md                        ← automated triage ref
├── qa/
│   ├── UPSTREAM-SKILL.md                         ← QA testing skill
│   ├── SKILL.md.tmpl                             ← QA skill template
│   ├── references/
│   │   └── issue-taxonomy.md                     ← issue classification
│   └── templates/
│       └── qa-report-template.md                 ← QA report format
├── browse/
│   ├── UPSTREAM-SKILL.md                         ← browser testing skill
│   ├── SKILL.md.tmpl                             ← browse skill template
│   ├── bin/
│   │   └── find-browse                           ← browse binary finder
│   ├── src/                                      ← TypeScript source
│   │   ├── browser-manager.ts                    ← browser lifecycle
│   │   ├── buffers.ts                            ← output buffering
│   │   ├── cli.ts                                ← CLI entry point
│   │   ├── commands.ts                           ← command definitions
│   │   ├── config.ts                             ← configuration
│   │   ├── cookie-import-browser.ts              ← cookie import
│   │   ├── cookie-picker-routes.ts               ← cookie picker API
│   │   ├── cookie-picker-ui.ts                   ← cookie picker UI
│   │   ├── find-browse.ts                        ← binary resolution
│   │   ├── meta-commands.ts                      ← meta commands
│   │   ├── read-commands.ts                      ← page reading
│   │   ├── server.ts                             ← local server
│   │   ├── snapshot.ts                           ← page snapshots
│   │   └── write-commands.ts                     ← page interaction
│   └── test/                                     ← test suite
│       ├── commands.test.ts
│       ├── config.test.ts
│       ├── cookie-import-browser.test.ts
│       ├── cookie-picker-routes.test.ts
│       ├── find-browse.test.ts
│       ├── gstack-update-check.test.ts
│       ├── snapshot.test.ts
│       ├── test-server.ts
│       └── fixtures/ (9 HTML test fixtures)
├── ship/
│   └── UPSTREAM-SKILL.md                         ← deployment automation
├── retro/
│   └── UPSTREAM-SKILL.md                         ← retrospective skill
├── gstack-upgrade/
│   └── UPSTREAM-SKILL.md                         ← self-update skill
├── setup-browser-cookies/
│   ├── UPSTREAM-SKILL.md                         ← cookie setup skill
│   └── SKILL.md.tmpl
├── scripts/
│   ├── dev-skill.ts                              ← dev tooling
│   ├── gen-skill-docs.ts                         ← doc generation
│   └── skill-check.ts                            ← skill validation
```

## Capability Flow Diagram

```
                       GSTACK SHIPPING PIPELINE

  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
  │ PLAN REVIEW  │───▶│   QA TEST    │───▶│ CODE REVIEW  │───▶│   SHIP   │
  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───┘
         │                   │                   │                   │
  plan-ceo-review      qa                 review               ship
  plan-eng-review      ┌─────────┐        ┌────────────┐      (deploy
         │             │ browse  │        │ checklist   │       automation)
         │             │ (visual │        │ greptile    │
         │             │  test)  │        │ triage      │
         │             └─────────┘        └────────────┘
         │
  ┌──────▼───────┐
  │   RETRO      │ ◀── post-ship learning
  │   retro      │
  └──────────────┘

  SUPPORT:
  ├── setup-browser-cookies ─── browser auth config
  ├── gstack-upgrade ────────── self-update
  └── setup ─────────────────── initial configuration
```

## Skills Table

| Skill | SDLC Phase | Quality | Status | fhhs Equivalent | Notes |
|-------|-----------|---------|--------|-----------------|-------|
| plan-ceo-review | Planning | A | ✅ Forked | /fh:plan-review | CEO-perspective plan review |
| plan-eng-review | Planning | A | ⬜ Available | — | Engineering plan review (G1) |
| review | Review | B | 🔀 Partial | Absorbed into /fh:review | Review methodology |
| qa | Testing | B | 🔀 Partial | /fh:ui-test | QA testing with taxonomy |
| browse | Testing | B | ⬜ Available | — | Browser-based visual testing (G4) |
| ship | Deploy | A | ⬜ Available | — | Deploy automation (G2) |
| retro | Retro | A | ⬜ Available | — | Post-project retrospective (G3) |
| setup-browser-cookies | Setup | C | 🚫 N/A | — | Browser auth config |
| gstack-upgrade | Maintenance | C | 🚫 N/A | — | gstack self-update |
| gstack (root) | Meta | C | 🚫 N/A | — | Meta/overview skill |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| review/checklist.md | Checklist | review | 🔀 Partial | Absorbed into /fh:review |
| review/greptile-triage.md | Reference | review | 🚫 N/A | Greptile-specific |
| qa/references/issue-taxonomy.md | Reference | qa | 🔀 Partial | Issue classification |
| qa/templates/qa-report-template.md | Template | qa | 🔀 Partial | QA report format |
| browse/src/ (14 TS files) | Source | browse | ⬜ Available | Browser testing runtime |
| browse/test/ (7 tests + fixtures) | Tests | browse | ⬜ Available | Browse test suite |
| ARCHITECTURE.md | Documentation | — | 🚫 N/A | Internal architecture |
| BROWSER.md | Documentation | browse | ⬜ Available | Browser testing guide |
| conductor.json | Config | — | 🚫 N/A | Conductor platform config |
| scripts/ (3 files) | Tooling | — | 🚫 N/A | Internal dev scripts |

## Assessment

gstack provides the strongest shipping-pipeline capabilities in the upstream catalog. The CEO plan review (plan-ceo-review) is already integrated as /fh:plan-review and is one of fhhs's most distinctive offerings. However, 4 significant capabilities remain unintegrated: plan-eng-review (the engineering counterpart to CEO review), ship (deploy automation), retro (retrospectives), and browse (visual testing). Of these, plan-eng-review is the highest-priority gap (G1) since it complements an already-integrated skill. The browse system is architecturally heavy (requires Playwright runtime, cookie management, local server) and would need significant adaptation. The review skill's checklist and QA's issue taxonomy have been partially absorbed but could be more fully leveraged.
