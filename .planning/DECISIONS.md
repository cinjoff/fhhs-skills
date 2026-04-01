# Decisions

Auto-generated decision log.

# Phase 05 Context Mode — Plan Review Decisions (Plan 04, Round 2)

## D-006: Clarify static_analysis step placement in map-codebase

- **Category:** implementation
- **Phase:** 05-context-mode
- **Step:** plan-review Step A
- **Context:** Plan 04 Task 1 had ambiguous placement: "between check_existing and create_structure (or just before spawn_agent)". These are different positions in the step flow.
- **Options considered:**
  - a) After create_structure, before spawn_agent — pros: structure is ready, data feeds into agent; cons: none
  - b) Between check_existing and create_structure — pros: earliest possible; cons: unnecessary, data isn't used until spawn_agent
- **Selected:** a) After create_structure, before spawn_agent
- **Rationale:** static_analysis results are consumed by spawn_agent's prompt injection. Placing it immediately before the consumer follows data-flow ordering. Structure creation doesn't depend on static analysis data.
- **Confidence:** HIGH
- **Affects:** map-codebase step ordering

## D-007: Add fallow dupes/health to Task 1 verify checks

- **Category:** quality
- **Phase:** 05-context-mode
- **Step:** plan-review Step A
- **Context:** Task 1 verify section only checked for `fallow check` but the action adds all three commands (check, dupes, health). An executor could skip dupes/health and pass verify.
- **Selected:** Add grep checks for all three commands
- **Rationale:** Verification must cover all must_haves truths. The [review] truth from the prior review explicitly requires fallow dupes.
- **Confidence:** HIGH
- **Affects:** Task 1 verify, plan verification section

## D-008: Document Serena/LSP overlap in setup step

- **Category:** product
- **Phase:** 05-context-mode
- **Step:** plan-review Step A
- **Context:** Research section 9 caveat #3 warns "if both Serena and built-in LSP are enabled, duplicate capabilities waste context." The setup step didn't mention this.
- **Selected:** Add a brief overlap note to the setup step's fallback text
- **Rationale:** Users installing Serena should understand the overlap. Skills already handle this (prefer Serena, fall back to LSP), but user awareness reduces confusion.
- **Confidence:** HIGH
- **Affects:** setup/SKILL.md Serena section

# Phase 05 Context Mode — Plan Review Decisions (Plan 04, Round 1)

## D-005: Include fallow dupes in map-codebase static analysis

- **Category:** architecture
- **Phase:** 05-context-mode
- **Step:** plan-review Step B
- **Context:** Plan 04 Task 1 omitted `fallow dupes` for map-codebase despite research rating duplication detection as HIGH for concerns/architecture mapping. The simplify reference pattern includes all three Fallow commands.
- **Options considered:**
  - a) Add `fallow dupes` to map-codebase's static_analysis step — pros: matches research findings and simplify pattern; cons: adds ~30s to map-codebase runtime
  - b) Keep check+health only — pros: smaller prompt injection; cons: misses duplication data that research rates HIGH
- **Selected:** a) Add `fallow dupes`
- **Rationale:** Research explicitly rates duplication as HIGH for map-codebase's concerns mapper ("duplication debt") and architecture mapper. The simplify reference pattern already includes all three commands. Consistency and research alignment outweigh the minor runtime cost.
- **Confidence:** HIGH
- **Affects:** map-codebase CODEBASE.md quality (duplication metrics in Concerns/Architecture sections)

# Phase 04 UX & Onboarding — Autonomous Decisions (Plan 02)

These decisions were made autonomously during plan-work. Review and override if needed.

## D-001: First-run detection via symlink check

- **Category:** architecture
- **Phase:** 04-ux-onboarding
- **Step:** plan-work Step 3
- **Context:** Need to detect if user has run /fh:setup to route them correctly in /fh:progress
- **Options considered:**
  - a) Check `~/.claude/get-shit-done/bin/gsd-tools.cjs` symlink existence — pros: already created by setup, no new files; cons: symlink could exist from manual setup
  - b) Write a `~/.claude/fhhs-setup-complete` marker file — pros: explicit signal; cons: new file, not created by current setup
  - c) No first-run detection — pros: no changes; cons: new users get poor guidance
- **Selected:** a) Symlink existence check
- **Rationale:** Setup already creates this symlink (Step 4). Using existing artifact avoids adding marker file infrastructure. False positives (manual symlink) are benign — user already has the tools.
- **Confidence:** HIGH
- **Affects:** progress routing, new user onboarding

## D-002: Error standardization limited to core pipeline skills

- **Category:** product
- **Phase:** 04-ux-onboarding
- **Step:** plan-work Step 3
- **Context:** 47 skills exist but most users interact with 6-8 core skills. Standardizing all at once is too broad.
- **Options considered:**
  - a) All 47 skills — pros: complete consistency; cons: massive diff, many skills rarely used
  - b) Core pipeline only (build, fix, plan-work, review, refactor, progress) — pros: high-impact, manageable scope; cons: inconsistency in niche skills
  - c) Create error standard reference + update core — pros: standard documented; cons: references/ not shipped to plugin installs
