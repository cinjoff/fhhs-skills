# Project Roadmap

## Phase 01: Authentication (COMPLETE)
**Goal:** Secure authentication with JWT tokens and session management

### Requirements
- **R-001:** JWT-based authentication with access/refresh token pair
- **R-002:** Login form with email/password validation
- **R-003:** Session persistence with automatic token refresh

### Success Criteria
- Users can log in with email/password
- Access tokens expire after 15 minutes
- Refresh tokens rotate on use

---

## Phase 02: Dashboard (IN PROGRESS)
**Goal:** Main dashboard with metrics, charts, and recent user activity

### Requirements
- **R-004:** Dashboard page with metric cards showing KPIs
- **R-005:** Chart widget for activity visualization

### Success Criteria
- Dashboard loads metrics from API
- Charts render with real data
- Responsive layout works on tablet+

---

## Phase 03: User Management (PLANNED)
**Goal:** Full CRUD for user accounts with role-based access

### Requirements
- **R-006:** User list with search, sort, and pagination
- **R-007:** User creation/editing form with validation

### Success Criteria
- Admin can create, edit, delete users
- Role changes take effect immediately
- Form validates all fields before submission

---

## Phase 04: Settings (PLANNED)
**Goal:** Application settings including theme, notifications, and preferences

### Requirements
- **R-008:** Theme toggle with dark mode support
- **R-009:** Notification and language preferences

### Success Criteria
- Dark mode persists across sessions
- Settings changes save immediately
