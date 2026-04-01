---
type: execute
wave: 1
files_modified:
  - ~/.claude-mem/settings.json
  - /Users/konstantin/conductor/workspaces/nerve-os/toronto/.claude/settings.json

must_haves:
  truths:
    - "CLAUDE_MEM_MODEL is claude-haiku-4-5-20251001 in ~/.claude-mem/settings.json"
    - "CLAUDE_MEM_SKIP_TOOLS includes Read, Glob, Grep, ToolSearch, all 7 claude-mem MCP tools, all 9 context-mode MCP tools (25 total)"
    - "[review] Skip list uses exact Set.has() matching — no wildcard support, enumerated list is mandatory"
    - "[review] CLAUDE_MEM_CONTEXT_OBSERVATIONS is 75 and CLAUDE_MEM_CONTEXT_SESSION_COUNT is 20"
    - "nerve-os/toronto workspace CLAUDE_MEM_PROJECT is nerve-os (not toronto)"
    - ".context/baseline-metrics.md exists with pre-change observation counts"
  artifacts:
    - path: "~/.claude-mem/settings.json"
      provides: "optimized claude-mem global configuration"
      contains: "claude-haiku-4-5-20251001"
    - path: "/Users/konstantin/conductor/workspaces/nerve-os/toronto/.claude/settings.json"
      provides: "corrected nerve-os project attribution"
      contains: "nerve-os"
    - path: ".context/baseline-metrics.md"
      provides: "pre-change baseline for comparison"
      contains: "observations"
---

<objective>
Reduce per-session token overhead from claude-mem by switching from Sonnet-4.5 to Haiku for observation creation, extending the tool skip list to exclude read-only and MCP tools already handled by context-mode, reducing observation count limits, and fixing a project misattribution bug in nerve-os/toronto.

Personal dev setup change — no fhhs-skills plugin code modified.
</objective>

<context>
Research: .context/claude-mem-docs-research.md, .context/context-mode-docs-research.md, .context/settings-comparison.md

Key findings:
- claude-mem PostToolUse fires on every tool call (universal matcher, 120s timeout)
- context-mode has zero hook overhead — already net-positive, no changes needed
- CLAUDE_MEM_MODEL=claude-sonnet-4-5 costs ~4-5x more than Haiku per observation
- CLAUDE_MEM_CONTEXT_SESSION_COUNT=50 is the binding injection limit at session start
- nerve-os/toronto: 79% of observations misattributed (CLAUDE_MEM_PROJECT=toronto, should be nerve-os)
- Gemini NOT available (API key empty) — do not use as fallback, revert to Sonnet if needed
</context>

<tasks>
<task type="auto">
  <name>Task 1: Document baseline metrics</name>
  <files>.context/baseline-metrics.md</files>
  <action>
Before making any changes, create .context/baseline-metrics.md with:
1. Run ctx_stats (mcp__plugin_context-mode_context-mode__ctx_stats) to capture current savings ratio
2. Use claude-mem smart_search or timeline to get approximate observation counts per project (fhhs-skills, fh-starter-project, nerve-os) for last 7 days
3. Record current values being changed: CLAUDE_MEM_MODEL, CLAUDE_MEM_CONTEXT_OBSERVATIONS, CLAUDE_MEM_CONTEXT_SESSION_COUNT, CLAUDE_MEM_SKIP_TOOLS (from ~/.claude-mem/settings.json)
4. Write all to .context/baseline-metrics.md
  </action>
  <verify>cat .context/baseline-metrics.md — file exists with current settings values</verify>
  <done>.context/baseline-metrics.md created with pre-change snapshot</done>
</task>

<task type="auto">
  <name>Task 2: Switch claude-mem to Haiku and extend skip list</name>
  <files>~/.claude-mem/settings.json</files>
  <action>
Edit ~/.claude-mem/settings.json:

1. CLAUDE_MEM_MODEL: "claude-sonnet-4-5" → "claude-haiku-4-5-20251001"

2. CLAUDE_MEM_SKIP_TOOLS — extend to full value below.
   CONFIRMED: Skip matching uses exact Set.has() — no wildcard support. Use enumerated list.