- **Selected:** b) Core pipeline skills only
- **Rationale:** These 6 skills represent 80%+ of user interactions. Standardizing them covers the critical path. Niche skills can follow in a later plan. Reference files in references/ aren't shipped anyway.
- **Confidence:** HIGH
- **Affects:** user error recovery experience
- **Expand scope note:** A more ambitious version would create an error taxonomy (E/W/I codes like health.md uses) and apply it across all 47 skills with automated validation.

## D-003: Progress new-user routing with setup detection

- **Category:** product
- **Phase:** 04-ux-onboarding
- **Step:** plan-work Step 3
- **Context:** /fh:progress currently shows "No project found. Run /fh:new-project" when no .planning/ exists. This skips setup for new plugin installs.
- **Options considered:**
  - a) Add setup detection to progress — pros: guides new users correctly; cons: adds logic to progress
  - b) Add beginner vs expert modes — pros: rich differentiation; cons: over-engineering for now
  - c) Keep current behavior — pros: no changes; cons: new users miss setup
- **Selected:** a) Add setup detection to progress
- **Rationale:** Simple check (symlink exists?) with branching message. Low complexity, high impact for new users who run /fh:progress first.
- **Confidence:** HIGH
- **Affects:** new user onboarding flow

## D-004: Enhance /fh:help over creating new skill

- **Category:** product
- **Phase:** 04-ux-onboarding
- **Step:** plan-work Step 3
- **Context:** Need better documentation for new users. Could create /fh:getting-started or enhance /fh:help.
- **Options considered:**
  - a) Create /fh:getting-started skill — pros: dedicated beginner content; cons: more skills = more confusion, shipping boundary adds a directory
  - b) Enhance /fh:help with Getting Started section — pros: single reference point, already exists; cons: help gets longer
  - c) Both — pros: best of both; cons: maintenance burden, duplicated content
- **Selected:** b) Enhance /fh:help
- **Rationale:** One authoritative reference is better than two overlapping ones. Help already has command tables and workflow sections — adding a "Getting Started" section at the top gives new users a clear entry point without creating another skill to maintain.
- **Confidence:** HIGH
- **Affects:** documentation, user discoverability
- **Expand scope note:** A more ambitious version would add interactive tooltips in skills that detect when the user seems unfamiliar and offer contextual help.

## D-005: Review dependency check is soft warning (plan-review decision)

- **Category:** product
- **Phase:** 04-ux-onboarding
- **Step:** plan-review Step B
- **Context:** Plan added hard dependency check to /fh:review requiring .planning/PROJECT.md. But review operates on git diffs and should work without GSD tracking.
- **Options considered:**
  - a) Hard gate (like build/fix/refactor) — pros: consistency; cons: blocks legitimate use case
  - b) Soft warning tip — pros: review always works; cons: slight inconsistency with other skills
- **Selected:** b) Soft warning
- **Rationale:** Review's primary input is git diffs, not .planning/ state. Blocking review for lack of project tracking would frustrate users doing standalone code review.
- **Confidence:** HIGH
- **Affects:** review skill usability

## D-006R: Remove /fh:verify from Getting Started (plan-review decision)

- **Category:** product
- **Phase:** 04-ux-onboarding
- **Step:** plan-review Step A
- **Context:** Getting Started section listed `/fh:verify` as step 5. No `verify` skill exists in `.claude/skills/`. New users following the flow would hit a dead-end command.
- **Options considered:**
  - a) Remove step 5, end flow at `/fh:build` — pros: all commands callable, `/fh:build` already verifies; cons: 4 steps instead of 5
  - b) Replace with `/fh:review --quick` — pros: 5 steps, review exists; cons: review is not verification, confusing semantics
  - c) Keep `/fh:verify` — pros: matches aspirational docs; cons: command doesn't exist, breaks onboarding goal
- **Selected:** a) Remove step 5, end at `/fh:build`
- **Rationale:** Build already includes test, review, and verification stages. Referencing a non-existent command in the primary onboarding flow directly contradicts the phase goal ("Non-technical users can install and use the plugin without assistance").
- **Confidence:** HIGH
- **Affects:** help skill Getting Started section, onboarding UX

## D-006: Eval coverage for onboarding behaviors (plan-review decision)

- **Category:** quality
- **Phase:** 04-ux-onboarding
- **Step:** plan-review Step A
- **Context:** Plan had a must_haves truth requiring 2 evals but no task to create them.
- **Options considered:**
  - a) Add eval task to plan — pros: truth is verifiable; cons: slightly more work
  - b) Remove the truth — pros: less work; cons: new behaviors go untested
