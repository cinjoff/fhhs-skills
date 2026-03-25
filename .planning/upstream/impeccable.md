# Upstream: impeccable (v1.2.0)

**Overall Quality: A**

## Overview

Impeccable is a design quality toolkit that provides 18 independent UI transformation commands — each targeting a specific dimension of frontend craft (typography, color, layout, motion, accessibility, performance). Its philosophy is opinionated design excellence: rather than generating generic UI, each command applies specific design principles with concrete rules. What makes it distinctive is the grid-of-transforms model where each command is a focused lens that can be applied independently or composed.

## File Tree

```
upstream/impeccable-1.2.0/
├── .claude-plugin/
│   ├── marketplace.json                          ← plugin registry metadata
│   └── plugin.json                               ← plugin config
├── .claude/skills/                               ← shipped skills (Claude Code format)
│   ├── adapt/UPSTREAM-SKILL.md                   ← responsive adaptation
│   ├── animate/UPSTREAM-SKILL.md                 ← motion design
│   ├── audit/UPSTREAM-SKILL.md                   ← UI quality audit
│   ├── bolder/UPSTREAM-SKILL.md                  ← increase visual weight
│   ├── clarify/UPSTREAM-SKILL.md                 ← UX clarity pass
│   ├── colorize/UPSTREAM-SKILL.md                ← color system application
│   ├── critique/UPSTREAM-SKILL.md                ← design critique
│   ├── delight/UPSTREAM-SKILL.md                 ← micro-interactions & polish
│   ├── distill/UPSTREAM-SKILL.md                 ← simplify to essence
│   ├── extract/UPSTREAM-SKILL.md                 ← extract design tokens
│   ├── frontend-design/
│   │   ├── UPSTREAM-SKILL.md                     ← comprehensive design skill
│   │   └── reference/                            ← 7 design reference docs
│   │       ├── typography.md                     ← type system rules
│   │       ├── color-and-contrast.md             ← color theory & WCAG
│   │       ├── spatial-design.md                 ← spacing & layout
│   │       ├── motion-design.md                  ← animation principles
│   │       ├── interaction-design.md             ← input & feedback patterns
│   │       ├── responsive-design.md              ← breakpoint strategy
│   │       └── ux-writing.md                     ← microcopy guidelines
│   ├── harden/UPSTREAM-SKILL.md                  ← robustness & edge cases
│   ├── normalize/UPSTREAM-SKILL.md               ← design system alignment
│   ├── onboard/UPSTREAM-SKILL.md                 ← onboarding flow design
│   ├── optimize/UPSTREAM-SKILL.md                ← performance optimization
│   ├── polish/UPSTREAM-SKILL.md                  ← final detail pass
│   ├── quieter/UPSTREAM-SKILL.md                 ← reduce visual noise
│   └── teach-impeccable/UPSTREAM-SKILL.md        ← setup & learn impeccable
├── source/skills/                                ← source-of-truth skills (pre-transform)
│   ├── adapt/UPSTREAM-SKILL.md
│   ├── animate/UPSTREAM-SKILL.md
│   ├── audit/UPSTREAM-SKILL.md
│   ├── bolder/UPSTREAM-SKILL.md
│   ├── clarify/UPSTREAM-SKILL.md
│   ├── colorize/UPSTREAM-SKILL.md
│   ├── critique/UPSTREAM-SKILL.md
│   ├── delight/UPSTREAM-SKILL.md
│   ├── distill/UPSTREAM-SKILL.md
│   ├── extract/UPSTREAM-SKILL.md
│   ├── frontend-design/
│   │   ├── UPSTREAM-SKILL.md
│   │   └── reference/ (same 7 files)
│   ├── harden/UPSTREAM-SKILL.md
│   ├── normalize/UPSTREAM-SKILL.md
│   ├── onboard/UPSTREAM-SKILL.md
│   ├── optimize/UPSTREAM-SKILL.md
│   ├── polish/UPSTREAM-SKILL.md
│   ├── quieter/UPSTREAM-SKILL.md
│   └── teach-impeccable/UPSTREAM-SKILL.md
├── api/                                          ← web API (Vercel serverless)
│   ├── command-source/[id].js
│   ├── commands.js
│   ├── download/[type]/[provider]/[id].js
│   ├── download/bundle/[provider].js
│   ├── patterns.js
│   └── skills.js
├── public/                                       ← marketing site
│   ├── index.html
│   ├── cheatsheet.html
│   ├── antipattern-examples/ (11 HTML files)     ← anti-pattern demos
│   ├── antipattern-images/ (11 PNG files)        ← screenshots
│   ├── assets/ (before/after comparisons)
│   ├── css/ (5 stylesheets)
│   └── js/ (demos, components, effects, utils)
├── scripts/                                      ← build tooling
│   ├── build.js
│   ├── generate-og-image.js
│   ├── screenshot-antipatterns.js
│   └── lib/ (transformers for 6 platforms + utils)
├── server/                                       ← API server
│   ├── index.js
│   └── lib/ (api-handlers.js, validation.js)
├── tests/                                        ← build & transformer tests
│   ├── build.test.js
│   └── lib/transformers/ (4 platform tests)
├── AGENTS.md
├── CLAUDE.md
├── DEVELOP.md
├── LICENSE
├── NOTICE.md
├── README.md
├── biome.json
├── package.json
├── bun.lock
└── vercel.json
```

