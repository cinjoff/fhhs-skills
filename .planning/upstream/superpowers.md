# Upstream: superpowers (v4.3.1)

**Overall Quality: A**

## Overview

Superpowers is an engineering discipline framework that enforces a rigorous pipeline from ideation through shipping. Its core philosophy is that every development task should flow through structured phases — plan, implement with subagents, review, verify, finish — rather than ad-hoc coding. What makes it distinctive is the subagent-driven development model where work is decomposed into spec-reviewed, independently-implemented units with automated verification gates.

## File Tree

```
upstream/superpowers-4.3.1/
├── .claude-plugin/
│   ├── marketplace.json                          ← plugin registry metadata
│   └── plugin.json                               ← plugin config
├── .codex/
│   └── INSTALL.md                                ← Codex integration
├── .cursor-plugin/
│   └── plugin.json                               ← Cursor integration
├── .opencode/
│   ├── INSTALL.md
│   └── plugins/superpowers.js                    ← OpenCode adapter
├── agents/
│   └── code-reviewer.md                          ← review agent persona
├── commands/
│   ├── brainstorm.md                             ← /brainstorm entry point
│   ├── execute-plan.md                           ← /execute-plan entry point
│   └── write-plan.md                             ← /write-plan entry point
├── docs/
│   ├── README.codex.md
│   ├── README.opencode.md
│   ├── testing.md                                ← test methodology docs
│   ├── plans/                                    ← internal dev plans
│   └── windows/polyglot-hooks.md
├── hooks/
│   ├── hooks.json                                ← hook definitions
│   ├── run-hook.cmd                              ← Windows hook runner
│   └── session-start                             ← session initialization hook
├── lib/
│   └── skills-core.js                            ← skill loading library
├── skills/
│   ├── brainstorming/
│   │   └── UPSTREAM-SKILL.md                     ← ideation & divergent thinking
│   ├── dispatching-parallel-agents/
│   │   └── UPSTREAM-SKILL.md                     ← parallel Task tool dispatch
│   ├── executing-plans/
│   │   └── UPSTREAM-SKILL.md                     ← plan execution methodology
│   ├── finishing-a-development-branch/
│   │   └── UPSTREAM-SKILL.md                     ← branch cleanup & PR prep
│   ├── receiving-code-review/
│   │   └── UPSTREAM-SKILL.md                     ← processing review feedback
│   ├── requesting-code-review/
│   │   ├── UPSTREAM-SKILL.md                     ← initiating code review
│   │   └── code-reviewer.md                      ← reviewer prompt (co-located)
│   ├── subagent-driven-development/
│   │   ├── UPSTREAM-SKILL.md                     ← SDD orchestration methodology
│   │   ├── code-quality-reviewer-prompt.md       ← quality gate prompt
│   │   ├── implementer-prompt.md                 ← subagent implementer prompt
│   │   └── spec-reviewer-prompt.md               ← spec validation prompt
│   ├── systematic-debugging/
│   │   ├── UPSTREAM-SKILL.md                     ← root-cause debugging method
│   │   ├── CREATION-LOG.md                       ← skill development notes
│   │   ├── condition-based-waiting.md            ← async wait patterns
│   │   ├── condition-based-waiting-example.ts    ← TypeScript example
│   │   ├── defense-in-depth.md                   ← layered fix strategy
│   │   ├── find-polluter.sh                      ← test pollution finder
│   │   ├── root-cause-tracing.md                 ← RCA methodology
│   │   └── test-*.md                             ← test scenarios (×4)
│   ├── test-driven-development/
│   │   ├── UPSTREAM-SKILL.md                     ← TDD methodology
│   │   └── testing-anti-patterns.md              ← anti-pattern catalog
│   ├── using-git-worktrees/
│   │   └── UPSTREAM-SKILL.md                     ← worktree-based isolation
│   ├── using-superpowers/
│   │   └── UPSTREAM-SKILL.md                     ← meta: how to use the plugin
│   ├── verification-before-completion/
│   │   └── UPSTREAM-SKILL.md                     ← pre-completion verification
│   ├── writing-plans/
│   │   └── UPSTREAM-SKILL.md                     ← structured plan authoring
│   └── writing-skills/
│       ├── UPSTREAM-SKILL.md                     ← meta: skill authoring guide
│       ├── anthropic-best-practices.md           ← Anthropic prompt guidelines
│       ├── graphviz-conventions.dot              ← graph rendering conventions
│       ├── persuasion-principles.md              ← persuasive writing ref
│       ├── render-graphs.js                      ← Graphviz rendering utility
│       ├── testing-skills-with-subagents.md      ← skill testing methodology
│       └── examples/CLAUDE_MD_TESTING.md
├── tests/                                        ← comprehensive test suite
│   ├── claude-code/                              ← integration tests
│   ├── explicit-skill-requests/                  ← skill triggering tests
│   ├── opencode/                                 ← OpenCode platform tests
│   ├── skill-triggering/                         ← trigger accuracy tests
│   └── subagent-driven-dev/                      ← SDD integration tests
├── LICENSE
├── README.md
└── RELEASE-NOTES.md
```

