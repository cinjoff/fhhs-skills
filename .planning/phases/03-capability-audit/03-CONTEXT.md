---
phase: 03-capability-audit
type: context
created: "2026-03-25"
---

# Phase 3 Context: Upstream Capability Audit

## Decisions

- **Split-file index structure:** Use `.planning/upstream/INDEX.md` (summary + matrix + gap registry) with per-source `.planning/upstream/{source}.md` files. Rationale: scales better as upstreams grow, audit-upstream only reads/writes changed sources.
- **Quality ratings A-D:** Based on structure, edge case handling, error recovery, documentation quality. Assessed during initial audit, refreshed during subsequent audits.
- **Gap Registry in INDEX.md:** Centralized in the summary file, not distributed across per-source files. Gaps reference their source upstream but live in one place for prioritization.
- **Five-section per-source structure:** Each upstream file has up to 5 sections: Skills, Commands/Workflows, Subagent Definitions, Supporting Assets, and Assessment. This ensures GSD workflow commands, agent personas, AND supporting materials (references, templates, prompt templates, rules, tools) are all tracked with the same rigor as skills. Supporting assets are critical because they contain the deep knowledge that makes skills work (e.g., Superpowers' `root-cause-tracing.md` is what makes systematic-debugging effective, Impeccable's 7 design references are what makes frontend-design distinctive).
- **Subagent dispatch mapping in INDEX.md:** The summary index includes a dispatch matrix showing which `/fh:*` skills dispatch which agents, and which agents exist but are unused. This makes agent utilization gaps visible.
- **Per-upstream documentation format:** Each upstream file leads with Overview (philosophy), File Tree (annotated directory structure from snapshot), and Capability Flow Diagram (ASCII showing how pieces chain together) BEFORE the catalog tables. Diagram style matches the upstream's nature: pipeline (Superpowers), state machine (GSD), toolkit grid (Impeccable), workflow (gstack). This gives both LLMs and humans instant structural+conceptual understanding.

- [review] **Edge case handling mandatory:** audit-upstream must handle: first run, upstream removal, skill renames, no-change re-runs, malformed skills, write failures. Never silently skip or fail.
- [review] **Post-sync chain eval required:** Eval must verify "I just synced, now what?" triggers audit-upstream.
- [review] **Hold scope:** This phase produces the index and maintenance skill only. Actual gap integrations (plan-eng-review, retros, ship, etc.) are planned separately using the gap registry as input.

## Deferred Ideas

- Implementing any gap registry items (G1-G11) — these become inputs for future `/fh:plan-work` sessions
- Modifying existing skills (build, review, plan-work) — that's downstream integration work
- Automating upstream change detection (GitHub webhooks, etc.) — future enhancement
- Quality re-assessment of already-integrated skills — only upstream skills are rated in this phase
