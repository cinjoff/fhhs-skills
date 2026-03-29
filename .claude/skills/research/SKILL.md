---
name: fh:research
description: Look into a topic. Searches the web and docs, then writes up what it found.
user-invocable: true
---

Research a topic using Firecrawl and Context7. Outputs in GSD-compatible format for seamless planning.

Research topic: $ARGUMENTS

You are a **lean orchestrator**. Delegate the actual research to a subagent to keep your context clean.

> **Dependency check:** GSD project required (`.planning/PROJECT.md` must exist). Firecrawl skill is needed for web search — if unavailable, the subagent falls back to WebSearch/WebFetch.

---

## Process

### 0. Verify GSD Project

Check `.planning/PROJECT.md` exists. If missing, stop: "No project found. Run `/fh:new-project` first." Do not proceed.

### 1. Determine Scope

Based on the topic, identify:
- **Research mode**: Ecosystem ("what exists?"), Feasibility ("can we do this?"), or Comparison ("X vs Y")
- **Output location**: `.planning/phases/XX-name/XX-RESEARCH.md` (phase detected from STATE.md current position)

### 1b. Past Learnings Check

If claude-mem is available, check for prior research on the same or related topics:
1. Derive project name from `.planning/PROJECT.md` name field (fall back to basename of cwd). Use this as the `project` parameter for all claude-mem calls.
2. Call `mcp__plugin_claude-mem_mcp-search__search` with query=2-3 keywords from the research topic, limit=5, project=<project-name>
3. Filter for: research, investigated, evaluated, compared, "decided on", recommendation, pitfall
4. If relevant: "**Prior research on this topic:** - {summary}" — max 3 items
5. If prior research covers the exact topic, present it and ask: "Prior research exists — want to build on it or start fresh?"
6. Skip silently if unavailable

### 2. Dispatch Research Subagent

Spawn a Task agent with:
- The topic and research mode
- Instruction to use Firecrawl for web search/scraping and Context7 for library documentation
- Instruction to be prescriptive ("Use X because Y"), not exploratory ("Consider X or Y")
- Instruction to tag each finding with confidence and source: HIGH [Context7/official docs], MEDIUM [web sources], LOW [inference — needs validation]
- Instruction to say "Couldn't find X" rather than guessing — negative results are valuable

### Context-Mode Acceleration

If ctx_batch_execute is available, index research sources for efficient synthesis:
- After fetching web pages or library docs, index them via ctx_batch_execute with descriptive labels
- Use ctx_search to extract relevant sections across all indexed sources at once
- Particularly useful when comparing multiple libraries, approaches, or documentation pages
- If unavailable, process sources inline as fetched

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
1. If ctx_search is available, query indexed sources for conclusions and recommendations
2. Output each finding as:
   **[research-finding]** {topic}: {conclusion/decision} — confidence: {high/medium/low}
3. Include library/approach decisions and their rationale — these are the most valuable for avoiding duplicate research
4. If the research contradicted prior findings (from Past Learnings Check), note the update
5. Max 3 findings per research session
6. Skip silently if research was inconclusive or purely exploratory