- **Selected:** a) Add Task 6 for evals
- **Rationale:** REQ-09 requires every shipped skill to have eval coverage. New onboarding behaviors in progress and setup warrant explicit verification.
- **Confidence:** HIGH
- **Affects:** eval coverage, phase verification

# Phase 04 — Autonomous Planning Decisions

## Coverage Assessment

**Decision: Existing plans (04-01, 04-02) fully cover phase goal — no Plan 03 needed.**

Plans were assessed against:
- Phase goal: "Non-technical users can install and use the plugin without assistance"
- REQ-17: Non-technical users can install and use skills without reading source code
- REQ-18: /fh:setup detects platform and guides through all tooling prerequisites
- REQ-19: /fh:progress and /fh:tracker provide clear project status for any user
- REQ-20: Error messages suggest next steps

Coverage matrix:

| Requirement | Plan 01 | Plan 02 | Gap? |
|-------------|---------|---------|------|
| REQ-17 | - | Getting Started, error standardization | No |
| REQ-18 | - | setup --check mode | No |
| REQ-19 | Tracker per-phase viz | Progress setup routing | No |
| REQ-20 | - | Standard format in 6 core skills | No |

**Why:** Adding a Plan 03 would be scope expansion. The two existing plans address all roadmap items and requirements. The phase goal is about core usability, not comprehensive documentation or advanced discoverability.

**Alternatives considered:**
- Plan 03 for skill discovery improvements (helping users find the right command) — deferred, not required for "install and use without assistance"
- Plan 03 for README/marketplace description improvements — out of phase scope (Phase 6: Ecosystem & Distribution)
- Plan 03 for post-setup wizard/guided mode — explicitly deferred in CONTEXT.md

## Execution Order Decision

**Decision: Execute Plan 02 before Plan 01.**

**Why:** Plan 02 (onboarding UX) directly serves the phase goal and touches only skill markdown files + evals — low risk, high impact. Plan 01 (tracker redesign) is more complex (JS components, parser, orchestrator) and is additive UX polish rather than core onboarding. Executing Plan 02 first delivers the most user-facing value and de-risks the phase.

**Alternatives considered:**
- Execute Plan 01 first (as numbered) — numerically natural but Plan 01 is tracker UI, not directly onboarding
- Execute both in parallel — plans touch different files but share the context budget

## Plan 01 Scope Decision

**Decision: Plan 01 (AutoPipeline redesign) belongs in Phase 4, not Phase 7.**

**Why:** The tracker is a user-facing tool that helps non-technical users understand what `/fh:auto` is doing. Without per-phase visibility, auto mode is a black box — the opposite of "use without assistance." The CONTEXT.md already has tracker-related decisions locked here.

**Alternatives considered:**
- Move Plan 01 to Phase 7 (Autonomous Execution) — closer thematically but the UX component belongs with UX phase
- Split: keep UI in Phase 4, move orchestrator changes to Phase 7 — over-engineering, the changes are tightly coupled

## Setup Detection Scope Decision

**Decision: Setup detection only in /fh:progress, not all skills.**

**Why:** Plan 02 adds setup detection (gsd-tools.cjs symlink check) to /fh:progress only. Other skills check for .planning/PROJECT.md which is a downstream indicator. A user who hasn't run setup but has .planning/ would still work — setup is for optional tooling (LSP, hooks). Adding setup checks to every skill would create unnecessary friction.

**Alternatives considered:**
- Add setup check to all skills — over-aggressive; setup is optional tooling, not a hard prerequisite
- Add setup check to build only — build benefits from LSP but doesn't require it

# Autonomous Decisions — Phase 05 Plan 04

These decisions were made autonomously during plan-work. Review if any seem wrong.

### D-AUTO-01: Fallow in map-codebase — pre-agent injection

- **Category:** architecture
- **Phase:** 05-context-mode
- **Step:** plan-work Step 3
- **Context:** map-codebase needs Fallow data for architecture and health metrics. Question is when to run it.
- **Options considered:**
  - a) Run Fallow before agent, inject JSON into prompt — pros: matches simplify/review pattern, agent gets data upfront; cons: increases prompt size
  - b) Have agent run Fallow itself — pros: agent controls filtering; cons: breaks agent isolation, agent may not have bash access
  - c) Post-agent step — pros: doesn't change agent; cons: too late to inform the mapping document
- **Selected:** a) Run Fallow before agent, inject JSON into prompt
- **Rationale:** Consistent with proven pattern in 5 other skills. Agent needs the data to write informed CODEBASE.md.
- **Confidence:** HIGH
- **Affects:** map-codebase skill
- **Status:** ACTIVE

### D-AUTO-02: Serena integration depth — inline references

