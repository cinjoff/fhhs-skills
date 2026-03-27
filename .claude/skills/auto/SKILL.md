---
name: fh:auto
description: Run autonomous execution — plans, reviews, builds, and reviews each phase without human intervention. Use when the user says 'auto', 'run autonomously', 'hands-off', or 'walk away'.
user-invocable: true
---

Run fully autonomous multi-phase execution. Plans, reviews, builds, and reviews each phase without human intervention.

What to run autonomously: $ARGUMENTS

---

## Step 1: Validate Prerequisites

Check that the project is set up for autonomous execution:

1. **`.planning/PROJECT.md` exists** — if missing: "No project found. Run `/fh:new-project` first to set up project tracking." Stop.
2. **`.planning/ROADMAP.md` exists** — if missing: "No roadmap found. Run `/fh:new-project` to generate a roadmap." Stop.
3. **`.planning/STATE.md` exists** — if missing: "No state tracking found. Run `/fh:new-project` to initialize state." Stop.

Read STATE.md and ROADMAP.md to determine current position, total phases, and which phases are incomplete.

---

## Step 2: Strategic Requirements Workshop

Before autonomous execution, engage the user as a strategic advisor to shape and validate the project vision. This step ensures the autonomous pipeline builds the RIGHT thing, not just builds things.

**Skip this step if:**
- `--skip-workshop` or `--resume` flag is set
- User says "just go", "proceed", "start building", or similar
- All three conditions met: PROJECT.md has clear vision with north star, REQUIREMENTS.md has exhaustive requirements, ROADMAP.md has well-formed phases with no gaps

### 2.1: Load Existing Context

Read existing planning artifacts to understand what's already defined:
- `.planning/PROJECT.md` — vision, goals, differentiation
- `.planning/REQUIREMENTS.md` — requirements and success criteria
- `.planning/ROADMAP.md` — phases and scope
- `.planning/DESIGN.md` — brand/design context (from `/fh:ui-branding`)
- `.planning/research/` — existing research (FEATURES.md, PITFALLS.md, STACK.md, ARCHITECTURE.md, SUMMARY.md from `/fh:new-project`)

If DESIGN.md exists, use it throughout to ground UX/UI guidance in the project's actual brand direction — color palette, typography, component patterns, design language, tone. When suggesting UX patterns, frame them in the project's design context: "Your brand is {tone} — for that, the proven pattern is {X}" rather than generic advice.

If context-mode is available, index these via `ctx_batch_execute` for efficient search during the conversation.

If claude-mem is available, call `smart_search` with 2-3 keywords from the project domain (limit=5) to surface relevant past learnings, decisions, and session context. Present as: "From previous sessions, here's what we've learned that might matter..."

Identify what's well-defined vs what has gaps: missing vision, vague success criteria, no differentiation story, unclear scope ambition, missing UX/domain research, missing design context.

### 2.2: Domain Research

Do research BEFORE engaging the user. Informed questions beat open questions.

Use firecrawl (preferred), WebSearch (fallback), or WebFetch (fallback) to research:

- **Competitor analysis**: Search for similar tools/products. What do they do well? Where do users complain? What's missing from the market?
- **Community pain points**: Search forums, GitHub issues, Reddit, HN for discussions about problems in this domain. What do people struggle with? What do they wish existed?
- **Domain landscape**: What's the state of the art? What approaches have been tried? What failed and why?
- **User sentiment**: What do users of competing/similar tools actually say? Common frustrations, feature requests, praise?
- **UX/UI best practices**: Research established UX patterns for the target user type and product category. For a SaaS product: onboarding flows, pricing pages, dashboard layouts, settings organization, notification patterns. For a CLI tool: DX patterns. For a mobile app: platform conventions. Identify what "good" looks like in this category.
- **Established domain patterns**: What are the proven patterns for this type of product? What do best-in-class products do that users take for granted? These become the baseline — table stakes the project should match before trying to differentiate.

If `.planning/research/` already has research files, use those findings as the base. Only research gaps not already covered.

Present a **brief research summary** to the user: "Here's what I found about the landscape..." (3-5 key findings, competitors, pain points, established patterns). This grounds the conversation.

### 2.3: Strategic Conversation

Engage as a VC evaluating a startup pitch. Use research findings to drive concrete, informed discussions — not abstract open questions.

