---
description: "Use when evaluating upstream skill changes after sync, assessing integration opportunities, or maintaining the upstream capability index. Triggers on 'audit upstream', 'evaluate upstream', 'what changed upstream', 'integration opportunities', or after /fh:sync-upstream."
---

# Audit Upstream

Evaluate upstream skill capabilities, assess real usage in fhhs pipelines, identify gaps, and maintain the upstream capability index.

Chain after `/fh:sync-upstream`: sync pulls code, this skill evaluates what changed.

Arguments: $ARGUMENTS

## Modes

This skill supports two modes based on arguments:

- **Incremental** (default, after sync): Detect what changed, assess new/modified items, update docs
- **Deep** (when user asks for deep review, capability analysis, or comparison): Full capability scan of all upstreams with pipeline usage analysis, overlap detection, and strategic recommendations

Use **deep** when: user says "deep", "review carefully", "compare", "what do I actually use", "overlap", or provides no prior index to diff against.

---

## Step 1: SCAN

Inventory the `upstream/` directory. For each upstream source:

1. **Identify version/commit** — read package.json, CHANGELOG, VERSION, or directory name to determine version
2. **Compare against index** — read `.planning/upstream/INDEX.md` to detect:
   - Version changes (bumped since last audit)
   - New sources (present in `upstream/` but absent from INDEX.md)
   - Removed sources (listed in INDEX.md but missing from `upstream/`)
3. **Scan all four asset categories** for each source:
   - **Skills:** SKILL.md / UPSTREAM-SKILL.md files
   - **Commands/workflows:** workflow .md files, especially `workflows/` directories
   - **Agent definitions:** `agents/` directories
   - **Supporting assets:** references, templates, prompt templates, rule files, tools

Build a complete inventory before proceeding.

**Mode gate:** In incremental mode, focus only on changed sources. In deep mode, scan ALL sources regardless of changes.

---

## Step 2: READ DEEPLY

For each capability being assessed (changed items in incremental, ALL items in deep):

1. **Read the actual file content** — not just the filename or first line. Understand what the skill/agent/workflow actually does.
2. **For each capability, extract:**
   - **What it actually does** — concrete description of behavior, not marketing language
   - **Value proposition** — what problem does this solve? What happens without it?
   - **Key mechanisms** — how does it achieve its goal? (e.g., "spawns 4 parallel agents", "produces CONTEXT.md with locked decisions")
   - **Anti-patterns addressed** — what bad outcomes does it prevent?
3. **Use parallel agents** to read multiple upstream sources simultaneously — one agent per source for deep mode.

This step is critical. Previous audits produced inventories of file names. This step produces understanding of capabilities.

---

## Step 3: PIPELINE USAGE ANALYSIS

Determine which capabilities are actually wired into fhhs execution paths.

1. **Search shipped skills** — grep `.claude/skills/*/SKILL.md` and `skills/*/PROMPT.md` for references to each upstream capability
2. **Classify each capability:**

| Status | Meaning | How to detect |
|--------|---------|---------------|
| **ACTIVE** | Referenced in main execution paths, regularly triggered | Found in build/fix/plan-work/review/quick pipeline steps |
| **CONDITIONAL** | Wired but only triggers under specific conditions | Found behind condition checks (visual ratio, project type, etc.) |
| **INTERNAL** | Referenced by other internal skills only | Found in skills/ but not .claude/skills/ |
| **DEAD** | Imported/shipped but never referenced in any pipeline | Exists in skills/ or .claude/skills/ but no pipeline references it |
| **PATTERN ABSORBED** | The concept is used but the specific skill file is never loaded | Pattern visible in pipeline code but skill file unreferenced |

3. **For dead capabilities, assess value:**
   - Is this dead because it's genuinely not useful? → candidate for pruning
   - Is this dead because it was never wired? → candidate for integration (gap)
   - Is the pattern absorbed even though the file is unused? → mark as absorbed, no action needed

---

## Step 4: OVERLAP & COMPARISON ANALYSIS (deep mode only)

Identify capabilities that exist in multiple upstreams with different approaches:

1. **Group by function** — find capabilities that solve the same problem across upstreams
   - Research: GSD phase-researcher vs Superpowers research vs fhhs inline research
   - Planning: GSD planner vs Superpowers writing-plans vs fhhs plan-work
   - Debugging: GSD debugger vs Superpowers systematic-debugging
   - Review: GSD plan-checker vs gstack plan-review vs Superpowers code-review
   - Execution: GSD executor vs Superpowers executing-plans vs SDD
   - Verification: GSD verifier vs Superpowers verification-before-completion

2. **For each overlap, produce a comparison table:**

| Dimension | Source A | Source B | fhhs current |
|-----------|---------|---------|--------------|
| Philosophy | ... | ... | ... |
| Depth | ... | ... | ... |
| When it's better | ... | ... | ... |
| What's missing | ... | ... | ... |

