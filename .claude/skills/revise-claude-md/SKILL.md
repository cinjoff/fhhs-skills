---
name: revise-claude-md
description: Update CLAUDE.md with learnings from this session. Use when the user says 'update claude md', 'save learnings', 'improve claude md', 'audit claude md', or after significant implementation work. Also triggered automatically by /fh:build at the end of phase completion.
user-invokable: true
---

Review this session for learnings about working with this codebase. Update CLAUDE.md with context that would help future sessions be more effective.

$ARGUMENTS

---

## Step 1: Detect Mode

| Argument | Mode | Action |
|----------|------|--------|
| No argument | **Session learnings** | Reflect on this session, propose targeted additions |
| `audit` | **Full audit** | Run `skills/claude-md-improver/` — full quality assessment with scoring |
| `init` | **Initial creation** | Generate CLAUDE.md from project context (used by `/fh:new-project`) |

---

## Step 2 (Session Learnings): Reflect

What context was missing that would have helped Claude work more effectively?
- Bash commands that were used or discovered
- Code style patterns followed
- Testing approaches that worked
- Environment/configuration quirks
- Warnings or gotchas encountered

## Step 3 (Session Learnings): Find and Read

```bash
find . -name "CLAUDE.md" -o -name ".claude.local.md" 2>/dev/null | head -20
```

Read each file. Also check for GSD project context:

```bash
[ -f ".planning/PROJECT.md" ] && echo "GSD project detected" || echo "No GSD project"
[ -f ".planning/DESIGN.md" ] && echo "Design system detected" || echo "No design system"
```

Decide where each addition belongs:
- `CLAUDE.md` — Team-shared (checked into git)
- `.claude.local.md` — Personal/local only (gitignored)

## Step 4 (Session Learnings): Draft Additions

**Keep it concise** — one line per concept. CLAUDE.md is part of the prompt, so brevity matters.

Format: `<command or pattern>` - `<brief description>`

Read `skills/claude-md-improver/references/update-guidelines.md` for what to add and what to avoid. Key rules:
- Don't duplicate `.planning/` content — reference it
- Don't list current phases or milestones — they change
- Do add commands, gotchas, architecture, testing patterns

## Step 5 (Session Learnings): Show Proposed Changes

For each addition:

```
### Update: ./CLAUDE.md

**Why:** [one-line reason]

```diff
+ [the addition - keep it brief]
```
```

## Step 6 (Session Learnings): Apply with Approval

Ask if the user wants to apply the changes. Only edit files they approve.

Commit: `docs: update CLAUDE.md with session learnings`

---

## Step 2 (Full Audit): Run Improver

Invoke `skills/claude-md-improver/`. Follow it completely — it handles discovery, quality assessment, scoring, and targeted updates.

---

## Step 2 (Initial Creation): Generate from Context

Read project context gathered by `/fh:new-project`:
- Project name and description (from Step 1 vision)
- Tech stack (from Step 2)
- Design system (from Step 3, if done)

Read `skills/claude-md-improver/references/templates.md` and use the **fhhs-skills Project** template.

Fill in:
- **Project name** and one-line description
- **Tech stack** — list exactly what was chosen
- **Commands** — adapt to chosen framework's conventions (e.g., `next dev` for Next.js, `vite dev` for Vite)
- **Architecture** — where src, components, pages, API routes, tests live (adapt to framework)
- **Code Style** — project-specific conventions, plus `Conventional commits` and `Stage files individually`
- **Testing** — adapt to chosen stack (Vitest, Jest, pytest, etc.)
- **Planning** — always include: `Project state tracked in .planning/. Run /fh:resume to check status.` Plus design reference if `.planning/DESIGN.md` was created.
- **Gotchas** — leave empty or add framework-specific ones (e.g., "NEXT_PUBLIC_ vars must be set at build time")

Keep under 40 lines. This file helps Claude navigate the project in all future sessions.

Commit: `docs: initialize CLAUDE.md with project conventions`
