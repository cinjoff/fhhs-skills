# Fallow CLI Integration Design

**Date:** 2026-03-25
**Status:** Plan written, pending approval

## Decision: CLI over MCP

Fallow's MCP server is a thin stdio wrapper — identical output, no token savings, no quality difference. CLI is more portable for a plugin that ships to users. Skills orchestrate when analysis runs (not Claude deciding spontaneously), so MCP's tool discoverability adds no value.

## Tool Landscape

| Tool | Purpose | Integration |
|------|---------|-------------|
| **Fallow** | Dead code, circular deps, duplication, complexity | CLI (`--format json`) |
| **Serena** | Symbol navigation + editing, LSP superset | Deferred — separate MCP server, requires Python |
| **Built-in LSP** | Go-to-definition, find-references, hover | Already used in fix/refactor/extract/plan-work |

All three are complementary, zero overlap.

## Integration Architecture

```
┌─────────────────────────────────────────────┐
│              Availability Check              │
│  command -v fallow → run / skip silently     │
└──────────────┬──────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │ fallow check --json │ → unused exports, files, deps, circular deps
    │ fallow dupes --json │ → code duplication (4 modes)
    │ fallow health --json│ → complexity metrics, hotspots
    └──────────┬──────────┘
               │
    ┌──────────┴──────────────────────────────┐
    │        Inject into agent prompts         │
    │  "## Static Analysis Findings"           │
    │  Ground truth data alongside the diff    │
    └──────────┬──────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │   LLM Agent Layer    │
    │  Judges actionability│
    │  Cites exact locations│
    │  Filters false positives│
    └──────────────────────┘
```

## Priority: Plan 11 (simplify → spec-gate → review)

These three cover the highest-leverage integration points because:
- **simplify** cascades through build, refactor, and fix
- **spec-gate** is the build pipeline's quality checkpoint
- **review** is the main quality gate before promoting code

## Future Plans (not in scope)

- **map-codebase**: Fallow dependency graph + metrics for architecture/concerns mappers
- **refactor Step 0**: Data-driven refactoring candidate discovery
- **plan-work**: Impact estimation via module graph
- **extract**: Duplication detection for component discovery
- **Serena**: Separate evaluation pending user decision
