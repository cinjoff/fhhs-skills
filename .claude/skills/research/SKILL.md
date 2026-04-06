---
name: fh:research
description: Look into a topic. Searches the web and docs, then writes up what it found.
user-invocable: true
---

Research a topic using Firecrawl and Context7. Outputs in GSD-compatible format for seamless planning.

Research topic: $ARGUMENTS

You are a **lean orchestrator**. Delegate the actual research to a subagent to keep your context clean.

> **Dependency check:** GSD project required (`.planning/PROJECT.md` must exist). Firecrawl MCP tools (`mcp__firecrawl__*`) preferred for web operations — see `@.claude/skills/shared/firecrawl-guide.md` for content-type patterns. Falls back to WebSearch/WebFetch if unavailable.

---

## Process

### 0. Verify GSD Project

Check `.planning/PROJECT.md` exists. If missing, stop: "No project found. Run `/fh:new-project` first." Do not proceed.

### 1. Determine Scope

Based on the topic, identify:
- **Research mode**: Ecosystem ("what exists?"), Feasibility ("can we do this?"), or Comparison ("X vs Y")
- **Output location**: `.planning/phases/XX-name/XX-RESEARCH.md` (phase detected from STATE.md current position)

### 1b. Past Learnings Check

Follow **Pattern A** (Past Learnings Check) from `@.claude/skills/shared/claude-mem-rules.md`. Keywords: 2-3 keywords from the research topic, filter for: research, investigated, evaluated, compared, "decided on", recommendation, pitfall. Present as "**Prior research on this topic:**". If prior research covers the exact topic, ask: "Prior research exists — want to build on it or start fresh?"

### 2. Dispatch Research Subagent

Spawn a Task agent with:
- The topic and research mode
- Instruction to follow `@.claude/skills/shared/firecrawl-guide.md` for content-type-specific patterns:
  - Documentation: firecrawl_scrape with only_main_content, or Context7 for library docs
  - YouTube: firecrawl_scrape with markdown format for transcript extraction
  - GitHub: firecrawl_search with category "github" for discovery
  - News: firecrawl_search with sourceType "news" and time filtering
  - Research papers: firecrawl_search with category "research"
  - General: firecrawl_scrape for specific URLs, firecrawl_search for discovery
- For deep research (3+ sources, synthesis): use agent approach — dispatch subagent with firecrawl tools
- For quick lookups (1-2 sources): inline firecrawl calls
- Instruction to be prescriptive ("Use X because Y"), not exploratory ("Consider X or Y")
- Instruction to tag each finding with confidence and source: HIGH [Context7/official docs], MEDIUM [web sources], LOW [inference — needs validation]
- Instruction to say "Couldn't find X" rather than guessing — negative results are valuable

### Context-Mode Acceleration

Use `mcp__plugin_claude-mem_mcp-search__smart_search` to cross-reference research sources for efficient synthesis:
- After fetching web pages or library docs, use smart_search to find relevant sections across sources
- Particularly useful when comparing multiple libraries, approaches, or documentation pages

- Instruction to write output with GSD-compatible YAML frontmatter:
  ```yaml
  ---
  researched: YYYY-MM-DD
  domain: <research topic description>
  confidence: HIGH|MEDIUM|LOW
  ---
  ```
- Target output path

Output format: Constraints, Findings (with confidence/source), Recommendations, Stack Decisions, Common Pitfalls, Code Examples.

### 3. Report

When the subagent completes, read its output file and present:
- Key recommendations
- Any LOW [inference] findings that need manual validation
- Where the full research was saved

---

If GSD project active, update STATE.md briefly.

---

## GSD Integration

Output goes to `.planning/phases/XX-name/XX-RESEARCH.md` with full frontmatter. Updates STATE.md.

### Persist Findings

After research output is generated, persist key conclusions so future research can build on them:
1. Use `mcp__plugin_claude-mem_mcp-search__smart_search` to query for conclusions and recommendations from this session's context.
2. Output each finding as:
   **[research-finding]** {topic}: {conclusion/decision} — confidence: {high/medium/low}
3. Include library/approach decisions and their rationale — these are the most valuable for avoiding duplicate research
4. If the research contradicted prior findings (from Past Learnings Check), note the update
5. Max 3 findings per research session
6. Skip silently if research was inconclusive or purely exploratory
