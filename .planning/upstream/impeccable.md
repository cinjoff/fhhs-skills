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
├── api/                                          ← web API (Vercel serverless)
├── public/                                       ← marketing site
├── scripts/                                      ← build tooling
├── server/                                       ← API server
├── tests/                                        ← build & transformer tests
├── AGENTS.md, CLAUDE.md, DEVELOP.md, README.md
├── package.json, biome.json, bun.lock, vercel.json
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

## Deep Capability Descriptions

### The Core Skill

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **frontend-design** | Comprehensive design skill covering: bold aesthetic commitment, typography (font selection/pairing/modular scales/fluid sizing/OpenType), color (OKLCH space, tinted neutrals, semantic color, dark mode), layout (asymmetry, visual rhythm, break-the-grid), visual details (intentional decorations), motion (ease-out curves, transform+opacity only), interaction (progressive disclosure, affordances, loading states), responsive (container queries, mobile-first), UX writing (clarity, active voice). **Anti-patterns**: no Inter/Roboto/system defaults, no gray-on-color, no pure black/white, no nested cards, no bounce/elastic easing, no cyan/purple gradients, no glassmorphism, no gradient text, no centered everything, no unnecessary modals. 7 deep-dive reference files. | Eliminates generic AI aesthetics. Teaches design vocabulary. The anti-pattern list is the most actionable part — it gives agents a "design smell" checklist. | **ACTIVE** — wired in `/fh:build` Step 4 and `/fh:fix` Step 3. Read by subagents for all frontend work. |

### Quality Assurance Commands

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **audit** | Systematic quality checks across accessibility, performance, theming, responsive design, and anti-patterns. Produces detailed report with severity ratings, root causes, remediation paths. Documents issues without fixing. | Finds systemic problems, not just surface issues. The structured report makes triage actionable. | **CONDITIONAL** — build suggests `/fh:audit` for frontend-heavy work (Phase 3.5). |
| **critique** | UX director-level design review: evaluates visual hierarchy, information architecture, emotional resonance, AI slop detection. Focuses on "does the design work?" not "is it technically correct?" | Higher-level evaluation than audit. Asks whether the design achieves its goals, not just whether it has bugs. | **CONDITIONAL** — in `/fh:build` design gates (when visual ratio > 40%). |
| **normalize** | Align with design system: replace one-off values with tokens, apply spacing/color/type system consistently, identify missing tokens. | Enforces systematic consistency. Turns ad-hoc design into systematic design. | **CONDITIONAL** — in `/fh:build` design gates. |

### Refinement Commands

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **polish** | Final quality pass: meticulous attention to alignment, spacing, typography, interactive states, transitions, microcopy. 20-point checklist of excellence markers. | Separates good from great. The detail-oriented pass that catches what review misses. | **CONDITIONAL** — in `/fh:build` design gates. |
| **distill** | Strip to essence: ruthlessly remove unnecessary complexity, apply progressive disclosure, question every element's necessity. | Design simplicity as a feature. "Simplicity is about removing obstacles, not features." | **DEAD** — shipped but never auto-invoked. Niche manual use. |
| **clarify** | Improve unclear UX copy: rewrite error messages, labels, empty states, help text, microcopy with active voice and user empathy. Transforms "Error 403" into "You don't have permission. Contact admin." | UX writing quality. Most agents write terrible error messages; this fixes them. | **DEAD** — shipped but never auto-invoked. Niche manual use. |
| **optimize** | Performance improvements: images, bundles, animations, rendering, Core Web Vitals. Measured before/after metrics. Covers React optimization, loading perf, rendering perf. | Speed and smoothness with measurable results. | **DEAD** — shipped but never auto-invoked. Overlaps with vercel-react-best-practices. |

### Enhancement Commands

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **harden** | Production resilience: handle text overflow, i18n, RTL, network errors, large datasets, invalid input, edge cases. Respects users doing unexpected things. | Makes designs production-ready. Addresses the gap between "works in demo" and "works in production". | **CONDITIONAL** — build suggests `/fh:harden` for production frontend (Phase 3.5). |
| **animate** | Add purposeful motion with choreography, staggering, easing (ease-out-quart/quint/expo, never bounce/elastic). Gathers context first. Respects reduced-motion preference. | Polished feel through intentional motion. Context-gathering prevents generic animations. | **CONDITIONAL** — in `/fh:build` design gates. |

### Personality Commands

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **colorize** | Introduce strategic color to monochromatic designs: semantic coding (success/error/warning), accent colors, visual interest. Uses OKLCH. Gathers context first. | Targeted color application, not random decoration. | **DEAD** — manual invocation only. |
| **bolder** | Amplify safe/boring designs: dramatic typography, bold colors, spatial tension. WARNING: detects and avoids AI slop traps (gradients, glassmorphism). | Design confidence when playing it too safe. | **DEAD** — manual invocation only. |
| **quieter** | Tone down overly aggressive designs: color desaturation, weight reduction, simplification. | Makes bold designs feel sophisticated through restraint. | **DEAD** — manual invocation only. |
| **delight** | Add moments of joy: micro-interactions, playful copy, illustrations, easter eggs, celebration moments. Context-sensitive, never blocks functionality. | Emotional engagement. Makes functional into memorable. | **DEAD** — manual invocation only. |

