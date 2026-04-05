# /plan Dry-Run Trace

**User prompt:** "I want to plan real-time task status updates using Supabase Realtime so team members see changes instantly without refreshing"

---

## Pre-flight: Dependency Check

**Action:** Read `references/dependency-check.md` from the fhhs-skills plugin directory.

**Check:** Does `.planning/PROJECT.md` exist?

**Result:** YES -- `.planning/PROJECT.md` exists and describes "TaskFlow," a task management SaaS on Next.js / TypeScript / Tailwind / Supabase.

**Proceed.** Read the three companion files:

| File | Key Takeaway |
|------|-------------|
| `STATE.md` | Current phase: `01-auth`, plan 1 of 2, status in_progress |
| `ROADMAP.md` | Four phases: 01-Auth, 02-Boards, 03-Tasks, 04-Dashboard. No phase covers real-time. |
| `CONTEXT.md` | Does not exist yet for any phase. |

Also noted: `PROJECT.md` explicitly lists "Real-time collaboration" under **Out of scope** for v1. This is significant -- the orchestrator would flag it.

---

## Step 0: Phase Matching

**Action:** Compare "$ARGUMENTS" (`real-time task status updates using Supabase Realtime`) against every phase in ROADMAP.md.

| Phase | Name | Match? |
|-------|------|--------|
| 01 | Auth | No -- auth is about signup/login/sessions |
| 02 | Boards | No -- CRUD boards and permissions |
| 03 | Tasks | Partial -- task status tracking exists, but "real-time" is a distinct cross-cutting concern |
| 04 | Dashboard | No -- aggregate stats page |

**Verdict: No clean match.** Phase 03 (Tasks) covers task CRUD and status tracking, but Supabase Realtime subscriptions are an orthogonal capability that touches multiple surfaces (task boards, dashboard, possibly boards).

**Additionally:** PROJECT.md lists "Real-time collaboration" as out of scope for v1. The orchestrator would surface this conflict:

> "This doesn't match any existing phase. Also, PROJECT.md lists real-time collaboration as out of scope for v1.
>
> Options:
> 1. Add as a new phase (e.g., Phase 05: Realtime) to the roadmap
> 2. Fold into the current phase (01-auth) -- not recommended, unrelated
> 3. Fold into Phase 03 (Tasks) as an enhancement
> 4. Revise the v1 scope in PROJECT.md first, then plan
>
> Which would you prefer?"

**For this dry run, assume the user says:** "Add it as Phase 05: Realtime. Update the scope too."