## Capability Flow Diagram

```
                        SUPERPOWERS ENGINEERING PIPELINE

  ┌──────────┐    ┌──────────┐    ┌───────────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
  │  IDEATE  │───▶│   PLAN   │───▶│   IMPLEMENT   │───▶│  REVIEW  │───▶│  VERIFY  │───▶│   SHIP   │
  └──────────┘    └──────────┘    └───────────────┘    └──────────┘    └──────────┘    └──────────┘
       │               │                  │                  │               │               │
  brainstorming   writing-plans   subagent-driven-    requesting-    verification-   finishing-a-
                                  development         code-review    before-         development-
                  executing-      ┌───────────────┐   receiving-     completion      branch
                  plans           │  Subagents:   │   code-review
                                  │ ┌───────────┐ │
                                  │ │implementer│ │
                                  │ └───────────┘ │
                                  │ ┌───────────┐ │
                                  │ │spec-review│ │
                                  │ └───────────┘ │
                                  │ ┌───────────┐ │
                                  │ │quality-rev│ │
                                  │ └───────────┘ │
                                  └───────────────┘

  CROSS-CUTTING SKILLS:
  ├── test-driven-development ─── enforced throughout implementation
  ├── systematic-debugging ────── invoked on failures at any stage
  ├── dispatching-parallel-agents  orchestrates concurrent subagent work
  ├── using-git-worktrees ──────── isolation for parallel branches
  └── writing-skills ──────────── meta: creating new skills
```

## Deep Capability Descriptions

### Planning & Discovery Skills

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **brainstorming** | Socratic design dialogue: explore context → ask clarifying questions one-at-a-time → propose 2-3 approaches → present design in sections → get user approval → write design doc to `docs/plans/`. Hard gate: NO code without approved design, even for "simple" projects. | Prevents coding without thinking. Forces exploration of alternatives before commitment. Simple projects are where unexamined assumptions cause the most wasted work. | **ACTIVE** — wired in `/fh:plan-work` Step 2. Subagents read `skills/brainstorming/PROMPT.md` before design phase. |
| **writing-plans** | Break approved design into bite-sized tasks (2-5 min each) with exact file paths, complete code snippets, test commands, verification steps. Output to `docs/plans/`. Principles: DRY, YAGNI, TDD, frequent commits. | Eliminates ambiguity. Every task is independently executable with clear done criteria. Makes work parallelizable across subagents. | **INTERNAL** — pattern absorbed into `/fh:plan-work` planning format. |
| **executing-plans** | Batch execution model (default 3 tasks at a time) with human checkpoints between batches. Requires git worktree isolation. Reviews plan critically before starting. | Controlled execution with regular review gates. Human stays in the loop without micromanaging. | **INTERNAL** — alternative to subagent model. Available but subagent-driven preferred. |

### Execution Skills

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **subagent-driven-development** | Fresh subagent per task (prevents context pollution) + two-stage review: (1) spec compliance first, (2) code quality second. Implementer asks questions before coding, self-reviews after. | Best quality through isolation: fresh agent = no accumulated assumptions. Two-stage review catches both "did it do what was asked?" and "is the code good?" | **DEAD as skill** — pattern fully absorbed into `/fh:build` which implements fresh-agent-per-task with spec-gate. The skill itself is never referenced. |
| **dispatching-parallel-agents** | Identify 3+ independent problem domains → spawn one agent per domain → integrate results. For debugging: 6 failures across 3 files → 3 agents → all fixed concurrently. | Massive time savings on multi-domain problems. Prevents sequential analysis waste. | **ACTIVE** — wired in `/fh:build` for parallel task dispatch. |
| **using-git-worktrees** | Create isolated git worktree with systematic directory selection (priority: existing > CLAUDE.md > ask), safety verification (must be gitignored), auto-detect project type (Node/Rust/Python/Go), run setup, verify clean baseline tests. | Reliable workspace isolation for parallel branch work without switching. | **INTERNAL** — referenced in executing-plans. Available for manual invocation. |
| **finishing-a-development-branch** | Verify all tests pass → present 4 options (merge locally / create PR / keep branch / discard) → execute chosen option → clean up worktree if applicable. | Structured completion prevents accidental work loss. Every branch gets a deliberate ending. | **CONDITIONAL** — referenced in `/fh:review` Step 9 for post-review branch promotion. |

