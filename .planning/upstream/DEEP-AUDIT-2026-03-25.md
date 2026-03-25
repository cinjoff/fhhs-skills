# Deep Upstream Capability Audit — 2026-03-25

## Executive Summary

This audit examines **6 upstream sources** containing **~80 distinct capabilities** (skills, agents, workflows, references). Of these, only **~15 are actively wired** into fhhs-skills execution paths. Another **~12 are conditionally available** but rarely triggered. The remaining **~53 are dead weight** — shipped or imported but never referenced in any pipeline.

The most critical finding is significant **capability overlap** between GSD and Superpowers in research/planning/execution, with each taking a fundamentally different approach. Understanding these differences is key to deciding which to lean on.

---

## Part 1: The Research/Planning/Brainstorming Overlap

### The Core Question: GSD vs Superpowers for thinking-before-coding

Both systems solve the same problem ("don't jump into code without thinking") but with very different philosophies:

| Dimension | GSD | Superpowers |
|-----------|-----|-------------|
| **Philosophy** | Process-heavy, agent-orchestrated, verification-driven | Discipline-heavy, human-guided, trust-the-engineer |
| **Research** | 4 parallel researcher agents → synthesis → roadmap | Single conversation with web/doc search → writeup |
| **Brainstorming** | `discuss-phase` → CONTEXT.md (locked decisions + discretion) | `brainstorming` → Socratic dialogue → design doc |
| **Planning** | Planner agent → plan-checker agent → executor agent | `writing-plans` → human review → `executing-plans` |
| **Execution** | Atomic commits, deviation rules, checkpoint protocol | Batch execution with human gates, or subagent-per-task |
| **Verification** | Goal-backward verifier + Nyquist auditor + integration checker | `verification-before-completion` (run command, read output, claim) |
| **Scale** | Large projects (multi-phase, multi-milestone) | Feature-sized work (single plan, single branch) |

### Deep Comparison: Research

**GSD `gsd-phase-researcher`**
- Spawned as subagent with full tool access (web search, doc fetch)
- Produces structured RESEARCH.md with: standard stack, architecture patterns, pitfalls, code examples, validation architecture
- Honors locked decisions from CONTEXT.md — won't re-litigate
- Runs before EVERY phase, not just project start
- Also has `gsd-project-researcher` (4 parallel agents for initial project research covering stack, features, architecture, pitfalls)

**Superpowers `research` (via fhhs `/fh:research`)**
- Simple web + doc search → written summary
- No structured output format
- No decision-locking mechanism
- Single-shot, not phase-aware

**fhhs current usage:** `/fh:plan-work` Step 1 optionally invokes research. The GSD research infrastructure (phase researcher, project researcher, synthesizer) is **not wired** — fhhs uses a simplified research step instead.

**Assessment:** GSD research is far more thorough but heavyweight. For a skills plugin project, the simpler Superpowers-style research is likely sufficient. The GSD research apparatus makes sense for greenfield apps, not for a plugin repo where you already know the stack.

### Deep Comparison: Brainstorming / Discussion

**GSD `discuss-phase`**
- Structured workshop producing CONTEXT.md
- Three output categories: **Locked decisions** (Claude must follow), **Discretion** (Claude decides within bounds), **Deferred** (track for later)
- References `questioning.md` for elicitation techniques
- Designed for consequential architectural decisions

**Superpowers `brainstorming`**
- Socratic dialogue: explore context → ask questions one-at-a-time → propose 2-3 approaches → present design → get approval → write design doc
- Hard gate: NO code without approved design
- Produces a design document saved to `docs/plans/`
- Transitions directly to `writing-plans`

**fhhs current usage:** `/fh:plan-work` references brainstorming in Step 2. The GSD discuss-phase is **not wired** at all.

**Assessment:** Both are valuable but serve different moments. Brainstorming is for "what should we build and how?" Discussion is for "we know what to build, what decisions need to be locked?" fhhs currently only uses the brainstorming side. The discussion/decision-locking pattern would add value for larger features where you want to prevent Claude from re-deciding things across sessions.