3. **Verdict per overlap** — which approach is right for fhhs and why? Is there value in combining?

---

## Step 5: ASSESS & RECOMMEND

### For incremental mode (post-sync)

For each new or changed item, evaluate:

- **Quality Rating (A–D):**
  - **A** — Well-structured, handles edge cases, documented
  - **B** — Solid structure, some gaps, usable
  - **C** — Functional but incomplete
  - **D** — Needs work before integration
- **Gap fill potential** — does this address a known gap in the Gap Registry?
- **Integration effort** — Low (reference only) / Medium (new skill) / High (patch existing composite)
- **Risk** — breaking changes, dependency conflicts, naming collisions

### For deep mode

Produce consolidated recommendations organized by impact area, not by upstream source:

**Strengthen [pipeline-name]** — group recommendations by which fhhs pipeline they improve:
- What to add/wire
- Why (what gap it fills, with reference to the capability description)
- Integration approach (how to wire it)

**Wire [capability]** — for high-value dead capabilities that should be connected

**Consider pruning** — for dead capabilities with no integration value

### Recommendation tiers

| Tier | Criteria |
|------|----------|
| **Immediate** | Breaking changes or critical fixes. Blocks normal operation. |
| **Plan** | High-value integrations worth planning via `/fh:plan-work` |
| **Backlog** | Worth doing but not urgent. Track in Gap Registry. |
| **Skip** | No integration value. Explain why to prevent re-evaluation. |

---

## Step 6: UPDATE DOCUMENTS

### Per-source files

Update `.planning/upstream/{source-name}.md` for each assessed source. Required sections:

```markdown
# Upstream: {name} (v{version})

**Overall Quality: {A-D}**

## Overview
{What this upstream is, its philosophy, what makes it distinctive}

## File Tree
{Directory structure with annotations}

## Deep Capability Descriptions
{Tables with columns: Capability | What It Actually Does | Value Proposition | fhhs Usage}

Organize by functional category (e.g., "Planning & Discovery", "Quality & Discipline", "Execution").
Each row must have substantive descriptions, not one-liners.
fhhs Usage must use the pipeline status labels (ACTIVE/CONDITIONAL/DEAD/etc.) with
specific pipeline references (e.g., "ACTIVE — wired in /fh:build Step 4").

## Skills/Agents/Workflows Table
{Inventory with: Name | SDLC Phase | Quality | Pipeline Status | fhhs Equivalent | Notes}

Pipeline Status uses: ✅ Active | ✅ Conditional | 🔀 Partial | ⚠️ Dead (high-value gap) | ⬜ Available | 🚫 N/A

## Supporting Assets Table
{References, templates, prompts with usage status}

## Assessment
### What's Working
### What's Underused (High-Value Gaps)
### Recommendations
{Priority | Action | Impact table}
```

### INDEX.md

Update the central index. Required sections:

- **Source Summary** — version, quality, capability counts, active vs dead counts
- **Pipeline Usage Reality** — tables of actively wired, conditionally triggered, and high-value gaps
- **SDLC Coverage Matrix** — phase coverage across upstreams with gap markers
- **Subagent Dispatch Matrix** — which skills dispatch which agents
- **Consolidated Recommendations** — grouped by impact area, not by upstream source
- **Gap Registry** — prioritized list of unintegrated capabilities with status
- **Integration Log** — append entry for this audit

### Cross-reference verification
- Verify `PATCHES.md` is still accurate — no stale references to renamed/removed upstream files
- Verify `COMPATIBILITY.md` reflects current version combinations

---

## Edge Cases

### First run (no index exists)
If `.planning/upstream/` or `INDEX.md` does not exist:
1. Create directory and build all per-source files from scratch
2. Create INDEX.md with full structure
3. Always run in deep mode on first run
4. Message: **"First audit — creating full index."**

### No changes detected (incremental mode)
1. Short-circuit — do not rewrite files
2. Output: **"No upstream changes since last audit on {date}."**
3. Offer: "Run with `--deep` for full capability review."

### Upstream removed
Mark as **"ARCHIVED"** in INDEX.md, keep per-source file with archived header.

### Skill renamed in upstream
Detect via content similarity, update name, add rename note.

### Malformed or empty skill files
Flag as `⚠️ Unreadable: {path} — {reason}`, never silently skip.

---

## Workflow Chain

> Typical flows:
>
> **After sync:**
> 1. `/fh:sync-upstream` — pull latest upstream code
> 2. `/audit-upstream` — evaluate changes (incremental), update index
> 3. `/fh:plan-work` — plan integration of recommended changes
>
> **Periodic deep review:**
> 1. `/audit-upstream` with deep/review/compare arguments
> 2. Review overlap analysis and pipeline usage reality
> 3. Decide which gaps to fill and which dead weight to prune
> 4. `/fh:plan-work` — plan the improvements