- **Category:** architecture
- **Phase:** 05-context-mode
- **Step:** plan-work Step 3
- **Context:** Need to decide how to expose Serena's enhanced capabilities to skills that use LSP.
- **Options considered:**
  - a) Inline Serena tool references in each skill with fallback — pros: simple, explicit, no abstraction; cons: some duplication across 3 skills
  - b) Shared "enhanced LSP" internal skill — pros: DRY; cons: premature abstraction for 3 skills, adds indirection
  - c) Document only in setup — pros: zero skill changes; cons: skills don't leverage Serena even when available
- **Selected:** a) Inline Serena tool references in each skill with fallback
- **Rationale:** Only 3 skills need it. The duplication is ~5 lines each. Abstraction not justified.
- **Confidence:** HIGH
- **Affects:** fix, refactor, extract skills
- **Status:** ACTIVE

### D-AUTO-03: Refactor Fallow placement — Step 1 only

- **Category:** implementation
- **Phase:** 05-context-mode
- **Step:** plan-work Step 3
- **Context:** Refactor has 3 potential Fallow points (Step 0, Step 1, Step 5). Steps 0 and 5 delegate to simplify which already has Fallow.
- **Selected:** Add Fallow to Step 1 (scope) only
- **Rationale:** Avoid duplicating what simplify already provides. Step 1 uniquely benefits from dependency graph and circular dep data for blast radius analysis.
- **Confidence:** HIGH
- **Affects:** refactor skill
- **Status:** ACTIVE

### D-AUTO-04: Serena setup — optional documentation only

- **Category:** product
- **Phase:** 05-context-mode
- **Step:** plan-work Step 3
- **Context:** Serena requires Python 3.11+ and uv — alien dependencies in a Node.js plugin ecosystem.
- **Options considered:**
  - a) Auto-install Serena in /fh:setup — pros: seamless; cons: heavy Python dependency, may fail on many systems
  - b) Document as optional enhancement — pros: no friction for users who don't want it; cons: lower adoption
- **Selected:** b) Document as optional enhancement
- **Rationale:** Plugin's core audience is JS/TS developers. Python dependency is a hard sell. Serena is a power-user enhancement. Expand scope: auto-install would be viable if Serena ships a standalone binary.
- **Confidence:** HIGH
- **Affects:** setup skill, user onboarding
- **Status:** ACTIVE

# Phase 6 Autonomous Decisions

Decisions made autonomously during plan-work. Review and ratify or override.

## marketplace-schema
**Category:** architecture
**Decision:** Enhance only supported marketplace.json fields (description, tags, category)
**Alternatives:** Add speculative fields (screenshots, features); wait for official docs
**Why:** Unsupported fields are silently ignored. Better to optimize what works than guess at future schema.
**Expand scope:** When Anthropic publishes a rich marketplace schema, add visual assets and structured feature lists.

## release-portability
**Category:** implementation
**Decision:** Replace hardcoded path with `git rev-parse --show-toplevel`

## community-artifacts
**Category:** product
**Decision:** Ship CONTRIBUTING.md + .github/ISSUE_TEMPLATE/ (bug, feature, question)
**Alternatives:** CONTRIBUTING.md only; issue templates only
**Why:** Structured issue templates reduce triage time. CONTRIBUTING.md sets expectations for PRs.
**Expand scope:** Add PR templates, CODEOWNERS, and a Discord/community channel.

## health-in-release
**Category:** architecture
**Decision:** Plugin health checks in `/release` Step 0, not standalone
**Alternatives:** Standalone command; add to `/fh:health`
**Why:** Health monitoring matters most at release time. A standalone command would be rarely used.
**Expand scope:** Add continuous monitoring via a `--watch` flag on `/fh:health` that tracks size over releases.

## eval-pre-release
**Category:** architecture
**Decision:** Smoke-tier eval run in `/release` Step 0
**Alternatives:** Full eval suite (too slow); no eval check (risky)
**Why:** Smoke tier catches critical regressions in ~30s. Full suite is 5+ minutes and belongs in manual pre-release.

## no-breaking-change-migration
**Category:** product (deferred)
**Decision:** Defer breaking-change migration support
**Alternatives:** Build migration framework now
**Why:** No breaking changes shipped yet. YAGNI. Reconciliation tags handle additive changes.
**Expand scope:** When first breaking change ships, add versioned migration scripts to `/fh:update`.

# Phase 9 Autonomous Decisions

## Decision 1: No skill code changes
- **Category:** architecture
- **Choice:** Keep SKILL.md as-is — it already implements all roadmap requirements
- **Alternatives:** Could add more sophisticated clustering (ML-based), richer dashboard output, or integration with other skills. Not warranted — skill is complete and functional.
- **Confidence:** HIGH — verified against all 6 roadmap bullet points
- **Expand scope note:** A more ambitious version would add trend analysis across time windows and auto-prioritization based on issue velocity.

## Decision 2: Add 4 edge-case evals
- **Category:** implementation
- **Choice:** IDs 300-303 covering empty observations, gh auth failure, --days flag, misroute guard
- **Alternatives:** Could add fewer (just 1-2 most critical) or more (chained with other skills). 4 gives solid edge coverage without bloat.
- **Confidence:** HIGH — follows established eval patterns from other skills