### Deep Comparison: Planning

**GSD `gsd-planner`**
- Goal-backward: starts from "what must be TRUE?" → derives tasks
- Produces structured PLAN.md with frontmatter (phase, wave, dependencies, must_haves)
- Each task has: Files, Action, Verify, Done
- TDD-aware with RED/GREEN/REFACTOR phases
- Verified by `gsd-plan-checker` before execution

**Superpowers `writing-plans`**
- Break design into bite-sized tasks (2-5 min each)
- Each task has: exact file paths, complete code snippets, test commands, verification steps
- Output to `docs/plans/YYYY-MM-DD-<feature>.md`
- Requires plan approval before execution

**fhhs current usage:** `/fh:plan-work` uses its own planning format that draws from both — GSD-style phase awareness with Superpowers-style task granularity.

**Assessment:** The fhhs hybrid is likely the right call. Pure GSD planning is too heavy for plugin work. Pure Superpowers planning lacks phase awareness. The current blend works.

### Deep Comparison: Execution

**GSD `gsd-executor`**
- Atomic commits per task
- Deviation rules: auto-fix bugs (Rule 1-3), gate architectural changes (Rule 4)
- Checkpoint protocol for human verification
- Context management and continuation support
- State tracking in STATE.md

**Superpowers `executing-plans`**
- Batch model (default 3 tasks at a time)
- Human checkpoint between batches
- Requires git worktree isolation
- Companion: `subagent-driven-development` (fresh agent per task + two-stage review)

**fhhs current usage:** `/fh:build` uses its own execution model that dispatches subagents per task, incorporates spec-gate review, and design gates. It's closer to Superpowers' subagent model but with GSD-style state tracking.

**Assessment:** The fhhs build pipeline is already the best of both worlds. The Superpowers `subagent-driven-development` pattern (fresh agent per task) is what `/fh:build` actually implements.

---

## Part 2: Complete Capability Map with Usage Status

### Legend
- **ACTIVE**: Referenced in main execution paths, regularly triggered
- **CONDITIONAL**: Wired but only triggers under specific conditions
- **SUGGESTED**: Mentioned in output/recommendations but not auto-invoked
- **INTERNAL**: Referenced by other internal skills only
- **DEAD**: Imported/shipped but never referenced in any pipeline

---

### SUPERPOWERS (4.3.1) — Development Discipline System

| Capability | Type | What It Does | Value Proposition | Status in fhhs |
|-----------|------|-------------|-------------------|----------------|
| **brainstorming** | Skill | Socratic design dialogue → approved design doc | Prevents coding without thinking; forces exploration of alternatives | **ACTIVE** — wired in `/fh:plan-work` Step 2 |
| **writing-plans** | Skill | Break design into 2-5min tasks with exact paths/code/tests | Eliminates ambiguity; makes tasks parallelizable | **INTERNAL** — feeds executing-plans |
| **executing-plans** | Skill | Batch execution (3 tasks) with human checkpoints | Controlled execution with review gates | **INTERNAL** — alternative to subagent model |
| **subagent-driven-development** | Skill | Fresh agent per task + two-stage review (spec then quality) | Prevents context pollution; enables parallel work | **DEAD** — pattern absorbed into `/fh:build` but skill itself unused |
| **dispatching-parallel-agents** | Skill | Identify independent domains → one agent per domain | Saves time on multi-domain problems | **ACTIVE** — wired in `/fh:build` |
| **test-driven-development** | Skill | RED-GREEN-REFACTOR enforcement with rationalization barriers | Prevents untested code; catches design issues early | **ACTIVE** — wired in build, fix, plan-work |
| **systematic-debugging** | Skill | 4-phase root cause methodology: investigate → analyze → hypothesize → implement | Prevents symptom-fixing; ensures real fixes | **ACTIVE** — wired in `/fh:fix` |
| **verification-before-completion** | Skill | Run verification commands before claiming success | Prevents false completion claims | **DEAD** — never referenced in any pipeline |
| **requesting-code-review** | Skill | When/how to dispatch code-reviewer subagent | Catches issues early with structured review | **DEAD** — pattern exists in build but skill unused |
| **receiving-code-review** | Skill | Technical rigor when processing review feedback (no performative agreement) | Prevents blind implementation of bad suggestions | **DEAD** — never referenced |
| **using-superpowers** | Skill | Meta-skill: check skills before any action | Ensures skill system is used | **DEAD** — fhhs has its own skill dispatch |
| **using-git-worktrees** | Skill | Create isolated git worktrees with safety checks | Enables parallel branch work | **INTERNAL** — referenced in executing-plans |
| **finishing-a-development-branch** | Skill | Verify tests → present merge/PR/keep/discard options → cleanup | Structured branch completion | **CONDITIONAL** — referenced in `/fh:review` |
| **writing-skills** | Skill | TDD for skill creation: write failing test → write skill → close loopholes | Quality skill authoring | **DEAD** — never referenced |
| **simplify** | Skill | Review changed code for reuse, quality, efficiency | Catches duplication and anti-patterns post-implementation | **ACTIVE** — wired in build, fix, refactor |
| **code-reviewer** | Agent | Senior reviewer: plan alignment + code quality + architecture + docs | Structured review with severity ratings | **ACTIVE** — used in build spec-gate and review |

