# CLAUDE.md Update Guidelines

## Core Principle

Only add information that will genuinely help future Claude sessions. The context window is precious - every line must earn its place.

## What TO Add

### 1. Commands/Workflows Discovered

```markdown
## Build

`npm run build:prod` - Full production build with optimization
`npm run build:dev` - Fast dev build (no minification)
```

Why: Saves future sessions from discovering these again.

### 2. Gotchas and Non-Obvious Patterns

```markdown
## Gotchas

- Tests must run sequentially (`--runInBand`) due to shared DB state
- `yarn.lock` is authoritative; delete `node_modules` if deps mismatch
```

Why: Prevents repeating debugging sessions.

### 3. Package Relationships

```markdown
## Dependencies

The `auth` module depends on `crypto` being initialized first.
Import order matters in `src/bootstrap.ts`.
```

Why: Architecture knowledge that isn't obvious from code.

### 4. Testing Approaches That Worked

```markdown
## Testing

For API endpoints: Use `supertest` with the test helper in `tests/setup.ts`
Mocking: Factory functions in `tests/factories/` (not inline mocks)
```

Why: Establishes patterns that work.

### 5. Configuration Quirks

```markdown
## Config

- `NEXT_PUBLIC_*` vars must be set at build time, not runtime
- Redis connection requires `?family=0` suffix for IPv6
```

Why: Environment-specific knowledge.

## What NOT to Add

### 1. Obvious Code Info

Bad: `The UserService class handles user operations.`
The class name already tells us this.

### 2. Generic Best Practices

Bad: `Always write tests for new features.`
This is universal advice, not project-specific.

### 3. One-Off Fixes

Bad: `We fixed a bug in commit abc123 where the login button didn't work.`
Won't recur; clutters the file.

### 4. Verbose Explanations

Bad: multi-paragraph explanation of JWT tokens.
Good: `Auth: JWT with HS256, tokens in Authorization: Bearer <token> header.`

### 5. Planning Content

Bad: Copying phase goals or roadmap items into CLAUDE.md.
Good: `Project state tracked in .planning/. Run /fh:resume to check status.`

Planning content changes frequently as phases complete. CLAUDE.md should reference `.planning/` files, not duplicate them.

## GSD Project Updates

When updating CLAUDE.md in a GSD-tracked project:

**DO:**
- Reference `.planning/` for project state
- Include `/fh:resume` as the entry point for project status
- Reference `.planning/DESIGN.md` for design context (if it exists)
- Note commit conventions: `feat(phase-plan):`, `fix:`, `test:`, etc.
- Keep architecture section current with actual directory structure

**DON'T:**
- List current phases or milestones (they change — reference ROADMAP.md)
- Copy requirements from REQUIREMENTS.md
- Mention specific plan numbers or task details
- Duplicate design tokens from DESIGN.md

**After significant changes** (new feature areas, major refactors, stack changes):
- Update the Architecture section to reflect new directories or modules
- Update Commands if new scripts were added
- Add new Gotchas discovered during implementation
- Update Testing section if new test patterns were established

## Validation Checklist

Before finalizing an update, verify:

- [ ] Each addition is project-specific
- [ ] No generic advice or obvious info
- [ ] Commands are tested and work
- [ ] File paths are accurate
- [ ] Would a new Claude session find this helpful?
- [ ] Is this the most concise way to express the info?
- [ ] Not duplicating `.planning/` content
