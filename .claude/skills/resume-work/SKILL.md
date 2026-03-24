---
name: resume-work
description: Restore context and route to the right next action. Use when the user says 'resume', 'where was I', 'what's next', 'continue', 'pick up where I left off', or starts a new session on an existing project.
user-invokable: false
---

Context restoration and routing. Reads project state, presents a briefing, routes to the right composite.

$ARGUMENTS

> **Dependency check:** This command works with or without all dependencies. It reads state and routes — if a dependency is missing, it notes this in the briefing so the user knows before proceeding.

---

## Step 1: Read State

Gather project context from all available sources.

### GSD State (if .planning/PROJECT.md exists)
- Read `.planning/STATE.md` — current position, last activity, decisions, blockers
- Read `.planning/ROADMAP.md` — phase list, progress table
- Read `.planning/CONCERNS.md` — known issues (if exists)

### Pending Todos
- Scan `.planning/todos/` for pending items (if directory exists)
- Count total pending todos, broken down by priority (high vs medium vs low)
- Note any overdue or stale items

### Incomplete Work Detection

Scan `.planning/phases/` for:

| Pattern | Meaning |
|---------|---------|
| PLAN.md without SUMMARY.md | Interrupted execution |
| All SUMMARY.md present, no VERIFICATION.md | Phase complete but unverified |
| RESEARCH.md without PLAN.md | Research done, planning needed |
| Phase in ROADMAP but no files | Phase not yet planned |

### State Integrity Check

Compare STATE.md claims against actual files on disk:

| STATE.md Claim | Actual Disk State | Verdict |
|---|---|---|
| Phase N is IN_PROGRESS | `phases/{N}-*/` directory doesn't exist | **State corruption** |
| Phase N is COMPLETE | No SUMMARY.md in `phases/{N}-*/` | **State corruption** |
| Current phase is N | ROADMAP.md shows different phase | **State mismatch** |

If any corruption or mismatch is detected, flag it prominently in the briefing and suggest `/fh:health --repair`.

### Git State
- Current branch name
- Uncommitted changes (`git status`)
- Unpushed commits (branch tracking status)
- Last commit message and timestamp

---

## Step 2: Present Briefing

Summarize concisely:

```
**Project:** {name from PROJECT.md or "No GSD project"}
**Branch:** {branch} ({N unpushed commits | up to date | no upstream})
**Position:** Phase {N} ({name}), plan {X} of {Y}
**Status:** {Plans 01-02 complete. Plan 03 not started.}
**Pending Todos:** {N pending todos (X high priority) | No pending todos}
**Last activity:** {date} — {what was done}
**Blockers:** {None | list from CONCERNS.md}
```

If uncommitted changes exist, flag them.

---

## Step 3: Route

Based on detected state, recommend next action:

| State | Recommendation |
|-------|---------------|
| Interrupted build (PLAN without SUMMARY) | "Continue with `/build`? Picks up from plan {X}." |
| Research done, no plans | "Research complete. Ready to `/plan-work`." |
| Plans ready, none executed | "Plans ready. Execute with `/build`." |
| Phase complete, unverified | "All plans done. Verify with `/verify {phase}`." |
| All phases done | "Milestone complete." Run milestone audit inline: aggregate phase verifications, check cross-phase integration, assess requirements coverage, then archive via `gsd-tools.cjs milestone complete`. |
| Uncommitted changes | "Uncommitted work in N files. Review before continuing?" |
| State corruption detected | "STATE.md is out of sync with actual files. Run `/fh:health --repair` to fix." |
| No `.planning/PROJECT.md` | "No project found. Run `/fh:new-project` to set up tracking." |
| No clear state | "No active work detected. What would you like to work on?" |

Present the recommendation. Wait for user to choose. Hand off to the chosen composite.
