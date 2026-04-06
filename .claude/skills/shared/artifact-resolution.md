# Shared Artifact Resolution Protocol

How skills locate planning artifacts. All skills that need PLAN.md, SPEC.md, CONTEXT.md, or RESEARCH.md follow this protocol instead of inlining their own file-finding logic.

---

## Resolution Chain

When a skill needs to find the active plan or its supporting artifacts, follow this chain in order. Stop at the first match.

```
1. claude-mem query (if available)
   → search({query: "<intent>", project, limit: 5})
   → Prefer observations tagged [plan-artifact] or [spec-section]

2. STATE.md
   → Read .planning/STATE.md → extract current_phase + active_plan path
   → If active_plan is absolute: use directly
   → If relative: resolve from .planning/phases/{phase}/

3. Phase directory
   → .planning/phases/{current_phase}/
   → List PLAN*.md files — use the one without a matching SUMMARY.md (= incomplete)

4. Fallback search
   → Glob(".planning/plans/PLAN*.md") — most recent by mtime
   → Glob(".planning/PLAN.md") — legacy single-plan projects
```

---

## Per-Artifact Loading Rules

Once the phase directory and PLAN.md path are known, load supporting artifacts as follows:

| Artifact | Load condition | How to load |
|----------|---------------|-------------|
| `PLAN.md` | Always | Full read (it IS the plan) |
| `SPEC.md` | If `spec:` field in PLAN.md frontmatter | `smart_unfold` target sections; full read only when editing |
| `CONTEXT.md` | If exists in phase dir | `smart_unfold({symbol: "Decisions"})` + `smart_unfold({symbol: "Discretion Areas"})` |
| `RESEARCH.md` | If referenced in PLAN.md or exists in phase dir | `smart_outline` first; `smart_unfold` relevant section |
| `STACK.md` / `ARCHITECTURE.md` | If task touches infra/dependencies | `smart_outline` only unless deeper context needed |

**Loading depth:**
- `smart_unfold` a section = load that heading's content only (not the whole file)
- Full read = only when you need to edit the file or when it is under ~100 lines

---

## Graceful Degradation

Skills must degrade gracefully when artifacts are missing. Never fail because a file doesn't exist.

| Scenario | Behavior |
|----------|----------|
| SPEC.md absent | Use PLAN.md + CONTEXT.md. Populate spec placeholders as empty strings. |
| CONTEXT.md absent | Use PLAN.md only. Skip context-aware enrichment. |
| RESEARCH.md absent | Skip research enrichment. Proceed with PLAN.md content. |
| STATE.md absent | Skip GSD phase resolution. Glob for PLAN*.md directly. |

---

## Claude-mem-First Rule

Before reading any file, query claude-mem by **intent** (not file path).

```
Pattern: search({query: "<what you need>", project, limit: 5})

Examples:
  "current plan active tasks wave"         → find active plan details
  "spec architecture data flow auth"       → find spec sections
  "context decisions locked scope"         → find context decisions
  "research findings domain"               → find prior research
```

If relevant observations are found (within 7 days), use them as primary input. Only read files when the observation content is insufficient or you need to edit.

This is **Pattern F** from `shared/claude-mem-rules.md`.

---

## Usage in Skills

Skills reference this protocol instead of inlining artifact-finding logic:

```
Resolve artifacts per @.claude/skills/shared/artifact-resolution.md
```

The skill then uses the resolved paths without repeating the chain logic.
