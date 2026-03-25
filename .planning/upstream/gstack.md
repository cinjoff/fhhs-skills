# Upstream: gstack (v0.3.3)

**Overall Quality: B+**

## Overview

gstack is a production safety and shipping automation toolkit that covers the last mile of development — plan review, QA testing, code review, browser testing, and deployment. Its philosophy is defense-in-depth before shipping: multiple review and testing gates before code reaches production. What makes it distinctive is its integration of browser-based testing (via Playwright), structured QA with issue taxonomies, and dual-perspective plan review (CEO and engineering manager modes).

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
│   ├── bin/find-browse                           ← browse binary finder
│   ├── src/ (14 TS files)                        ← browser automation runtime
│   └── test/ (7 tests + fixtures)                ← browse test suite
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

## Deep Capability Descriptions

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **plan-ceo-review** | Founder/CEO-perspective plan review: evaluates business alignment, resource allocation, risk assessment, timeline feasibility, strategic fit. Asks "is this the right thing to build?" not just "is the plan technically sound?" | Catches strategic misalignment before engineering effort is wasted. The "founder taste" lens is unique in the catalog. | **ACTIVE** — forked as `/fh:plan-review`. One of fhhs's most distinctive offerings. |
| **plan-eng-review** | Engineering manager perspective plan review: evaluates technical feasibility, architecture decisions, dependency risks, team capacity, testing strategy, operational readiness. Asks "can we build this reliably?" and "what will break?" Complements CEO review with engineering rigor. | The engineering counterpart to CEO review. Focuses on implementation risk, architecture soundness, and operational concerns that a business-focused review misses. | **ACTIVE** — integrated into `/fh:plan-review` (Phase 3.5). Always runs both business + engineering review — not a separate command. |
| **review** | Structured code review with checklist (correctness, security, performance, style, edge cases) + Greptile integration for automated triage. Greptile triage: valid issues get fixed, already-fixed get acknowledged, false positives get pushed back. | Systematic review beyond "looks good to me." The Greptile triage pattern handles AI-generated review noise well. | **PARTIAL** — review methodology absorbed into `/fh:review`. Greptile triage available but platform-specific. |
| **qa** | Systematic QA testing with structured issue taxonomy (critical/major/minor/cosmetic), test plan generation, QA report output. References issue-taxonomy.md for consistent classification. | Structured QA process with consistent severity ratings. Issue taxonomy prevents subjective severity assignments. | **PARTIAL** — QA methodology partially in `/fh:ui-test`. Taxonomy and report templates underused. |
| **browse** | Persistent headless Chromium session for visual testing: ~100-200ms per command, page snapshots, form interaction, cookie import for authenticated testing. Full TypeScript runtime with 14 source files. | Real browser testing without manual clicking. Authenticated session support via cookie import. | **DEAD** — heavy dependency (compiled binary, Playwright runtime). Architecturally complex integration. Low priority. |
| **ship** | Release engineer workflow: sync branches, run full test suite, push PR, monitor CI, deploy. Handles the mechanics of getting reviewed code to production. | Automates the error-prone last mile of shipping. | **DEAD** — no deploy phase in fhhs. Low priority unless user has deploy targets. |
| **retro** | Engineering manager mode for post-project retrospectives: analyze commit history, team metrics, velocity, what went well/poorly, action items. | Structured learning loop after shipping. Prevents repeating mistakes. | **DEAD** — no retrospective capability in fhhs. Medium-value gap. |
| **setup-browser-cookies** | Import real browser cookies for authenticated testing sessions. Cookie picker UI for selecting which cookies to import. | Enables testing behind authentication. | **DEAD** — dependency of browse. |
| **gstack-upgrade** | Self-update mechanism for gstack. | Not applicable to fhhs. | 🚫 N/A |
| **gstack (root)** | Meta-skill overview and routing. | Not applicable to fhhs. | 🚫 N/A |

## Skills Table

| Skill | SDLC Phase | Quality | Pipeline Status | fhhs Equivalent | Notes |
|-------|-----------|---------|----------------|-----------------|-------|
| plan-ceo-review | Planning | A | ✅ **Active** | /fh:plan-review | CEO-perspective plan review |
| plan-eng-review | Planning | A | ✅ **Active** | /fh:plan-review (integrated) | Always-on alongside CEO review |
| review | Review | B | 🔀 Partial | Absorbed into /fh:review | Review checklist + Greptile |
| qa | Testing | B | 🔀 Partial | /fh:ui-test | QA testing with taxonomy |
| browse | Testing | B | ⬜ Available | — | Browser visual testing |
| ship | Deploy | A | ⬜ Available | — | Deploy automation |
| retro | Retro | A | ⬜ Available | — | Post-project retrospective |
| setup-browser-cookies | Setup | C | 🚫 N/A | — | Browser auth config |
| gstack-upgrade | Maintenance | C | 🚫 N/A | — | gstack self-update |
| gstack (root) | Meta | C | 🚫 N/A | — | Meta/overview skill |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| review/checklist.md | Checklist | review | 🔀 Partial | Absorbed into /fh:review |
| review/greptile-triage.md | Reference | review | 🔀 Available | Greptile-specific triage |
| qa/references/issue-taxonomy.md | Reference | qa | 🔀 Partial | Issue classification |
| qa/templates/qa-report-template.md | Template | qa | 🔀 Partial | QA report format |
| browse/src/ (14 TS files) | Source | browse | ⬜ Available | Browser testing runtime |
| browse/test/ (7 tests + fixtures) | Tests | browse | ⬜ Available | Browse test suite |
| ARCHITECTURE.md | Documentation | — | 🚫 N/A | Internal architecture |
| BROWSER.md | Documentation | browse | ⬜ Available | Browser testing guide |

## Assessment

gstack provides the strongest shipping-pipeline capabilities in the upstream catalog. The CEO plan review is already one of fhhs's most distinctive offerings.

### What's Working

`plan-ceo-review` and `plan-eng-review` together power `/fh:plan-review` — providing both business-alignment and engineering-risk review in a single pass. This dual-perspective plan review is one of fhhs's most distinctive offerings. The review methodology and QA taxonomy are partially absorbed and functional.

### What's Underused

No high-value gaps remain for gstack. The primary integration priority (plan-eng-review) was closed in Phase 3.5.

### Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| ~~High~~ | ~~Integrate plan-eng-review alongside plan-ceo-review~~ | ✅ **DONE** (Phase 3.5) — always-on in /fh:plan-review |
| ~~High~~ | ~~Add complexity-based review suggestion to `/fh:plan-work`~~ | ✅ **DONE** (Phase 3.5) |
| **Medium** | Integrate retro as `/fh:retro` for post-milestone learning | Structured improvement loop |
| **Low** | Explore browse integration for visual testing | Heavy dependency, questionable ROI |
| **Low** | Integrate ship for projects with deploy targets | Only relevant for deployed apps |