**Research-driven questions:**
- "Competitor X does {thing} — are you doing it better, differently, or not at all? Why?"
- "Users of {similar tool} consistently complain about {pain point} — is solving that part of your vision?"
- "The community is moving toward {trend} — does your roadmap account for that?"
- "Nobody in this space does {gap} — is that your moat?"
- "Here's what kills projects like this: {common failure mode}. How are you avoiding it?"

**Ambitious thinking (push for scope expansion):**
- "What's the north star? What does wild success look like in 6 months?"
- "If you could only ship ONE thing, what would make users tell their friends?"
- "What would make this a 10x solution, not a 1x?"
- "What are you afraid you're not thinking about?"

**Concrete directions based on research:**
- "Based on {finding}, you might want to consider {suggestion}"
- "Three directions this could go: (a) {option based on research}, (b) {option}, (c) {option} — which resonates?"
- "The biggest opportunity I see from the research is {X} — want to explore that?"

**UX/UI and domain guidance (use research + DESIGN.md):**
- If DESIGN.md exists: "Your design language is {tone/style} — for that brand, the proven {category} pattern is {X}. Does that fit your vision?"
- "For {product type}, the established pattern is {pattern} — are you following that or deliberately breaking from it?"
- "Best-in-class {category} products all have {feature} — that's table stakes, not differentiation"
- "Your target users ({user type}) expect {UX pattern} — have you accounted for that?"
- "Here are the proven patterns for {domain}: {list}. Which are you adopting, and where are you innovating?"
- If DESIGN.md is missing and the project has UI: suggest running `/fh:ui-branding` first, or help capture basic brand direction during the workshop.

**Strategic stress-testing (borrow from plan-work and plan-review):**
- "What big architectural bets are you making? What if they're wrong?"
- "What kills this project? What makes users leave?"
- "What would make this category-defining?"

Challenge safe/obvious answers. Push toward differentiation and ambition. Help users think bigger by offering concrete directions grounded in evidence.

### 2.4: Capture and Update

Update planning artifacts with the refined vision:
- Update PROJECT.md with clarified vision, north star, differentiation
- Update REQUIREMENTS.md with discovered requirements
- Optionally update ROADMAP.md if scope changed significantly

### 2.5: Confirm and Proceed

Get explicit approval: "Your vision is captured and the planning artifacts are updated. Ready to start autonomous execution?"

Only proceed to the orchestrator (Step 6) after the user confirms. If the user wants to iterate, return to 2.3.

---

## Step 3: Parse Arguments

Parse `$ARGUMENTS` for flags:

| Flag | Behavior |
|------|----------|
| `--resume` | Resume from last crash/stop point. Read STATE.md for the last completed step and continue from there. |
| `--phase N` | Run only phase N (skip all others). |
| `--dry-run` | Show what would run without executing. See Step 4. |
| `--budget N` | Set cost ceiling in dollars. Passed to the orchestrator as `--budget N`. |
| `--check-corrections` | Run decision correction cascade instead of normal execution. See Step 8. |
| `--skip-workshop` | Skip the Strategic Requirements Workshop (Step 2) and go straight to execution. |
| *(no flags)* | Run all incomplete phases from current position in STATE.md. |

Determine `START_PHASE` and `END_PHASE`:
- `--phase N`: both are N
- `--resume`: START_PHASE = phase from STATE.md's last position, END_PHASE = last phase in ROADMAP
- Default: START_PHASE = first incomplete phase, END_PHASE = last phase in ROADMAP

---

## Step 4: Dry-Run Mode

If `--dry-run` is set:

1. Read ROADMAP.md and STATE.md
2. List each phase that would execute (from START_PHASE to END_PHASE, skipping completed phases)
3. For each phase, show the per-phase loop steps:
   ```
   Phase N: {phase name}
     1. /fh:plan-work  → produces PLAN.md
     2. /fh:plan-review → HOLD SCOPE review
     3. /fh:build       → executes plan
     4. /fh:review --quick → final code review
     5. Update STATE.md via gsd-tools
   ```
4. Report total phases to execute and exit. Do not set AUTO_MODE or invoke the orchestrator.

---

## Step 5: Set AUTO_MODE

