---
type: roadmap
project: fhhs-skills
version: v1
created: "2026-03-25"
phases: 11
---

# Roadmap

## Phase 1: Skill Quality & Eval Coverage
**Goal:** Every shipped skill works correctly and has eval coverage proving it.
**Status:** Mostly complete (130+ evals, all skills covered)

- All composite skills orchestrate correctly (build, plan-work, fix, refactor, review, simplify)
- All design skills produce quality output (23 design commands)
- Eval suite covers happy paths, edge cases, misrouting, failure recovery, state corruption
- Fixture-backed evals validate against real project structures

## Phase 2: Upstream Sync & Patch Stability
**Goal:** Upstream updates can be incorporated without breaking patched skills.
**Status:** Complete

- Upstream sync workflow documented and repeatable
- PATCHES.md and COMPATIBILITY.md stay accurate after syncs
- Eval suite catches regressions introduced by upstream changes
- `/fh:sync-upstream` skill guides the process
- Pre-sync validation (Step 0.5) checks forked paths, snapshots, PATCHES.md
- Git checkpoint (Step 3.5) with --include-untracked before modifications
- Post-sync regression detection (Step 4.5) with targeted eval runs
- Registry has explicit eval_commands per upstream
- Eval runner supports --commands filter for targeted runs
- 6 sync-upstream evals covering validation and regression flows

## Phase 3: Upstream Capability Audit & Integration Planning
**Goal:** All upstream capabilities are cataloged, quality-assessed, and gaps identified with integration recommendations.
**Status:** Complete

- UPSTREAM-INDEX.md documents all 8 upstream sources with skill-level detail
- Every upstream skill has quality rating (A-D) and integration status
- Gap Registry identifies unused high-value capabilities with recommended approaches (G1-G11)
- /fh:audit-upstream skill maintains the index after upstream syncs
- SDLC coverage matrix shows where gaps exist across the development lifecycle
- 8 per-source upstream catalog files in `.planning/upstream/`
- 13 audit-upstream evals (IDs 181-193)

## Phase 3.5: Pipeline Depth & Intelligence
**Goal:** Plan-work and new-project pipelines intelligently assess task complexity and suggest appropriate depth — deeper research, decision-locking, and engineering review when warranted.
**Status:** Planning

- `/fh:plan-work` evaluates complexity and suggests deep research for unfamiliar domains
- Decision-locking (CONTEXT.md locked/discretion/deferred) prevents cross-session drift
- Engineering review mode complements existing CEO-style plan-review
- `/fh:build` wires verification-before-completion into final steps
- Upstream gap registry items G1-G5 addressed

## Phase 4: User Experience & Onboarding
**Goal:** Non-technical users can install and use the plugin without assistance.

- `/fh:setup` handles all platform-specific tooling installation
- Documentation is clear, non-verbose, and action-oriented
- Error messages always suggest next steps
- `/fh:progress` and `/fh:tracker` provide clear status at any point

## Phase 5: Advanced Integrations
**Goal:** Skills leverage external tooling for deterministic analysis where available.

- Fallow CLI integration for static analysis (unused exports, circular deps, complexity)
- TypeScript LSP integration for type-aware code analysis
- Graceful degradation when external tools aren't available

## Phase 6: Ecosystem & Distribution
**Goal:** Plugin is discoverable, installable, and maintainable at scale.

- Marketplace listing is accurate and compelling
- Release process is automated (version bump, changelog, tag, GitHub release)
- Plugin update mechanism works reliably (`/fh:update`)
- Community feedback loop established

## Phase 7: Autonomous Execution & Harness Engineering
**Goal:** Users can invoke `/fh:auto` with a project description and walk away — the system produces a working codebase with multi-milestone roadmap, executed phases, and a DECISIONS.md audit trail, without human intervention.

- DECISIONS.md as append-only autonomous decision journal with confidence flagging and correction cascade
- `/fh:new-project --auto` with deep research, scope-expansion roadmap, elaborate multi-milestone output
- Autonomous loop: plan-work → plan-review (HOLD SCOPE) → build → review per phase
- Headless orchestrator using `claude -p` for process-isolated agent sessions with crash recovery
- Stuck detection, timeout supervision, and cost tracking
- Decision correction cascade: human corrects a decision, system identifies downstream impact

## Phase 9: Learning Persistence & Feedback Loop
**Goal:** Workflow issues and skill improvement opportunities are automatically extracted from claude-mem observations and filed as GitHub issues.

- `/fh:learnings` analyzes cross-project observations from claude-mem
- Surfaces positive insights and productive patterns alongside problems
- Clusters similar issues and deduplicates against existing GitHub issues
- Auto-files structured issues with problem/evidence/suggestion format
- Supports --dry-run and configurable time windows
- Suggests claude-mem dashboard for deeper exploration

---

# Milestone: Startup Validation Skills

Pre-building skills that help founders validate ideas, research markets, and shape their startup before writing code. Artifacts produced become the starting point for `/fh:new-project`.

