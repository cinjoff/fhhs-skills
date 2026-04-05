# Spec Creation Process

SPEC.md captures WHAT and WHY for a single plan. This reference defines how to create one based on complexity.

See @references/spec-format.md for the output format.

---

## Complexity Routing

| Complexity | Process | Agent Dispatch |
|------------|---------|----------------|
| **Simple** | Skip — no SPEC.md | None |
| **Medium** | Streamlined inline | None |
| **Complex** | Full 5-step process | spec-architect agent (Step C) |

---

## Complex: Full 5-Step Process

Adapted from CEK SDD phases: Code Explorer → Business Analyst → Architect → QA Engineer → Verification.

### Step A: Bounded Context Init
_CEK equivalent: Code Explorer_

Derive vocabulary, invariants, and scope exclusions from three sources:
1. **`.planning/PROJECT.md`** — project domain terms and goals
2. **`.planning/REQUIREMENTS.md`** + phase ROADMAP entry — what this plan must deliver
3. **Codebase mapping** — check `@.planning/codebase/ARCHITECTURE.md`, `@.planning/codebase/CONVENTIONS.md` for existing terms and boundaries

Output (draft into SPEC.md `## Bounded Context`):
- **Vocabulary table:** terms that have precise meaning in this plan
- **Invariants:** conditions that must remain true throughout execution
- **Scope Exclusions:** explicit out-of-scope items to prevent creep

### Step B: Requirements Synthesis
_CEK equivalent: Business Analyst_

Derive observable acceptance criteria from:
1. **Brainstorm / design doc** (`.planning/designs/`) — approved design decisions
2. **RESEARCH.md** (if exists) — technical constraints that affect behavior
3. **Phase must_haves** from Step 4 of plan-work

Output (draft into SPEC.md `## Requirements`):
- AC-NN statements written as completed facts: "The user can...", "The command outputs..."
- No implementation details — observable states only
- For complex plans: include error-case ACs

### Step C: Architecture Synthesis
_CEK equivalent: Architect_

**Dispatch spec-architect agent** (see `@agents/spec-architect.md`) with:
```
bounded_context: <Step A output>
research_md: <path to RESEARCH.md or "none">
design_doc: <path to approved design or "none">
phase_goals: <ROADMAP entry for this phase>
output_path: <.planning/phases/XX-name/XX-NN-SPEC.md>
```

The agent produces `## Architecture`, `## Data Flow`, and `## Failure Modes` sections.

Merge agent output into the SPEC.md being built.

### Step D: Quality Rubric Generation
_CEK equivalent: QA Engineer_

For **each task** in the planned PLAN.md, define a quality rubric across 4 dimensions:

| Dimension | Question to Answer |
|-----------|-------------------|
| **Functional** | What does correct behavior look like for this task? |
| **Resilience** | How does it handle bad input, missing data, or partial failure? |
| **Quality** | What is the code/content quality bar? (DRY, clear errors, naming) |
| **Testability** | How can this task be verified in isolation? |

**Format in SPEC.md `## Quality Rubrics`:**
```
Task N: [task name]
  functional:   What correct behavior looks like
  resilience:   How it handles bad input / partial failure
  quality:      Code/content quality bar (DRY, clear errors, etc.)
  testability:  How to verify this task in isolation
```

**Consumers of Quality Rubrics:**
- **`/fh:build`** — executor reads rubrics before starting each task to calibrate effort
- **`/fh:plan-review`** — reviewer checks rubrics against the plan's done criteria
- **`/fh:reflect`** — retro compares actual outcome against rubric expectations

For complex plans: define rubrics for all tasks.

### Step E: Consistency Check
_CEK equivalent: Verification_

Verify coverage before finalizing SPEC.md:

- [ ] Every AC in `## Requirements` traces to at least one task in PLAN.md
- [ ] Every task in PLAN.md has a rubric in `## Quality Rubrics`
- [ ] Every failure in `## Failure Modes` has a corresponding AC or must_haves truth
- [ ] Vocabulary terms in `## Bounded Context` are used consistently throughout
- [ ] Scope exclusions prevent at least one plausible scope creep scenario

Fix gaps before proceeding to plan creation.

---

## Medium: Streamlined Process

No agent dispatch. Execute inline.

**Steps A+B combined:**
- Scan codebase briefly (Glob/Grep key areas, ~5 min)
- Extract vocabulary from PROJECT.md + phase description
- Write Bounded Context (vocabulary + invariants + 2-3 scope exclusions)
- Write Requirements (3-5 ACs for the core behaviors)

**Step C inline:**
- Write Architecture section directly: key decisions with rationale, component map
- Write Data Flow: happy path + 1 error path
- Write Failure Modes: top 2-3 risks only

**Step D for critical tasks only:**
- Identify the 1-2 tasks with the highest failure risk
- Write rubrics for those tasks; omit rubrics for routine tasks

**Step E light check:**
- Verify: every AC has a corresponding task, every critical task has a rubric

---

## Output

**File path:** `.planning/phases/XX-name/XX-NN-SPEC.md`

See @references/spec-format.md for full section format, YAML frontmatter schema, and examples.