### Quality & Discipline Skills

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **test-driven-development** | Iron law: NO production code without failing test first. RED (write failing test, verify it fails) → GREEN (minimal code to pass) → REFACTOR (clean up, keep green). Includes 10+ rationalization rebuttals ("too simple to test", "just a UI change", etc.) and explicit anti-pattern catalog. | Prevents untested code. Forces design clarity through test-first thinking. The rationalization barriers are key — they close the loopholes engineers use to skip TDD. | **ACTIVE** — wired in `/fh:build` (subagent context), `/fh:fix` Step 2, `/fh:plan-work` plan frontmatter. Core discipline skill. |
| **systematic-debugging** | Mandatory 4-phase process: (1) Root cause investigation (read errors, reproduce, check recent changes, trace data flow), (2) Pattern analysis (find working examples, compare, identify differences), (3) Hypothesis testing (form single hypothesis, test minimally), (4) Implementation (create failing test, single fix, verify). 7+ rationalization rebuttals. Supporting refs: root-cause-tracing.md, defense-in-depth.md, condition-based-waiting.md. | Prevents symptom-fixing. "ALWAYS find root cause before attempting fixes. Symptom fixes are failure." The 4-phase structure prevents the common pattern of trying random fixes. | **ACTIVE** — wired in `/fh:fix` Step 1 for moderate/complex bugs. |
| **verification-before-completion** | Gate function: (1) IDENTIFY verification command, (2) RUN fresh and complete, (3) READ full output, (4) VERIFY claim matches output, (5) ONLY THEN claim success. Catches: "should work", "probably passes", satisfaction expressions before verification, trusting agent reports without evidence. | Prevents dishonest completion claims. "Evidence before claims, always." Without this, agents claim success based on vibes. | **ACTIVE** — wired in `/fh:build` Step 5 and `/fh:fix` Step 4 (Phase 3.5). |
| **requesting-code-review** | When to request review (mandatory: after each task, before merge; optional: when stuck). How to dispatch code-reviewer subagent with structured template (WHAT, PLAN, BASE_SHA, HEAD_SHA, DESCRIPTION). | Early review prevents issue cascading. Structured review requests get better reviews. | **DEAD** — pattern exists in `/fh:build` spec-gate but this skill is never referenced directly. |
| **receiving-code-review** | Technical evaluation discipline. Forbidden: "You're absolutely right!", "Great point!", blind implementation. Required: READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND → IMPLEMENT. Handles YAGNI: grep codebase before implementing "professional" suggestions. Be skeptical of external review. | Prevents performative agreement. Ensures code review remains technical discipline, not social performance. | **DEAD** — never referenced. **MEDIUM-VALUE GAP**: would improve `/fh:review` when processing external feedback. |

### Meta Skills

| Skill | What It Actually Does | Value Proposition | fhhs Usage |
|-------|----------------------|-------------------|------------|
| **using-superpowers** | Meta-skill: mandatory skill check before ANY action (even 1% chance). 12+ rationalization rebuttals. Process skills first (brainstorming, debugging), then implementation skills. | Ensures the skill system is actually used. Without this, agents skip skills and go straight to coding. | **DEAD** — fhhs has its own skill dispatch via SKILL.md descriptions. Not needed. |
| **writing-skills** | TDD applied to skill creation: write failing test (subagent pressure scenario) → write skill → close loopholes (rationalization barriers). Skill structure: YAML frontmatter, overview, when-to-use, patterns. Testing methodology: pressure scenarios with subagents as "tests". | Quality skill authoring. The testing methodology (subagent pressure scenarios) is genuinely unique. | **DEAD in pipelines** — but valuable as reference when YOU are authoring skills. Keep as internal reference. |

## Skills Table

