# Upstream Capability Index

> Last audit: 2026-03-25 (deep) | Sources: 8 | Total capabilities: ~80 distinct | Active in pipelines: ~21 | Dead weight: ~47

## Source Summary

| # | Source | Version | Type | Quality | Capabilities | Active | Dead |
|---|--------|---------|------|---------|-------------:|-------:|-----:|
| 1 | [superpowers](superpowers.md) | 4.3.1 | Engineering discipline | A | 14 skills | 7 | 4 |
| 2 | [impeccable](impeccable.md) | 1.2.0 | Design quality | A | 18 skills | 5+2c | 10 |
| 3 | [gsd](gsd.md) | 1.22.4 | Project execution | A | 12 agents + 34 workflows | ~9+1c | ~36 |
| 4 | [gstack](gstack.md) | 0.3.3 | Production safety | B+ | 10 skills | 2 | 6 |
| 5 | [feature-dev](feature-dev.md) | 55b58ec6 | Feature workflow | B | 1 workflow + 3 agents | 3 | 0 |
| 6 | [claude-md-management](claude-md-management.md) | 1.0.0 | Knowledge mgmt | B | 1 skill + 3 refs | 1 | 0 |
| 7 | [playwright-best-practices](playwright-best-practices.md) | b4b0fd3c | Testing reference | A | 1 skill + 35 refs | 1 | 0 |
| 8 | [vercel-react-best-practices](vercel-react-best-practices.md) | 64bee5b7 | Performance rules | B+ | 1 skill + 58 rules | 0 | 1 |

---

## Pipeline Usage Reality

### Actively Wired (triggered in normal workflow)

| Capability | Source | Used by | What it does |
|-----------|--------|---------|-------------|
| brainstorming | Superpowers | /fh:plan-work | Socratic design dialogue before coding |
| test-driven-development | Superpowers | /fh:build, /fh:fix | RED-GREEN-REFACTOR enforcement |
| systematic-debugging | Superpowers | /fh:fix | 4-phase root cause methodology |
| simplify | Superpowers | /fh:build, /fh:fix, /fh:refactor | Post-implementation code review |
| dispatching-parallel-agents | Superpowers | /fh:build | Parallel subagent dispatch |
| frontend-design | Impeccable | /fh:build, /fh:fix | Design quality with anti-patterns |
| code-explorer/architect/reviewer | Feature-dev | /fh:build, /fh:review | Exploration, design, review agents |
| gsd-planner | GSD | /fh:plan-work, /fh:build | Goal-backward planning |
| gsd-executor | GSD | /fh:build, /fh:quick | Atomic execution with deviation handling |
| gsd-plan-checker | GSD | /fh:plan-work | Plan quality gate |
| gsd-roadmapper | GSD | /fh:new-project | Roadmap from requirements |
| gsd-codebase-mapper | GSD | /fh:map-codebase | Codebase documentation |
| claude-md-improver | claude-md-mgmt | /fh:revise-claude-md | CLAUDE.md quality auditing |
| plan-ceo-review | gstack | /fh:plan-review | Business alignment review |
| plan-eng-review | gstack | /fh:plan-review | Engineering risk review (always-on alongside CEO review) |
| verification-before-completion | Superpowers | /fh:build Step 5, /fh:fix Step 4 | Evidence-before-claims verification gate |
| discuss-phase (decision-locking) | GSD | /fh:plan-work Step 3 | CONTEXT.md with locked/discretion/deferred decisions |

### Conditionally Triggered (under specific conditions)

| Capability | Source | Trigger condition |
|-----------|--------|-------------------|
| ui-critique, polish, normalize, animate | Impeccable | Build design gates (visual ratio > 40%) |
| playwright-testing | Playwright | Interactive features in build/fix/plan |
| finishing-a-development-branch | Superpowers | Post-review branch promotion |
| audit | Impeccable | Build suggests /fh:audit for frontend-heavy work |
| harden | Impeccable | Build suggests /fh:harden for production frontend |
| gsd-phase-researcher | GSD | plan-work suggests deep research for complex tasks |

