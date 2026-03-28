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

1. **`.planning/PROJECT.md` exists** — if missing, check for startup artifacts first:
   - If `.planning/startup/` exists: "Found startup validation artifacts but no project setup. Run `/fh:new-project` to create the project — it will auto-populate from your startup data." Stop.
   - If no `.planning/` at all: "No project found. Consider running `/fh:startup-design` first to validate your idea, then `/fh:new-project` to set up the project. Or run `/fh:new-project` directly if you're ready to build." Stop.
2. **`.planning/ROADMAP.md` exists** — if missing: "No roadmap found. Run `/fh:new-project` to generate a roadmap." Stop.
3. **`.planning/STATE.md` exists** — if missing: "No state tracking found. Run `/fh:new-project` to initialize state." Stop.

Read STATE.md and ROADMAP.md to determine current position, total phases, and which phases are incomplete.

---

## Step 1.5: Tracker Registration

Register the current project with the live dashboard and surface the URL if it's running.

```bash
# Ensure tracker directory exists
mkdir -p "$HOME/.claude/tracker"

# Register project in global registry
node -e "
const fs = require('fs');
const path = require('path');
const registryPath = path.join(process.env.HOME, '.claude', 'tracker', 'projects.json');
let registry = [];
try { const d = JSON.parse(fs.readFileSync(registryPath, 'utf8')); if (Array.isArray(d)) registry = d; } catch {}
const projectDir = process.cwd();
const now = new Date().toISOString();
const idx = registry.findIndex(e => e.path === projectDir);
if (idx >= 0) { registry[idx].lastSeen = now; } else { registry.push({ path: projectDir, name: path.basename(projectDir), addedAt: now, lastSeen: now }); }
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
"
```

Then check if the live dashboard is running:

```bash
# Attempt HTTP GET to tracker API with 2s timeout
node -e "
const http = require('http');
const projectDir = process.cwd();
const projectName = require('path').basename(projectDir);
const req = http.get('http://localhost:4111/api/state', { timeout: 2000 }, (res) => {
  if (res.statusCode === 200) {
    // Dashboard is running — register this project
    const postData = JSON.stringify({ path: projectDir, name: projectName });
    const postReq = http.request({
      hostname: 'localhost',
      port: 4111,
      path: '/api/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, () => {});
    postReq.on('error', () => {});
    postReq.write(postData);
    postReq.end();
    console.log('TRACKER_RUNNING');
  } else {
    console.log('TRACKER_NOT_RUNNING');
  }
});
req.on('error', () => console.log('TRACKER_NOT_RUNNING'));
req.on('timeout', () => { req.destroy(); console.log('TRACKER_NOT_RUNNING'); });
" 2>/dev/null
```

- If output is `TRACKER_RUNNING`: print `Live dashboard running at http://localhost:4111 — open it to watch progress`
- If output is `TRACKER_NOT_RUNNING`: check if tracker files exist and auto-start:

```bash
[ -f "$HOME/.claude/tracker/server.cjs" ] && echo "TRACKER_FILES_EXIST" || echo "TRACKER_NO_FILES"
```

  - If `TRACKER_FILES_EXIST`: kill any stale process and start the server:

    ```bash
    lsof -ti :4111 -s TCP:LISTEN | xargs kill 2>/dev/null; echo "port cleared"
    ```

    Then start the server with `run_in_background: true`:

    ```bash
    TRACKER_REGISTRY=~/.claude/tracker/projects.json node ~/.claude/tracker/server.cjs
    ```

    Print `Live dashboard started at http://localhost:4111 — open it to watch progress`

  - If `TRACKER_NO_FILES`: print `Tip: Run \`/fh:tracker\` to set up the live dashboard`

This step always succeeds — tracker errors are non-fatal.

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
- `.planning/startup/` — startup validation artifacts (from `/fh:startup-design`). If present, pre-index all startup artifacts alongside planning files. Market data, competitors, positioning, and financial projections should inform every phase's planning context.

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
| `--concurrency N` | Max parallel claude -p sessions (default 2, max 4). Higher values increase throughput but also API cost. |
| `--no-speculative` | Disable speculative planning pipeline — fall back to fully sequential execution identical to pre-parallel behavior. Use if parallel mode causes issues. |
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
3. Show the pipeline structure:
   ```
   Phase range: 4–7 (4 phases)
   Dependency analysis: (computed after planning wave)

   Pipeline plan:
     Wave 1 (planning): Phase 4, Phase 5, Phase 6, Phase 7 [concurrent, max 2]
     Wave 2 (review):   Phase 4, Phase 5, Phase 6, Phase 7 [concurrent, max 2]
     Wave 3 (build):    dependency-ordered (computed from plan files_modified)
     Quick reviews:     batched every 3 phases

   Note: Actual build order depends on file overlap between plans.
   Use --no-speculative for guaranteed sequential execution.
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

The orchestrator runs phases using `claude -p` for fresh-context sessions. Each session receives:
- `--plugin-dir` pointing to the fh plugin root (so `/fh:` skills are available)
- `--permission-mode bypassPermissions` (non-interactive, no prompts)
- `--append-system-prompt` with CLAUDE.md content (project context)
- Testing enforcement: "Every phase build must include tests for business logic. Build Step 2.5 auto-generates test specs from plan must_haves. plan-work rejects plans without test coverage for business logic (check 7). UI phases should include E2E tests using Playwright. Coverage metrics are tracked in SUMMARY.md test_metrics field."
- A rich prompt with the phase goal and explicit autonomous instructions

```
Pipeline execution (default):
1. Pre-index shared docs (PROJECT, ROADMAP, research, codebase mapping)
2. Planning wave: all phases plan concurrently via ConcurrencyPool
   - Phase-local decisions (.decisions-pending.md), merged after wave
   - Dependency graph computed from plan frontmatter files_modified