**Superpowers summary: 16 capabilities → 6 ACTIVE, 2 INTERNAL, 2 CONDITIONAL, 6 DEAD**

---

### GSD (1.22.4) — Project Orchestration System

| Capability | Type | What It Does | Value Proposition | Status in fhhs |
|-----------|------|-------------|-------------------|----------------|
| **gsd-codebase-mapper** | Agent | Explores and documents codebase → STACK/ARCHITECTURE/CONVENTIONS.md | Provides context for planners without token waste | **ACTIVE** — exposed as `/fh:map-codebase` |
| **gsd-phase-researcher** | Agent | Domain investigation per phase → RESEARCH.md | Verified current knowledge, not stale training data | **DEAD** — fhhs uses simpler research |
| **gsd-planner** | Agent | Goal-backward planning → structured PLAN.md | Ensures plans achieve outcomes, not just tasks | **DEAD** — fhhs uses own planning format |
| **gsd-plan-checker** | Agent | Verify plans before execution: coverage, deps, scope, Nyquist | Quality gate preventing bad plans | **DEAD** — fhhs uses `/fh:plan-review` instead |
| **gsd-executor** | Agent | Atomic execution with deviation rules and checkpoints | Reliable execution with automatic bug-fixing | **DEAD** — fhhs uses own build pipeline |
| **gsd-debugger** | Agent | Scientific method debugging with persistent sessions | Survives context resets; captures reasoning | **DEAD** — fhhs uses systematic-debugging from Superpowers |
| **gsd-verifier** | Agent | Goal-backward verification: exists → substantive → wired | Catches stubs, unwired code, incomplete implementations | **DEAD** — not wired |
| **gsd-nyquist-auditor** | Agent | Generate tests for unverified requirements | Ensures test coverage for all requirements | **DEAD** — not wired |
| **gsd-integration-checker** | Agent | Cross-phase wiring and E2E flow verification | Catches architectural breaks between phases | **DEAD** — not wired |
| **gsd-research-synthesizer** | Agent | Combine 4 parallel researcher outputs → SUMMARY.md | Unified research for roadmapping | **DEAD** — not wired |
| **gsd-roadmapper** | Agent | Requirements → phases → success criteria → roadmap | Foundation for project execution | **DEAD** — fhhs uses own roadmap format |
| **gsd-project-researcher** | Agent | 4 parallel domain researchers (stack, features, arch, pitfalls) | Deep initial project understanding | **DEAD** — not wired |
| **new-project** | Workflow | Full project bootstrap: research → roadmap → initial phase | Complete project setup | Used as basis for `/fh:new-project` |
| **progress** | Workflow | Show current phase status and next steps | Quick status check | Used as basis for `/fh:progress` |
| **health** | Workflow | Validate .planning/ integrity | Catch corrupted state | Used as basis for `/fh:health` |
| **38 workflows total** | Workflows | Phase lifecycle, troubleshooting, monitoring, management | Full project orchestration | ~5 actively used, ~33 dead |
| **16 references** | References | Checkpoints, TDD, verification patterns, git integration | Shared knowledge for agents | Referenced by dead agents |
| **61 templates** | Templates | Structured output formats for all deliverables | Consistent documentation | Used by gsd-tools.cjs |

