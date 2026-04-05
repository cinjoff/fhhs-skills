# AUTO_MODE Path — Step 3

If `AUTO_MODE` is `"true"`, skip interactive gray area discussion. Instead:

**Crash reconciliation:** Before scouting, search `.planning/DECISIONS.md` for entries where Phase matches the current phase directory name AND Step starts with 'plan-work'. If such entries exist BUT the corresponding CONTEXT.md does not exist or is incomplete (missing one of the three canonical sections: Decisions, Discretion Areas, Deferred Ideas), this indicates a prior crash. Warn: 'Prior plan-work decisions found for this phase but CONTEXT.md is incomplete — resuming from existing decisions.' Reuse the existing decisions to populate CONTEXT.md rather than re-deciding. Only auto-decide gray areas not covered by existing entries.

a) **Scout and identify** the same 3-4 gray areas by scanning the codebase (existing components, utilities, patterns, data flows) — same scouting as the normal path below.
b) **Classify each gray area** as `product` (user experience, feature scope, what to build), `architecture` (system design, data model, tech choices), or `implementation` (naming, file structure, config). Focus decision-recording effort on product and architecture decisions — these shape the system long-term.
c) **Auto-decide** each gray area using best judgment, following the heuristics in `.claude/skills/build/references/decisions-template.md` (match existing patterns > reversible > simpler > well-documented libs > fewer deps > keep doors open).
d) **Log each decision** to `.planning/DECISIONS.md` using the decision entry format from the template. Create the file first if it doesn't exist, or recover if corrupt — see the template's "Subagent Instructions: Creating DECISIONS.md" section. Use `step='plan-work Step 3'` in each entry.
   - For **product and architecture** decisions: always include `alternatives` — the other options you considered and why you didn't pick them. Also add a one-sentence "expand scope" note: what a more ambitious version of this decision might look like. This preserves strategic context for future sessions even though auto-mode uses HOLD SCOPE.
   - For **implementation** decisions: alternatives are optional. Keep the entry terse.
   - Use the `category` field (`product` | `architecture` | `implementation`) in each entry.
   - Use high-level `affects` descriptions ("auth subsystem", "onboarding flow") not file paths.
e) **Still produce** the mandatory ASCII diagram and lightweight Error/Rescue Map for the gray areas (same tables as the normal path).
f) **Write** the same locked/discretion/deferred categories to CONTEXT.md as the normal path (Step 3 item 6 below). For product/architecture decisions in CONTEXT.md, append `(alternatives: X, Y)` to capture what was considered.

Then continue to Step 4.