Full CLAUDE_MEM_SKIP_TOOLS value (25 tools):
ListMcpResourcesTool,SlashCommand,Skill,TodoWrite,AskUserQuestion,Read,Glob,Grep,ToolSearch,mcp__plugin_claude-mem_mcp-search____IMPORTANT,mcp__plugin_claude-mem_mcp-search__search,mcp__plugin_claude-mem_mcp-search__get_observations,mcp__plugin_claude-mem_mcp-search__timeline,mcp__plugin_claude-mem_mcp-search__smart_search,mcp__plugin_claude-mem_mcp-search__smart_unfold,mcp__plugin_claude-mem_mcp-search__smart_outline,mcp__plugin_context-mode_context-mode__ctx_search,mcp__plugin_context-mode_context-mode__ctx_execute,mcp__plugin_context-mode_context-mode__ctx_execute_file,mcp__plugin_context-mode_context-mode__ctx_batch_execute,mcp__plugin_context-mode_context-mode__ctx_index,mcp__plugin_context-mode_context-mode__ctx_fetch_and_index,mcp__plugin_context-mode_context-mode__ctx_stats,mcp__plugin_context-mode_context-mode__ctx_doctor,mcp__plugin_context-mode_context-mode__ctx_upgrade

Do NOT change CLAUDE_MEM_PROVIDER. Do NOT touch Gemini settings.
  </action>
  <verify>
grep CLAUDE_MEM_MODEL ~/.claude-mem/settings.json → claude-haiku-4-5-20251001
grep CLAUDE_MEM_SKIP_TOOLS ~/.claude-mem/settings.json → contains Read,Glob,Grep,ToolSearch
  </verify>
  <done>Model is haiku, skip list includes all specified tools</done>
</task>

<task type="auto">
  <name>Task 3: Reduce observation count limits</name>
  <files>~/.claude-mem/settings.json</files>
  <action>
Edit ~/.claude-mem/settings.json:
1. CLAUDE_MEM_CONTEXT_OBSERVATIONS: "500" → "75"
2. CLAUDE_MEM_CONTEXT_SESSION_COUNT: "50" → "20"
Leave CLAUDE_MEM_CONTEXT_FULL_COUNT unchanged at 15.
  </action>
  <verify>
grep CONTEXT_OBSERVATIONS ~/.claude-mem/settings.json → 75
grep CONTEXT_SESSION_COUNT ~/.claude-mem/settings.json → 20
  </verify>
  <done>CONTEXT_OBSERVATIONS=75 and CONTEXT_SESSION_COUNT=20</done>
</task>

<task type="auto">
  <name>Task 4: Fix nerve-os/toronto project misattribution</name>
  <files>/Users/konstantin/conductor/workspaces/nerve-os/toronto/.claude/settings.json</files>
  <action>
Edit /Users/konstantin/conductor/workspaces/nerve-os/toronto/.claude/settings.json.
Change: "CLAUDE_MEM_PROJECT": "toronto" → "CLAUDE_MEM_PROJECT": "nerve-os"
Forward-only fix — historical observations tagged "toronto" remain as-is.
  </action>
  <verify>grep CLAUDE_MEM_PROJECT /Users/konstantin/conductor/workspaces/nerve-os/toronto/.claude/settings.json → nerve-os</verify>
  <done>toronto workspace uses CLAUDE_MEM_PROJECT=nerve-os</done>
</task>
</tasks>

<verification>
grep -E "CLAUDE_MEM_MODEL|CONTEXT_OBSERVATIONS|CONTEXT_SESSION_COUNT" ~/.claude-mem/settings.json
grep CLAUDE_MEM_SKIP_TOOLS ~/.claude-mem/settings.json | tr ',' '\n' | grep -c "Read\|Glob\|Grep"
grep CLAUDE_MEM_PROJECT /Users/konstantin/conductor/workspaces/nerve-os/toronto/.claude/settings.json
ls .context/baseline-metrics.md
</verification>

<success_criteria>
- CLAUDE_MEM_MODEL=claude-haiku-4-5-20251001
- CLAUDE_MEM_SKIP_TOOLS has exactly 25 entries including all 9 context-mode tools and all 7 claude-mem MCP tools
- CLAUDE_MEM_CONTEXT_OBSERVATIONS=75, CLAUDE_MEM_CONTEXT_SESSION_COUNT=20
- nerve-os/toronto CLAUDE_MEM_PROJECT=nerve-os
- .context/baseline-metrics.md exists

Post-build verification (next 1-2 sessions):
- Confirm observations are still being created (Haiku model ID accepted by API)
- If Haiku quality is insufficient: revert CLAUDE_MEM_MODEL to claude-sonnet-4-5 only
</success_criteria>

<output>.context/SUMMARY.md</output>
