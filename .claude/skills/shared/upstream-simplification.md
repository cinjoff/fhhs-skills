# Upstream Simplification

Single source of truth per capability. When two upstreams overlap, one wins.

## Capability Map

| Capability | Owner | Skill |
|-----------|-------|-------|
| Planning & state | GSD | `/fh:plan-work`, `/fh:progress` |
| Research | FPF-lite (Firecrawl + Perplexity) | `/fh:research` |
| Brainstorming / ideation | Superpowers | `/fh:startup-design`, `/fh:startup-advisor` |
| Spec authoring | SPEC.md (CEK-inspired) | Built into plan frontmatter |
| Build execution | fhhs build | `/fh:build` |
| Design quality | Impeccable | `/fh:review --design` |
| Code review | fhhs review | `/fh:review` |
| Reflection / learnings | CEK + claude-mem | `/fh:learnings` |

## Deprecated Items by Upstream

### GSD (get-shit-done)

- `fh:gsd-executor` — deprecated. Use `general-purpose` subagents via `/fh:build` orchestrator.
- `fh:gsd-planner` — deprecated. Use `/fh:plan-work` (fhhs wrapper with SPEC.md integration).
- Per-task GSD state writes during wave execution — deprecated. Task state now tracked via `build/references/task-state-protocol.md`.

### Superpowers

- Superpowers `build` command — deprecated. Use `/fh:build`.
- Superpowers `review` command — deprecated. Use `/fh:review`.
- Superpowers research flow — deprecated for structured research. Use `/fh:research` (FPF-lite).

### Impeccable

- Impeccable standalone invocation — deprecated as primary build path. Design quality checks are embedded in `/fh:review` (post-build).
- Impeccable spec gate — superseded by SPEC.md rubrics + `/fh:review` spec gate.

### FPF (Firecrawl + Perplexity)

- FPF full pipeline for quick lookups — use `/fh:research` with `--quick` instead.

## Rationale

Each upstream was designed for a different context. Composing them means picking the right tool per job rather than running all three. The rules above eliminate redundant invocations and ensure consistent state management through GSD.
