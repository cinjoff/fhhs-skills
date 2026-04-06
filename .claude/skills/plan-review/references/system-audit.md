# PRE-REVIEW System Audit

Before doing anything else, run a system audit. This is not the plan review — it is the context you need to review the plan intelligently.

## Phase Context Check

Use `smart_search` to check for prior planning context:
`mcp__plugin_claude-mem_mcp-search__smart_search` with query="project vision architecture patterns", project=<project-name>

Use returned observations to supplement your review context. Also read `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/DESIGN.md`, `.planning/codebase/` files, and `.planning/research/*.md` as needed.

Run the following commands:
```bash
git log --oneline -30                          # Recent history
git diff main --stat                           # What's already changed
git stash list                                 # Any stashed work
```

Then read relevant project docs. Map:
* What is the current system state?
* What is already in flight (other open PRs, branches, stashed changes)?
* What are the existing known pain points most relevant to this plan?
* Are there any FIXME/TODO comments in files this plan touches?

## Retrospective Check
Check the git log for this branch. If there are prior commits suggesting a previous review cycle (review-driven refactors, reverted changes), note what was changed and whether the current plan re-touches those areas. Be MORE aggressive reviewing areas that were previously problematic. Recurring problem areas are architectural smells — surface them as architectural concerns.

## Load Phase Context
Read `.planning/phases/{phase}/{phase}-CONTEXT.md` if it exists.
This contains decisions from plan-work's discussion phase.

**Respect-but-flag protocol for locked decisions:**
- Default: respect decisions. Do NOT suggest alternatives.
- Exception: if during review you find evidence that a decision causes
  a problem (research contradicts it, architecture review reveals a flaw,
  security concern), you MAY surface it as:
  "Decision concern: [decision X] was locked in planning, but [evidence Y]
  suggests reconsidering. Confirm or unlock for revision?"
- Present as an AskUserQuestion with options: Keep decision / Revise.
- If user keeps it, move on. Do not revisit.

## DECISIONS.md Cross-Check
If `.planning/DECISIONS.md` exists, read it. Filter entries for the current phase (by Phase field matching the phase directory name, plus Phase='project'). Cross-reference each decision against CONTEXT.md's Decisions section:
- Flag as BLOCKING any decision in DECISIONS.md that is not reflected in CONTEXT.md
- Flag as BLOCKING any CONTEXT.md locked decision that contradicts a DECISIONS.md entry
- Note discrepancies in the System Audit report

Skip this check silently if `.planning/DECISIONS.md` does not exist (non-auto-mode projects won't have it).

## Research Alignment Check
Check if `.planning/phases/{phase}/{phase}-RESEARCH.md` exists.
If it does, read it and verify during the review that:
- The plan uses the recommended stack from research (or documents why not)
- The plan addresses pitfalls identified in research (Common Pitfalls section)
- The plan doesn't hand-roll solutions for problems listed in "Don't Hand-Roll"
- LOW confidence findings from research are handled with appropriate caution
If misalignment is found, surface it as an issue during Architecture Review (Section 1).

## Claude-Mem Acceleration

Use `smart_search` for targeted queries before reading files directly:
- `smart_search` with query="locked decisions for phase {phase}", project=<project-name>
- `smart_search` with query="research pitfalls for {topic}", project=<project-name>
- `smart_search` with query="design context", project=<project-name>

claude-mem observations persist across sessions, so prior plan-work context is automatically available.

## Past Learnings Check

Follow **Pattern A** (Past Learnings Check) from `@.claude/skills/shared/claude-mem-rules.md`. Keywords: phase name + "architecture" or "decision". Present as "**Prior decisions relevant to this review:**". Cross-reference with locked decisions in CONTEXT.md — flag contradictions.

## Taste Calibration (EXPANSION mode only)
Read `.planning/DESIGN.md` for the project's design context and taste references. Use it to calibrate your recommendations — align with established design language and patterns rather than discovering them from scratch.

Report findings before proceeding to Step 0.