## Capability Flow Diagram

```
                          IMPECCABLE TOOLKIT GRID

  Each command is an independent transform — apply one or compose many.

  ┌─────────────────────────────────────────────────────────────────────┐
  │                     frontend-design (master skill)                  │
  │  Comprehensive design skill with 7 reference documents             │
  │  typography │ color │ spatial │ motion │ interaction │ responsive │ UX│
  └──────────────────────────────┬──────────────────────────────────────┘
                                 │ informs all transforms
          ┌──────────────────────┼──────────────────────────┐
          │                      │                          │
  ┌───────┴───────┐    ┌────────┴────────┐    ┌────────────┴──────────┐
  │  VISUAL STYLE │    │  STRUCTURE/UX   │    │  QUALITY ASSURANCE    │
  ├───────────────┤    ├─────────────────┤    ├───────────────────────┤
  │ bolder        │    │ distill         │    │ audit    (full scan)  │
  │ quieter       │    │ clarify         │    │ critique (design rev) │
  │ colorize      │    │ normalize       │    │ harden   (edge cases) │
  │ polish        │    │ extract         │    │ optimize (perf)       │
  │ delight       │    │ onboard         │    └───────────────────────┘
  │ animate       │    │ adapt           │
  └───────────────┘    └─────────────────┘

  SETUP: teach-impeccable → configure brand guidelines for all transforms
```

## Skills Table

| Skill | SDLC Phase | Quality | Status | fhhs Equivalent | Notes |
|-------|-----------|---------|--------|-----------------|-------|
| frontend-design | Design | A | ✅ Forked | skills/frontend-design/PROMPT.md | Master design skill with 7 refs |
| audit | QA | A | ✅ Forked | /fh:audit | UI quality audit |
| critique | Review | A | ✅ Forked | /fh:ui-critique | Design review |
| normalize | Design | B | ✅ Forked | /fh:normalize | Design system alignment |
| extract | Design | B | ✅ Forked | /fh:extract | Design token extraction |
| distill | Design | A | ✅ Forked | /fh:distill | Simplify to essence |
| polish | Design | A | ✅ Forked | /fh:polish | Final detail pass |
| bolder | Design | B | ✅ Forked | /fh:bolder | Increase visual weight |
| quieter | Design | B | ✅ Forked | /fh:quieter | Reduce visual noise |
| colorize | Design | B | ✅ Forked | /fh:colorize | Color system application |
| clarify | UX | A | ✅ Forked | /fh:clarify | UX clarity pass |
| delight | Design | B | ✅ Forked | /fh:delight | Micro-interactions |
| harden | QA | A | ✅ Forked | /fh:harden | Robustness & edge cases |
| optimize | Performance | A | ✅ Forked | /fh:optimize | Performance optimization |
| adapt | Design | B | ✅ Forked | /fh:adapt | Responsive adaptation |
| onboard | UX | B | ✅ Forked | /fh:onboard | Onboarding flow design |
| animate | Design | B | ✅ Forked | /fh:ui-animate | Motion design |
| teach-impeccable | Setup | B | ✅ Forked | /fh:ui-branding (renamed) | Brand config setup |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| reference/typography.md | Reference | frontend-design | ✅ Forked | Type system rules |
| reference/color-and-contrast.md | Reference | frontend-design | ✅ Forked | Color theory & WCAG |
| reference/spatial-design.md | Reference | frontend-design | ✅ Forked | Spacing & layout |
| reference/motion-design.md | Reference | frontend-design | ✅ Forked | Animation principles |
| reference/interaction-design.md | Reference | frontend-design | ✅ Forked | Input & feedback patterns |
| reference/responsive-design.md | Reference | frontend-design | ✅ Forked | Breakpoint strategy |
| reference/ux-writing.md | Reference | frontend-design | ✅ Forked | Microcopy guidelines |
| antipattern-examples/ | HTML demos | Marketing site | 🚫 N/A | Not relevant to plugin |
| scripts/lib/transformers/ | Build tools | Multi-platform build | 🚫 N/A | Platform-specific builders |

## Assessment

Impeccable is the most comprehensive UI quality toolkit in the upstream catalog. Its independent-transforms model maps cleanly to fhhs's skill-per-command architecture — every single skill has been forked and exposed as a `/fh:*` command. The frontend-design master skill with its 7 co-located reference documents is the strongest individual asset, providing concrete design rules rather than vague guidelines. The only weakness is that some transforms (bolder, quieter, colorize) are somewhat niche and see low real-world usage. The web infrastructure (API, marketing site, build system) is entirely irrelevant to fhhs and correctly excluded.