## Decision 3: Verify-and-document approach
- **Category:** architecture
- **Choice:** This phase is verification + eval hardening + SUMMARY.md, not new feature work
- **Alternatives:** Could use this phase to add new features (trend analysis, Slack notifications, auto-scheduling). Deferred — the core skill is already complete.
- **Confidence:** HIGH — the skill was already built in a prior session

### D-005: Speculative plan validated: phase 4
- **Category:** implementation
- **Status:** ACTIVE
- **Confidence:** HIGH
- **Context:** No file overlap with predecessor phases (none)
- **Decision:** Plan proceeds as-is (VALID)
- **Affects:** Phase 4

### D-006: Speculative plan validated: phase 6
- **Category:** implementation
- **Status:** ACTIVE
- **Confidence:** HIGH
- **Context:** No file overlap with predecessor phases (none)
- **Decision:** Plan proceeds as-is (VALID)
- **Affects:** Phase 6

## Autonomous Decisions — Plan 10

### D-070: Multi-milestone means roadmap creation, not multi-milestone execution
- **Phase:** 07-auto-mode
- **Step:** plan-work Step 3
- **Category:** architecture
- **Context:** Phase goal says "multi-milestone roadmap" — does the orchestrator need to complete one milestone, archive it, create a new milestone, and continue?
- **Options:** (a) Full multi-milestone execution loop with milestone-complete + new-milestone-create between milestones, (b) Treat "multi-milestone" as referring to roadmap creation scope only — new-project --auto creates an ambitious roadmap that may span milestones, but a single auto run executes phases within the current roadmap
- **Selected:** (b) — roadmap creation scope
- **Rationale:** The orchestrator already executes all phases in the roadmap. `new-project --auto` with SCOPE EXPANSION already produces ambitious multi-phase roadmaps. True multi-milestone execution (archive → create → execute) would require `gsd-tools milestone complete` automation + `new-milestone` integration, which is a separate feature. The phase goal is achieved when a user can walk away and get a working codebase — milestone boundaries are project management, not code production.
- **Confidence:** HIGH
- **Affects:** auto orchestrator scope, SKILL.md documentation
- **Alternatives:** Full multi-milestone execution loop — more ambitious but requires milestone lifecycle automation that doesn't exist yet
- **Expand scope:** Future plan could add `--milestones` flag that auto-archives and creates new milestones when all phases complete

### D-071: Eval strategy uses structural validation, not live e2e
- **Phase:** 07-auto-mode
- **Step:** plan-work Step 3
- **Category:** product
- **Context:** How to validate the full auto pipeline works without actually running hours-long auto executions in CI?
- **Options:** (a) Mock claude -p and simulate full run, (b) Structural evals verifying SKILL.md completeness + orchestrator code contracts, (c) Live smoke test with a tiny 1-phase project
- **Selected:** (b) — structural validation evals
- **Rationale:** Live e2e tests take 30-60 minutes and cost $5-20+ per run — impractical for eval suite. Mock-based tests require maintaining a parallel simulation of claude -p behavior. Structural evals verify the contracts that make auto work: SKILL.md has all required steps, orchestrator has all required features (stuck detection, resume, budget, etc.), pipeline contracts between components hold. This catches the regressions that matter — missing steps, broken contracts, removed features.
- **Confidence:** HIGH
- **Affects:** evals.json, eval coverage strategy
- **Alternatives:** Live smoke test (option c) would provide highest confidence but at prohibitive cost. Could be run manually before releases.

### D-072: Resume hardening focuses on state file integrity + SKILL.md instructions
- **Phase:** 07-auto-mode
- **Step:** plan-work Step 3
- **Category:** implementation
- **Context:** How to validate --resume works correctly after various failure modes?
- **Selected:** Add saveAutoState/loadAutoState round-trip validation in orchestrator + eval verifying resume instructions cover all failure modes listed in SKILL.md
- **Confidence:** HIGH
- **Affects:** auto-orchestrator.cjs, evals

# Autonomous Decisions — Phase 05 Plan 05 (Serena Deep Integration)

### D-AUTO-05: Shared Serena usage notes location
- **Category:** architecture
- **Phase:** 05-context-mode
- **Step:** plan-work Step 3
- **Context:** Multiple skills reference Serena tools. Error handling (timeout, partial rename, stale state) should be shared, not duplicated.
- **Options considered:**
  - a) `.claude/skills/setup/references/serena-usage.md` — setup owns Serena config, natural home (alternatives: per-skill references — DRY violation; new cross-skill location — no precedent)
  - b) Each skill duplicates 3 lines — simpler but maintenance burden
- **Selected:** a) `.claude/skills/setup/references/serena-usage.md`
- **Rationale:** Matches build/references pattern. Setup already owns Serena installation. All skills reference with `@.claude/skills/setup/references/serena-usage.md`.
- **Confidence:** HIGH
- **Affects:** setup skill, fix skill, refactor skill, extract skill, map-codebase skill