3. Review wave: all plans reviewed concurrently
4. Build wave: phases built in dependency-wave order
   - Phases with no file overlap build concurrently within each wave
   - Phases with dependencies wait for predecessor waves to complete
   - Each build preceded by speculative plan validation (file overlap check)
   - Post-wave batched review for all phases built in that wave
     Test metrics:   coverage tracked per phase in SUMMARY.md test_metrics
5. Final review + state update

Sequential fallback (--no-speculative):
Per-phase loop (unchanged from pre-parallel behavior):
1. claude -p → PLAN.md
2. claude -p → HOLD review
3. claude -p → build
4. claude -p → quick review
5. Update STATE.md
```

Each step is a separate `claude -p` session with fresh context. The orchestrator handles crash recovery, state persistence to `.planning/`, and budget tracking.

**Known pitfalls:**
- `claude -p` does NOT support `--cwd` — use spawn `cwd` option only
- `gsd-tools.cjs` must resolve from `projectDir/.claude/get-shit-done/bin/`, not `__dirname`
- Without `--plugin-dir`, `/fh:` skill commands are unavailable in `-p` sessions
- Without `--permission-mode bypassPermissions`, interactive prompts hang the process
- Bare skill invocations (e.g. `/fh:plan-work`) alone are insufficient — include phase goal and autonomy instructions
- Without `CLAUDE_MEM_PROJECT` env var, claude-mem stores observations under the plugin-dir project name instead of the actual project name, causing observation misattribution across projects
- Project name uses `git rev-parse --git-common-dir` (not `--show-toplevel`) to resolve actual repo name in Conductor worktrees (e.g., "fh-starter-project" not "havana")

**Resilience features (built into orchestrator):**
- **Stuck detection:** Sessions producing no output for 3min get warned, killed at 8min silence — prevents API stalls from running to the 45min hard timeout
- **API health check:** Before each session spawn, verifies `claude --version` responds. On failure, retries with exponential backoff (10s → 20s → 40s → 80s → 120s) up to 5 times before aborting with saved state
- **API error classification:** Distinguishes API/infra errors (connection refused, 502/503, rate limit) from logic errors. Orchestrator-initiated kills (stuck/timeout) are NOT classified as API errors — they skip health check backoff.
- **Smart resume:** `--resume` checks both `.auto-state.json` AND existing SUMMARY.md artifacts. If a phase has SUMMARY.md but the state file says incomplete (crashed between build and state update), skips ahead automatically.
- **Error log persistence:** On failure, writes `{step}-error.log` to the phase directory with full stdout/stderr tail for post-mortem analysis
- **Partial SUMMARY:** When a build session is killed (stuck/timeout), writes `PARTIAL-SUMMARY.md` with last output — preserves diagnostic context even for incomplete builds
- **Decision context:** Skip decisions include stdout tail (last 20 lines) in the context field, not just exit codes

Monitor the orchestrator's stdout for progress updates. If the orchestrator exits with a non-zero code, read its error output and report the failure point.

---

## Parallelism Details

### Dependency Graph

The orchestrator computes a dependency graph from plan frontmatter after the planning wave completes. Each PLAN.md may include a `files_modified` list. Two phases are considered dependent if their `files_modified` sets overlap — meaning they touch the same files and cannot safely build in parallel. Independent phases (no overlapping files) can build concurrently within the concurrency limit.

### Speculative Plan Validation

Before each build session in the build wave, the orchestrator performs a file overlap check:
1. Compare the phase's planned `files_modified` against files already modified by earlier builds in the same wave.
2. If overlap is detected, trigger a validation session (`claude -p`) that re-evaluates the plan against the actual post-build state.
3. If the plan is still valid, proceed. If not, fall back to REPLAN: re-run the planning step for this phase before building.

Use `--no-speculative` to skip this check and always build in strict dependency order without validation sessions.

### Phase-Local Decisions

During the concurrent planning wave, multiple sessions may attempt to update `.planning/DECISIONS.md` simultaneously, causing write races. To prevent this:
- Each planning session writes its decisions to `.decisions-pending.md` in the phase directory instead of the shared DECISIONS.md.
- After the planning wave completes, the orchestrator merges all `.decisions-pending.md` files into `.planning/DECISIONS.md` in a single serial step.
- This guarantees DECISIONS.md integrity without file locking.

### Context-Mode Pre-Indexing

Shared documents (PROJECT.md, ROADMAP.md, research files, codebase mapping) are indexed once before any wave begins using context-mode's `ctx_batch_execute`. Concurrent sessions then use `ctx_search` in read-only mode to query the shared index. This prevents SQLite write contention that would occur if each parallel session independently indexed the same files.

### Partial Failure Handling

If a phase fails during the build wave:
- Phases that depend on the failed phase (via the dependency graph) are rescheduled to sequential execution after the wave completes.
- Phases that are independent of the failed phase continue running concurrently without interruption.
- The failed phase is logged as `failed` in the per-phase state map and can be retried via `--resume`.

### Parallel-Aware Resume (`--resume`)

In parallel mode, `--resume` uses a per-phase state map (`.auto-state.json`) that tracks each phase's status individually:

| Status | Meaning |
|--------|---------|
| `planned` | PLAN.md produced, not yet reviewed |
| `reviewed` | Plan reviewed and approved |
| `built` | Build complete, SUMMARY.md exists |
| `failed` | Session exited non-zero |
| `blocked` | Waiting on a failed dependency |

On resume, the orchestrator reconstructs the dependency graph from existing PLAN.md files and re-enters the pipeline at the earliest incomplete wave, skipping phases already in `built` state.

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
