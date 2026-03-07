---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

## CRITICAL CONSTRAINTS

**You MUST NOT call `EnterPlanMode` or `ExitPlanMode` during this skill.** This skill operates in normal mode, executing a plan that already exists on disk. Plan mode is unnecessary and dangerous here — it restricts Write/Edit tools needed for implementation.

# Executing Plans

## Overview

Load plan, review critically, execute tasks in batches, report for review between batches.

**Core principle:** Batch execution with checkpoints for architect review.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## GSD Integration

**Before anything else, check for GSD project tracking:**

1. Check if `.planning/PROJECT.md` exists
2. **If GSD active:**
   - Read `.planning/STATE.md` for current phase/plan position
   - Read `.planning/ROADMAP.md` for phase goals and requirements
   - Plans live in `.planning/phases/XX-name/XX-NN-PLAN.md` — look there first
   - If `.planning/phases/{phase}/{phase}-CONTEXT.md` exists, honor locked decisions
   - After completion (Step 5), update STATE.md: `node ./.claude/get-shit-done/bin/gsd-tools.cjs state record-session --stopped-at "Completed {phase}-{plan}"`
3. **If no GSD:** Plans live in `docs/plans/` — use original paths

## The Process

### Step 0: Verify Workspace (Worktree Check)

Before calling `using-git-worktrees`, check if a worktree already exists:

1. Run `git worktree list` to see all existing worktrees
2. If a worktree for the plan's branch already exists: **cd into it — do NOT create a new one**
3. If on main/master with no worktree: **REQUIRED SUB-SKILL:** Use `using-git-worktrees` to create one

### Step 1: Load and Review Plan
1. **Find the plan:**
   - If GSD active: check `.planning/phases/` for incomplete plans (PLAN without matching SUMMARY)
   - If user specified a path, use that
   - Otherwise: check `docs/plans/` for the most recent plan
2. Read plan file
3. Review critically - identify any questions or concerns about the plan
4. If concerns: Raise them with your human partner before starting
5. If no concerns: Proceed

### Step 2: Execute Batch
**Default: First 3 tasks**

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Report
When batch complete:
- Show what was implemented
- Show verification output
- Say: "Ready for feedback."

### Step 4: Continue
Based on feedback:
- Apply changes if needed
- Execute next batch
- Repeat until complete

### Step 5: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker mid-batch (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Between batches: just report and wait
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**GSD tracking:** If GSD is active, prefer using composite commands (`/build`, `/plan`) which handle state management automatically. This skill is the standalone Superpowers alternative.

**Required workflow skills:**
- **using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **writing-plans** - Creates the plan this skill executes
- **finishing-a-development-branch** - Complete development after all tasks