**GSD summary: ~80 capabilities → ~5 actively surfaced, ~75 dead (agent/workflow infrastructure largely unused)**

---

### IMPECCABLE (1.2.0) — Design Quality System

| Capability | Type | What It Does | Value Proposition | Status in fhhs |
|-----------|------|-------------|-------------------|----------------|
| **frontend-design** | Skill | Core design skill: typography, color, layout, motion, interaction, responsive, UX writing + anti-patterns | Eliminates generic AI aesthetics; teaches design vocabulary | **ACTIVE** — wired in build and fix |
| **ui-critique** | Command | UX director review: visual hierarchy, information architecture, emotional resonance | Evaluates whether design WORKS, not just looks correct | **CONDITIONAL** — in build design gates |
| **polish** | Command | Final quality pass: alignment, spacing, typography, states, transitions, copy | Separates good from great; 20-point checklist | **CONDITIONAL** — in build design gates |
| **normalize** | Command | Align with design system: replace one-offs, apply tokens consistently | Enforces systematic consistency | **CONDITIONAL** — in build design gates |
| **ui-animate** | Command | Add purposeful motion with choreography and staggering | Polished feel through motion design | **CONDITIONAL** — in build design gates |
| **audit** | Command | Systematic checks: a11y, performance, theming, responsive, anti-patterns | Documents all issues with severity and remediation | **DEAD** — shipped but never auto-invoked |
| **harden** | Command | Edge cases: text overflow, i18n, RTL, network errors, large datasets | Production resilience | **DEAD** |
| **optimize** | Command | Performance: images, bundles, animations, rendering, Core Web Vitals | Speed and smoothness | **DEAD** |
| **distill** | Command | Strip to essence: remove unnecessary complexity | Design simplicity | **DEAD** |
| **clarify** | Command | Improve unclear copy, labels, error messages | UX writing quality | **DEAD** |
| **colorize** | Command | Add strategic color to monochromatic interfaces | Visual interest via OKLCH | **DEAD** |
| **bolder** | Command | Amplify safe/boring designs with visual impact | Design confidence | **DEAD** |
| **quieter** | Command | Tone down overly aggressive designs | Design restraint | **DEAD** |
| **delight** | Command | Add moments of joy, personality, unexpected touches | Emotional engagement | **DEAD** |
| **extract** | Command | Consolidate reusable patterns into design system | Systematic reuse | **DEAD** |
| **adapt** | Command | Redesign for different contexts (mobile, tablet, desktop, etc.) | Multi-context support | **DEAD** |
| **onboard** | Command | Design first-time user experiences and empty states | User activation | **DEAD** |
| **ui-redesign** | Command | Change look and feel; update design guidelines | Design direction | **DEAD** |
| **teach-impeccable** | Command | One-time setup: gather design context → save to CLAUDE.md | Persistent design preferences | Exposed as `/fh:ui-branding` |

**Impeccable summary: 19 capabilities → 1 ACTIVE, 4 CONDITIONAL, 14 DEAD**

---

### OTHER UPSTREAMS