**Orchestrator actions:**
1. Update `PROJECT.md` scope section to remove "Real-time collaboration" from out-of-scope (or note it's now in scope for v1.1)
2. Add Phase 05 to `ROADMAP.md`:
   ```
   | 05 | Realtime | Live task status updates via Supabase Realtime | Planned |
   ```
3. Add a phase detail section:
   ```
   ## Phase 05: Realtime
   **Goal:** Team members see task status changes in real time without page refresh.
   **Success Criteria:**
   - Task status changes propagate to all connected clients within 2 seconds
   - No full page reload required to see updates
   - Graceful fallback when WebSocket connection drops
   **Requirements:** RT-01, RT-02, RT-03
   ```
4. Add requirements to `REQUIREMENTS.md`:
   ```
   | RT-01 | Task status changes broadcast to all board viewers in real time | 05 |
   | RT-02 | Connection status indicator shows online/offline state | 05 |
   | RT-03 | Missed updates sync when reconnecting | 05 |
   ```
5. Create directory: `.planning/phases/05-realtime/`
6. Hold target phase = `05-realtime` for the output path in Step 5.

---

## Step 1: Research (if needed)

**Detection logic:** The request involves:
- **Supabase Realtime** -- an external service with specific API patterns (channels, subscriptions, Postgres Changes)
- **WebSocket lifecycle** -- connection, reconnection, cleanup in React/Next.js
- **Row-Level Security interaction** -- how RLS policies interact with Realtime subscriptions
- **Next.js App Router** -- client vs server component boundaries for subscriptions

**Verdict: Research IS needed.** This is not a "well-known pattern" -- Supabase Realtime has specific constraints (RLS requirements for Postgres Changes, channel configuration, subscription cleanup in React). Designing without research risks brainstorming in a vacuum.

**Orchestrator announces:** "This needs technical research before design -- researching first."

### Research Subagent Dispatch

**Subagent type:** `Task` (as specified by the /plan command)

**Subagent instructions (what the orchestrator passes):**

```
Research questions:
1. How does Supabase Realtime work with Postgres Changes? What table/event filters are available?
2. How do RLS policies interact with Realtime subscriptions? Does the subscriber need to pass a JWT? How does row-level filtering work?
3. What is the recommended pattern for Supabase Realtime in Next.js App Router (client components, useEffect cleanup, reconnection)?
4. What are the known pitfalls (stale closures, duplicate subscriptions, connection limits on free tier)?
5. Does Supabase Realtime support presence (for showing who's viewing a board)?

Tools to use:
- Firecrawl for web search (Supabase Realtime docs, blog posts, known issues)
- Context7 for library documentation (@supabase/supabase-js Realtime API reference)

Output: Write findings to `.planning/research/supabase-realtime.md` with:
- Prescriptive recommendations (not just facts)
- Stack decisions (e.g., Postgres Changes vs Broadcast vs Presence)
- Pitfalls and mitigations
- Code examples for subscription setup and teardown in React
```

**Expected research output** (written to `.planning/research/supabase-realtime.md`):
- Supabase Realtime offers three modes: Broadcast, Presence, Postgres Changes
- For task status updates, **Postgres Changes** is the right mode -- it fires on INSERT/UPDATE/DELETE on specific tables
- RLS policies MUST be enabled on the table for Postgres Changes to respect row-level access
- The client must be initialized with the user's JWT (anon key + auth session) for RLS to filter correctly
- In Next.js App Router: subscriptions MUST live in client components (`"use client"`); use `useEffect` with cleanup to unsubscribe
- Free tier: 200 concurrent connections, 2 channels per client recommended
- Pitfall: stale closures in React -- use `useRef` for mutable state or event-based patterns
- Presence is available but separate from Postgres Changes -- could use for "who's online" later

---

## Step 2: Brainstorm

**Action:** Invoke `skills/brainstorming/SKILL.md`. Follow the full checklist:

### 2.1 Explore project context

The brainstorming skill reads:
- `.planning/PROJECT.md` -- TaskFlow, Supabase stack (already a fit)
- Existing code structure -- `src/lib/supabase.ts` (client wrapper from Phase 01)
- `src/middleware.ts` -- auth middleware (confirms JWT/session is available)
- Research findings from `.planning/research/supabase-realtime.md`
- No `.planning/DESIGN.md` exists (no design system defined yet), so skip design context incorporation

### 2.2 Ask clarifying questions (one at a time)

The brainstorming agent would ask questions like:

**Q1:** "Which task events should trigger real-time updates?
- (a) Status changes only (e.g., todo -> in_progress -> done)
- (b) All task mutations (status, title, assignee, description)
- (c) Status + assignee changes
I'd recommend (a) for v1 -- keeps the subscription filter tight and reduces noise."

**Q2:** "Where should real-time updates appear?
- (a) Board view only (the Kanban/list where tasks live)
- (b) Board view + Dashboard
- (c) Everywhere tasks are displayed
I'd recommend (a) -- board view is the primary workspace. Dashboard can poll or hydrate on load."

**Q3:** "How should updates be shown to the user?
- (a) Silently move the task card (optimistic, no notification)
- (b) Highlight the changed card briefly (e.g., flash/pulse animation)
- (c) Toast notification + card update
I'd recommend (b) -- makes changes visible without being disruptive."

**Q4:** "Should we show a connection status indicator?
- (a) Yes, subtle indicator in the board header
- (b) Only show when disconnected (error state)
- (c) No indicator
I'd recommend (b) -- don't clutter the UI when things are working."

### 2.3 Propose 2-3 approaches

**Approach A (Recommended): Postgres Changes on tasks table**
- Subscribe to `UPDATE` events on the `tasks` table, filtered by `board_id`
- Client component wraps the board view, manages subscription lifecycle
- On event: update local state (React state or Zustand store) to reflect the change
- Pros: Simple, RLS-aware, minimal infrastructure
- Cons: One subscription per board the user is viewing

**Approach B: Broadcast channel per board**
- Use Supabase Broadcast to send custom messages when a task changes
- Server-side: after any task mutation API call, broadcast the change
- Client-side: subscribe to the board's broadcast channel
- Pros: More control over payload shape, works without RLS on Realtime
- Cons: Requires server-side broadcast logic, duplicates mutation events

**Approach C: Hybrid (Postgres Changes + Presence)**
- Postgres Changes for task updates (same as A)
- Add Presence to show who is currently viewing the board
- Pros: Richer collaboration feel
- Cons: More complexity, Presence is a separate concern

**Recommendation:** Approach A for this plan. Presence (from C) can be a follow-up.

### 2.4 Present design (section by section, wait for approval after each)

**Section 1: Subscription Architecture**
- Create a `useRealtimeBoard(boardId)` custom hook in `src/hooks/useRealtimeBoard.ts`
- Hook subscribes to `supabase.channel('board:${boardId}').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks', filter: 'board_id=eq.${boardId}' }, callback)`
- Cleanup: `useEffect` return unsubscribes the channel
- The hook returns updated task data and a connection status flag

**Section 2: State Integration**
- Board view component uses `useRealtimeBoard` alongside initial data fetch
- On receiving a change event: merge the updated task into local state
- Optimistic updates: when the current user changes a task, update locally immediately; Realtime event from Postgres confirms it (or corrects if failed)

**Section 3: UI Feedback**
- Changed task cards receive a brief highlight animation (CSS transition, `ring-2 ring-blue-400` for 2 seconds)
- Disconnection: show a small banner at the top of the board ("Reconnecting...") when the channel status is `CLOSED` or `CHANNEL_ERROR`

**Section 4: Database Setup**
- Enable Realtime on the `tasks` table via Supabase dashboard or migration
- Ensure RLS policies on `tasks` allow SELECT for board members (should already exist from Phase 03)

### 2.5 Write design doc

**Output:** `.planning/designs/2026-03-06-realtime-task-updates.md`

Contains the approved design from all sections above.

**Gate: Wait for user approval before continuing to Step 3.**

---

## Step 3: Discuss Implementation

**Skip check:** Does `.planning/phases/05-realtime/05-CONTEXT.md` exist? No -- so we proceed.

### 3.1 Scout codebase for reusable assets

- `src/lib/supabase.ts` -- existing Supabase client wrapper (from Phase 01). Can be reused for Realtime subscriptions.
- `src/middleware.ts` -- auth middleware. Not directly reused, but confirms session/JWT is available client-side.
- Task-related components/types (from Phase 03, assumed to exist by the time Phase 05 runs) -- task type definitions, board view component.

### 3.2 Identify 3-4 gray areas

1. **State management for real-time merges** -- Should the board view use React state, a context provider, or a state manager like Zustand for handling incoming Realtime events? Trade-off: simplicity vs. avoiding prop drilling for deeply nested task cards.

2. **Subscription scope** -- Subscribe per-board (one channel when viewing a board) or subscribe globally (one channel for all the user's boards)? Trade-off: bandwidth/connection count vs. cross-view updates.

3. **Optimistic update conflict resolution** -- When the current user updates a task and a Realtime event arrives for the same task, how do we avoid flicker or double-updates? Trade-off: complexity of deduplication vs. occasional visual glitch.

4. **Error recovery UX** -- When the WebSocket drops, should we (a) auto-refetch all tasks on reconnect, (b) rely on Realtime catching up, or (c) show a "refresh" button? Trade-off: data freshness guarantee vs. bandwidth.

### 3.3 Ask user which to discuss

Orchestrator presents the 4 gray areas and asks: "Which of these would you like to deep-dive? Pick 1-2 and I'll present options with trade-offs."

**Assume user picks:** #1 (state management) and #4 (error recovery).

### 3.4 Deep-dive selected areas

**Gray Area #1: State management**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A: Local useState | Board component holds tasks in useState, Realtime callback updates via setter | Simple, no dependencies | Prop drilling for nested components; callback closure issues |
| B: React Context | TaskBoardContext provides tasks + dispatch; Realtime events dispatch updates | Clean API for nested components | Context re-renders entire tree on any change |
| C: Zustand store | `useBoardStore` with tasks map; Realtime events call store actions | Surgical re-renders, easy to test | Extra dependency, slight learning curve |

**Recommendation:** Option A for now (YAGNI). The board component tree is shallow enough. Upgrade to Zustand in a future phase if performance becomes an issue.

**Assume user agrees with A.**

**Gray Area #4: Error recovery**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A: Auto-refetch on reconnect | When channel status returns to SUBSCRIBED, fetch all tasks for the board | Guarantees data freshness | Extra API call, brief loading state |
| B: Trust Realtime catchup | Supabase Realtime may replay missed events on reconnect | No extra API call | Not guaranteed by Supabase; could miss events |
| C: Manual refresh button | Show "You were offline. Click to refresh." | User is in control | Extra click, stale data until clicked |

**Recommendation:** Option A. One extra fetch is cheap and guarantees consistency. Show "Reconnected" banner briefly.

**Assume user agrees with A.**

### 3.5 Lock decisions in CONTEXT.md

**Output:** `.planning/phases/05-realtime/05-CONTEXT.md`

```markdown
# Phase 05: Realtime -- Context & Decisions

## Design Decisions (Locked)

1. **State management:** Use local `useState` in the board component. Realtime callback updates state directly via setter. No external state library.
2. **Subscription scope:** Per-board subscription. One channel created when the board view mounts, unsubscribed on unmount.
3. **Error recovery:** Auto-refetch all board tasks when the channel status transitions back to `SUBSCRIBED` after a disconnection.
4. **Realtime mode:** Postgres Changes (not Broadcast or Presence).
5. **UI feedback:** Brief highlight animation on changed cards. Disconnection banner when channel is in error state.

## Deferred

- Presence (who's viewing the board) -- separate follow-up phase
- Cross-board real-time updates (global subscription) -- not needed for v1
```

---

## Step 4: Derive must_haves

From the approved design, extract must_haves:

### Truths (3-5 observable, user-facing statements)

1. "When a team member changes a task's status on a board, all other members viewing that board see the change within 2 seconds without refreshing."
2. "A task card that was updated by another user briefly highlights to draw attention to the change."
3. "When the real-time connection drops, a reconnection banner appears on the board view; when it reconnects, the board data refreshes automatically."

### Artifacts

| path | provides | contains |
|------|----------|----------|
| `src/hooks/useRealtimeBoard.ts` | Custom hook for Supabase Realtime subscription per board | `useRealtimeBoard` |
| `src/components/board/RealtimeTaskCard.tsx` | Task card wrapper with highlight animation on update | `highlight` or `animate` |
| `src/components/board/ConnectionStatus.tsx` | Reconnection banner component | `ConnectionStatus` |
| `supabase/migrations/XXXX_enable_realtime_tasks.sql` | Migration to enable Realtime on tasks table | `supabase_realtime` or `alter publication` |

### Key links

| from | to | via |
|------|----|-----|
| `src/hooks/useRealtimeBoard.ts` | `src/lib/supabase.ts` | import (Supabase client) |
| `src/components/board/BoardView.tsx` (existing) | `src/hooks/useRealtimeBoard.ts` | import + hook call |
| `src/components/board/BoardView.tsx` | `src/components/board/RealtimeTaskCard.tsx` | renders task cards |
| `src/components/board/BoardView.tsx` | `src/components/board/ConnectionStatus.tsx` | renders connection banner |

---

## Step 5: Create Plan

**Output path:** `.planning/phases/05-realtime/05-01-PLAN.md`

(Phase = 05-realtime from Step 0; plan number = 01 since no existing plans in this phase directory.)

### Plan content (draft)

```yaml
---
phase: 05-realtime
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/hooks/useRealtimeBoard.ts
  - src/components/board/RealtimeTaskCard.tsx
  - src/components/board/ConnectionStatus.tsx
  - src/components/board/BoardView.tsx
  - supabase/migrations/XXXX_enable_realtime_tasks.sql
  - src/hooks/__tests__/useRealtimeBoard.test.ts
autonomous: true

must_haves:
  truths:
    - "When a team member changes a task's status on a board, all other members viewing that board see the change within 2 seconds without refreshing."
    - "A task card updated by another user briefly highlights to draw attention."
    - "When the real-time connection drops, a reconnection banner appears; on reconnect the board refreshes automatically."
  artifacts:
    - path: "src/hooks/useRealtimeBoard.ts"
      provides: "Supabase Realtime subscription hook"
      contains: "useRealtimeBoard"
    - path: "src/components/board/RealtimeTaskCard.tsx"
      provides: "Task card with highlight animation"
      contains: "RealtimeTaskCard"
    - path: "src/components/board/ConnectionStatus.tsx"
      provides: "Connection status banner"
      contains: "ConnectionStatus"
    - path: "supabase/migrations/XXXX_enable_realtime_tasks.sql"
      provides: "Enable Realtime on tasks table"
      contains: "supabase_realtime"
  key_links:
    - from: "src/hooks/useRealtimeBoard.ts"
      to: "src/lib/supabase.ts"
      via: "import createClient"
    - from: "src/components/board/BoardView.tsx"
      to: "src/hooks/useRealtimeBoard.ts"
      via: "import useRealtimeBoard"
    - from: "src/components/board/BoardView.tsx"
      to: "src/components/board/ConnectionStatus.tsx"
      via: "renders ConnectionStatus"

requirements: [RT-01, RT-02, RT-03]
---
```

```xml
<objective>Add real-time task status updates to board views using Supabase Realtime Postgres Changes, so team members see changes instantly without page refresh.</objective>

<context>
@src/lib/supabase.ts
@src/components/board/BoardView.tsx
@.planning/phases/05-realtime/05-CONTEXT.md
@.planning/research/supabase-realtime.md
</context>

<tasks>
<task type="auto" tdd="true" wave="1">
  <name>Task 1: Realtime hook and database migration</name>
  <files>src/hooks/useRealtimeBoard.ts, src/hooks/__tests__/useRealtimeBoard.test.ts, supabase/migrations/XXXX_enable_realtime_tasks.sql</files>
  <action>
    1. Create migration to enable Realtime on the tasks table (ALTER PUBLICATION supabase_realtime ADD TABLE tasks)
    2. Create useRealtimeBoard(boardId) hook:
       - Subscribe to postgres_changes on tasks table filtered by board_id
       - Track channel status (SUBSCRIBED, CLOSED, CHANNEL_ERROR)
       - On UPDATE event: call onTaskUpdate callback with new task data
       - On channel reconnect (status returns to SUBSCRIBED): call onReconnect callback
       - Cleanup: unsubscribe channel in useEffect return
    3. Write tests mocking Supabase channel API: verify subscribe, event handling, cleanup, reconnect detection
  </action>
  <verify>npm test -- --grep useRealtimeBoard -- all tests pass</verify>
  <done>useRealtimeBoard hook subscribes to task changes for a given board, fires callbacks on updates, detects reconnection, and cleans up on unmount</done>
</task>

<task type="auto" wave="2">
  <name>Task 2: UI integration -- RealtimeTaskCard, ConnectionStatus, and BoardView wiring</name>
  <files>src/components/board/RealtimeTaskCard.tsx, src/components/board/ConnectionStatus.tsx, src/components/board/BoardView.tsx</files>
  <action>
    1. Create RealtimeTaskCard: wraps existing task card, adds a transient highlight class (ring-2 ring-blue-400 transition, removed after 2s via setTimeout)
    2. Create ConnectionStatus: renders a banner ("Reconnecting...") when passed isDisconnected=true; renders "Reconnected" briefly on recovery
    3. Wire into BoardView:
       - Call useRealtimeBoard(boardId) with onTaskUpdate that merges into local useState
       - onReconnect triggers full refetch of board tasks
       - Pass connection status to ConnectionStatus
       - Render tasks via RealtimeTaskCard, passing a `justUpdated` flag for highlight
  </action>
  <verify>Manual: open board in two tabs, change task status in one, observe update + highlight in the other. Disconnect network briefly, observe banner and recovery.</verify>
  <done>Task status changes from other users appear in real time with a highlight animation; disconnection shows a banner and reconnection auto-refreshes</done>
</task>
</tasks>

<verification>
npm test -- --grep realtime
npm run build
# Manual: two browser tabs on same board, update task in one, observe other
</verification>

<success_criteria>
- When a team member changes a task's status on a board, all other members viewing that board see the change within 2 seconds without refreshing.
- A task card updated by another user briefly highlights to draw attention.
- When the real-time connection drops, a reconnection banner appears; on reconnect the board refreshes automatically.
</success_criteria>

<output>.planning/phases/05-realtime/05-01-SUMMARY.md</output>
```

### Planning rules compliance check (self-audit before Step 6)

- Tasks: 2 (within 2-3 range)
- Files: 6 in files_modified (within 5-8 range)
- Task 1 marked `tdd="true"` (involves logic/state/behavior)
- Task 2 has `type="checkpoint:human-verify"` consideration -- the plan marks it `type="auto"` but includes manual verification. The orchestrator might upgrade this to `checkpoint:human-verify` since it involves UI. **Potential revision needed.**
- Wave numbers: Task 1 = wave 1, Task 2 = wave 2. Task 2 depends on the hook from Task 1. Consistent.
- Word count: body is well under 1500 words.

---

## Step 6: Plan-check (Inline Verification Loop)

### Structural validation (GSD tools)

```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs verify plan-structure ".planning/phases/05-realtime/05-01-PLAN.md"
node ./.claude/get-shit-done/bin/gsd-tools.cjs frontmatter validate ".planning/phases/05-realtime/05-01-PLAN.md" --schema plan
```

Assume both pass (frontmatter has all required fields, tasks have correct XML structure).

### Semantic checks

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | **Requirement coverage** | PASS | RT-01 (broadcast to viewers) covered by Task 1+2. RT-02 (connection indicator) covered by Task 2 (ConnectionStatus). RT-03 (sync on reconnect) covered by Task 1 (onReconnect) + Task 2 (refetch on reconnect). |
| 2 | **Task completeness** | PASS | Both tasks have non-empty files, action, verify, done. |
| 3 | **Dependency correctness** | PASS | No `depends_on` listed (single plan). Wave 1 -> Wave 2, no circular deps. Task 2 (wave 2) does not depend on a higher wave. |
| 4 | **Scope sanity** | PASS | 2 tasks, 6 files in files_modified, body under 1500 words. |
| 5 | **must_haves trace** | PASS | Truth 1 ("changes within 2 seconds") maps to Task 2 done. Truth 2 ("highlight") maps to Task 2 done. Truth 3 ("reconnection banner + auto-refresh") maps to Task 1 done (reconnect detection) + Task 2 done (banner + refetch). All artifacts in must_haves.artifacts appear in files_modified. |
| 6 | **Context compliance** | PASS | Plan uses useState (locked decision #1), per-board subscription (decision #2), auto-refetch on reconnect (decision #3), Postgres Changes (decision #4). Plan does NOT include Presence or cross-board subscription (deferred items). |

**All 6 checks pass. No revision needed.**

### Potential revision flag

One possible revision: Task 2 involves UI work (RealtimeTaskCard highlight, ConnectionStatus banner). The planning rules say "If frontend: add `type='checkpoint:human-verify'` for key visual moments." The orchestrator could revise Task 2 to `type="checkpoint:human-verify"` and set `autonomous: false` at the plan level. This is a judgment call -- if the highlight and banner are simple CSS, `auto` may be fine. If the user wants to visually approve them, `checkpoint:human-verify` is safer.

**Decision:** Flag to user in presentation: "Task 2 involves visual components. Want me to add a human-verify checkpoint, or is auto execution fine?"

### Present plan to user

The orchestrator presents the full plan (frontmatter + XML body) and waits for user approval.

---

## Step 7: Handoff

After user approves the plan, present two options:

> "Plan 05-01 is ready. What would you like to do?
>
> 1. **`/build`** -- Execute now. I'll spawn a fresh subagent per task with clean context. Task 1 runs first (wave 1, TDD), then Task 2 (wave 2, UI integration).
> 2. **Continue planning** -- Plan more phases or additional plans before building.
>
> Default: option 1."

If the user says "build" (or says nothing / agrees), the orchestrator would invoke `/build` which:
- Reads the plan at `.planning/phases/05-realtime/05-01-PLAN.md`
- Spawns a Task subagent for Task 1 with context files (`src/lib/supabase.ts`, research doc, CONTEXT.md) and TDD instructions
- After Task 1 completes and passes verification, spawns a Task subagent for Task 2 with context files + the newly created hook
- After Task 2, runs the verification commands
- Writes summary to `.planning/phases/05-realtime/05-01-SUMMARY.md`
- Updates `STATE.md` to reflect completion

---

## Summary: Complete Invocation Chain

```
/plan "real-time task status updates using Supabase Realtime..."
  |
  +-- Pre-flight: read dependency-check.md, confirm PROJECT.md exists
  +-- Read STATE.md, ROADMAP.md, CONTEXT.md (missing)
  |
  +-- Step 0: Phase Matching
  |     No match -> ask user -> "Add Phase 05: Realtime"
  |     Update ROADMAP.md, REQUIREMENTS.md, create phases/05-realtime/
  |
  +-- Step 1: Research
  |     Detect: Supabase Realtime API = unfamiliar external service
  |     Spawn: Task subagent (research)
  |       Tools: Firecrawl (web search), Context7 (library docs)
  |       Output: .planning/research/supabase-realtime.md
  |
  +-- Step 2: Brainstorm
  |     Invoke: skills/brainstorming/SKILL.md
  |       2.1 Explore context (PROJECT.md, supabase.ts, research findings)
  |       2.2 Clarifying questions (4 questions, one at a time)
  |       2.3 Propose 3 approaches (recommend Postgres Changes)
  |       2.4 Present design (4 sections, approval after each)
  |       2.5 Write design doc -> .planning/designs/2026-03-06-realtime-task-updates.md
  |     GATE: wait for user approval
  |
  +-- Step 3: Discuss Implementation
  |     3.1 Scout codebase (supabase.ts, middleware.ts, task components)
  |     3.2 Identify 4 gray areas
  |     3.3 User picks 2 to discuss
  |     3.4 Deep-dive with options + trade-offs
  |     3.5 Lock decisions -> .planning/phases/05-realtime/05-CONTEXT.md
  |
  +-- Step 4: Derive must_haves
  |     3 truths, 4 artifacts, 3 key_links
  |
  +-- Step 5: Create Plan
  |     Write -> .planning/phases/05-realtime/05-01-PLAN.md
  |     2 tasks, 6 files, wave 1 + wave 2
  |
  +-- Step 6: Plan-check
  |     Run gsd-tools.cjs verify + frontmatter validate
  |     6 semantic checks: all pass
  |     GATE: present plan, wait for user approval
  |
  +-- Step 7: Handoff
        Option 1: /build (default)
        Option 2: Continue planning
```

---

## Observations and Edge Cases Encountered

1. **Scope conflict detected.** PROJECT.md explicitly listed "Real-time collaboration" as out of scope. A good orchestrator surfaces this immediately in Step 0 rather than planning something the project has excluded. This tests whether the /plan command reads PROJECT.md thoroughly.

2. **Research was genuinely needed.** Supabase Realtime has non-obvious constraints (RLS interaction, channel lifecycle, Postgres publication setup). Without the research step, the brainstorming would have produced a design based on assumptions that could fail at implementation time.

3. **No CONTEXT.md existed.** This meant Step 3 (Discuss Implementation) was not skipped. If a previous `/gsd:discuss-phase` had already run for Phase 05, the orchestrator would skip Step 3 entirely and honor the existing locked decisions.

4. **Phase 05 depends on Phase 03.** The tasks table and board components must exist before Realtime can be wired up. The plan's `depends_on: []` is correct at the plan level (no other plans in Phase 05 to depend on), but the phase itself implicitly depends on Phase 03 completing first. The orchestrator does not explicitly model inter-phase dependencies in the plan frontmatter, but ROADMAP.md phase ordering handles this.

5. **Frontend checkpoint question.** Task 2 involves visual components (highlight animation, banner). The planning rules suggest `checkpoint:human-verify` for frontend work. The orchestrator should flag this to the user rather than silently choosing.

6. **Existing plan numbering.** Phase 05 is new with no existing plans, so plan number = 01. If there were already a `05-01-PLAN.md`, the next plan would be `05-02-PLAN.md`.
