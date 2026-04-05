---
name: simplify
description: Review changed code for reuse, quality, and efficiency, then fix any issues found. Use after builds, refactors, or any implementation work to catch duplication, anti-patterns, and missed optimizations.
user-invokable: false
---

# Simplify: Code Review and Cleanup

Review all changed files for reuse, quality, and efficiency. Fix any issues found.

## Phase 1: Identify Changes

Run `git diff -- ':!.planning/' ':!*.lock' ':!pnpm-lock.yaml' ':!package-lock.json' ':!yarn.lock' ':!.next/' ':!*.map'` (or with `HEAD` if there are staged changes) to see what changed. If there are no git changes, review the most recently modified files that the user mentioned or that you edited earlier in this conversation.

## Phase 2: Launch One Review Agent

Use the Agent tool to launch a single review agent. Pass the full diff so it has complete context.

The agent reviews sequentially through three lenses:

### Lens 1: Code Reuse

**Use LSP for discovery:** `workspaceSymbol` to find existing utilities by name, `findReferences` to verify a candidate is actually used elsewhere (not dead code), `goToDefinition` to inspect whether an existing function already handles the same logic.

For each change:

1. **Search for existing utilities and helpers** that could replace newly written code. Use LSP `workspaceSymbol` to search by function/class name before falling back to grep. Look for similar patterns elsewhere in the codebase — common locations are utility directories, shared modules, and files adjacent to the changed ones.
2. **Flag any new function that duplicates existing functionality.** Use `goToDefinition` on imports to check if the dependency already exposes the needed helper. Suggest the existing function to use instead.
3. **Flag any inline logic that could use an existing utility** — hand-rolled string manipulation, manual path handling, custom environment checks, ad-hoc type guards, and similar patterns are common candidates.

### Lens 2: Code Quality

**Use LSP for structure:** `documentSymbol` to understand file layout, `findReferences` to check if a parameter or export is actually consumed anywhere, `hover` for type info when checking stringly-typed code.

Review the same changes for hacky patterns:

1. **Redundant state**: state that duplicates existing state, cached values that could be derived, observers/effects that could be direct calls
2. **Parameter sprawl**: adding new parameters to a function instead of generalizing or restructuring existing ones
3. **Copy-paste with slight variation**: near-duplicate code blocks that should be unified with a shared abstraction
4. **Leaky abstractions**: exposing internal details that should be encapsulated, or breaking existing abstraction boundaries
5. **Stringly-typed code**: using raw strings where constants, enums (string unions), or branded types already exist in the codebase
6. **Unnecessary JSX nesting**: wrapper Boxes/elements that add no layout value — check if inner component props (flexShrink, alignItems, etc.) already provide the needed behavior

### Lens 3: Efficiency

**Use LSP for tracing:** `incomingCalls`/`outgoingCalls` to map call graphs and spot N+1 patterns, `findReferences` to find all callers of a hot function, `goToDefinition` to trace data flow through layers.

Review the same changes for efficiency:

1. **Unnecessary work**: redundant computations, repeated file reads, duplicate network/API calls, N+1 patterns
2. **Missed concurrency**: independent operations run sequentially when they could run in parallel
3. **Hot-path bloat**: new blocking work added to startup or per-request/per-render hot paths
4. **Unnecessary existence checks**: pre-checking file/resource existence before operating (TOCTOU anti-pattern) — operate directly and handle the error
5. **Memory**: unbounded data structures, missing cleanup, event listener leaks
6. **Overly broad operations**: reading entire files when only a portion is needed, loading all items when filtering for one

## Phase 3: Fix Issues

Fix each issue found. Skip false positives without debate.

When done, briefly summarize what was fixed (or confirm the code was already clean).