| Source | Capabilities | What It Provides | Status in fhhs |
|--------|-------------|-----------------|----------------|
| **feature-dev** | 3 agents (explorer, architect, reviewer) | Structured feature dev: explore → design 3 approaches → implement → review | **ACTIVE** — agents used in brainstorming and build |
| **gstack** (0.3.3) | 8 skills (browse, qa, review, plan-ceo-review, plan-eng-review, ship, retro, setup-browser-cookies) | Browser automation for QA, founder/eng review modes, release management | **PARTIAL** — qa/browse partially wired via `/fh:ui-test`, rest DEAD |
| **claude-md-management** (1.0.0) | 2 skills (claude-md-improver, revise-claude-md) | CLAUDE.md auditing and session learning capture | **ACTIVE** — both wired |
| **playwright-best-practices** | 1 skill + 35 references | Comprehensive Playwright testing guidance for all scenarios | **CONDITIONAL** — wired in build/fix/plan-work |
| **vercel-react-best-practices** | 1 skill + 58 rules | React/Next.js performance optimization | **DEAD** — shipped but not wired in any pipeline |

---

## Part 3: What's Actually Valuable vs Dead Weight

### Tier 1: Actively Earning Their Keep
These are wired into execution paths and provide clear value:

1. **brainstorming** (Superpowers) — prevents coding without thinking
2. **test-driven-development** (Superpowers) — prevents untested code
3. **systematic-debugging** (Superpowers) — prevents symptom-fixing
4. **simplify** (Superpowers) — catches post-implementation issues
5. **dispatching-parallel-agents** (Superpowers) — enables parallel work
6. **frontend-design** (Impeccable) — design quality for frontend
7. **code-explorer/architect/reviewer** (feature-dev) — structured feature work
8. **gsd-codebase-mapper** (GSD) — codebase documentation
9. **gsd-tools.cjs** (GSD) — state management infrastructure
10. **claude-md-improver/revise-claude-md** (claude-md-management) — project memory

### Tier 2: Conditionally Valuable
These trigger under specific conditions and add value when they do:

1. **ui-critique/polish/normalize/ui-animate** (Impeccable) — design gates in visual-heavy builds
2. **playwright-testing** — E2E test guidance when interactive features involved
3. **finishing-a-development-branch** (Superpowers) — branch completion workflow
4. **plan-review** (gstack-influenced) — stress-testing plans before build

### Tier 3: Valuable Ideas, Not Wired
These have real value but aren't connected to any pipeline:

1. **verification-before-completion** (Superpowers) — should be in build/fix pipelines
2. **GSD verifier** — goal-backward verification is powerful but unused
3. **GSD integration-checker** — cross-phase wiring checks, valuable for larger projects
4. **harden** (Impeccable) — production resilience is always valuable
5. **audit** (Impeccable) — comprehensive quality checks worth auto-triggering
6. **receiving-code-review** (Superpowers) — technical rigor in processing feedback

### Tier 4: Dead Weight (Consider Removing from Shipped Plugin)
These add token cost when loaded but provide no automated value:

1. **distill, bolder, quieter, delight, colorize, extract, onboard, adapt** (Impeccable) — niche design commands rarely invoked manually
2. **ui-redesign** (Impeccable) — too broad, rarely useful
3. **vercel-react-best-practices** — not wired anywhere
4. **gstack review/ship/retro/plan-ceo-review/plan-eng-review** — gstack's non-browse skills are unused
5. **using-superpowers** — meta-skill for Superpowers users, not fhhs users
6. **writing-skills** — skill authoring skill, only useful for plugin developers (you)
7. **subagent-driven-development** — pattern absorbed into `/fh:build`
8. **requesting-code-review** — pattern exists in build but skill itself unused

---

## Part 4: Specific Overlap Analysis

### Research Capabilities (3-way overlap)

```
GSD Phase Researcher    → Heavy: 4 parallel agents, structured RESEARCH.md, domain-deep
Superpowers Research    → Light: web search + doc fetch → summary
fhhs /fh:research      → Light: based on Superpowers pattern

GSD Project Researcher  → Heavy: stack + features + architecture + pitfalls (parallel)
fhhs /fh:plan-work     → Inline: optional research step before brainstorming
```

**Verdict:** The light approach is right for fhhs. GSD's research apparatus is designed for greenfield projects where you don't know the stack yet. For a plugin repo, you know the stack.

### Brainstorming/Discussion (2-way overlap)

```
Superpowers Brainstorming → "What should we build?" → Design doc → Plans
GSD Discuss-Phase         → "How should we build it?" → CONTEXT.md (locked decisions)
fhhs /fh:plan-work       → Uses brainstorming, skips discuss-phase
```

