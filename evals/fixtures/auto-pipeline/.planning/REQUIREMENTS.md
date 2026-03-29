# Requirements

## Phase 1: Setup
- REQ-01: Project must have a Makefile with start, test, and build targets
- REQ-02: CI must run tests on every PR via GitHub Actions

## Phase 2: Core API
- REQ-03: GET /tasks returns list of all tasks as JSON array
- REQ-04: POST /tasks creates a new task with title, description, and status
- REQ-05: PUT /tasks/:id updates an existing task
- REQ-06: DELETE /tasks/:id removes a task

## Phase 3: Auth
- REQ-07: POST /auth/login returns JWT token for valid credentials
- REQ-08: Protected endpoints require valid Bearer token in Authorization header
