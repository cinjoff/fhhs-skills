# Research Protocol (FPF-lite)

Applies to Step 1 of plan-work. Select the tier based on the complexity assessment from Step 0.5.

---

## Simple tier

Skip research entirely, or inline a quick fact-check (1-2 tool calls, no subagent). No hypothesis diversity, no epistemic tagging, no RESEARCH.md output.

---

## Medium tier

Use the **Inline Research Path** from `research-paths.md` and apply these controls:

**Hypothesis diversity** — before settling on an approach, generate at least 2 competing hypotheses:
- Hypothesis A: [approach], reasoning: [why it could work]
- Hypothesis B: [competing approach], reasoning: [why it could work]

**Epistemic tagging** — tag every key claim in your findings. See `@.claude/skills/shared/epistemic-tags.md`.

**Comparison table** — summarize the top 2-3 approaches in a table before recommending:

| Approach | Pros | Cons | Confidence |
|----------|------|------|------------|
| ...      | ...  | ...  | [tag]      |

Output format: write findings to `XX-RESEARCH.md` using the template below.

---

## Complex tier (FPF-lite)

Use the **Deep Research Path** from `research-paths.md` (spawn `fh:gsd-phase-researcher`). Apply all medium-tier controls plus:

**CL annotation** — every key claim gets a confidence-level tag (see epistemic-tags.md):
- `[CL3-internal]` — grounded in this codebase's actual code/tests
- `[CL2-similar]` — inferred from analogous systems or community patterns
- `[CL1-external]` — sourced from docs, articles, or first-principles reasoning

**Weakest-link principle** — before finalizing the research, identify the single claim with the lowest CL. Explicitly flag it:
> **Weakest link:** [claim] `[CL1-external]` — verify before committing to this approach.

**Bounded context initialization** — at the start of the research subagent prompt, enumerate exactly which files to read (no open-ended "explore everything"). Pass the file list explicitly in `<files_to_read>` so the agent anchors to known structure.

---

## RESEARCH.md Template

```markdown
# Research: [Phase name]

**Tier:** [medium | complex]
**Date:** YYYY-MM-DD

## Findings

### [Finding 1 title]
[Summary] [CL-tag]

Details: ...

### [Finding 2 title]
...

## Approach Comparison

| Approach | Pros | Cons | Confidence |
|----------|------|------|------------|
| ...      |      |      |            |

## Recommendation

[Chosen approach and rationale] [epistemic tag]

## Weakest Link (complex tier only)

**[Claim]** `[CL1-external]` — action needed before committing: [verification step]

## Open Questions

- [ ] [Question that should be resolved in brainstorm or gray-area discussion]
```

---

## Examples

### Example A — Medium tier (library selection)

**Task:** Choose between two state-management libraries for a React app.

Hypothesis A: Use Zustand — lightweight, no boilerplate, fits the team's existing patterns. `[reasoned]`
Hypothesis B: Use Redux Toolkit — more familiar to the team, better DevTools, but heavier. `[reasoned]`

Comparison table:

| Approach | Pros | Cons | Confidence |
|----------|------|------|------------|
| Zustand | 2 KB, minimal boilerplate | Less familiar, smaller ecosystem | `[reasoned]` |
| Redux Toolkit | Team familiarity, DevTools | 13 KB, verbose setup | `[tested]` |

Recommendation: Zustand — the codebase already avoids heavy dependencies. `[CL2-similar]`

---

### Example B — Complex tier (new data pipeline)

**Task:** Design an async job queue for background image processing.

Bounded context initialization — files passed to subagent:
- `src/lib/queue/` (existing queue patterns)
- `src/workers/` (existing worker patterns)
- `.planning/phases/12-images/12-CONTEXT.md`

CL annotations on key claims:
- "Bull MQ handles priority queues without a separate scheduler" `[CL2-similar]`
- "Our Redis instance supports Streams (v6.2+)" `[CL3-internal]` — verified from `docker-compose.yml`
- "BullMQ's stalled-job detection fires within 30 s by default" `[CL1-external]` — from BullMQ docs

Weakest link: "BullMQ stalled-job detection fires within 30 s" `[CL1-external]` — load-test to confirm before committing to the 60 s SLA.
