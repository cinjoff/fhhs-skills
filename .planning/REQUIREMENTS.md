---
type: requirements
project: fhhs-skills
version: v1
created: "2026-03-25"
---

# Requirements

## Core Skills

- **REQ-01:** Composite skills (build, plan-work, fix, refactor, simplify, review) orchestrate multi-step workflows by delegating to internal skills and agents
- **REQ-02:** Design skills (critique, polish, normalize, harden, adapt, animate, etc.) provide specialized UI/UX quality gates
- **REQ-03:** System commands (setup, new-project, health, update, settings) handle project lifecycle
- **REQ-04:** All user-facing skills work when invoked as `/fh:{name}` through the plugin system

## Upstream Integration

- **REQ-05:** Upstream snapshots stored verbatim in `upstream/` for diff baselines
- **REQ-06:** All deviations from upstream documented in PATCHES.md with rationale
- **REQ-07:** COMPATIBILITY.md tracks upstream versions and attribution
- **REQ-08:** Upstream sync process: save new snapshot, diff against current, re-apply patches, verify evals

## Quality & Testing

- **REQ-09:** Every shipped skill has at least 1 eval in evals.json
- **REQ-10:** Eval suite covers happy paths, edge cases, misrouting, failure recovery, and state corruption
- **REQ-11:** Fixture-backed evals use real project structures (nextjs-app-deep) for realistic testing
- **REQ-12:** Eval runner (`run_all_evals.py`) can execute full suite and report pass/fail

## Plugin Shipping

- **REQ-13:** All runtime-read files co-located inside `.claude/skills/{skill}/` (shipping boundary)
- **REQ-14:** Internal skills, references, and templates accessible at development time but not shipped
- **REQ-15:** plugin.json and marketplace.json versions stay in sync
- **REQ-16:** No postinstall hooks required — setup is user-initiated via `/fh:setup`

## User Experience

- **REQ-17:** Non-technical users can install and use skills without reading source code
- **REQ-18:** `/fh:setup` detects platform and guides through all tooling prerequisites
- **REQ-19:** `/fh:progress` and `/fh:tracker` provide clear project status for any user
- **REQ-20:** Error messages suggest next steps (e.g., "Run /fh:new-project first")

## State Management

- **REQ-21:** GSD CLI (gsd-tools.cjs) handles all state reads/writes for .planning/ files
- **REQ-22:** STATE.md accurately reflects current project phase and status
- **REQ-23:** /fh:health can detect and repair .planning/ corruption

## Upstream Capability Management

- **REQ-24:** UPSTREAM-INDEX.md catalogs all upstream sources with per-skill quality ratings and integration status
- **REQ-25:** /fh:audit-upstream evaluates upstream changes and maintains the capability index
- **REQ-26:** Gap Registry tracks unused upstream capabilities with prioritized integration recommendations

## Startup Validation Skills (Complete — shipped v1.39.0)

- **REQ-27:** Pre-building skills help founders validate ideas, research markets, and shape startups before writing code
- **REQ-28:** Each startup skill works standalone but produces richer output when prior skill artifacts exist (progressive enrichment)
- **REQ-29:** Startup skill artifacts stored in `.planning/startup/` and readable by `/fh:new-project`, `/fh:plan-work`, `/fh:auto`, and `/fh:plan-review`
- **REQ-30:** Startup skills have explicit territory boundaries — no trigger overlap with existing development skills
- **REQ-31:** ferdinandobons/startup-skill tracked as upstream #9 with snapshot in `upstream/startup-skill/`
- **REQ-32:** Each startup skill has minimum 3 evals covering standalone, chained, and fast-track modes
- **REQ-33:** Reference files required at runtime are co-located in `.claude/skills/{name}/` (shipping boundary)
- **REQ-34:** `/fh:startup-advisor` provides three-tier knowledge retrieval: claude-mem indexed YC library → shipped curated frameworks → firecrawl/web search
- **REQ-35:** ~~DROPPED~~ — composite orchestrator removed; startup-design IS the journey, others are optional depth/follow-up
- **REQ-36:** `/fh:new-project` Step 0.5 detects `.planning/startup/` and auto-populates project vision from startup artifacts
- **REQ-37:** `/fh:startup-design` supports `--refresh` to update existing artifacts
- **REQ-38:** `/fh:auto` detects missing `.planning/` and suggests running startup skills first
- **REQ-39:** All startup skills use `startup-` prefix for discoverability
- **REQ-40:** `/fh:plan-work` reads `.planning/startup/` as domain context
- **REQ-41:** `/fh:auto` pre-indexes `.planning/startup/` alongside other `.planning/` files

## Auto Skill Optimization & Observability

- **REQ-42:** Auto orchestrator validates .auto-state.json on resume — corrupted state is detected, renamed to .corrupt, and fresh run starts
- **REQ-43:** Milestone completion awareness — orchestrator detects all-phases-done and suggests archive
- **REQ-44:** Walk-away narrative documented in SKILL.md — from project description to working codebase
- **REQ-45:** Auto pipeline lifecycle evals cover corrupt state, milestone complete, walk-away scenarios
- **REQ-46:** Observability dashboard shows live auto progress (activity feed, step tokens, cost)
- **REQ-47:** Cost optimization measured — per-phase agent cost tracked, context waste identified
- **REQ-48:** Auto agents use context-mode (ctx_search) for large files instead of Read

## Serena & Context Workflow

- **REQ-49:** Serena is primary symbol navigator when installed — not "enhanced alternative"
- **REQ-50:** map-codebase uses Serena `get_symbols_overview` on entry points before agent dispatch
- **REQ-51:** Workflow decision matrix documented: when to use context-mode vs Serena vs claude-mem vs Read
- **REQ-52:** Serena runs in `--mode no-memories` — symbol tools only, claude-mem handles cross-session memory
- **REQ-53:** Evals updated for Serena-primary behavior in fix, refactor, extract skills

## Eval Framework & Continuous Improvement

- **REQ-54:** /auto-improve command runs iterative eval analysis, proposes fixes, re-runs to verify
- **REQ-55:** Eval pass rates baselined and tracked — regressions detected automatically
- **REQ-56:** Before/after metrics required for every skill change
- **REQ-57:** Deterministic checks alongside keyword heuristics in eval grading
- **REQ-58:** Context-mode token savings and Serena impact measurable via eval infrastructure
