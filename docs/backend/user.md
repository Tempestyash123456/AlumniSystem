# Backend User & Profile Module

This document provides a deep-dive into the administration, directory listings, and extended profile management capabilities within the Alumni Portal.

## 1. Core Entities

### `User.java`
**Path:** `src/main/java/com/university/alumni/user/entity/User.java`

The foundational entity of the system mapped to the `users` table. Extends `BaseEntity` (providing UUIDs, createdAt, etc.) and strictly implements Spring Security's `UserDetails` contract.

#### Key Variables
- `email` (String): Unique identifier and login username.
- `passwordHash` (String): Stores external BCrypt encodings.
- `enabled`, `accountLocked` (boolean): Native Spring Security toggles.
- `failedLoginCount` (int): Counter used to trigger lockouts after 5 failed attempts.
- `roles` (Set<Role>): A `@ManyToMany` persistent collection executing Eager fetches (mandatory for real-time auth checking).

#### Key Methods
- **`getAuthorities()`**: Maps persistent `Role` mappings into stateless `SimpleGrantedAuthority` objects.
- **`incrementFailedLogin()`**: Self-contained lock logic shifting `accountLocked` to true if threshold (>= 5) is met.

### `AlumniProfile.java`
**Path:** `src/main/java/com/university/alumni/user/entity/AlumniProfile.java`

Maps to the `alumni_profiles` table, mapped `OneToOne (fetch = LAZY)` back to `User`. Accommodates granular details separated from the heavily hit auth user entity.

#### Key Variables
- Contains partitioned metrics: Academic (`studentId`, `graduationYear`, `degree`), Professional (`currentCompany`, `githubUrl`), and Personal (`bio`, `city`).
- `skills` (List<String>): Utilizes a native PostgreSQL array structure mapped via hibernate `@JdbcTypeCode(SqlTypes.ARRAY)`.
- **Scoring toggles**: `profileScore`, `profilePublic`, `openToMentor`, `openToHire`.

#### Key Methods
- **`recomputeScore()`**: Incrementally builds a 0-100 completion integer metric by scanning active fields. Called actively before any `.save()` operation.

---

## 2. Business Services

### `ProfileService.java`
**Path:** `src/main/java/com/university/alumni/user/service/ProfileService.java`

Manages extended detail CRUD.

#### Methods
- **`getMyProfile(UUID)` / `getProfileByUserId(UUID)`**: Finds the active `User` or throws HTTP 404. Pulls their profile lazily. Allows mapping even if the `AlumniProfile` entity doesn't exist yet in the DB.
- **`updateMyProfile(UUID, UpdateProfileRequest)`**: 
  1. Splices the single HTTP Request DTO across two database entities. 
  2. Commits core fields like phone or name back to `UserRepository`.
  3. Uses `.orElseGet(...)` to initialize a blank `AlumniProfile` if this is their first edit.
  4. Calls `recomputeScore()` and commits to `AlumniProfileRepository`.
- **`applyUpdates(...)`**: Massive internal mapper preventing null overrides from nullifying DB states.

### `AdminService.java`
**Path:** `src/main/java/com/university/alumni/user/service/AdminService.java`

Restricted logic allowing elevated privileges to administer the user base.

#### Methods
- **`getAllUsers()` / `getUserById(UUID)`**: Pulls users strictly filtering out soft-deleted (`deletedAt != null`) accounts.
- **`assignRole(...)` / `removeRole(...)`**: Finds native Role entities and directly splices the set array in `user.getRoles()`.
- **`setAccountLock(...)`**: Toggles lock states and forcefully calls `resetFailedLogin()` if passing an unlock instruction.
- **`setAccountEnabled(...)`**: Hard override for account activation bypassing regular email workflows.
- **`deleteUser(UUID)`**: Relies on a hibernate `SQLDelete` override hook in `BaseEntity` to perform a non-destructive soft-delete in the database.
- **`sendTargetedEmails(BulkEmailRequest)`**: An advanced dynamic mailer. Allows single targeted dispatch via email, or bulk complex queries fetching `all` profiles applying runtime stream filters (`department`, `graduationYear`), extracting the base `User` entities, templating the body (e.g., `{{firstName}}`), and mass queueing `EmailService`.

### `AlumniService.java`
**Path:** `src/main/java/com/university/alumni/user/service/AlumniService.java`

#### Methods
- **`getAllVerifiedAlumni()`**: Fetches raw `User` rows, strictly verifying `.isEnabled()` logic. Transforms into a sanitized `.AlumniDto` intentionally blocking the exposure of PII (phone numbers, full profile data) and security states (passwordHashes, UUID role lists) to the frontend directory boards.
