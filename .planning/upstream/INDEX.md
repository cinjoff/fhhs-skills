# Upstream Capability Index

> Last audit: 2026-03-25 | Sources: 8 | Total capabilities: 120+ | Integration coverage: ~72%

## Source Summary

| # | Source | Version | Type | Overall | Skills/Capabilities | Integrated |
|---|--------|---------|------|---------|--------------------:|----------:|
| 1 | [superpowers](superpowers.md) | 4.3.1 | Engineering discipline | A | 14 | 14 (100%) |
| 2 | [impeccable](impeccable.md) | 1.2.0 | Design quality | A | 18 | 18 (100%) |
| 3 | [gsd](gsd.md) | 1.22.4 | Project execution | A | 12 agents + 27 workflows | ~60% |
| 4 | [gstack](gstack.md) | 0.3.3 | Production safety | B+ | 10 | 3 (~30%) |
| 5 | [feature-dev](feature-dev.md) | 55b58ec6 | Feature workflow | B | 1 workflow + 3 agents | 3 (100%) |
| 6 | [claude-md-management](claude-md-management.md) | 1.0.0 | Knowledge mgmt | B | 1 | 1 (100%) |
| 7 | [playwright-best-practices](playwright-best-practices.md) | b4b0fd3c | Testing reference | A | 1 + 35 refs | 1 (100%) |
| 8 | [vercel-react-best-practices](vercel-react-best-practices.md) | 64bee5b7 | Performance rules | B+ | 1 + 58 rules | 1 (100%) |

---

## SDLC Coverage Matrix

Maps which upstream sources cover each SDLC phase and how fhhs exposes them.

| SDLC Phase | superpowers | impeccable | gsd | gstack | feature-dev | claude-md | playwright | vercel-react | fhhs Exposure |
|------------|:-----------:|:----------:|:---:|:------:|:-----------:|:---------:|:----------:|:------------:|---------------|
| Discovery | | | ✅ | | ✅ | | | | /fh:research, agents |
| Planning | ✅ | | ✅ | ✅ | | | | | /fh:plan-work, /fh:plan-review |
| Design | | ✅ | | | ✅ | | | | /fh:ui-redesign, /fh:ui-branding |
| Building | ✅ | | ✅ | | | | | | /fh:build, /fh:quick |
| Testing | ✅ | ✅ | | ✅ | | | ✅ | | /fh:ui-test, /fh:playwright-testing |
| Review | ✅ | ✅ | | ✅ | ✅ | | | ✅ | /fh:review, /fh:ui-critique |
| Debugging | ✅ | | ✅ | | | | | | /fh:fix (internal skills) |
| Verification | ✅ | | ✅ | | | | | | /fh:build (spec gate) |
| Integration | ✅ | | ✅ | | | | | | /fh:build (branch finishing) |
| Deploy | | | | ✅ | | | | | ⬜ Not exposed |
| Performance | | ✅ | | | | | | ✅ | /fh:nextjs-perf, /fh:optimize |
| Knowledge | | | | | | ✅ | | | /fh:revise-claude-md |
| Meta/Setup | ✅ | ✅ | ✅ | | | | | | /fh:setup, /fh:settings |

---

## Subagent Dispatch Matrix

Which `/fh:*` skills dispatch which agents via the Task tool.

| /fh: Skill | Agents Dispatched | Source |
|------------|-------------------|--------|
| /fh:build | gsd-planner, gsd-executor, gsd-verifier, gsd-plan-checker | gsd |
| /fh:build | code-reviewer (spec gate) | superpowers |
| /fh:plan-work | gsd-planner, gsd-plan-checker | gsd |
| /fh:fix | gsd-debugger | gsd |
| /fh:research | gsd-phase-researcher, gsd-project-researcher, gsd-research-synthesizer | gsd |
| /fh:map-codebase | gsd-codebase-mapper | gsd |
| /fh:review | code-reviewer | feature-dev, superpowers |
| /fh:progress | (reads state, no agent dispatch) | gsd |
| /fh:health | (reads state, no agent dispatch) | gsd |
| /fh:quick | gsd-executor | gsd |
| /fh:ui-redesign | code-explorer, code-architect | feature-dev |

---

## Command Exposure Map

GSD workflows mapped to their `/fh:*` equivalents or internal use.

| GSD Command | fhhs Equivalent | Status |
|-------------|-----------------|--------|
| new-project | /fh:new-project | ✅ Direct |
| plan-phase | /fh:plan-work | ✅ Direct |
| execute-phase | /fh:build | ✅ Composite |
| verify-work | (internal to /fh:build) | 🔀 Internal |
| verify-phase | (internal to /fh:build) | 🔀 Internal |
| progress | /fh:progress | ✅ Direct |
| health | /fh:health | ✅ Direct |
| quick | /fh:quick | ✅ Direct |
| settings | /fh:settings | ✅ Direct |
| set-profile | /fh:settings | ✅ Merged |
| map-codebase | /fh:map-codebase | ✅ Direct |
| add-todo | /fh:todos | ✅ Merged |
| check-todos | /fh:todos | ✅ Merged |
| discuss-phase | (absorbed into /fh:plan-work) | 🔀 Absorbed |
| research-phase | /fh:research | 🔀 Absorbed |
| discovery-phase | /fh:research | 🔀 Absorbed |
| resume-project | (via /fh:progress) | 🔀 Partial |
| execute-plan | (internal to /fh:build) | 🔀 Internal |
| validate-phase | — | ⬜ Not exposed |
| pause-work | — | ⬜ Not exposed |
| new-milestone | — | ⬜ Not exposed |
| complete-milestone | — | ⬜ Not exposed |
| audit-milestone | — | ⬜ Not exposed |
| add-phase | — | ⬜ Not exposed |
| insert-phase | — | ⬜ Not exposed |
| remove-phase | — | ⬜ Not exposed |
| add-tests | — | ⬜ Not exposed |
| diagnose-issues | — | ⬜ Not exposed |
| plan-milestone-gaps | — | ⬜ Not exposed |
| list-phase-assumptions | — | ⬜ Not exposed |

---

## Gap Registry

Capabilities available upstream but not yet integrated into fhhs.

| ID | Capability | Source | SDLC Phase | Priority | Notes |
|----|-----------|--------|------------|----------|-------|
| G1 | plan-eng-review | gstack | Planning | High | CEO review exists (/fh:plan-review), eng review does not |
| G2 | ship (deploy automation) | gstack | Deploy | Medium | No deploy phase coverage at all in fhhs |
| G3 | retro (retrospective) | gstack | Retro | Medium | Post-project learning loop missing |
| G4 | browse (browser testing) | gstack | Testing | Low | Heavy dependency (Playwright runtime), questionable ROI |
| G5 | pause-work / resume | gsd | State | Low | State persistence across sessions partially handled by /fh:progress |
| G6 | milestone management | gsd | Planning | Low | new/complete/audit-milestone — multi-milestone projects rare |
| G7 | phase CRUD (add/insert/remove) | gsd | Planning | Low | Plan mutation during execution — edge case |
| G8 | add-tests | gsd | Testing | Medium | Explicit test addition workflow not surfaced |
| G9 | diagnose-issues | gsd | Debugging | Low | Overlaps with /fh:fix + systematic-debugging |
| G10 | validate-phase | gsd | Planning | Low | Pre-execution validation, partially in plan-checker |
| G11 | gsd-nyquist-auditor | gsd | Testing | Low | Test coverage auditor — integrated but unused |

---

## Integration Log

| Date | Action | Details |
|------|--------|---------|
| 2026-03-25 | Initial index created | Full catalog of 8 upstream sources |
