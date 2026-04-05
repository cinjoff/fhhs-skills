# Design Agent Protocol

Mandatory 7-step pattern all design agents follow. Reference this file instead of inlining the steps.

**Reading this file efficiently:** Use `smart_unfold({path: "shared/design-agent-protocol.md", symbol: "Step N"})` to load just the step you need.

---

## Overview

Each design agent receives a specific dimension (e.g., "make it bolder", "polish spacing", "harden for edge cases"). The agent executes these 7 steps in order. Steps 1–3 are preparation; steps 4–6 are execution; step 7 is verification.

---

## Step 1: Gather Context

Collect the inputs needed to make informed design decisions.

**When dispatched from auto-orchestrator (non-interactive):**
- Extract target scope and constraints from the dispatch prompt
- Identify which files / components are in scope
- Note any explicit instructions or restrictions from the dispatch

**When invoked interactively (user-facing):**
- Attempt to gather context from the current thread and codebase first
- If you cannot find *exact* information and must infer, confirm with `{{ask_instruction}}` before proceeding
- If confidence is medium or lower on any critical input (target audience, brand personality, use-case), ask clarifying questions via `{{ask_instruction}}`
- Do NOT proceed until you have answers — guessing leads to generic AI slop

**Always gather:**
- Target audience and use-case (critical)
- Brand personality / tone (if available)
- Which components or pages are in scope
- Any known constraints (accessibility, performance, brand guidelines)

---

## Step 2: Load Design Principles

Load the Impeccable design framework before making any design decisions.

```
Read skills/frontend-design/PROMPT.md
```

This file contains:
- Core design principles and DO's
- Full anti-patterns checklist (the DON'T list)
- AI slop detection patterns (cyan/purple gradients, glassmorphism, gradient text, hero metrics, identical card grids, bounce easing, etc.)

**Do NOT proceed until you have read this file and internalized the anti-patterns list.** Violating these constraints produces generic AI slop regardless of intent.

---

## Step 3: Load Project Design Context

Load the project's established design direction, if available.

```
If .planning/DESIGN.md exists:
  Read .planning/DESIGN.md
  Use it to calibrate all decisions — color palette, typography, component patterns,
  design language, tone, and spacing scale.
  Frame suggestions in the project's actual brand context, not generic advice.
Else:
  Proceed without it. Note the absence — suggest running /fh:ui-branding if the
  project has substantial UI and DESIGN.md is missing.
```

---

## Step 4: Assess Current State

Analyze the codebase against the specific design dimension this agent owns.

1. Use **Pattern B from `shared/claude-mem-rules.md`** to explore file structure without loading everything:
   - `smart_outline({path})` before reading any file
   - `smart_unfold({path, symbol})` to read specific components
   - Only `Read` full files when you need to `Edit` them

2. Use **Pattern A from `shared/claude-mem-rules.md`** to surface prior decisions and gotchas relevant to this dimension.

3. Identify specific issues, gaps, or improvement opportunities against the design dimension criteria (defined per-agent).

4. Prioritize by impact: what changes will produce the most noticeable improvement?

---

## Step 5: Plan Improvements

Draft the set of changes to implement.

**If interactive (user present):**
- Present the plan to the user before executing
- List specific files and changes
- Flag any trade-offs or irreversible decisions
- Wait for approval or adjustments

**If AUTO_MODE (dispatched non-interactively):**
- Auto-decide based on the assessment, design principles (Step 2), and project context (Step 3)
- Document decisions inline as comments or in a brief summary
- Prefer safe, reversible changes when uncertain
- Skip changes that would require user input to resolve ambiguity

**In both modes:**
- Reject any improvement that introduces an anti-pattern from `frontend-design/PROMPT.md`
- Check that changes align with `.planning/DESIGN.md` (if loaded)
- Scope changes to the design dimension — don't fix unrelated issues

---

## Step 6: Implement Changes

Execute the planned changes.

- Make targeted edits — don't rewrite files unnecessarily
- Maintain existing code style and naming conventions
- Preserve functional behavior — design changes only, no logic changes
- If a change requires touching many files, prefer a systematic approach (update design tokens / shared components first, then consumers)
- Remove any anti-patterns introduced during implementation immediately

---

## Step 7: Verify Quality

Confirm the changes meet the design dimension criteria and introduce no regressions.

**Check against the specific design dimension** (defined per-agent — e.g., polish agents verify alignment/spacing/states; harden agents verify edge cases/i18n/errors).

**Always check:**
- No anti-patterns from `frontend-design/PROMPT.md` were introduced
- Changes are consistent with `.planning/DESIGN.md` (if it exists)
- Responsive behavior is preserved (test key breakpoints mentally)
- Accessibility is maintained or improved (contrast ratios, focus indicators, ARIA)
- No functional regressions (the component still does what it did before)

**Output a brief summary** of what was changed and why, suitable for the orchestrator's task log.
