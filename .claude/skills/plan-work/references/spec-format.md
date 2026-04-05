# SPEC.md Format Reference

SPEC.md is a **per-plan artifact** (filename: `XX-NN-SPEC.md`) capturing WHAT and WHY for a single plan.
It is distinct from PLAN.md (HOW) and CONTEXT.md (persistent DECISIONS for the phase).

## Artifact Relationships

```
CONTEXT.md  (per phase)  = persistent DECISIONS — Decisions / Discretion Areas / Deferred Ideas
SPEC.md     (per plan)   = WHAT and WHY for this plan
PLAN.md     (per plan)   = HOW — references spec via `spec:` frontmatter field
```

**Information flow:**

```
Research / Brainstorm
        |
        v
  Decisions discovered ──► CONTEXT.md  (phase-level, lives forever)
        |
        v
    SPEC.md created  (plan-level, scoped to one plan)
        |
        v
    PLAN.md references spec:  (executor uses SPEC for WHAT/WHY, PLAN for HOW)
```

**Graceful degradation:** Simple/routine work does not require a SPEC.md.
A PLAN.md with `spec:` field triggers validation; absence of `spec:` means no SPEC expected.

---

## YAML Frontmatter

```yaml
---
phase: XX-name                 # Phase directory name
plan: NN                       # Plan number this spec belongs to
complexity: medium             # medium | complex
research_confidence: HIGH      # HIGH | MEDIUM | LOW — confidence in the design
weakest_link: "short phrase"   # The single riskiest assumption or unknown
created: YYYY-MM-DD
derived_from:                  # Source artifacts that informed this spec
  - .planning/phases/XX-name/CONTEXT.md
  - .planning/phases/XX-name/XX-NN-PLAN.md
---
```

**Field rules:**
- `complexity: medium` — bounded problem, well-understood domain, <5 files
- `complexity: complex` — cross-cutting, novel patterns, >5 files, or uncertain scope
- `research_confidence: HIGH` — prior art exists, team has done this before
- `research_confidence: MEDIUM` — some unknowns, design requires judgment
- `research_confidence: LOW` — significant unknowns, validate early
- `weakest_link` — one phrase; if you can't name it, do more research

---

## Section Format (smart_unfold queryable)

Each `##` heading is a discrete queryable section. Keep each section self-contained.

---

## Bounded Context

**Purpose:** Define the vocabulary, invariants, and explicit scope boundary.

### Vocabulary
| Term | Definition |
|------|------------|
| `term` | precise definition used in this plan |

### Invariants
Conditions that must remain true throughout execution:
- Invariant 1
- Invariant 2

### Scope Exclusions
What this plan explicitly does NOT do (prevents scope creep):
- Not in scope: X
- Not in scope: Y

---

## Requirements

**Purpose:** Observable, user-facing acceptance criteria. Each criterion must be independently verifiable.

```
AC-01: [observable state after change]
AC-02: [observable state after change]
```

Rules:
- Written as completed facts ("The user can...", "The command outputs...")
- No implementation details
- Each AC traces to a must_haves truth in PLAN.md
- Complex plans: include error-case ACs

---

## Architecture

**Purpose:** Design decisions with evidence, alternatives considered, and epistemic status.

### Decision Record

| Decision | Rationale | Alternatives | CL Tag | Epistemic Status |
|----------|-----------|--------------|--------|-----------------|
| decision | why chosen | what was rejected | `CL-NN` | KNOWN / ASSUMED / UNKNOWN |

**CL Tag:** Cross-link to CONTEXT.md entry if this decision persists beyond this plan.
**Epistemic Status:**
- `KNOWN` — validated by prior art or tests
- `ASSUMED` — reasonable but unvalidated
- `UNKNOWN` — needs a spike or experiment

### Component Map
Brief description of components involved and their responsibilities.

---

## Data Flow

**Purpose:** ASCII diagrams showing all significant execution paths.

### Happy Path
```
Input → Component A → Component B → Output
```

### Nil / Empty Path
```
Input (nil/empty) → Component A → [guard] → early return
```

### Error Path
```
Input → Component A → [error] → Error Handler → error output
```

Add additional paths for any branching of significance.

---

## Failure Modes

**Purpose:** Registry of known failure modes with severity and rescue strategy.

### Failure Registry

