# TaskFlow Codebase

## Architecture

TaskFlow is a Node.js/Express REST API using SQLite for persistence. The app follows a layered architecture: routes → handlers → db layer.

```
src/
  index.js       — Express app entry point, route registration
  routes/
    tasks.js     — Task CRUD route handlers
  db/
    schema.js    — SQLite table definitions
    queries.js   — Parameterized SQL queries
tests/
  tasks.test.js  — Jest integration tests for task endpoints
```

## Conventions
- All route handlers are async, errors bubble to Express error middleware
- SQLite queries use parameterized statements to prevent injection
- Response format: `{ data: T }` for success, `{ error: string }` for failure
- HTTP status codes: 200 OK, 201 Created, 404 Not Found, 400 Bad Request, 500 Server Error

## Key Files
- `src/index.js` — app setup and server listen
- `src/routes/tasks.js` — GET/POST/PUT/DELETE /tasks handlers
- `src/db/schema.js` — tasks table schema
- `package.json` — dependencies: express, better-sqlite3, jest