**Research:** `.planning/research/startup-skills-research.md`
**Upstream candidate:** [ferdinandobons/startup-skill](https://github.com/ferdinandobons/startup-skill) (MIT, 4 skills, 52 commits)

## Phase 10: Deep Skill Analysis & Architecture Design
**Goal:** Save upstream snapshot, analyze skill internals, and design the 5-skill startup suite — boundaries, artifacts, chains, and advisor knowledge system.

### Upstream & Analysis
- Save `ferdinandobons/startup-skill` verbatim in `upstream/startup-skill/` (all 4 skills + references + output-guidelines)
- Clone full repo (not just raw files) to capture all reference files and inter-skill dependencies
- Analyze each SKILL.md: prompt structure, phase flow, parallel agent dispatch, fallback chains
- Document artifact chain: which files each skill reads from prior skills, exact paths and formats
- Catalog all reference files and their role (agent templates, research prompts, output guidelines)
- Document startup-design's Fast Track mode and checkpoint/resume mechanism
- Assess shipping boundary: what must co-locate in `.claude/skills/`, what's too large to ship

### Architecture Design (5 skills)
- **4 forked workflow skills:** `/fh:startup-design` (monolithic 8-phase, the comprehensive journey), `/fh:startup-competitors` (optional deeper dive), `/fh:startup-positioning` (optional deeper dive), `/fh:startup-pitch` (natural follow-up)
- **1 new skill:** `/fh:startup-advisor` (claude-mem + frameworks + firecrawl)
- Per-skill spec: name, trigger phrases, explicit exclusions, YAML description draft
- Artifact directory: `.planning/startup/` with per-skill output files
- Artifact chain map: which skill produces what, which reads what, fallback when prior data missing
- `/fh:startup-design --refresh` design: update existing artifacts (v1 for this skill only, others deferred)
- Artifact flow design: `.planning/startup/` feeds `/fh:new-project` (Step 0.5), `/fh:plan-work` (domain context), `/fh:auto` (pre-indexed), `/fh:plan-review` (business reality checks)
- Territory conflict analysis: no overlap with `/fh:plan-work`, `/fh:review`, `/fh:research`, `/fh:plan-review`

### Advisor Knowledge Architecture
- Three-tier retrieval: claude-mem (indexed YC library) → shipped frameworks → firecrawl + WebSearch fallback
- `/fh:startup-advisor --setup`: downloads YC resources from pinned release, indexes into claude-mem with proper tagging
- Shipped `references/frameworks/*.md` (~20-30KB): distilled decision frameworks as fallback
- Firecrawl with targeted arguments (scrape mode for specific URLs, search mode for market data)
- Context grounding: advisor reads `.planning/startup/` artifacts to personalize advice

### Integration Points
- `/fh:new-project` bridge: Step 0.5 reads `.planning/startup/` to auto-populate vision, scope, constraints
- `/fh:auto` detection: when no `.planning/` exists, suggest running `/fh:startup-design` first
- Startup artifacts drive `/fh:plan-work` — scorecard, market analysis, positioning inform planning decisions

### Delight Features (design only)
- Visual ASCII scorecard from `/fh:startup-design` (screenshot-worthy format)
- 2-sentence description generator with clarity scoring (grandmother test)
- `/fh:startup-pitch --practice` investor roleplay mode (adapt from upstream)
- Shareable battle card format (self-contained, Notion/Docs-ready)

### Deliverable
- `.planning/research/startup-skill-deep-analysis.md` — per-skill upstream breakdown
- `.planning/research/startup-skill-architecture.md` — skill specs, artifact map, territory rules, advisor design, delight specs

## Phase 11: Integration Planning & Readiness
**Goal:** Plan exact implementation changes, validate the architecture is buildable, and produce a go/no-go assessment with implementation wave plan.

### Upstream Integration
- Plan PATCHES.md entries for each forked skill
- Plan COMPATIBILITY.md updates (startup-skill as source #9)
- Plan UPSTREAM-INDEX.md update: add startup-skill with per-skill quality ratings
- Plan sync-upstream registry addition for future upstream syncs

### Per-Skill Adaptation Plan
- List all changes needed per forked SKILL.md: path changes (upstream dirs → `.planning/startup/`), naming (`/fh:` prefix), reference co-location
- New skill not in upstream: `/fh:startup-advisor` (knowledge + search)
- `/fh:startup-design --refresh` implementation approach: diff existing artifacts, update sections, preserve user edits
- Reference files: which must ship vs generated at runtime (web research results)
- Size assessment: estimate total shipped file size, check plugin cache constraints

### New-Project & Auto Bridge
- Plan `/fh:new-project` Step 0.5: detect `.planning/startup/`, read artifacts, auto-populate PROJECT.md
- Map which startup artifacts feed which new-project questions
- Plan `/fh:auto` detection: suggest startup skills when no `.planning/` exists
- Design how `.planning/startup/` artifacts flow into `/fh:plan-work` (domain context), `/fh:auto` (pre-indexed per phase), and `/fh:plan-review` (business reality checks)
- Plan modifications to plan-work and auto to read `.planning/startup/` as context source

### Eval Strategy
- Minimum 3 evals per skill: standalone mode, chained mode (with prior artifacts), fast-track mode (startup-design)
- Advisor skill: eval for framework retrieval, eval for claude-mem search, eval for web fallback
- Territory conflict evals: ensure startup skills don't trigger on development tasks

### Implementation Wave Plan
- Wave 1: Upstream snapshot + base skill forks (startup-design, startup-competitors, startup-positioning, startup-pitch)
- Wave 2: New skill (startup-advisor with framework references + claude-mem --setup)
- Wave 3: New-project bridge (Step 0.5) + auto detection + downstream integration (plan-work + auto + plan-review read .planning/startup/)
- Wave 4: Delight features + evals + startup-design --refresh
- Risk assessment + mitigation strategies per wave

### Go/No-Go Checklist
- All architectural decisions recorded and consistent
- No unresolved questions or dependencies
- Size budget confirmed within plugin cache limits
- Eval strategy covers all skill modes
- Implementation waves have clear execution order

### Deliverable
- `.planning/research/startup-skill-integration-plan.md` — task breakdown, wave plan, go/no-go checklist
