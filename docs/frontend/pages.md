# Frontend View Pages

This document breaks down the major interactive pages navigating the React frontend.

## 1. Authentication Views (`pages/auth/`)

### `LoginPage.tsx`
The primary entry point.
- Renders a styled cyberpunk/neon entry terminal.
- Supports raw Email/Password authentication routed via `authApi.login()`.
- Capable of resolving specialized `fieldErrors` returned by the backend (e.g., highlighting the specific email box red if validation fails).
- Contains an External Auth hook (`window.location.href = '/oauth2/authorization/google'`) deferring the UI to the backend Google Redirect sequence.

---

## 2. Dashboard (`pages/dashboard/`)

### `DashboardPage.tsx`
The central nervous system of the portal post-login.
- Performs an initial data fetch hook. If Admin, fetching `adminApi.getAllUsers()`. If Alumni, fetching `profileApi.getMyProfile()`.
- **Responsive Geometry**: Disables absolute document scrolling. Fixes its own height to `calc(100vh - 120px)`. 
- Implements parallel, independently scrolling flex-columns (utilizing `.custom-scrollbar` and `.custom-scrollbar-purple` micro-CSS classes) to display `Profile Data` next to `Skills_Log` without clashing.
- Shows dynamic top-level Stat Cards summarizing Database Health/Active User counts for Admins, or Profile Completeness percentages for Alumni.

---

## 3. Administrative Workbenches (`pages/admin/`)

### `AdminPage.tsx`
A complex data-table view mapped to `AdminUserDto` arrays.
- Implements real-time DOM-based filtering: Searching instantly parses names, emails, and roles without pinging the backend.
- Supports deep CRUD controls via embedded Action buttons on every row (`Lock`, `Enable`, `Delete`).
- Capable of manipulating user roles by executing `<Modal>` workflows utilizing `adminApi.assignRole()` and instantly appending the `ROLE_` prefix string to user inputs before API dispatch.

### `AdminEmailPage.tsx` (Implied via Architecture)
Consumes the `adminApi.sendTargetedEmail` backend capability. Likely renders a form with multi-select dropdowns passing parameters (`department`, `degree`, `graduationYear`) matching the backend BulkEmailRequest.

---

## 4. Community & Alumni Directory Hooks (`pages/alumni/` & `pages/posts/`)

### Directory Logic
- Utilizes `alumniApi.getAll()` or `postsApi.getAll()`. 
- Ingesters must parse backend URL strings via the `getImageUrl()` utility before mounting `<img>` tags locally to prevent broken rendering, as the core backend endpoints might supply partial URIs (like `/uploads/...`) versus absolute URIs (like `https://lh3.googleusercontent.com/...`).
