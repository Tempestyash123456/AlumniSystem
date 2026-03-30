# Backend Security Module

This document provides a deep-dive into the Spring Security configuration and JWT implementation of the Alumni Portal.

## 1. `SecurityConfig.java`
**Path:** `src/main/java/com/university/alumni/security/config/SecurityConfig.java`

Handles the core Spring Security integration, filter chain declaration, and CORS policies.

### Dependencies & Setup
- `@EnableWebSecurity` and `@EnableMethodSecurity` enable web layer security and method level auth (e.g. `@PreAuthorize`).
- Injects `JwtAuthenticationFilter`, `UserDetailsService`, `AppProperties`, and `OAuth2SuccessHandler`.

### Variables
- `PUBLIC_POST_PATHS` (`String[]`): Paths that bypass authentication for POST requests (login, register, forgot-password, oauth triggers).
- `PUBLIC_GET_PATHS` (`String[]`): Paths that bypass authentication for GET requests (health checks, public posts, uploads, swagger UI).

### Methods
- **`securityFilterChain(HttpSecurity http)`**: The main filter chain. Disables CSRF, sets stateless sessions, configures route authorization rules, handles OAuth2 login success, and attaches the `JwtAuthenticationFilter` before the `UsernamePasswordAuthenticationFilter`.
- **`corsConfigurationSource()`**: Defines global CORS policies. Allows specific origins (from `AppProperties`), methods, and exposes specific headers (like `Authorization` and `X-Total-Count`).
- **`authenticationProvider()`**: Instantiates a `DaoAuthenticationProvider` utilizing the injected local `UserDetailsService` and `PasswordEncoder`.
- **`authenticationManager(AuthenticationConfiguration)`**: Exposes the Spring Authentication Manager as a bean.
- **`passwordEncoder()`**: Returns a `BCryptPasswordEncoder` configured with strength 12.
- **`authenticationEntryPoint()`**: Returns a lambda that handles unauthorized requests (401), responding with a standardized JSON error message instead of default behavior.
- **`accessDeniedHandler()`**: Returns a lambda that handles forbidden requests (403), outputting a JSON payload.

---

## 2. `JwtAuthenticationFilter.java`
**Path:** `src/main/java/com/university/alumni/security/filter/JwtAuthenticationFilter.java`

A custom `OncePerRequestFilter` that intercepts incoming HTTP requests to validate JWT tokens.

### Variables
- `BEARER_PREFIX` (`String`): The literal string `"Bearer "`.
- `PUBLIC_PATHS` (`List<String>`): Base paths to bypass early during request filtering.

### Methods
- **`shouldNotFilter(HttpServletRequest)`**: Bypasses JWT checking for public paths and public GET calls to the `/api/v1/posts` endpoint.
- **`doFilterInternal(...)`**: Core logic. 
  1. Extracts the Authorization header.
  2. Parses the JWT using `JwtService`.
  3. Rejects tokens labeled as `REFRESH`.
  4. Loads the user using `UserDetailsService` and establishes a `UsernamePasswordAuthenticationToken` in the `SecurityContextHolder`.
  5. Catches `ExpiredJwtException` and other validation errors, outputting a clear JSON localized error via `writeErrorResponse`.
- **`writeErrorResponse(...)`**: Utility method that formats and writes an `ApiResponse` directly to the `HttpServletResponse` output stream.

---

## 3. `JwtService.java`
**Path:** `src/main/java/com/university/alumni/security/service/JwtService.java`

Handles the creation, validation, and parsing of JSON Web Tokens.

### Methods
- **`generateAccessToken(UserDetails)`**: Generates a short-lived token labeled with `"type": "ACCESS"` and includes the user's role authorities in the token claims. Uses expiry config from `AppProperties`.
- **`generateRefreshToken(UserDetails)`**: Generates a long-lived token labeled with `"type": "REFRESH"`. Used only for acquiring new access tokens.
- **`buildToken(...)`**: Internal builder utility appending common JWT properties (UUID string ID, issued at, expiry) and signing the token.
- **`extractUsername(String)`**: Parses the token and returns the subject (typically email).
- **`extractClaim(...)`**: Generic extractor using a functional resolver over the parsed claims.
- **`extractAllClaims(String)`**: Parses and validates the token signature against the configured HMAC secret. Made public to reduce multiple parsing overheads in the Auth Filter.
- **`getSigningKey()`**: Decodes the base64 application secret key and generates an HMAC SHA key utilized by `jjwt`.

---

## 4. `UserDetailsServiceImpl.java`
**Path:** `src/main/java/com/university/alumni/security/service/UserDetailsServiceImpl.java`

Bridges Spring Security to the application's database and caching layers.

### Methods
- **`loadUserByUsername(String)`**: Implementing the `UserDetailsService` contract. Searches the local `UserRepository` by email, eagerly fetching roles. It is wrapped with `@Cacheable(value = RedisConfig.CacheNames.USER_DETAILS, key = "#username")` to eliminate repetitive DB queries for active JWT sessions. Returns a `CachedUserDetails` instance instead of the raw entity.

---

## 5. `CachedUserDetails.java`
**Path:** `src/main/java/com/university/alumni/security/model/CachedUserDetails.java`

A serialized DTO mapping specifically crafted to cache securely in Redis while fulfilling the `UserDetails` contract. 

### Core Attributes
Contains strictly flattened fields (`id`, `email`, `passwordHash`, `firstName`, `lastName`, `profilePhotoUrl`, `enabled`, `accountLocked`, `roles` lists).

### Methods
- **Constructor (`@JsonCreator`)**: Prepares the object safely to allow Jackson to instantiate it from Redis binary caches.
- **`from(User)`**: Static factory mimicking a mapper; extracts and flattens roles.
- **`getAuthorities()`**: Re-inflates the raw string roles back into `SimpleGrantedAuthority` objects recognized by Spring Security context managers.
- **`JsonIgnore` Getters**: Various getters (like `getPassword()`) mask standard outputs while allowing internal Jackson specific methods `getPasswordHash()` to actually serialize states properly into Redis.

---

## 6. `OAuth2SuccessHandler.java`
**Path:** `src/main/java/com/university/alumni/security/oauth2/OAuth2SuccessHandler.java`

Executes after a successful Google/Github OAuth login to synchronize users and handoff a JWT back to the caller.

### Methods
- **`onAuthenticationSuccess(...)`**: 
  1. Extracts attributes (`email`, `picture`, `given_name`, `family_name`) from the `OAuth2User` provider payload.
  2. Resolves an existing local `User` by email, or dynamically creates one with the `ROLE_ALUMNI` default role and a randomized password if they don't exist.
  3. Updates their profile picture if null but provided by the OAuth provider.
  4. Generates a fresh `AccessToken`.
  5. Determines the target callback URL utilizing host headers/ports and executes an HTTP `302 Redirect` to `oauth2/callback?token=...`, passing authentication flow back to the frontend.