| Skill | SDLC Phase | Quality | Status | fhhs Equivalent | Notes |
|-------|-----------|---------|--------|-----------------|-------|
| brainstorming | Planning | A | ✅ Active | skills/brainstorming/PROMPT.md | Core ideation methodology |
| writing-plans | Planning | A | ✅ Internal | Absorbed into /fh:plan-work | Plan authoring pattern |
| test-driven-development | Testing | A | ✅ Active | skills/test-driven-development/ | Core discipline skill |
| systematic-debugging | Debugging | A | ✅ Active | skills/systematic-debugging/ | Root-cause methodology |
| subagent-driven-development | Building | A | 🔀 Pattern absorbed | Pattern in /fh:build | Skill itself unused |
| executing-plans | Building | B | ✅ Internal | skills/executing-plans/ | Alternative execution mode |
| dispatching-parallel-agents | Building | A | ✅ Active | skills/dispatching-parallel-agents/ | Parallel dispatch |
| requesting-code-review | Review | B | ⚠️ Dead | skills/requesting-code-review/ | Pattern in build, skill unused |
| receiving-code-review | Review | A | ⚠️ Dead | skills/receiving-code-review/ | Valuable but not wired |
| verification-before-completion | Verification | A | ✅ **Active** | skills/verification-before-completion/ | Wired in build Step 5, fix Step 4 |
| finishing-a-development-branch | Integration | B | ✅ Conditional | skills/finishing-a-development-branch/ | Post-review workflow |
| using-git-worktrees | Setup | B | ✅ Internal | skills/using-git-worktrees/ | Workspace isolation |
| using-superpowers | Meta | B | ⬜ Not needed | skills/using-superpowers/ | fhhs has own dispatch |
| writing-skills | Meta | A | ⬜ Reference only | skills/writing-skills/ | Useful for skill authoring |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| root-cause-tracing.md | Reference | systematic-debugging | ✅ Active | RCA methodology |
| defense-in-depth.md | Reference | systematic-debugging | ✅ Active | Layered fix strategy |
| condition-based-waiting.md (+.ts) | Reference + Example | systematic-debugging | ✅ Active | Async wait patterns |
| testing-anti-patterns.md | Reference | test-driven-development | ✅ Active | Anti-pattern catalog |
| implementer-prompt.md | Prompt | subagent-driven-development | ✅ Active | Used by /fh:build |
| spec-reviewer-prompt.md | Prompt | subagent-driven-development | ✅ Active | Used by /fh:build |
| code-quality-reviewer-prompt.md | Prompt | subagent-driven-development | ✅ Active | Used by /fh:build |
| anthropic-best-practices.md | Reference | writing-skills | ⬜ Reference | Useful for skill authoring |
| persuasion-principles.md | Reference | writing-skills | ⬜ Reference | Writing reference |
| testing-skills-with-subagents.md | Reference | writing-skills | ⬜ Reference | Skill testing methodology |
| code-reviewer.md | Agent | requesting-code-review | ✅ Active | Reviewer persona |
| skills-core.js | Library | Plugin runtime | 🚫 N/A | Claude Code plugin loader |
| hooks/ | Hooks | Session init | 🚫 N/A | Not applicable to fhhs model |

## Assessment

Superpowers is the backbone of fhhs's engineering methodology. Its pipeline model — ideation through shipping — provides the structural discipline that all other upstreams plug into. The SDD model with spec-reviewed, independently-implemented subagents is the single most valuable pattern in the entire upstream catalog.

### What's Working

7 of 14 skills are actively wired and regularly triggered: brainstorming, TDD, systematic-debugging, simplify, dispatching-parallel-agents, verification-before-completion, and the SDD subagent prompts (implementer, spec-reviewer, quality-reviewer). These form the quality backbone of `/fh:build`, `/fh:fix`, and `/fh:plan-work`.

### What's Underused (High-Value Gaps)

1. **receiving-code-review** — The anti-performative-agreement discipline would improve how `/fh:review` processes external feedback. Currently nothing prevents blind "Great point!" responses to review comments.

### What's Dead Weight

- **using-superpowers** — fhhs has its own skill dispatch. This meta-skill is for standalone Superpowers users.
- **subagent-driven-development** — The pattern is fully absorbed into `/fh:build`. The skill file itself adds no value.
- **requesting-code-review** — The review request pattern exists in build's spec-gate. The skill adds nothing.

### Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| ~~High~~ | ~~Wire verification-before-completion into `/fh:build` final step and `/fh:fix` final step~~ | ✅ **DONE** (Phase 3.5) |
| **Medium** | Wire receiving-code-review into `/fh:review` when processing external/Greptile feedback | Prevents performative agreement |
| **Low** | Keep writing-skills as reference for plugin development (you), don't ship | Useful for skill authoring |
| **None** | Remove using-superpowers from shipped skills if shipped | Token savings, no functionality loss |
