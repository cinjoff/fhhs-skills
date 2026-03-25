---
type: project
name: fhhs-skills
version: v1
created: "2026-03-25"
---

# fhhs-skills

A Claude Code plugin that composes upstream skill libraries into a comprehensive software development toolkit, with patching and eval infrastructure to maintain quality.

## Target Users

Software developers using Claude Code — including non-technical users who need things to work without reading source code.

## Problem

Individual upstream skills are fragmented and don't work together cohesively. Users can't assemble a complete development workflow from disconnected plugins.

## Solution

Unify upstream skills (Superpowers, Impeccable, GSD) into an opinionated, well-documented toolkit that covers the full development lifecycle: planning, building, reviewing, testing, fixing, refactoring, and design quality.

## Scope

### In v1
- Core development skills (plan, build, review, fix, refactor, simplify)
- Design/UI skills (branding, critique, polish, animate, etc.)
- GSD tracking infrastructure (.planning/, roadmap, phases)
- Upstream sync mechanism (snapshots, PATCHES.md, COMPATIBILITY.md)
- Eval suite for verifying skills work correctly
- Non-technical-friendly documentation and setup flow

### Out of scope
- Building end-user apps (this is tooling)
- Custom LLM integrations beyond Claude Code's plugin system
- GUI/dashboard for managing skills (beyond tracker)

## Constraints

- **Team:** Solo maintainer
- **Plugin boundary:** `.claude/skills/` is the only shipped directory — runtime file reads must be co-located there
- **No postinstall hooks:** Claude Code plugins can't run shell at install time
- **Upstream tracking:** Must track 3+ upstream repos and re-patch on updates without breaking downstream skills

## Tech Stack

- **Runtime:** Claude Code plugin system
- **Languages:** Markdown (skills), JavaScript/Node.js (GSD tooling)
- **Testing:** Custom eval suite with mock projects (130+ evals)
- **Distribution:** plugin.json + marketplace.json
- **Upstream management:** Snapshot + patch model

## Success Criteria

1. Skills trigger correctly and produce quality output for their intended use cases
2. Eval suite passes — mock project tests verify skills behave as expected
3. Non-technical users can install, run `/fh:setup`, and use skills without reading source code
4. Upstream syncs don't break patched skills
5. Plugin ships cleanly within `.claude/skills/` boundary — no runtime file-not-found errors
