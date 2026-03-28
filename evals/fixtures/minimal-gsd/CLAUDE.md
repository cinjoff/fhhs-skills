# minimal-gsd-test

A minimal TypeScript Express project for GSD skill testing.

## Stack

- TypeScript (strict mode)
- Express 4.x
- Node.js 18+

## Code Style

- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Use `async/await`, not callbacks
- Export named functions, not default exports
- All handlers must have explicit return types

## Project Structure

```
src/
  index.ts       — server entry point
  routes/        — route handlers
  middleware/    — Express middleware
```
