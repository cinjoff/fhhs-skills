# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design and get user approval.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.
</HARD-GATE>

**You MUST NOT call `EnterPlanMode` or `ExitPlanMode` during this skill.** This skill operates in normal mode. Plan mode restricts Write/Edit tools and has no clean exit.

## Anti-Pattern: "This Is Too Simple To Need A Design"

Every project goes through this process. A todo list, a single-function utility, a config change — all of them. "Simple" projects are where unexamined assumptions cause the most wasted work. The design can be short (a few sentences for truly simple projects), but you MUST present it and get approval.

## Process Flow

1. **Check for RESEARCH.md** — if exists in the phase directory, start from the hypothesis comparison table rather than blank-slate brainstorming
2. **Load codebase context** — use `smart_outline`/`smart_search` before generating options
3. **Diversity requirement** — proposals must include at least 1 conservative approach (minimal change, low risk) and 1 alternative approach (different trade-off axis)
4. **Explore project context** — check files, docs, recent commits
5. **Ask clarifying questions** — one at a time, understand purpose/constraints/success criteria
6. **Propose 2-3 approaches** — with trade-offs and your recommendation
7. **Present design** — in sections scaled to their complexity, get user approval after each section
8. **Write design doc** — save to `.planning/designs/YYYY-MM-DD-<topic>.md`

## The Process

**Understanding the idea:**
- Check out the current project state first (files, docs, recent commits)
- Ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

**Deep codebase exploration (for complex features):**
For features that touch multiple areas or need architectural understanding, dispatch 2-3 `fh:code-explorer` agents in parallel to explore different aspects (similar features, architecture, integration points). After agents return, **read the essential files they identify** — this builds deep context in the main session before designing approaches.

Skip this for simple changes where you already understand the relevant code.

**Exploring approaches:**
- Propose 2-3 different approaches with trade-offs
- For complex features, consider dispatching 2-3 `fh:code-architect` agents with different lenses (minimal changes, clean architecture, pragmatic balance) to independently flesh out approaches
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Presenting the design:**
- Once you believe you understand what you're building, present the design
- Scale each section to its complexity: a few sentences if straightforward, up to 200-300 words if nuanced
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

## After the Design

**Documentation:**
- Write the validated design to `.planning/designs/YYYY-MM-DD-<topic>.md`
- Use elements-of-style:writing-clearly-and-concisely skill if available

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design, get approval before moving on
- **Be flexible** - Go back and clarify when something doesn't make sense