### Systematic Commands

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **extract** | Consolidate reusable patterns into design system: identify repeated components/tokens, create systematic versions, reduce duplication. | Design system maintenance. Prevents design debt accumulation. | **DEAD** — manual invocation only. |
| **adapt** | Redesign for different contexts (mobile, tablet, desktop, print, email). Respects platform conventions, mobile-first, input-method aware. | Multi-context support. Not just "make it responsive" but true adaptation. | **DEAD** — manual invocation only. |
| **onboard** | Design first-time user experiences: feature discovery, tooltips, walkthroughs, empty state design, progressive teaching. | Gets users to "aha moment" quickly. | **DEAD** — manual invocation only. |
| **teach-impeccable** | One-time setup: gather design context (brand personality, audience, constraints) → save to CLAUDE.md for all future sessions. | Persistent design preferences across all sessions. | Exposed as `/fh:ui-branding`. Setup utility. |

## Skills Table

| Skill | SDLC Phase | Quality | Pipeline Status | fhhs Equivalent | Notes |
|-------|-----------|---------|----------------|-----------------|-------|
| frontend-design | Design | A | ✅ **Active** | skills/frontend-design/PROMPT.md | Master design skill — core value |
| critique | Review | A | ✅ Conditional | /fh:ui-critique | Build design gates (visual > 40%) |
| polish | Design | A | ✅ Conditional | /fh:polish | Build design gates |
| normalize | Design | B | ✅ Conditional | /fh:normalize | Build design gates |
| animate | Design | B | ✅ Conditional | /fh:ui-animate | Build design gates |
| audit | QA | A | ✅ **Conditional** | /fh:audit | Build suggests for frontend-heavy work |
| harden | QA | A | ✅ **Conditional** | /fh:harden | Build suggests for production frontend |
| clarify | UX | A | ⬜ Manual only | /fh:clarify | Niche but valuable when invoked |
| distill | Design | A | ⬜ Manual only | /fh:distill | Niche |
| optimize | Performance | A | ⬜ Manual only | /fh:optimize | Overlaps vercel-react |
| colorize | Design | B | ⬜ Manual only | /fh:colorize | Niche personality command |
| bolder | Design | B | ⬜ Manual only | /fh:bolder | Niche personality command |
| quieter | Design | B | ⬜ Manual only | /fh:quieter | Niche personality command |
| delight | Design | B | ⬜ Manual only | /fh:delight | Niche personality command |
| extract | Design | B | ⬜ Manual only | /fh:extract | Design system maintenance |
| adapt | Design | B | ⬜ Manual only | /fh:adapt | Multi-context adaptation |
| onboard | UX | B | ⬜ Manual only | /fh:onboard | Onboarding flow design |
| teach-impeccable | Setup | B | ✅ Available | /fh:ui-branding (renamed) | Brand config setup |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| reference/typography.md | Reference | frontend-design | ✅ Active | Type system rules |
| reference/color-and-contrast.md | Reference | frontend-design | ✅ Active | Color theory & WCAG |
| reference/spatial-design.md | Reference | frontend-design | ✅ Active | Spacing & layout |
| reference/motion-design.md | Reference | frontend-design | ✅ Active | Animation principles |
| reference/interaction-design.md | Reference | frontend-design | ✅ Active | Input & feedback patterns |
| reference/responsive-design.md | Reference | frontend-design | ✅ Active | Breakpoint strategy |
| reference/ux-writing.md | Reference | frontend-design | ✅ Active | Microcopy guidelines |
| antipattern-examples/ | HTML demos | Marketing site | 🚫 N/A | Not relevant to plugin |
| scripts/lib/transformers/ | Build tools | Multi-platform build | 🚫 N/A | Platform-specific builders |

## Assessment

Impeccable is the most comprehensive UI quality toolkit in the upstream catalog. The frontend-design master skill with its 7 reference documents and explicit anti-pattern list is the single strongest individual asset — it provides concrete, opinionated design rules rather than vague guidelines.

### What's Working

The core skill (frontend-design) and the 4 design gate commands (critique, polish, normalize, animate) are well-integrated into `/fh:build`'s visual quality pipeline. These trigger automatically when visual ratio exceeds 40%. Additionally, `audit` and `harden` are now conditionally triggered — build suggests them for frontend-heavy and production frontend work respectively (Phase 3.5).

### What's Underused (Significant Token Cost)

12 of 18 skills are shipped as `/fh:*` commands but never auto-invoked by any pipeline. They're available for manual invocation but realistically see little use. Each adds to the skill description list that Claude loads on session start.

### Honest Assessment: Keep or Prune?

The **manual-only** commands fall into two categories:

**Worth keeping** (valuable when manually invoked, unique capability):
- `clarify` — unique UX writing capability, no overlap
- `distill` — useful design simplification

**Consider pruning from shipped plugin** (rarely invoked, niche):
- `bolder`, `quieter`, `colorize`, `delight` — personality commands for subjective tweaks
- `extract`, `adapt`, `onboard` — design system maintenance, low frequency
- `optimize` — overlaps with vercel-react-best-practices

### Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| ~~High~~ | ~~Wire `audit` into `/fh:build` as optional step for frontend-heavy builds~~ | ✅ **DONE** (Phase 3.5, conditional) |
| ~~Medium~~ | ~~Wire `harden` into `/fh:build` for production-bound frontend features~~ | ✅ **DONE** (Phase 3.5, conditional) |
| **Low** | Evaluate pruning personality commands (bolder/quieter/colorize/delight) from shipped plugin | Reduce token cost on session start |
| **Low** | Keep extract/adapt/onboard as manual commands — niche but no replacement | Available when needed |
