---
milestone: v1.0
phases: 4
---

# Roadmap

## Milestone: v1.0 — Core Product

| Phase | Name | Goal | Status |
|-------|------|------|--------|
| 01 | Auth | User signup, login, session management | In Progress |
| 02 | Boards | Create/edit/delete boards with permissions | Planned |
| 03 | Tasks | Task CRUD, assignments, status tracking | Planned |
| 04 | Dashboard | Overview page with task stats and activity | Planned |

## Phase 01: Auth
**Goal:** Users can sign up, log in, and maintain sessions. Protected routes redirect to login.
**Success Criteria:**
- User can create account with email/password
- User can log in and see protected dashboard
- Unauthenticated users redirected to /login
**Requirements:** AUTH-01, AUTH-02, AUTH-03
