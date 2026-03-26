# DECISIONS.md Template and Format Specification

This reference defines the format for `.planning/DECISIONS.md` — the append-only
decision journal used across all planning and build skills.

---

## File Format

### Frontmatter

```yaml
---
type: decisions
project: {name}
created: {YYYY-MM-DD}
---
```

### Structure

After frontmatter, the file has one top-level section:

```markdown
## Decision Log
```

All decision entries are appended under this section.

---

## Decision Entry Format

Each decision is an H3 block under `## Decision Log`:

```markdown
### D-{NNN}: {title}

- **Phase:** {phase directory name, e.g. "07-auto-mode", or "project" for cross-phase decisions}
- **Step:** {which skill/step made this decision, e.g., "plan-work Step 3", "build Wave 2"}
- **Context:** {what prompted the decision — 1-2 sentences}
- **Options considered:**
  - a) {option} — pros: {pros}; cons: {cons}
  - b) {option} — pros: {pros}; cons: {cons}
  - c) {option} — pros: {pros}; cons: {cons}
- **Selected:** {letter}) {option name}
- **Rationale:** {why this option — 1-2 sentences}
- **Confidence:** {HIGH | MEDIUM | LOW}
- **Affects:** {comma-separated list of artifacts/plans impacted}
- **Status:** ACTIVE
```

When confidence is LOW, append ` — ⚠ NEEDS REVIEW` to the Confidence line:

```markdown
- **Confidence:** LOW — ⚠ NEEDS REVIEW
```

---

## Decision Correction Format

When a decision is revisited (by human review or agent self-correction), add a
new entry — never edit or delete the original. The corrected entry uses:

```markdown
### D-{NNN}: {title} [CORRECTED]

- **Corrected by:** {human | agent}
- **Original:** D-{original ID}
- **Phase:** {phase identifier}
- **Step:** {which skill/step made the correction}
- **Context:** {what prompted the correction — 1-2 sentences}
- **New selection:** {letter}) {option name}
- **Correction rationale:** {why the original decision was wrong — 1-2 sentences}
- **Cascade needed:** {list of affected artifacts that need updating}
- **Status:** ACTIVE
```

To identify corrected decisions, consumers scan for correction entries with
`Original: D-{ID}` referencing the original. Do NOT edit the original entry —
the append-only guarantee is absolute. The original remains as-is for audit trail.

---

## Auto-Decision Heuristics

When making decisions autonomously (without explicit human input), prefer:

1. **Match existing patterns** — options that follow established codebase conventions over novel approaches
2. **Reversible over irreversible** — choices that can be undone easily over those that cannot
3. **Simpler over complex** — straightforward solutions over clever ones
4. **Well-documented libraries over hand-rolling** — proven packages over custom implementations
5. **Fewer new dependencies** — options that minimize additions to the dependency tree
6. **Keep doors open** — the option that preserves the most flexibility for future changes

When multiple heuristics conflict, use the ordering above as a tiebreaker (earlier
heuristics have higher priority).

---

## Subagent Instructions: Appending Decisions

### Creating DECISIONS.md

- If `.planning/DECISIONS.md` does **not exist**, create it with the frontmatter
  template above (fill in project name and today's date), add `## Decision Log`,
  then append the decision entry.
- If `.planning/DECISIONS.md` exists but is **corrupt or unparseable** (missing
  frontmatter, garbled content), rename it to `DECISIONS.md.bak.{YYYY-MM-DD-HHmmss}`, create a fresh
  file with frontmatter and `## Decision Log`, add a note under a `## Recovery`
  section documenting that the previous file was backed up, then append the
  decision entry.

### Appending a New Decision

1. Read the existing `DECISIONS.md`.
2. Find the last `### D-{NNN}:` entry and extract the number.
   - If no entries exist yet, start at `D-001`.
3. Increment by 1 to get the new ID (zero-padded to 3 digits: `D-001`, `D-012`, `D-123`). IDs above 999 overflow to 4+ digits naturally — no special handling needed.
4. Append the new decision block at the **end** of the file, after all existing entries.
5. **Never edit or delete existing entries.**

### Concurrency

Decision IDs are sequential. This relies on a **single-writer guarantee** — only
one session writes to DECISIONS.md at a time. Do not attempt concurrent appends.
