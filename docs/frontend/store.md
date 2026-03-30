# Frontend State Stores (Zustand)

This document provides a deep-dive into the client-side global state orchestrations mapped via the Zustand library.

## 1. `authStore.ts`
**Path:** `my-frontend/src/store/authStore.ts`

Manages session persistence and user data delivery globally across React components.

### Implementation
Relies heavily on the `create<AuthState>()(persist(...))` middleware. 

#### Configuration
- **`name: 'auth-store'`**: Stores a stringified JSON representation of the user state inside `localStorage` under this key. This forces the UI to stay "logged in" visually across hard page reloads instantly without waiting for a backend `/me` request to finish.
- **`partialize`**: Strictly defines which fields to save, ensuring ephemeral or sensitive UI states derived during runtime aren't accidentally flushed to long-term browser storage.

#### Properties
- `user` (`UserInfo | null`): Replicates the backend DTO containing UUIDs, emails, and profile picture paths.
- `isAuthenticated` (`boolean`): Quick-check toggle for the Router.
- `isAdmin` (`boolean`): Convenience evaluated toggle explicitly checking if `ROLE_ADMIN` strings exist inside the `user.roles` payload. Controls sidebar renders.

#### Methods
- **`setUser(...)`**: Called predominantly on Login/Refresh. Mutates Zustand variables *and* actively saves to `tokenStorage` in the API layer simultaneously.
- **`clearAuth()`**: Erases the Zustand state map and wipes physical localStorage tokens.
- **`updateUser(Partial<UserInfo>)`**: Allows nested React components (like the Profile editor) to patch live variables within the `user` object (like a newly uploaded `profilePhotoUrl`) without requiring a full session refresh.

---

## 2. `themeStore.ts`
**Path:** `my-frontend/src/store/themeStore.ts`

A dedicated micro-store powering Light/Dark mode transitions.

### Implementation

#### Properties
- `theme` (`'dark' | 'light'`): Strongly typed strict toggles.

#### Initialization (`getInitialTheme`)
Immediately intercepts Native JS `localStorage.getItem('theme')` prior to React DOM mounting. It reads the previous preference and forcibly injects either `theme-dark` or `theme-light` CSS classes into the root `document.body` DOM element. This eliminates "Flashes of Unstyled Content" (FOUC).

#### Methods
- **`toggleTheme()`**: Mutates the Zustand state variable, saves the preference string to `localStorage` identically to `authStore`, and explicitly executes native DOM manipulations swapping the active CSS class.