| ID | Failure | Trigger | Severity | Detection |
|----|---------|---------|----------|-----------|
| FM-01 | description | what causes it | critical/high/low | how to detect |

### Error / Rescue Map

| Error | Root Cause | Rescue |
|-------|------------|--------|
| `ErrorType` | why it happens | how to handle or mitigate |

---

## Quality Rubrics

**Purpose:** Per-task acceptance criteria across four dimensions.

For each task in PLAN.md, define expected quality bar:

```
Task N: [task name]
  functional:   What correct behavior looks like
  resilience:   How it handles bad input / partial failure
  quality:      Code/content quality bar (DRY, clear errors, etc.)
  testability:  How to verify this task in isolation
```

---

## Open Questions

**Purpose:** Unresolved items that should be answered before or during execution.

| ID | Question | Epistemic Status | Blocking? | Resolution Path |
|----|----------|-----------------|-----------|-----------------|
| OQ-01 | question text | UNKNOWN | yes/no | how to resolve |

Epistemic status: `UNKNOWN` (no data), `CONFLICTING` (data disagrees), `PENDING` (awaiting input).

---

## Examples

---

### Example: Medium Complexity (~150 lines)

File: `.planning/phases/24-spec/24-06-SPEC.md`

```markdown
---
phase: 24-spec
plan: 6
complexity: medium
research_confidence: HIGH
weakest_link: "YAML parser handles all frontmatter edge cases"
created: 2026-04-05
derived_from:
  - .planning/phases/24-spec/CONTEXT.md
  - .planning/phases/24-spec/24-06-PLAN.md
---

# Spec: SPEC.md Format Definition

## Bounded Context

### Vocabulary
| Term | Definition |
|------|------------|
| `SPEC.md` | Per-plan artifact describing WHAT and WHY |
| `frontmatter schema` | YAML fields validated by gsd-tools |
| `smart_unfold` | MCP tool that queries individual ## sections |

### Invariants
- SPEC.md never contains HOW (that belongs in PLAN.md)
- SPEC.md is created before PLAN.md execution begins
- Section headings must be exactly `##` (not `###`) for smart_unfold queryability

### Scope Exclusions
- Not in scope: SPEC.md auto-generation
- Not in scope: migrating existing plans to add SPEC.md retroactively

## Requirements

AC-01: `gsd-tools frontmatter validate --schema spec` exits 0 for valid SPEC.md
AC-02: `gsd-tools frontmatter validate --schema spec` prints missing fields for invalid SPEC.md
AC-03: `gsd-tools verify plan-structure` warns (not errors) when PLAN.md has `spec:` field pointing to non-existent file
AC-04: `gsd-tools verify artifacts` treats missing referenced SPEC.md as a failed artifact check

## Architecture

### Decision Record

| Decision | Rationale | Alternatives | CL Tag | Epistemic Status |
|----------|-----------|--------------|--------|-----------------|
| SPEC.md is optional | Simple plans don't need overhead | Required for all plans | — | KNOWN |
| `spec:` field in PLAN.md triggers validation | Zero-cost for plans without spec | Separate manifest | — | ASSUMED |
| 7 fixed sections | Covers all queryable domains | Freeform sections | — | ASSUMED |

### Component Map
- `bin/lib/frontmatter.cjs` — adds `spec` schema to FRONTMATTER_SCHEMAS
- `bin/lib/verify.cjs` — adds spec-existence check in plan-structure and artifacts

## Data Flow

### Happy Path
```
PLAN.md with spec: 24-06-SPEC.md
  → verify plan-structure
  → extract frontmatter.spec field
  → resolve path relative to plan file
  → check file exists
  → pass
```

### Nil Path (no spec field)
```
PLAN.md without spec: field
  → verify plan-structure
  → spec field absent
  → skip spec check
  → pass
```

### Error Path
```
PLAN.md with spec: 24-06-SPEC.md (file missing)
  → verify plan-structure
  → extract frontmatter.spec field
  → resolve path
  → file not found
  → warning: "spec file referenced but not found: 24-06-SPEC.md"
```

## Failure Modes

### Failure Registry

| ID | Failure | Trigger | Severity | Detection |
|----|---------|---------|----------|-----------|
| FM-01 | YAML parse fails on spec frontmatter | Non-standard YAML values | low | validate --schema spec returns error |
| FM-02 | spec: path uses wrong relative base | Path resolved from cwd not plan dir | low | verify plan-structure warning |

