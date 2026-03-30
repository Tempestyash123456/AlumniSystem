# Frontend Components & Core Layout

This document details the root structural layout and reusable UI component architecture of the React environment.

## 1. The Root Entry (`App.tsx`)
**Path:** `my-frontend/src/App.tsx`

The core router and authentication gatekeeper.

### Router Elements
Implements `react-router-dom` mappings dividing the application into three security zones:
1. **Public Routes:** `/login`, `/register`, `/forgot-password`, `/oauth2/callback`. Wrapped in `<RedirectIfAuth>` to push already logged-in users directly to their dashboard.
2. **Protected Routes:** `/dashboard`, `/profile`, `/posts`, `/events`. Wrapped in `<RequireAuth>` which validates the `isAuthenticated` boolean from `authStore`.
3. **Admin Routes:** `/admin/...`. Wrapped in `<RequireAdmin>` which strictly checks `isAdmin` prior to render, bouncing normal users back to `/dashboard`.

### The Pre-Boot Sequence (`<AppBootstrap>`)
Before the main router mounts, a `booting` state is active.
- `AppBootstrap` silently reads local storage. 
- If tokens exist, it fires `authApi.me()`.
- If successful, it re-hydrates the Zustand `authStore` with live data.
- If it fails (or no token exists), it executes `clearAuth()`.
- Finally, it calls `onDone()` removing the `<LoadingScreen />` and rendering the router.

---

## 2. Core Layout (`Layout.tsx`)
**Path:** `my-frontend/src/components/layout/Layout.tsx`

The main shell enveloping all authenticated pages, providing consistent navigation.

### Structural Flexbox Design
1. **Sidebar (`<aside>`)**: Fixed width (280px). Contains the `University Logo` and a dynamically rendered navigation list. `AdminNavItems` only render if `isAdmin` is true.
2. **Main Canvas (`<main>`)**: Set to `flex: 1` growing to fill the remaining horizontal viewport.
   - **Header (`<header>`)**: Fixed height. Contains the Title, the User Identity Pill (avatar, name, role designation), and System Actions (Theme Toggle, Logout).
   - **Scrollable Content Layer**: An enveloped container (`<div flex: 1 overflow: hidden>`) that guarantees the inner `<children>` can scroll independently without shifting the header off-screen.

---

## 3. Generic UI Components (`components/ui/index.tsx`)
**Design Philosophy:** The portal avoids heavy CSS libraries like Tailwind or Material UI, relying instead on custom, raw CSS elements mapped through specific `.className` assignments detailed in `index.css`. 

Key exported primitives include:
- `<Button>`: Supports `variant` (`solid`, `outline`, `ghost`, `danger`) and `loading` states.
- `<Input>`: Stylized text fields.
- `<Badge>`: Contextual color tags utilized in the Directory for parsing skills.
- `<Spinner>` & `<LoadingScreen>`: Global async indicators.
- `<Alert>`: In-page banner notifications.
- `<Modal>` & `<Confirm>`: Overlay dialogue wrappers handling administrative warnings and data intake workflows.