### D-AUTO-06: Serena as primary, not enhanced alternative
- **Category:** product
- **Phase:** 05-context-mode
- **Step:** plan-work Step 3
- **Context:** User explicitly chose "Serena as PRIMARY when installed." Current skills say "Enhanced navigation (if Serena MCP is connected)" — positions Serena as secondary.
- **Options considered:**
  - a) Rewrite LSP sections to lead with Serena, LSP as fallback block (alternatives: additive approach — preserves old framing; replace LSP entirely — too aggressive, LSP has diagnostics/hover that Serena lacks)
  - b) Add Serena block before LSP, keep both
  - c) Replace LSP references entirely
- **Selected:** a) Rewrite to lead with Serena
- **Rationale:** User decision from plan-review. Serena maintainers also recommend using instead of alongside. More ambitious version: Serena as the ONLY navigation layer with LSP disabled entirely — deferred.
- **Confidence:** HIGH
- **Affects:** fix, refactor, extract skill prompts

### D-AUTO-07: map-codebase Serena integration — pre-agent analysis pattern
- **Category:** architecture
- **Phase:** 05-context-mode
- **Step:** plan-work Step 3
- **Context:** How should map-codebase use Serena? Agent calls Serena directly, or pre-agent data injection?
- **Options considered:**
  - a) Pre-agent analysis: run get_symbols_overview on key files, inject into agent prompt (alternatives: agent calls Serena tools during exploration — requires MCP access in subagent, not guaranteed; both pre-agent + agent — complex)
  - b) Modify mapper agent to call Serena tools itself
  - c) Both pre-agent and agent-level
- **Selected:** a) Pre-agent analysis, consistent with Fallow pattern
- **Rationale:** Agent isolation preserved. Mapper agent gets data but doesn't need MCP access. Consistent with D-AUTO-01 (Fallow pre-agent injection). More ambitious: give mapper agent direct Serena tool access for iterative exploration — deferred.
- **Confidence:** HIGH
- **Affects:** map-codebase skill

### D-AUTO-08: Memory architecture — research spike first
- **Category:** product
- **Phase:** 05-context-mode
- **Step:** plan-work Step 3
- **Context:** User deferred memory decision. 4 options identified (no-onboarding+memory, no-onboarding+pre-populate, no-memories, full defaults). Each has real tradeoffs.
- **Options considered:**
  - a) Standalone spike as Task 1 (alternatives: spike within setup task — conflates concerns; skip spike and pick option A — premature without measurement)
  - b) Part of setup task
  - c) Skip spike, default to option A
- **Selected:** a) Standalone Task 1 with all 4 options tested
- **Rationale:** User explicitly deferred to spike. Memory decision affects setup config AND potentially map-codebase integration. Must be resolved before other tasks.
- **Confidence:** HIGH
- **Affects:** setup skill, potentially map-codebase skill

# Autonomous Decisions — Phase 10-11

No pending decisions. Phase 10-11 was completed in v1.39.0.
All decisions documented in 10-CONTEXT.md.

# Plan 06 Autonomous Decisions

These decisions were made autonomously during plan-work Step 3 (AUTO_MODE).

## Decision 1: Memory Architecture — Option C (no-memories)
- **Category:** architecture
- **Step:** plan-work Step 3
- **Chosen:** `--mode no-memories` — Serena reduced to pure symbol navigation (7 tools)
- **Alternatives:**
  - Option A: `no-onboarding` only (5 extra memory tools, duplication with claude-mem)
  - Option B: pre-populate + read_only_patterns (fragile bridge, maintenance burden)
  - Option D: full defaults (7 extra tools, onboarding conflicts with map-codebase)
- **Rationale:** Deep research (serena-deep-research.md) confirms memories don't improve symbol navigation quality. `ENABLE_TOOL_SEARCH=true` eliminates token overhead concern. claude-mem is the project's memory system — no benefit to running two.
- **Affects:** setup skill, Serena configuration
- **Confidence:** HIGH

## Decision 2: Plan 06 supersedes plan 05
- **Category:** implementation
- **Step:** plan-work Step 3
- **Chosen:** Create plan 06 verified against post-04 state rather than execute stale plan 05
- **Rationale:** Plan 05 was written before plan 04 executed. Some assumptions about starting state (e.g., "Replace the current two-block pattern" in fix/SKILL.md) need verification against actual file contents.
- **Affects:** planning workflow
- **Confidence:** HIGH

## Decision 3: map-codebase symbol exploration scope
- **Category:** architecture
- **Step:** plan-work Step 3
- **Chosen:** `get_symbols_overview` on 3-5 entry points only, no `find_referencing_symbols` fan-out
- **Alternatives:** Full reference tracing (too much data for agent prompt, risk of prompt bloat)
- **Rationale:** Entry point symbols are sufficient to inform architecture mapping. Reference fan-out data is better left to the agent's own exploration.
- **Affects:** map-codebase skill
- **Confidence:** HIGH