**Verdict:** Both are useful but at different moments. Brainstorming explores the solution space. Discussion locks decisions for execution. fhhs would benefit from a "lock decisions" step for multi-session features.

### Planning (3-way overlap)

```
GSD Planner         → Goal-backward, agent-verified, phase-aware, TDD-integrated
Superpowers Plans   → Task-granular (2-5 min), exact paths/code, human-reviewed
fhhs /fh:plan-work → Hybrid: phase-aware + task-granular
```

**Verdict:** The fhhs hybrid works. The GSD plan-checker concept (verify plans before execution) is valuable and partially implemented via `/fh:plan-review`.

### Execution (3-way overlap)

```
GSD Executor              → Atomic commits, deviation rules (1-4), checkpoints
Superpowers Executing     → Batch (3 tasks), human gates, git worktree
Superpowers Subagent-Dev  → Fresh agent per task, two-stage review
fhhs /fh:build            → Subagent per task, spec-gate, design gates
```

**Verdict:** fhhs build already incorporates the best patterns from all three.

### Code Review (3-way overlap)

```
Superpowers code-reviewer  → Plan alignment + code quality (agent definition)
Feature-dev code-reviewer  → Bugs + quality + convention compliance (agent definition)
GStack review              → Greptile-integrated, paranoid review mode
fhhs /fh:review            → Combines feature-dev reviewer + spec-gate from build
```

**Verdict:** fhhs review is well-composed. The Greptile integration from gstack could add value if the user has Greptile access.

### Debugging (2-way overlap)

```
GSD Debugger             → Scientific method, persistent sessions, parallel UAT
Superpowers Debugging    → 4-phase root cause methodology, defense-in-depth
fhhs /fh:fix             → Uses Superpowers systematic-debugging
```

**Verdict:** GSD debugger has one advantage: persistent debug sessions that survive `/clear`. This is valuable for complex bugs. The Superpowers approach is simpler and sufficient for most cases.

### Verification (2-way overlap)

```
GSD Verifier             → Goal-backward (exists → substantive → wired), re-verification mode
GSD Nyquist Auditor      → Generate tests for unverified requirements
Superpowers Verification → Run command, read output, verify claim matches
fhhs                     → No explicit verification step in pipeline
```

**Verdict:** This is a **gap in fhhs**. Neither the simple Superpowers verification nor the heavy GSD verifier is wired. At minimum, verification-before-completion should be injected into build and fix pipelines.

---

## Part 5: Recommendations

### Wire Now (High Value, Low Effort)
1. **Add verification-before-completion** to `/fh:build` final step and `/fh:fix` final step — prevents false success claims
2. **Add audit** (Impeccable) as optional step in `/fh:build` for frontend work — catches a11y/performance issues
3. **Add harden** (Impeccable) to `/fh:build` for frontend features — production resilience

### Consider Wiring (Medium Value)
4. **GSD discuss-phase pattern** → Add a "lock decisions" step to `/fh:plan-work` for multi-session features
5. **GSD verifier pattern** → Add goal-backward check to `/fh:build` completion: "did we achieve what the plan said?"
6. **receiving-code-review** → Inject into `/fh:review` when processing external feedback

### Consider Removing from Shipped Plugin (Reduce Token Cost)
7. **12 dead Impeccable commands** (distill, bolder, quieter, delight, colorize, extract, onboard, adapt, optimize, clarify, ui-redesign) — keep in upstream, remove from shipped `.claude/skills/` unless you want them available for manual invocation
8. **vercel-react-best-practices** — not wired; keep in upstream for reference but don't ship
9. **gstack non-browse skills** — review, ship, retro, plan-ceo-review, plan-eng-review are unused

### Keep as Reference Only
10. **GSD agent definitions and templates** — valuable as patterns even if not directly wired. The goal-backward thinking and verification patterns inform better skill design.
11. **writing-skills** (Superpowers) — valuable when YOU are authoring skills, even if not shipped to users