### Error / Rescue Map

| Error | Root Cause | Rescue |
|-------|------------|--------|
| `Missing required field: weakest_link` | Author skipped it | Add weakest_link to SPEC.md frontmatter |
| `spec file referenced but not found` | SPEC.md not yet created | Create SPEC.md before running verify |

## Quality Rubrics

```
Task 1: Create spec-format.md
  functional:   Contains all 7 sections with ## headings; frontmatter schema documented
  resilience:   Examples cover both medium and complex cases
  quality:      Each section is self-contained and scannable
  testability:  Grep for "## Bounded Context", "## Requirements", etc.

Task 2: Add gsd-tools awareness
  functional:   validate --schema spec exits 0 for valid, 1 for invalid
  resilience:   Missing file returns clear error, not stack trace
  quality:      Error messages name the missing field specifically
  testability:  node bin/gsd-tools.cjs frontmatter validate test.md --schema spec
```

## Open Questions

| ID | Question | Epistemic Status | Blocking? | Resolution Path |
|----|----------|-----------------|-----------|-----------------|
| OQ-01 | Should spec: path be relative to plan file or project root? | UNKNOWN | no | Convention: relative to phase directory |
```

---

### Example: Complex Complexity (~300 lines)

File: `.planning/phases/25-search/25-03-SPEC.md`

```markdown
---
phase: 25-search
plan: 3
complexity: complex
research_confidence: MEDIUM
weakest_link: "token budget for smart_unfold across large SPEC.md files"
created: 2026-04-05
derived_from:
  - .planning/phases/25-search/CONTEXT.md
  - .planning/phases/25-search/25-03-PLAN.md
  - upstream/gsd-1.30.0/agents/implementer.md
---

# Spec: Smart Search Integration

## Bounded Context

### Vocabulary
| Term | Definition |
|------|------------|
| `smart_unfold` | MCP tool that loads a section of a markdown file by heading |
| `token budget` | Maximum tokens an LLM context window can hold |
| `section index` | List of ## headings in a file used to select sections |
| `query` | The heading string passed to smart_unfold |
| `full-load` | Loading entire file content (fallback when smart_unfold unavailable) |

### Invariants
- Section headings must be `##` level — deeper nesting is not top-level queryable
- Section content must be self-contained (no dangling references to prior sections)
- smart_unfold availability is not guaranteed — full-load must always work
- Heading text must be stable across edits (heading renames break saved queries)

### Scope Exclusions
- Not in scope: smart_unfold server implementation
- Not in scope: cross-file section linking
- Not in scope: section versioning or diffing
- Not in scope: automatic section discovery (caller must know heading name)

## Requirements

AC-01: Each ## section in SPEC.md can be independently loaded via smart_unfold without losing meaning
AC-02: The section index (list of headings) can be extracted without loading full content
AC-03: A SPEC.md with missing smart_unfold still works via full file read
AC-04: Headings in SPEC.md do not change between plan creation and execution (stable query keys)
AC-05: Error sections contain both the failure description AND the rescue path in one section load
AC-06: Data Flow section contains all significant execution paths in one section load

## Architecture

### Decision Record

| Decision | Rationale | Alternatives | CL Tag | Epistemic Status |
|----------|-----------|--------------|--------|-----------------|
| Fixed 7 sections | Stable query keys, predictable structure | Dynamic sections | `CL-14` | ASSUMED |
| ## heading level only | smart_unfold queries ## not ### | Allow any heading | — | KNOWN |
| Self-contained sections | Avoids partial-load confusion | Cross-references OK | — | ASSUMED |
| ASCII diagrams in Data Flow | Universally renderable | Mermaid/graphviz | — | KNOWN |
| Failure Modes split: registry + error map | Registry = discovery, map = action | Single table | — | ASSUMED |

**CL-14:** Section stability decision recorded in CONTEXT.md Decisions.

### Component Map

```
SPEC.md file
  ├── Frontmatter (gsd-tools validates)
  ├── ## Bounded Context   (scope and vocabulary)
  ├── ## Requirements      (ACs, traces to must_haves)
  ├── ## Architecture      (decisions, CL tags)
  ├── ## Data Flow         (execution paths, ASCII)
  ├── ## Failure Modes     (registry + error map)
  ├── ## Quality Rubrics   (per-task quality bar)
  └── ## Open Questions    (unknowns with epistemic status)

smart_unfold query flow:
  caller → "## Data Flow" → MCP loads section content → caller uses without full file
```