Enable autonomous advance so downstream skills (build, plan-work) make decisions without stopping:

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs config-set workflow.auto_advance true
```

Confirm the config was set successfully before proceeding.

---

## Step 6: Shell Out to Orchestrator

**Find the orchestrator path first** — it lives in the plugin cache, not in the project:

```bash
ORCHESTRATOR=$(find "$HOME/.claude/plugins/cache/fhhs-skills" -name "auto-orchestrator.cjs" 2>/dev/null | sort -V | tail -1)
if [ -z "$ORCHESTRATOR" ]; then
  echo "ERROR: auto-orchestrator.cjs not found in plugin cache"
  exit 1
fi
```

Then invoke it:

```bash
node "$ORCHESTRATOR" \
  --project-dir "$(pwd)" \
  --start-phase "${START_PHASE}" \
  --end-phase "${END_PHASE}" \
  ${BUDGET:+--budget $BUDGET} \
  ${DRY_RUN:+--dry-run} \
  ${RESUME:+--resume}
```

The orchestrator runs each phase through a sequential loop using `claude -p` for fresh-context sessions. Each session receives:
- `--plugin-dir` pointing to the fh plugin root (so `/fh:` skills are available)
- `--permission-mode bypassPermissions` (non-interactive, no prompts)
- `--append-system-prompt` with CLAUDE.md content (project context)
- A rich prompt with the phase goal and explicit autonomous instructions

```
Per-phase loop:
1. claude -p [rich prompt] --plugin-dir [...] --permission-mode bypassPermissions  → PLAN.md
2. claude -p [rich prompt] --plugin-dir [...] --permission-mode bypassPermissions  → HOLD review
3. claude -p [rich prompt] --plugin-dir [...] --permission-mode bypassPermissions  → build
4. claude -p [rich prompt] --plugin-dir [...] --permission-mode bypassPermissions  → quick review
5. Update STATE.md via gsd-tools (from projectDir/.claude/get-shit-done/bin/)
```

Each step is a separate `claude -p` session with fresh context. The orchestrator handles crash recovery, state persistence to `.planning/`, and budget tracking.

**Known pitfalls:**
- `claude -p` does NOT support `--cwd` — use spawn `cwd` option only
- `gsd-tools.cjs` must resolve from `projectDir/.claude/get-shit-done/bin/`, not `__dirname`
- Without `--plugin-dir`, `/fh:` skill commands are unavailable in `-p` sessions
- Without `--permission-mode bypassPermissions`, interactive prompts hang the process
- Bare skill invocations (e.g. `/fh:plan-work`) alone are insufficient — include phase goal and autonomy instructions

Monitor the orchestrator's stdout for progress updates. If the orchestrator exits with a non-zero code, read its error output and report the failure point.

---

## Step 7: Completion or Interruption

Whether the orchestrator completes successfully or is interrupted, always:

1. **Reset AUTO_MODE:**
   ```bash
   node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs config-set workflow.auto_advance false
   ```

2. **Report final state:**
   - Phases completed (e.g., "Completed phases 3-5 of 8")
   - Total decisions logged to `.planning/DECISIONS.md`
   - Any LOW confidence decisions that need human review (flagged with `⚠ NEEDS REVIEW`)
   - If interrupted: the exact stop point so `--resume` can pick up

3. **Read final STATE.md** and confirm it reflects the orchestrator's last successful step.

---

## Step 8: Decision Correction Cascade (`--check-corrections`)

When invoked with `--check-corrections`, the orchestrator runs in a separate mode that does NOT execute the normal phase loop. Instead:

1. Reads `.planning/DECISIONS.md` for entries with `Status: CORRECTED`
2. For each CORRECTED entry, parses the `Affects` field to identify impacted artifacts
3. Classifies each correction as **Mechanical** (string/config changes) or **Architectural** (design changes)
4. Mechanical corrections are auto-fixed via `claude -p` sessions targeting the affected files
5. Architectural corrections produce a `.planning/CORRECTION-PLAN.md` for manual review
6. Logs a cascade analysis decision entry summarizing what was processed

Invoke via:
```bash
node .claude/skills/auto/auto-orchestrator.cjs --project-dir "$(pwd)" --check-corrections
```

This mode is useful after a human reviews DECISIONS.md and marks entries as CORRECTED — the cascade propagates those corrections to affected artifacts automatically where possible.