## Decision 4: refactor Step 4 minimal touch
- **Category:** implementation
- **Step:** plan-work Step 3
- **Chosen:** Single-line Serena reference in Step 4 (replace existing addendum)
- **Rationale:** Step 4 already works well. Heavy rewrite for one additional tool mention is over-engineering.
- **Affects:** refactor skill
- **Confidence:** HIGH

## Decision 5: Workflow matrix shipping location
- **Category:** architecture
- **Step:** plan-work Step 3 (Plan 07)
- **Chosen:** `.claude/skills/plan-work/references/workflow-matrix.md` — shipped with plugin, plan-work is primary consumer
- **Alternatives:** `.claude/skills/auto/` (secondary consumer), `.planning/` (not shipped)
- **Rationale:** plan-work orchestrates tool selection decisions; auto and build reference guidance transitively. Shipping boundary requires `.claude/skills/` location.
- **Affects:** plan-work skill, workflow documentation
- **Confidence:** HIGH

## Decision 6: Token measurement is guidance, not infrastructure
- **Category:** architecture
- **Step:** plan-work Step 3 (Plan 07)
- **Chosen:** Add measurement guidance to skill prompts (build, auto, map-codebase) — LLM self-observation
- **Alternatives:** Parse claude -p JSON output (fragile, couples to CLI format); external monitoring (out of scope)
- **Rationale:** No token counting API available to skills at runtime. Skills can note tool call patterns and suggest optimizations. Infrastructure belongs in Phase 12 (eval framework).
- **Affects:** build, auto, map-codebase skills
- **Confidence:** HIGH

## Decision 7: Serena rows in workflow matrix marked deferred
- **Category:** implementation
- **Step:** plan-work Step 3 (Plan 07)
- **Chosen:** Keep Serena rows with `(deferred)` annotation
- **Alternatives:** Remove completely (loses research context); keep unmarked (misleading)
- **Rationale:** Research-backed decisions should be preserved for when Serena is undeferred.
- **Affects:** workflow matrix reference doc
- **Confidence:** HIGH

### D-AUTO-11-01: Per-phase cost aggregation format

- **Category:** architecture
- **Phase:** 07-auto-mode
- **Step:** plan-work Step 3
- **Context:** The orchestrator tracks per-step metrics in stepHistory but has no per-phase aggregation. Need a format for phase-level cost summaries.
- **Options considered:**
  - a) Add `phase_costs` object to .auto-state.json alongside stepHistory — pros: queryable by tracker, clean separation; cons: slight duplication
  - b) Compute on-the-fly from stepHistory at display time — pros: no duplication; cons: tracker must aggregate itself, slow for large runs
  - c) Replace stepHistory with phase-level only — pros: simpler; cons: lose per-step granularity
- **Selected:** a) `phase_costs` object in .auto-state.json
- **Rationale:** Tracker and final summary both need phase-level data. Pre-aggregating avoids N passes through stepHistory. stepHistory remains for debugging.
- **Confidence:** HIGH
- **Affects:** auto-mode pipeline, tracker dashboard

### D-AUTO-11-02: Final summary cost breakdown format

- **Category:** implementation
- **Phase:** 07-auto-mode
- **Step:** plan-work Step 3
- **Context:** Final summary currently shows only total cost. Per-phase breakdown helps identify expensive phases.
- **Selected:** Table format in stdout: phase | steps | tokens_in | tokens_out | cost | elapsed
- **Confidence:** HIGH
- **Affects:** auto-mode pipeline output

### D-AUTO-11-03: Token measurement eval strategy

- **Category:** implementation
- **Phase:** 07-auto-mode
- **Step:** plan-work Step 3
- **Context:** Need evals proving token measurement works. parseSessionMetrics is internal orchestrator code — can't eval directly via skill invocation.
- **Options considered:**
  - a) Unit test for parseSessionMetrics in a separate test file — pros: direct; cons: adds test infrastructure for orchestrator
  - b) Eval that checks PHASE_METRICS log output exists in auto run output — pros: end-to-end; cons: requires full run
  - c) Inline syntax/behavior check in orchestrator verification commands — pros: lightweight; cons: not in eval suite
- **Selected:** a) Unit test for parseSessionMetrics + eval verifying cost breakdown in auto output
- **Rationale:** parseSessionMetrics is pure function, easily unit-testable. Complement with skill-level eval checking the summary output format.
- **Confidence:** HIGH
- **Affects:** auto-mode testing

### D-AUTO-11-04: CONTEXT-SHARING.md measurement additions

