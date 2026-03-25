---
name: fh:research
description: Look into a topic. Searches the web and docs, then writes up what it found.
user-invokable: true
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

### 2. Dispatch Research Subagent

Spawn a Task agent with:
- The topic and research mode
- Instruction to use Firecrawl for web search/scraping and Context7 for library documentation
- Instruction to be prescriptive ("Use X because Y"), not exploratory ("Consider X or Y")
- Instruction to tag each finding with confidence and source: HIGH [Context7/official docs], MEDIUM [web sources], LOW [inference — needs validation]
- Instruction to say "Couldn't find X" rather than guessing — negative results are valuable
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
