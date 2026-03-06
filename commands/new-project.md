---
description: "Bootstrap a new project with opinionated defaults, design framework, and full GSD tracking."
---

Bootstrap a new project with opinionated defaults, design framework, and full GSD tracking.

$ARGUMENTS

You are a **lean orchestrator**. Guide the user through setup, delegate heavy work to framework skills.

---

## Step 1: Project Vision

Delegate to the GSD new-project questioning flow. Ask the user one question at a time:

1. **What** is this project? (one sentence)
2. **Who** is it for? (target users)
3. **Why** does it need to exist? (problem it solves)
4. **Scope:** What's in v1? What's explicitly out?
5. **Constraints:** Timeline, team size, budget, technical constraints?
6. **Success criteria:** How do you know it worked?

Save answers — they feed into PROJECT.md in Step 5.

---

## Step 2: Tech Stack Confirmation

Present the default stack:

> **Default stack:** Next.js + TypeScript + Tailwind CSS + Shadcn/ui + GitHub + Vercel
>
> These are defaults — override any of them.

Ask: **"Need user authentication or a database?"**
- Yes → add Supabase to the stack
- No → skip

Ask: **"Any changes to the default stack?"**

Lock the final tech stack decisions. These go into PROJECT.md.

---

## Step 3: Design Framework

Invoke `impeccable:teach-impeccable`.

This runs the one-time design context setup:
- Aesthetic direction (tone, style, differentiation)
- Design tokens and constraints
- Typography and color decisions
- Component patterns

Output: `.planning/DESIGN.md` — referenced by all future `/build` and `/verify-ui` runs.

If the user wants to skip this step and set up design later, allow it. They can always run `impeccable:teach-impeccable` manually.

---

## Step 4: CLAUDE.md Generation

Create a lean but effective `CLAUDE.md` at the project root. Include:

- **Project name** and one-line description (from Step 1)
- **Tech stack** (from Step 2)
- **Project structure** — where src, components, pages, API routes, and tests live (use Next.js App Router conventions unless overridden)
- **Planning state** — "Project state is tracked in `.planning/`. Use `/resume` to check current status."
- **Design conventions** — "See `.planning/DESIGN.md` for design tokens and aesthetic direction."
- **Testing conventions** — "Use Vitest for unit tests. Tests live next to source files as `*.test.ts`."
- **Commit conventions** — "Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`. Stage files individually, never `git add .`."

Keep it under 40 lines. This file helps Claude navigate the project in all future sessions.

Commit: `docs: initialize CLAUDE.md with project conventions`

---

## Step 5: Requirements + Roadmap

Derive requirements from the vision in Step 1. Create:

- `.planning/PROJECT.md` — Vision, scope, constraints, tech stack, success criteria
- `.planning/REQUIREMENTS.md` — Scoped work items (REQ-01, REQ-02, ...)
- `.planning/ROADMAP.md` — Phased plan with goals per phase
- `.planning/STATE.md` — Current position (phase 1, plan 0)
- `.planning/config.json` — GSD workflow settings

**Phase 1 must always be "Project scaffolding and core setup"** — this is where the actual Next.js project gets created, dependencies installed, and base configuration applied.

Use `gsd-tools.cjs` for file creation if available:
```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs init new-project
```

If gsd-tools not available, create the files manually following GSD frontmatter conventions.

Commit: `docs: initialize project planning with GSD structure`

---

## Step 6: Handoff

Report to the user:

```
Project initialized:
- .planning/PROJECT.md    — vision and scope
- .planning/DESIGN.md     — design framework (if set up)
- .planning/REQUIREMENTS.md — work items
- .planning/ROADMAP.md    — phased plan
- .planning/STATE.md      — tracking state
- CLAUDE.md               — project conventions

Next: run /plan to plan your first phase (scaffolding and core setup).
```