- **Category:** implementation
- **Phase:** 07-auto-mode
- **Step:** plan-work Step 3
- **Context:** CONTEXT-SHARING.md documents architecture but doesn't describe how to interpret measurement data or verify savings.
- **Selected:** Add "Measurement & Verification" section documenting: how to read PHASE_METRICS, how to compare pre/post ctx_search savings, expected baselines from Performance Baseline table
- **Confidence:** HIGH
- **Affects:** auto-mode documentation

# Plan 13 Review Decisions

## D-REVIEW-13-01: Eval ID conflict resolution

- **Category:** implementation
- **Phase:** 07-auto-mode
- **Step:** plan-review Step A
- **Context:** Plan 13 proposed eval IDs 316-319, which are already taken by context-mode evals from plan 05-08.
- **Selected:** Reassign to IDs 321-324 (next available after max ID 320)
- **Confidence:** HIGH
- **Affects:** evals.json, plan 13 Task 4

## D-REVIEW-13-02: aggregatePhaseMetrics data path

- **Category:** implementation
- **Phase:** 07-auto-mode
- **Step:** plan-review Step A
- **Context:** Plan said "sums tokens_in, tokens_out" without specifying these live in `entry.metrics.tokens_in` (nested), not at the stepHistory entry root.
- **Selected:** Clarified in plan: tokens from `entry.metrics.tokens_in`/`tokens_out`, elapsed from `entry.elapsed_ms`
- **Confidence:** HIGH
- **Affects:** aggregatePhaseMetrics implementation

## D-REVIEW-13-03: gsd-tools path in milestone log

- **Category:** implementation
- **Phase:** 07-auto-mode
- **Step:** plan-review Step A
- **Context:** Plan hardcoded `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs` in milestone suggestion. This breaks in Conductor workspaces.
- **Selected:** Use `path.join(projectDir, '.claude/get-shit-done/bin/gsd-tools.cjs')` — same pattern as `updateStateViaGsd` (line ~796)
- **Confidence:** HIGH
- **Affects:** milestone completion log output

# Phase 12 Eval Framework — plan-work Decisions

## D-12-01: auto-improve stays as maintainer command

- **Category:** architecture
- **Phase:** 12-eval-framework
- **Step:** plan-work Step 3
- **Context:** auto-improve at `.claude/commands/auto-improve.md` operates on fhhs-skills eval suite. Users don't have eval infrastructure.
- **Options considered:**
  - a) Promote to shipped skill — users could run on their own evals (but they don't exist)
  - b) Keep as maintainer command — works for the team that maintains the plugin
- **Selected:** b) Keep as maintainer command
- **Confidence:** HIGH
- **Affects:** eval workflow, plugin shipping boundary

## D-12-02: Coverage gap analysis via --coverage flag

- **Category:** architecture
- **Phase:** 12-eval-framework
- **Step:** plan-work Step 3
- **Context:** 23 shipped skills lack evals. Need visibility into gaps.
- **Options considered:**
  - a) `--coverage` flag on run_all_evals.py — already has COMMAND_MAP
  - b) Separate script
  - c) auto-improve pre-step only
- **Selected:** a) `--coverage` flag on run_all_evals.py
- **Confidence:** HIGH
- **Affects:** eval runner, coverage visibility

## D-12-03: Baseline integration in auto-improve

- **Category:** implementation
- **Phase:** 12-eval-framework
- **Step:** plan-work Step 3
- **Selected:** Read baselines.json at loop start, show delta in trend table, update on final iteration if improved
- **Confidence:** HIGH
- **Affects:** auto-improve iteration output

## D-12-04: 3 fixture-backed auto evals

- **Category:** implementation
- **Phase:** 12-eval-framework
- **Step:** plan-work Step 3
- **Selected:** corrupt state recovery, milestone completion detection, walk-away from description
- **Confidence:** HIGH
- **Affects:** auto skill eval coverage (REQ-42, REQ-43, REQ-44)

## D-12-05: Measurement workflow documentation

- **Category:** product
- **Phase:** 12-eval-framework
- **Step:** plan-work Step 3
- **Context:** REQ-56 requires before/after metrics for skill changes. Need documented process.
- **Options considered:**
  - a) In auto-improve command + CLAUDE.md convention
  - b) Separate doc in .planning/
  - c) In eval runner README
- **Selected:** a) In auto-improve command + CLAUDE.md convention
- **Confidence:** HIGH
- **Affects:** skill change workflow, CLAUDE.md conventions

### D-018: Speculative plan validated: phase 16
- **Category:** implementation
- **Status:** ACTIVE
- **Confidence:** HIGH
- **Context:** No file overlap with predecessor phases (none)
- **Decision:** Plan proceeds as-is (VALID)
- **Affects:** Phase 16

### D-019: Speculative plan validated: phase 17
- **Category:** implementation
- **Status:** ACTIVE
- **Confidence:** HIGH
- **Context:** No file overlap with predecessor phases (none)
- **Decision:** Plan proceeds as-is (VALID)
- **Affects:** Phase 17
