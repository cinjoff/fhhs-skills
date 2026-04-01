# Codebase Reference

**Mapped:** 2026-03-31

## Structure — Where to Put New Code

### Directory Layout
```
salvador-v2/
├── .claude/
│   ├── skills/             # SHIPPED — all user-facing runtime files live here
│   │   ├── {name}/
│   │   │   ├── SKILL.md           # Skill definition (frontmatter + process steps)
│   │   │   └── references/        # Skill-local reference files (co-located for runtime access)
│   │   └── shared/                # Cross-skill reference files (claude-mem-rules.md, etc.)
│   └── commands/           # NOT SHIPPED — maintainer-only commands (release, sync-upstream)
├── agents/                 # Subagent persona files dispatched via Task tool
├── bin/
│   ├── gsd-tools.cjs       # State & config CLI (gsd-tools resolve-model, config-get, etc.)
│   └── lib/                # Supporting modules (commands.cjs for CONTEXT.md parsing)
├── evals/
│   ├── evals.json          # Eval suite definitions (210+ evals)
│   └── fixtures/           # Mock project directories used as eval inputs
├── upstream/               # Verbatim upstream snapshots — NEVER edit
└── .planning/              # GSD project state (PROJECT.md, ROADMAP.md, STATE.md, phases/)
```

### Placement Rules
- **New user-facing skill:** `.claude/skills/{name}/SKILL.md` — must have YAML frontmatter
- **Skill-local reference file:** `.claude/skills/{name}/references/{file}.md` — co-locate; never use repo-root `references/`
- **Cross-skill shared reference:** `.claude/skills/shared/{file}.md` — reference via `@.claude/skills/shared/`
- **New maintainer command:** `.claude/commands/{name}.md` — not shipped, repo-local only
- **New subagent persona:** `agents/{name}.md` — dispatched via Task tool from orchestrator skills
- **New eval:** add entry to `evals/evals.json`; add fixture to `evals/fixtures/` if needed
- **New bin module:** `bin/lib/{name}.cjs`
- **NEVER place runtime-read files in:** `references/` (repo root), `templates/`, or any repo-root dir — these are not shipped to plugin installs and will fail with "File does not exist"

### Key Entry Points
- `.claude/skills/{name}/SKILL.md`: Skill invoked as `/fh:{name}` — process steps run top to bottom
- `bin/gsd-tools.cjs`: State/config CLI called from skill bash blocks
- `bin/lib/commands.cjs`: CONTEXT.md section parsing — source of truth for section names
- `evals/evals.json`: Eval suite consumed by `fhhs-skills-workspace/run_all_evals.py`

## Conventions — Which Patterns to Follow

### Naming
- **Skill directories:** `kebab-case` matching the invocation name (e.g., `plan-work/` → `/fh:plan-work`)
- **Reference files:** `kebab-case.md`
- **Agents:** `gsd-{role}.md` for GSD pipeline agents (e.g., `gsd-executor.md`, `gsd-planner.md`); `code-{role}.md` for code agents
- **Frontmatter field:** `user-invocable` (with **c**) — NOT `user-invokable`. Misspelling silently defaults to `true`
- **Skill references in docs:** always `/fh:{name}` prefix — never `/{name}` alone

### Skill Frontmatter
```yaml
---
name: fh:{skill-name}
description: One-sentence description shown in help.
user-invocable: true          # false = composite-only, not user-invokable
disable-model-invocation: true  # optional — for pass-through skills
---
```

### Skill Structure Pattern
```markdown
---
[frontmatter]
---

One-paragraph summary of what the skill does.

What to build: $ARGUMENTS     # ← how user input is injected

> **Dependency check:** Verify `.planning/PROJECT.md` exists — if missing, tell user: "..."

---

## Step N: Step Title

> **Task tracking:** TaskUpdate(taskId, status="in_progress") — skip if TASKS_AVAILABLE=false.

[Process instructions...]

---
```

### Orchestrator Pattern
- Orchestrator skills (plan-work, build, review, auto) declare: "You are a **lean orchestrator**. Stay under 15% context usage. Delegate all heavy work to subagents."
- Heavy work dispatched via `Task` tool to `general-purpose` subagents using an implementer prompt template
- Subagent prompt template lives at `.claude/skills/build/references/implementer-prompt.md`
- Subagents write code but do NOT commit; orchestrator makes one commit per plan after all waves complete
- Model resolution via: `node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs resolve-model gsd-executor --raw`

### Commits
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Both `plugin.json` and `marketplace.json` must stay version-synced on every release

### String Safety
- `str.replace(pattern, dynamicContent)` — always use function form: `str.replace(pattern, () => dynamicContent)` to prevent `$&` corruption in dynamic content

## Architecture — How Layers Connect

### Pattern Overview
**Plugin skill orchestration** — skills are Markdown process documents that Claude executes top-to-bottom. Orchestrator skills keep their own context lean and dispatch subagents for heavy analysis or implementation work.

### Layer Dependencies
```
User invokes /fh:{name}
        ↓
Orchestrator SKILL.md          (.claude/skills/{name}/SKILL.md)
        ↓                      reads planning state, dispatches agents
GSD State Layer                (.planning/ — PROJECT.md, ROADMAP.md, STATE.md, phases/)
        ↓
bin/gsd-tools.cjs              (state reads/writes, model resolution, config)
        ↓
Subagents (Task tool)          (agents/*.md — gsd-executor, gsd-planner, etc.)
```

- Orchestrators read `.planning/` state but write state only via `gsd-tools.cjs`
- Subagents receive context via implementer-prompt; they read/write project files directly
- `build` subagents do NOT commit; commit is orchestrator's responsibility after all waves
- `.claude/commands/` are maintainer-only, never invoked by plugin users

### GSD Pipeline Data Flow
**Planning → Execution → Review:**
1. `/fh:plan-work` → reads ROADMAP.md + CONTEXT.md → spawns phase-researcher agent → writes PLAN.md to `.planning/phases/XX-name/`
2. `/fh:plan-review` → reads PLAN.md → spawns gsd-plan-checker agent → writes review findings
3. `/fh:build` → reads PLAN.md → groups tasks into waves → spawns parallel implementer subagents per wave → commits after all waves
4. `/fh:review` → diffs HEAD → spawns code-reviewer agent → writes review
5. `/fh:auto` → chains all four above autonomously, phase by phase

### CONTEXT.md Contract
Three canonical sections (load-bearing — renaming requires mirroring in plan-work, plan-review, build, implementer-prompt, and `bin/lib/commands.cjs`):
- `Decisions` — locked decisions for the phase
- `Discretion Areas` — areas where executor can use judgment
- `Deferred Ideas` — out-of-scope ideas to revisit

### Shipping Boundary
Only `.claude/skills/` is shipped to plugin installs. Everything else (agents/, bin/, references/, templates/, .claude/commands/) stays in the repo. Skills must co-locate all runtime-read files inside their own `.claude/skills/{name}/` directory.

### claude-mem Integration
Skills check for `mcp__plugin_claude-mem_*` tools at runtime. If available: use `search` → `get_observations` progressive disclosure (never auto-inject). If unavailable: fall back to Read/Grep/Glob directly. Zero behavioral change for systems without claude-mem.