## Data Flow

### Happy Path: smart_unfold query
```
caller: smart_unfold("## Data Flow", "25-03-SPEC.md")
  → MCP locates file
  → finds ## Data Flow heading
  → extracts content until next ## heading
  → returns section text
  → caller has data flow context without loading 300-line file
```

### Nil Path: section not found
```
caller: smart_unfold("## Missing Section", "25-03-SPEC.md")
  → MCP locates file
  → scans headings
  → heading not found
  → returns error or empty
  → caller falls back to full file load
```

### Empty Path: section present but empty
```
caller: smart_unfold("## Open Questions", "25-03-SPEC.md")
  → section found with no table rows
  → returns heading + empty table
  → caller interprets as "no open questions" — valid state
```

### Error Path: file not found
```
caller: smart_unfold("## Requirements", "25-99-SPEC.md")
  → MCP cannot locate file
  → returns file-not-found error
  → caller logs: "SPEC not found, proceeding with PLAN.md only"
```

### Error Path: malformed section
```
SPEC.md with ### subheadings under ## Requirements
  → smart_unfold("## Requirements") loads until next ##
  → subheadings included in section content
  → caller receives full nested content — no data loss, minor verbosity
```

## Failure Modes

### Failure Registry

| ID | Failure | Trigger | Severity | Detection |
|----|---------|---------|----------|-----------|
| FM-01 | Token budget exceeded | Large SPEC.md loaded in full | high | LLM context error or truncation |
| FM-02 | Stale heading query | Heading renamed after query saved | medium | smart_unfold returns not-found |
| FM-03 | Section references prior section | Author writes "as above" | low | Content review |
| FM-04 | Missing Bounded Context | Author skips vocabulary | low | validate --schema spec (structural check) |
| FM-05 | Frontmatter field missing | Author omits weakest_link | medium | gsd-tools validate --schema spec |

### Error / Rescue Map

| Error | Root Cause | Rescue |
|-------|------------|--------|
| `section not found` | Heading renamed or typo | Check available headings via section index |
| `file not found` | SPEC not created yet | Create SPEC.md before running verify |
| `token budget exceeded` | SPEC too large for full load | Use smart_unfold to load individual sections |
| `Missing required field: weakest_link` | Author skipped it | Identify the riskiest assumption; write it |
| Section content references "previous section" | Author assumption | Rewrite to be self-contained |

## Quality Rubrics

```
Task 1: Define SPEC.md format
  functional:   spec-format.md documents all 7 sections with correct ## headings
  resilience:   Examples cover both medium and complex plans
  quality:      Each section definition is ≤30 lines and scannable
  testability:  grep -c "^## " spec-format.md returns 7

Task 2: Document artifact relationships
  functional:   Relationship table maps CONTEXT/SPEC/PLAN to their roles
  resilience:   Graceful degradation path documented (no SPEC = no check)
  quality:      Flow diagram shows where decisions go
  testability:  Section "Artifact Relationships" present in spec-format.md

Task 3: gsd-tools SPEC.md awareness
  functional:   validate --schema spec checks all 6 required frontmatter fields
  resilience:   Missing spec file → warning not error in plan-structure
  quality:      Error messages cite the specific missing field by name
  testability:  node bin/gsd-tools.cjs frontmatter validate --schema spec <file>
                node bin/gsd-tools.cjs verify plan-structure <plan-with-spec-field>

Task 4: Evals (skipped per plan instructions)
```

## Open Questions

| ID | Question | Epistemic Status | Blocking? | Resolution Path |
|----|----------|-----------------|-----------|-----------------|
| OQ-01 | Should spec: path be relative to phase dir or project root? | UNKNOWN | no | Convention: relative to phase directory (same as must_haves.artifacts) |
| OQ-02 | Should smart_unfold work on frontmatter section? | UNKNOWN | no | Test with MCP; frontmatter is pre-## so likely excluded |
| OQ-03 | Maximum recommended SPEC.md size before smart_unfold is required? | UNKNOWN | no | Empirical; ~200 lines as initial heuristic |
```
