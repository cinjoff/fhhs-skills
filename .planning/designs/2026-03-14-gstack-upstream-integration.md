# gstack Upstream Integration — Design Document

**Date:** 2026-03-14
**Status:** Approved
**Scope:** Upstream gstack (garrytan/gstack) as 8th upstream source, incorporate all skills except `/retro`, adapt to fhhs conventions, use agent-browser instead of gstack's compiled browse binary.

---

## Design Decisions

### D1: Upstream Scope
- **Include:** plan-ceo-review, plan-eng-review, review (checklist), ship, qa, setup-browser-cookies patterns
- **Exclude:** retro (user decision), gstack-upgrade (plugin marketplace handles this), browse binary (agent-browser is richer)
- **Rationale:** Focus on cognitive mode skills and workflow patterns. Browser tool already solved.

### D2: Skill Mapping
| gstack Skill | fhhs Action | Rationale |
|---|---|---|
| `/plan-ceo-review` | NEW: `/fh:plan-review` | Distinct cognitive mode (challenge ≠ create). Fills gap between plan and build. |
| `/plan-eng-review` | ENHANCE: `/fh:plan-work` Step 3 | Eng review patterns (diagrams, failure modes, test matrices) strengthen existing discuss-implementation step. |
| `/review` | ENHANCE: `/fh:review` + new checklist reference | Absorb checklist approach + suppressions. Production safety categories fold into security scanner. |
| `/ship` | ENHANCE: `/release` | Add pre-ship validation (tests, review check, bisectable commits). Keep semver + dual-JSON. |
| `/qa` | NEW: `/fh:qa` | Diff-aware testing with health scoring. Uses agent-browser. |
| `/browse` | SKIP | agent-browser already installed, richer feature set. |
| `/setup-browser-cookies` | ABSORB into `/fh:qa` | Cookie/auth handling as a qa sub-workflow, not standalone skill. |

### D3: Novel Pattern Integration
Absorb these cross-cutting patterns into existing skills:
1. **AskUserQuestion discipline** → plan-work, plan-review, review
2. **Anti-drift rules** → plan-work, plan-review
3. **Priority hierarchies** → build, plan-work, review
4. **Suppressions** → review checklist, secure
5. **Error/Rescue Map** → plan-work Step 3
6. **Failure Modes Registry** → plan-work Step 4

### D4: Browser Strategy
- Use `agent-browser` CLI as the browser backend for `/fh:qa`
- Reference agent-browser's commands directly (same @ref system as gstack)
- No compiled binary dependency — agent-browser handles installation
- Session management via `--session` flag for parallel instances

### D5: Eval Coverage
- New evals for: plan-review, qa (diff-aware, full, quick modes)
- Enhanced evals for: review (checklist adherence, suppressions), plan-work (failure modes, diagrams)
- Eval methodology: match existing evals.json format with semantic assertions