### High-Value Gaps (should be wired)

| Capability | Source | Why it matters | Recommended integration |
|-----------|--------|---------------|------------------------|
| **gsd-verifier** | GSD | Goal-backward verification (exists → substantive → wired) catches incomplete work | Wire into /fh:build completion |
| **receiving-code-review** | Superpowers | Anti-performative-agreement discipline | Wire into /fh:review for external feedback |

---

## SDLC Coverage Matrix

| SDLC Phase | superpowers | impeccable | gsd | gstack | feature-dev | claude-md | playwright | vercel-react | fhhs Exposure |
|------------|:-----------:|:----------:|:---:|:------:|:-----------:|:---------:|:----------:|:------------:|---------------|
| Discovery | | | ✅ | | ✅ | | | | /fh:research, agents |
| Planning | ✅ | | ✅ | ✅ | | | | | /fh:plan-work, /fh:plan-review |
| Design | | ✅ | | | ✅ | | | | /fh:ui-redesign, /fh:ui-branding |
| Building | ✅ | | ✅ | | | | | | /fh:build, /fh:quick |
| Testing | ✅ | ✅ | | ✅ | | | ✅ | | /fh:ui-test, /fh:playwright-testing |
| Review | ✅ | ✅ | | ✅ | ✅ | | | ✅ | /fh:review, /fh:ui-critique |
| Debugging | ✅ | | ✅ | | | | | | /fh:fix (internal skills) |
| Verification | ✅ | | ✅ ⚠️ | | | | | | verification-before-completion wired in build/fix |
| Integration | ✅ | | ✅ | | | | | | /fh:build (branch finishing) |
| Deploy | | | | ✅ | | | | | ⬜ Not exposed |
| Performance | | ✅ | | | | | | ✅ | /fh:nextjs-perf, /fh:optimize |
| Knowledge | | | | | | ✅ | | | /fh:revise-claude-md |
| Meta/Setup | ✅ | ✅ | ✅ | | | | | | /fh:setup, /fh:settings |

---

## Subagent Dispatch Matrix

| /fh: Skill | Agents Dispatched | Source | Status |
|------------|-------------------|--------|--------|
| /fh:build | gsd-planner, gsd-executor, gsd-verifier, gsd-plan-checker | gsd | ✅ Active |
| /fh:build | code-reviewer (spec gate) | superpowers | ✅ Active |
| /fh:plan-work | gsd-planner, gsd-plan-checker | gsd | ✅ Active |
| /fh:fix | gsd-debugger | gsd | ✅ Active |
| /fh:research | gsd-phase-researcher, gsd-project-researcher | gsd | ⚠️ Simplified |
| /fh:map-codebase | gsd-codebase-mapper | gsd | ✅ Active |
| /fh:review | code-reviewer | feature-dev, superpowers | ✅ Active |
| /fh:quick | gsd-executor | gsd | ✅ Active |

---

## Consolidated Recommendations

### Strengthen /fh:plan-work (HIGH PRIORITY)

`/fh:plan-work` should become smarter about when to involve deeper research and review:

1. **Complexity detection** — Evaluate the task and suggest appropriate depth:
   - Simple (1-3 tasks, familiar domain): brainstorm → plan → go
   - Medium (4-8 tasks): brainstorm → plan → offer plan-review
   - Complex (9+ tasks, unfamiliar domain, architectural decisions): suggest deep research + brainstorm → plan → eng-review + CEO-review

2. **Deep research trigger** — ✅ **DONE (Phase 3.5, conditional)** — plan-work suggests spawning gsd-phase-researcher for complex tasks requiring deep domain investigation

3. **Decision-locking** — ✅ **DONE (Phase 3.5)** — plan-work Step 3 produces CONTEXT.md with locked/discretion/deferred decisions

4. **Engineering review** — ✅ **DONE (Phase 3.5)** — plan-eng-review integrated into /fh:plan-review (always runs both business + engineering)

