# Backend Authentication Module

This document provides a deep-dive into the custom authentication, registration, refresh token management, and email verification workflows of the Alumni Portal backend.

## 1. `AuthController.java`
**Path:** `src/main/java/com/university/alumni/auth/controller/AuthController.java`

Exposes REST endpoints for the full authentication lifecycle. 

### Endpoints / Methods
- **`POST /register`**: Accepts a `RegisterRequest`. Delegates to `authService.register` and returns a 201 Created with a success message.
- **`POST /login`**: Accepts a `LoginRequest`. Returns user info, an `accessToken`, and a long-lived `refreshToken`.
- **`POST /refresh`**: Requires a strictly valid `RefreshTokenRequest`. Validates the old token and rotates it, returning a new pair of access and refresh tokens.
- **`POST /forgot-password`**: Triggers a password reset flow via email for the requested address. Always returns a generic success message to prevent user enumeration attacks.
- **`POST /reset-password`**: Consumes a `ResetPasswordRequest` containing a secret token and new password. Updates the user's credentials.
- **`POST /verify-email`**: Validates a one-time token received via email and activates the user account.
- **`POST /logout`**: Accepts a refresh token to revoke it individually, preventing future use. Injects `@AuthenticationPrincipal` to also execute a cache eviction in the service layer.
- **`POST /logout-all`**: Revokes all active refresh tokens associated with the current user, logging them out globally across all devices.
- **`GET /me`**: Returns the current session's `UserInfo` without needing a database hit, drawing state directly from the `CachedUserDetails` Principal context.

---

## 2. `AuthService.java`
**Path:** `src/main/java/com/university/alumni/auth/service/AuthService.java`

Contains the core business logic for user authentication state mutations.

### Methods
- **`register(RegisterRequest)`**: Blocks duplicate emails. Creates a locked `User` entity injected with the `ROLE_ALUMNI` role. Generates an `EMAIL_VERIFICATION` token and transmits an activation link via `EmailService`.
- **`login(LoginRequest, HttpServletRequest)`**: Leverages `AuthenticationManager` to validate credentials. Updates `lastLogin` timestamp. Generates JWT pairs and safely stores a hashed Refresh Token appending device metadata (User-Agent header).
- **`refresh(RefreshTokenRequest, HttpServletRequest)`**: Uses `RefreshTokenService` to validate the incoming string. Revokes the used token (Token Rotation policy) and issues fresh JWTs.
- **`logout(...) / logoutAllDevices(...)`**: Hands token revoking to the `RefreshTokenService`. Crucially uses `@CacheEvict` to purge active `USER_DETAILS` Redis caches, instantly terminating access scope.
- **`verifyEmail(String)`**: Looks up the DB token, validates expiry dates, sets `user.enabled = true`, deletes the consumed token, and evicts active session caching.
- **`forgotPassword(String)`**: Looks up the user; if found, creates a `PASSWORD_RESET` token expiring in 1 hour and dispatches an email message. (Fails silently if user isn't found).
- **`resetPassword(ResetPasswordRequest)`**: Accepts the secret token from the email, validates it, mathematically hashes the new incoming password, updates the DB, and deletes the one-time token.
- **`buildAuthResponse(...)`**: Internal builder packaging up standard JWT token DTO responses.

---

## 3. `RefreshTokenService.java`
**Path:** `src/main/java/com/university/alumni/auth/service/RefreshTokenService.java`

Manages secure, stateful session tokens.

### Security Implementation
Never stores raw `RefreshTokens` in the database. Instead, calculates and persists a mathematical SHA-256 hash. This mitigates severe damage if the Token Table is compromised via SQL Injection.

### Methods
- **`create(...)`**: Hashes the raw JWT Refresh Token, appends device headers, and persists a `RefreshToken` DB entity.
- **`validateAndGet(String)`**: Hashes the incoming token string, compares it to DB records, checks hard expiry dates, and critically audits `isRevoked()` statuses. If a revoked token is re-submitted, it triggers a catastrophic session killswitch (`revokeAllForUser()`) assuming a token-snatching attack has occurred.
- **`revoke(RefreshToken)`** / **`revokeAllForUser(UUID)`**: Mutates the active lifecycle states of tracking tokens.
- **`cleanupExpiredTokens()`**: A Cron Scheduled Job (`@Scheduled`) triggering daily at 2:00 AM. Permanently deletes tokens exceeding a 30-day cutoff point to prevent unbounded table growth.
- **`hash(String)`**: Pure `MessageDigest` SHA-256 utility method.

---

## 4. `EmailService.java`
**Path:** `src/main/java/com/university/alumni/auth/service/EmailService.java`

Handles asynchronous email dispatches.

### Methods
- **`sendEmail(String to, String subject, String body)`**: Wrapped with `@Async` to prevent UI thread blocking while connecting to SMTP servers. Dispatches simple plain text emails utilizing Spring Boot's `JavaMailSender` driven by `application.yml` properties. Logs success or connectivity failures gracefully.

---

## 5. `AuthDtos.java`
**Path:** `src/main/java/com/university/alumni/auth/dto/AuthDtos.java`

Contains immutable `Record` objects modeling inbound HTTP request payloads and outbound structures.

### Key Data Transfer Objects
- **`RegisterRequest` / `ResetPasswordRequest`**: Utilizes heavy `jakarta.validation` annotations enforcing strong passwords (Regex checking for uppercase, lowercase, numbers, specials, minimum 8 characters) and `@Email` constraints.
- **`LoginRequest`**: Requires strict `@NotBlank` annotations on `email` and `password`.
- **`AuthResponse`**: Formats the final output containing raw tokens alongside a nested `UserInfo` state.
- **`UserInfo`**: A flattened projection containing core string identities so frontend clients do not have to parse the JWT payload manually to render visual profile pictures or name badges.
