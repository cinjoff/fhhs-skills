# Reflection Protocol

Post-build reflection gated by plan complexity. Inspired by Self-Refine (2023) and Reflexion (2023) — iterative self-critique as a forcing function for quality.

## Complexity Tiers

### Simple (1-3 tasks, no cross-cutting concerns)

**Skip reflection.** Existing Pattern D `[build-learning]` tags are sufficient. Do not add a `## Reflection` section to SUMMARY.md.

---

### Medium (4-7 tasks, or moderate integration surface)

**Light reflection.** Answer three questions concisely:

1. What went well — which tasks executed smoothly and why?
2. What was harder than expected — where did friction appear?
3. What to do differently — one concrete change for the next plan.

Write **1-2 `[reflection-learning]` observations** using Pattern D format:

```
**[reflection-learning]** {area}: {what was observed} → {what to change}
```

Append a `## Reflection` section to SUMMARY.md with the answers above and the observations.

---

### Complex (8+ tasks, OR architectural changes, OR cross-phase impact)

**Full adversarial reflection.** Dispatch the `reflector` agent (see `@references/reflector-agent.md`).

Provide the agent:
- Path to SUMMARY.md
- Path to SPEC.md (if the plan had a `spec:` field)
- Git diff range: `$WAVE_START_SHA..HEAD`
- Complexity tier: `complex`

The agent returns a structured reflection. Append verbatim as `## Reflection` in SUMMARY.md.

Write **2-3 `[reflection-learning]` observations** from the agent's findings.

---

## Complexity Detection

Evaluate after all waves complete, before Step 7:

```
task_count = number of tasks in the plan
is_architectural = plan description contains: architecture, refactor, extract, migrate, redesign
is_cross_phase = plan modifies files in 2+ planning phases or touches shared/ skills
```

| Condition | Tier |
|-----------|------|
| task_count ≤ 3 AND not architectural AND not cross_phase | simple |
| task_count ≤ 7 AND not architectural AND not cross_phase | medium |
| task_count ≥ 8 OR is_architectural OR is_cross_phase | complex |

---

## Adversarial Framing

For medium and complex tiers, enter the reflection with this stance:

> "Assume this build has problems. Find them before the reviewer does."

Do not start from "what went well." Start from "what could have gone wrong" — then check whether it did.

Bias checklist (complex tier only, but applicable everywhere):

| Bias | Check |
|------|-------|
| **Sycophancy** | Did I accept the first implementation without pushing back on design trade-offs? |
| **Anchoring** | Did early task results anchor later assumptions in ways that weren't re-examined? |
| **Completion bias** | Did I mark tasks complete based on "it runs" rather than "it meets the spec rubrics"? |

---

## Self-Grading (complex tier)

For each task in the plan, locate the relevant SPEC.md Quality Rubric (if SPEC.md exists). Assign a grade:

| Grade | Meaning |
|-------|---------|
| ✓ | Rubric met fully |
| ~ | Rubric partially met — specify what's missing |
| ✗ | Rubric not met — flag as risk |

Any `~` or `✗` grades become `[reflection-learning]` observations.

---

## Recurring Patterns (medium + complex)

Query claude-mem for prior `[reflection-learning]` observations:

```
search({query: "reflection-learning recurring pattern", project, limit: 10})
```

If the same pattern appears in 3+ observations: label it **systemic** in the SUMMARY.md Reflection section. Systemic patterns warrant a follow-up plan task or GitHub issue.

---

## Output Contract

The `## Reflection` section in SUMMARY.md follows this structure:

```markdown
## Reflection

**Complexity tier:** {simple | medium | complex}

### What went well
- {item}

### Friction points
- {item}

### Bias check
- Sycophancy: {clean | flagged: {detail}}
- Anchoring: {clean | flagged: {detail}}
- Completion bias: {clean | flagged: {detail}}

### Self-grades (if SPEC.md present)
| Task | Rubric | Grade | Note |
|------|--------|-------|------|

### Recurring patterns
- {pattern} — {systemic if 3+}

### Observations
**[reflection-learning]** {area}: {observation} → {action}
```

Simple tier: omit this section entirely.
Medium tier: include "What went well", "Friction points", and "Observations". Omit bias check and self-grades.
Complex tier: full section.
