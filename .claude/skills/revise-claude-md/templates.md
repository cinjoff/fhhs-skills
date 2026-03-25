# CLAUDE.md Templates

## Key Principles

- **Concise**: Dense, human-readable content; one line per concept when possible
- **Actionable**: Commands should be copy-paste ready
- **Project-specific**: Document patterns unique to this project, not generic advice
- **Current**: All info should reflect actual codebase state
- **Reference, don't duplicate**: Point to `.planning/` files instead of copying their content

---

## Recommended Sections

Use only the sections relevant to the project. Not all sections are needed.

### Commands

Document the essential commands for working with the project.

```markdown
## Commands

| Command | Description |
|---------|-------------|
| `<install command>` | Install dependencies |
| `<dev command>` | Start development server |
| `<build command>` | Production build |
| `<test command>` | Run tests |
| `<lint command>` | Lint/format code |
```

### Architecture

Describe the project structure so Claude understands where things live.

```markdown
## Architecture

```
<root>/
  <dir>/    # <purpose>
  <dir>/    # <purpose>
  <dir>/    # <purpose>
```
```

### Key Files

List important files that Claude should know about.

```markdown
## Key Files

- `<path>` - <purpose>
- `<path>` - <purpose>
```

### Code Style

Document project-specific coding conventions.

```markdown
## Code Style

- <convention>
- <convention>
- <preference over alternative>
```

### Environment

Document required environment variables and setup.

```markdown
## Environment

Required:
- `<VAR_NAME>` - <purpose>
- `<VAR_NAME>` - <purpose>

Setup:
- <setup step>
```

### Testing

Document testing approach and commands.

```markdown
## Testing

- `<test command>` - <what it tests>
- <testing convention or pattern>
```

### Gotchas

Document non-obvious patterns, quirks, and warnings.

```markdown
## Gotchas

- <non-obvious thing that causes issues>
- <ordering dependency or prerequisite>
- <common mistake to avoid>
```

### Workflow

Document development workflow patterns.

```markdown
## Workflow

- <when to do X>
- <preferred approach for Y>
```

### Planning State (GSD projects)

Reference the `.planning/` directory. Do NOT duplicate its content.

```markdown
## Planning

Project state tracked in `.planning/`. Run `/resume` to check status.
Design tokens and aesthetic direction in `.planning/DESIGN.md`.
```

---

## Template: fhhs-skills Project (Recommended)

Use this for projects bootstrapped with `/fh:new-project`. Keep under 40 lines.

```markdown
# <Project Name>

<One-line description>

## Tech Stack

<framework>, <language>, <styling>, <database if any>

## Commands

| Command | Description |
|---------|-------------|
| `<dev command>` | Start dev server |
| `<build command>` | Production build |
| `<test command>` | Run tests |
| `<lint command>` | Lint/format |

## Architecture

```
<root>/
  src/          # Application source
  <dir>/        # <purpose>
  <dir>/        # <purpose>
```

## Code Style

- <convention specific to this project>
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Stage files individually, never `git add .`

## Testing

- <test runner> in `<test dir>/`
- <test file naming convention>

## Planning

Project state tracked in `.planning/`. Run `/fh:resume` to check status.
Design tokens and aesthetic direction in `.planning/DESIGN.md`.

## Gotchas

- <project-specific gotcha>
```

---

## Template: Project Root (Minimal)

For projects without GSD tracking.

```markdown
# <Project Name>

<One-line description>

## Commands

| Command | Description |
|---------|-------------|
| `<command>` | <description> |

## Architecture

```
<structure>
```

## Gotchas

- <gotcha>
```

---

## Template: Package/Module

For packages within a monorepo or distinct modules.

```markdown
# <Package Name>

<Purpose of this package>

## Usage

```
<import/usage example>
```

## Key Exports

- `<export>` - <purpose>

## Dependencies

- `<dependency>` - <why needed>

## Notes

- <important note>
```

---

## Template: Monorepo Root

```markdown
# <Monorepo Name>

<Description>

## Packages

| Package | Description | Path |
|---------|-------------|------|
| `<name>` | <purpose> | `<path>` |

## Commands

| Command | Description |
|---------|-------------|
| `<command>` | <description> |

## Cross-Package Patterns

- <shared pattern>
- <generation/sync pattern>

## Planning

Project state tracked in `.planning/`. Run `/fh:resume` to check status.
```

---

## Update Principles

When updating any CLAUDE.md:

1. **Be specific**: Use actual file paths, real commands from this project
2. **Be current**: Verify info against the actual codebase
3. **Be brief**: One line per concept when possible
4. **Be useful**: Would this help a new Claude session understand the project?
5. **Reference `.planning/`**: Don't copy planning content into CLAUDE.md — point to it
