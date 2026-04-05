# 3-Layer Context API Contract

Defines what context each layer contains, which skills read and write each layer, and how to order context to avoid the lost-in-the-middle problem.

---

## The Three Layers

### Layer 1 — Project Identity

Stable, rarely changes. Defines what the project is.

| File | Contains | Changes |
|------|----------|---------|
| `.planning/PROJECT.md` | Project name, description, tech stack, goals | Once at setup |
| `.planning/REQUIREMENTS.md` | Feature requirements, acceptance criteria | Per milestone |
| `.planning/ROADMAP.md` | Phases, milestones, delivery sequence | Per milestone |
| `.planning/DESIGN.md` | Visual/UX direction, design system | Per design sprint |

**Load when:** Starting a new skill session from scratch. Provides orientation for agents that have no prior context.

**Token cost:** ~600–1,500 tokens total. Load all four only when onboarding a fresh agent.

---

### Layer 2 — Codebase Knowledge

Semi-stable. Documents how the codebase is built.

| File | Contains | Changes |
|------|----------|---------|
| `.planning/codebase/STACK.md` | Tech versions, package manager, key deps | Per dependency update |
| `.planning/codebase/ARCHITECTURE.md` | Layers, data flow, abstractions, boundaries | Per structural refactor |
| `.planning/codebase/CONVENTIONS.md` | Naming, error handling, patterns | Evolves gradually |
| `.planning/codebase/STRUCTURE.md` | Directory layout, file placement rules | Per structural refactor |
| `.planning/codebase/TESTING.md` | Test patterns, coverage targets | Per testing overhaul |
| `.planning/codebase/INTEGRATIONS.md` | External services, APIs, env vars | Per integration change |
| `.planning/codebase/CONCERNS.md` | Known tech debt, open issues | Updated by /fh:review |

**Load when:** Implementing or reviewing code. Use `smart_outline` first; only read sections relevant to the task.

**Token cost:** ~300–600 tokens per file. Load selectively — not all at once.

---

### Layer 3 — Session State

Changes every session. Drives the current task.

| File | Contains | Changes |
|------|----------|---------|
| `.planning/STATE.md` | Current phase, active plan, last position | Every session |
| `CONTEXT.md` (phase dir) | Decisions, Discretion Areas, Deferred Ideas | Per plan |
| `SPEC.md` (phase dir) | Architecture, failure modes, quality rubrics | Per feature |
| `PLAN.md` (phase dir) | Task list, waves, acceptance criteria | Per plan |

**Load when:** Always — this is the active work context.

**Token cost:** ~200–800 tokens total. STATE.md is tiny; SPEC.md can be large — use `smart_unfold`.

---

## Per-Skill Read/Write Matrix

| Skill | Reads (layers) | Writes |
|-------|---------------|--------|
| `/fh:new-project` | — | Layer 1 (all files) |
| `/fh:plan-work` | L1, L2 (partial) | Layer 3 (PLAN.md, CONTEXT.md) |
| `/fh:plan-review` | L1, L3 | CONTEXT.md (decisions) |
| `/fh:build` | L3 (primary), L2 (selective) | DECISIONS.md, SUMMARY.md |
| `/fh:review` | L2, L3 | CONCERNS.md |
| `/fh:fix` | L2 (STACK, ARCHITECTURE), L3 | — |
| `/fh:refactor` | L2, L3 | — |
| `/fh:map-codebase` | codebase source | Layer 2 (all STRUCTURE/ARCH/etc.) |
| `/fh:progress` | L3 (STATE.md) | — |
| `/fh:setup` | — | CLAUDE.md, settings |

---

## Lost-in-the-Middle Ordering

LLMs recall content at the **beginning and end** of context more reliably than the middle. Order context accordingly:

```
1. [FIRST]  Layer 3 — Session State (STATE.md, PLAN.md)
             → Current task — must be recalled precisely
2. [MIDDLE] Layer 2 — Codebase Knowledge (ARCHITECTURE.md, CONVENTIONS.md)
             → Background reference — okay if partially recalled
3. [LAST]   Layer 1 — Project Identity (PROJECT.md, REQUIREMENTS.md)
             → Stable orientation — recall quality matters less
4. [LAST]   Source files being modified
             → The actual code — must be at the end for edit precision
```

**Practical rule:** Always inject PLAN.md and task description first. Put source files last. Layer 2 knowledge goes in the middle.

---

## Loading Checklist for Subagents

When dispatching a subagent, provide context in this order:

1. Task description (from PLAN.md)
2. Relevant SPEC.md sections (via `smart_unfold`)
3. CONTEXT.md decisions that affect this task
4. Architecture/conventions for the affected subsystem
5. Source files to be modified (at end of prompt)

Never dump all three layers — each additional layer costs tokens and dilutes task focus. Load only what the task needs.
