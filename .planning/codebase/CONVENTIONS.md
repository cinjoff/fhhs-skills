# Coding Conventions

**Analysis Date:** 2026-03-27

## Naming Patterns

**Files:**
- JavaScript modules: `kebab-case.cjs` (e.g., `bin/lib/core.cjs`, `bin/lib/frontmatter.cjs`)
- Skill definitions: `SKILL.md` inside named directories (e.g., `.claude/skills/build/SKILL.md`)
- Agent definitions: `kebab-case.md` (e.g., `agents/gsd-codebase-mapper.md`)
- Commands: `kebab-case.md` (e.g., `.claude/commands/audit-upstream.md`)
- Hooks: `fhhs-kebab-case.js` (e.g., `hooks/fhhs-check-update.js`)
- Planning artifacts: `UPPERCASE.md` (e.g., `STATE.md`, `ROADMAP.md`, `PLAN.md`, `SUMMARY.md`)

**Functions:**
- Use `camelCase` for all function names
- Prefix command handler functions with `cmd`: `cmdGenerateSlug()`, `cmdStateLoad()`, `cmdVerifySummary()`
- Internal/shared utility functions use plain camelCase: `safeReadFile()`, `loadConfig()`, `extractFrontmatter()`
- Exported entry points match CLI subcommands: `cmdPhasesList`, `cmdRoadmapGetPhase`, `cmdRequirementsMarkComplete`

**Variables:**
- Use `camelCase` for local variables: `phaseInfo`, `reqContent`, `selfCheck`
- Use `UPPER_SNAKE_CASE` for constants/tables: `MODEL_PROFILES`
- Config keys use `snake_case` in JSON: `model_profile`, `commit_docs`, `branching_strategy`

**Types:**
- No TypeScript — all JavaScript (CommonJS). No type annotations.

## Code Style

**Formatting:**
- No automated formatter configured (no Prettier, ESLint, or Biome config files detected)
- Consistent 2-space indentation across all `.cjs` files
- Single quotes for strings in JavaScript
- Semicolons always present
- Max line length ~120 characters (soft convention)

**Linting:**
- No linter configured. Code quality is enforced through eval suite and manual review.

## Import Organization

**Order (CommonJS):**
1. Node.js built-ins: `fs`, `path`, `child_process`, `os`
2. Local modules from `./core.cjs`, `./frontmatter.cjs`, `./state.cjs`

**Pattern:**
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { safeReadFile, loadConfig, output, error } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
```

**Path Aliases:**
- None. All imports use relative paths.
- CLI entry point `bin/gsd-tools.cjs` requires from `./lib/` subdirectory.

## Error Handling

**Patterns:**

1. **Fatal errors in CLI commands** use the `error()` helper which writes to stderr and exits with code 1:
```javascript
// bin/lib/core.cjs
function error(message) {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}
```

2. **Graceful degradation** with empty catch blocks for optional operations:
```javascript
try {
  const content = fs.readFileSync(filePath, 'utf-8');
} catch {}
```
This is intentional for optional file reads (e.g., checking if STATE.md exists). The pattern appears in `bin/lib/commands.cjs`, `bin/lib/state.cjs`, `bin/lib/core.cjs`.

3. **Safe file reading** via `safeReadFile()` that returns `null` on failure:
```javascript
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}
```

4. **Structured error output** — command failures return JSON with error fields rather than throwing:
```javascript
output({ found: false, error: 'ROADMAP.md not found' }, raw, '');
```

## Output Conventions

**CLI output** always uses the `output()` helper from `bin/lib/core.cjs`:
```javascript
function output(result, raw, rawValue) {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));
  } else {
    const json = JSON.stringify(result, null, 2);
    if (json.length > 50000) {
      // Write to tmpfile for large payloads
      const tmpPath = path.join(require('os').tmpdir(), `gsd-${Date.now()}.json`);
      fs.writeFileSync(tmpPath, json, 'utf-8');
      process.stdout.write('@file:' + tmpPath);
    } else {
      process.stdout.write(json);
    }
  }
  process.exit(0);
}
```

**Dual output mode:** Every command supports `--raw` flag for plain text output (consumed by bash scripts in skills) and JSON output (default, consumed by skill orchestrators).

## SKILL.md Authoring Conventions

**Frontmatter (YAML):**
```yaml
---
name: fh:skill-name
description: One-line description of what the skill does.
user-invocable: true          # or false for internal-only skills
disable-model-invocation: true # optional, prevents auto-triggering
---
```

- Field is `user-invocable` (with a **c**), NOT `user-invokable` — misspelling silently defaults to `true`
- All user-facing skills use `fh:` prefix in the `name` field
- Skills reference other skills as `/fh:name` in prose, never `/name`

**Skill structure:**
1. Description paragraph with `$ARGUMENTS` placeholder
2. Dependency checks (`.planning/PROJECT.md` existence)
3. Numbered steps with markdown headers (`## Step N: Name`)
4. Inline bash code blocks for CLI tool invocations
5. XML-style tags for structured sections: `<required_reading>`, `<process>`, `<step name="...">`, `<role>`

**Agent definition frontmatter:**
```yaml
---
name: gsd-agent-name
description: What the agent does.
tools: Read, Bash, Grep, Glob, Write
color: cyan
skills:
  - internal-skill-name
---
```

## Logging

**Framework:** `console` is not used in CLI code. All output goes through `process.stdout.write()` and `process.stderr.write()` via the `output()` and `error()` helpers.

**Skills:** Use inline `echo` in bash code blocks for status messages. No logging framework.

## Comments

**When to Comment:**
- Section dividers using box-drawing characters: `// --- Section Name ---` or `// ─── Section Name ────`
- JSDoc-style block comments at the top of each module file describing purpose
- Inline comments for non-obvious regex patterns or migration logic
- No JSDoc on individual functions

**Module header pattern:**
```javascript
/**
 * ModuleName — Brief description of module purpose
 */
```

## Function Design

**Size:** Functions are typically 20-80 lines. Larger functions (100+) exist for complex parsing (frontmatter, roadmap).

**Parameters:** Command handlers follow the pattern `cmdName(cwd, ...specificArgs, raw)` where:
- `cwd` is always the first parameter (working directory)
- `raw` is always the last parameter (boolean for --raw output mode)
- Specific args come between

**Return Values:** Functions don't return values. They call `output()` or `error()` which exits the process. This is a CLI-specific pattern — every function is an endpoint.

## Module Design

**Exports:** Each module in `bin/lib/` exports all its public functions via `module.exports`:
```javascript
module.exports = { cmdGenerateSlug, cmdCurrentTimestamp, cmdListTodos, ... };
```

**Barrel Files:** None. The entry point `bin/gsd-tools.cjs` imports directly from each module and dispatches based on CLI args.

## Commit Messages

**Format:** Conventional commits required:
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `chore:` — maintenance
- `refactor:` — code restructuring
- `release:` — version bumps

## String Safety

**Critical rule:** Always use function form for `str.replace()` with dynamic content:
```javascript
// WRONG — $& in content corrupts replacement
str.replace(pattern, dynamicContent);

// CORRECT — function form avoids special replacement patterns
str.replace(pattern, () => dynamicContent);
```

---

*Convention analysis: 2026-03-27*
