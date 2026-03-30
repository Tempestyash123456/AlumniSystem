# Frontend API Client Architecture

This document provides a deep-dive into the central `api.ts` file acting as the sole gateway for frontend-to-backend communication.

## `lib/api.ts`
**Path:** `my-frontend/src/lib/api.ts`

### 1. Token Storage (`tokenStorage`)
A simple wrapper around the browser's native `localStorage`.
- **`getAccess()` / `getRefresh()`**: Synchronously reads keys.
- **`set(access, refresh)`**: Writes both tokens.
- **`clear()`**: Wipes tokens upon logout or unrecoverable fetch errors.

### 2. The Core Fetch Wrapper (`apiFetch<T>`)
A robust `Promise` returning functional wrapper over the native `fetch` API.

#### Mechanics:
1. **Header Injection**: Intercepts every outgoing request, reading `tokenStorage.getAccess()` and prepending `Authorization: Bearer ...` if present. Dynamically toggles `Content-Type: application/json` unless the payload is detected to be a `FormData` object (used for multipart image uploads).
2. **Global Refresh Token Interceptor**:
   - If a request returns a `TOKEN_EXPIRED` JSON error payload from the backend, it pauses execution.
   - It sets an `isRefreshing` lock flag.
   - It executes `refreshAccessToken()`, asynchronously retrieving a new pair of JWTs from `/auth/refresh`.
   - Any parallel requests that fail while this lock is active are saved into `refreshQueue: Array<(token: string) => void>`.
   - Once the new token arrives, the queue is blasted, retrying all suspended API calls with the new token.
   - If the refresh itself fails (e.g., refresh token expired), it wipes storage via `tokenStorage.clear()` and force-redirects to `/login`.
3. **Graceful Error Handling**: Wraps catastrophic failures (like network disconnections) in a standardized `ApiResponse` structure containing `NETWORK_ERROR`.

### 3. API Exporter Objects
To keep React components clean, raw fetch paths are abstracted into strictly typed JavaScript objects.

#### `authApi`
- Exports `login()`, `register()`, `logout()`, `me()`, `forgotPassword()`, `resetPassword()`, and `verifyEmail()`.

#### `profileApi`
- Manages `getMyProfile()` and `updateMyProfile()`.
- **`uploadPhoto(File)`**: Instantiates a native `FormData` object, appends the binary `File`, and dispatches without a JSON header.

#### `adminApi`
- Contains elevated administrative calls resolving against `/api/v1/admin/...` including toggles for locking users (`setLock`), role modifications (`assignRole`, `removeRole`), and the `sendTargetedEmail` bulk mailer.

#### `postsApi` / `eventsApi`
- **`create(...) / update(...)`**: Like `uploadPhoto`, these intelligently assemble mixed payloads (JSON strings alongside raw binary files in the same POST request) via `FormData` instances. Supports appending `removeImage` boolean toggles for deletion.

### 4. Utilities
**`getImageUrl(path)`**
Normalizes partial URLs. Returns unaltered paths if they begin with `http` (OAuth Google photos) or relative `/uploads` paths matching the proxy configuration.
