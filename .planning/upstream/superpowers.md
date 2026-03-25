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
│   │   └── test-*.md                             ← pressure test scenarios (×3)
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

## Skills Table

| Skill | SDLC Phase | Quality | Status | fhhs Equivalent | Notes |
|-------|-----------|---------|--------|-----------------|-------|
| brainstorming | Planning | A | ✅ Forked | skills/brainstorming/PROMPT.md | Divergent thinking methodology |
| writing-plans | Planning | A | ✅ Forked | Absorbed into /fh:plan-work | Structured plan authoring |
| test-driven-development | Testing | A | ✅ Forked | skills/test-driven-development/ | TDD enforcement |
| systematic-debugging | Debugging | A | ✅ Forked | skills/systematic-debugging/ | Root-cause analysis method |
| subagent-driven-development | Building | A | ✅ Forked | skills/subagent-driven-development/ | Core SDD orchestration |
| executing-plans | Building | B | ✅ Forked | skills/executing-plans/ | Plan execution methodology |
| dispatching-parallel-agents | Building | A | ✅ Forked | skills/dispatching-parallel-agents/ | Parallel Task dispatch |
| requesting-code-review | Review | B | ✅ Forked | skills/requesting-code-review/ | Review initiation |
| receiving-code-review | Review | A | ✅ Forked | skills/receiving-code-review/ | Processing feedback |
| verification-before-completion | Verification | A | ✅ Forked | skills/verification-before-completion/ | Pre-completion gate |
| finishing-a-development-branch | Integration | B | ✅ Forked | skills/finishing-a-development-branch/ | Branch cleanup |
| using-git-worktrees | Setup | B | ✅ Forked | skills/using-git-worktrees/ | Worktree isolation |
| using-superpowers | Meta | B | ✅ Forked | skills/using-superpowers/ | Plugin usage guide |
| writing-skills | Meta | A | ✅ Forked | skills/writing-skills/ | Skill authoring guide |

## Supporting Assets Table

| Asset | Type | Used by | Status | Notes |
|-------|------|---------|--------|-------|
| root-cause-tracing.md | Reference | systematic-debugging | ✅ Forked | RCA methodology |
| defense-in-depth.md | Reference | systematic-debugging | ✅ Forked | Layered fix strategy |
| condition-based-waiting.md (+.ts) | Reference + Example | systematic-debugging | ✅ Forked | Async wait patterns |
| testing-anti-patterns.md | Reference | test-driven-development | ✅ Forked | Anti-pattern catalog |
| implementer-prompt.md | Prompt | subagent-driven-development | ✅ Forked | Subagent implementer |
| spec-reviewer-prompt.md | Prompt | subagent-driven-development | ✅ Forked | Spec validation gate |
| code-quality-reviewer-prompt.md | Prompt | subagent-driven-development | ✅ Forked | Quality review gate |
| anthropic-best-practices.md | Reference | writing-skills | ✅ Forked | Prompt engineering ref |
| persuasion-principles.md | Reference | writing-skills | ✅ Forked | Writing reference |
| graphviz-conventions.dot | Template | writing-skills | ✅ Forked | Graph conventions |
| render-graphs.js | Utility | writing-skills | ✅ Forked | Graphviz renderer |
| code-reviewer.md | Agent | requesting-code-review | ✅ Forked | Reviewer persona |
| skills-core.js | Library | Plugin runtime | 🚫 N/A | Claude Code plugin loader |
| hooks/ | Hooks | Session init | 🚫 N/A | Not applicable to fhhs model |

## Assessment

Superpowers is the backbone of fhhs's engineering methodology. Its pipeline model — ideation through shipping — provides the structural discipline that all other upstreams plug into. The SDD model with spec-reviewed, independently-implemented subagents is the single most valuable pattern in the entire upstream catalog. All 14 skills are fully integrated as internal forks. The only weakness is that some skills (executing-plans, using-superpowers) are somewhat generic and could benefit from tighter integration with GSD's state machine. The test suite is comprehensive but platform-specific (Claude Code plugin tests) and not directly usable by fhhs.