5. **Codebase exploration** — For unfamiliar codebases, suggest code-explorer dispatch before brainstorming

### Strengthen /fh:new-project (MEDIUM PRIORITY)

6. **Deep research mode** — Offer option to spawn 4 parallel researchers (stack, features, architecture, pitfalls) for projects in unfamiliar domains, using GSD's project-researcher infrastructure

### Wire Verification (HIGH PRIORITY)

7. **verification-before-completion** → ✅ **DONE (Phase 3.5)** — wired into /fh:build Step 5 and /fh:fix Step 4
8. **gsd-verifier** → `/fh:build` completion (goal-backward: did we achieve what the plan said?)

### Wire Design Quality (MEDIUM PRIORITY)

9. **audit** → ✅ **DONE (Phase 3.5, conditional)** — build suggests /fh:audit for frontend-heavy work
10. **harden** → ✅ **DONE (Phase 3.5, conditional)** — build suggests /fh:harden for production frontend

### Consider Pruning (LOW PRIORITY)

11. Evaluate whether shipping 12 dead Impeccable commands (bolder, quieter, colorize, delight, extract, adapt, onboard, distill, optimize, clarify, ui-redesign) is worth the token cost vs manual invocation value

---

## Gap Registry

| ID | Capability | Source | Priority | Status | Notes |
|----|-----------|--------|----------|--------|-------|
| G1 | plan-eng-review | gstack | **High** | ✅ Closed (2026-03-25) | Integrated into /fh:plan-review — always runs both business + engineering |
| G2 | verification-before-completion | superpowers | **High** | ✅ Closed (2026-03-25) | Wired into /fh:build Step 5 and /fh:fix Step 4 |
| G3 | gsd-verifier (goal-backward) | gsd | **High** | ⚠️ Not wired | Should be in build completion |
| G4 | gsd-phase-researcher (deep) | gsd | **High** | ✅ Closed (2026-03-25) | Conditional — plan-work suggests for complex tasks |
| G5 | discuss-phase (decision-locking) | gsd | **High** | ✅ Closed (2026-03-25) | plan-work Step 3 produces CONTEXT.md with locked decisions |
| G6 | audit (design quality) | impeccable | **Medium** | ✅ Closed (2026-03-25) | Conditional — build suggests /fh:audit for frontend-heavy work |
| G7 | harden (production resilience) | impeccable | **Medium** | ✅ Closed (2026-03-25) | Conditional — build suggests /fh:harden for production frontend |
| G8 | receiving-code-review | superpowers | **Medium** | ⬜ Not wired | Wire into review for external feedback |
| G9 | ship (deploy automation) | gstack | Low | ⬜ Available | No deploy phase in fhhs |
| G10 | retro (retrospective) | gstack | Low | ⬜ Available | Post-milestone learning loop |
| G11 | browse (browser testing) | gstack | Low | ⬜ Available | Heavy dependency |
| G12 | milestone management | gsd | Low | ⬜ Available | Edge case for large projects |
| G13 | vercel-react (perf rules) | vercel-react | Low | ⬜ Not wired | Narrow applicability |

---

## Integration Log

| Date | Action | Details |
|------|--------|---------|
| 2026-03-25 | Initial index created | Full catalog of 8 upstream sources |
| 2026-03-25 | **Deep audit** | Pipeline usage analysis: ~15 active, ~12 conditional, ~53 dead. Identified 8 high-value gaps. Recommendations for strengthening plan-work/new-project with deeper research/discussion/review. All per-source docs updated with deep capability descriptions, real usage status, and actionable recommendations. |
| 2026-03-25 | **Phase 3.5 integrations** | Closed 6 gaps: G1 plan-eng-review (active in plan-review), G2 verification-before-completion (active in build/fix), G4 gsd-phase-researcher (conditional in plan-work), G5 discuss-phase decision-locking (active in plan-work), G6 audit (conditional in build), G7 harden (conditional in build). Active ~15→~21, Dead ~53→~47. |
