# Backend Common & Configuration Module

This document provides a deep-dive into the shared infrastructure layer of the backend, covering global configurations, exception handling, and core generic entities.

## 1. Configurations (`/config/`)

### `RedisConfig.java`
**Path:** `src/main/java/com/university/alumni/common/config/RedisConfig.java`

Manages exactly how Spring Boot connects to the Redis server and how Java objects are serialized into binary formats for storage.

#### Key Implementations
- **`redisObjectMapper()`**: Crucial custom mapper configuration. 
  - Uses `BasicPolymorphicTypeValidator` enforcing `As.PROPERTY` typing. This ensures serialized JSON embeds `"@class":"com.university...User"` instead of wrapping data in arrays. This is necessary to properly re-inflate polymorphic types utilized by Spring Security (like `SimpleGrantedAuthority`).
- **`cacheManager()`**: Initializes the `RedisCacheManager`. Defines differing TTLs (Time-To-Live) for specific caches:
  - `ALUMNI_PROFILES`: 15 Minutes
  - `EVENTS`: 5 Minutes
  - `USER_DETAILS`: 30 Minutes
  - `STATS`: 1 Hour

### `WebMvcConfig.java`
**Path:** `src/main/java/com/university/alumni/common/config/WebMvcConfig.java`

Alters native Spring Web MVC behavior.

#### Key Methods
- **`addResourceHandlers(...)`**: Instructs the embedded Tomcat server to natively serve static files resting inside the system's `uploads/` directory on the disk straight to the HTTP `/uploads/**` path mappings, effectively bypassing the application controller layer for much faster media rendering.

### `AppProperties.java`
**Path:** `src/main/java/com/university/alumni/common/config/AppProperties.java`

An `@ConfigurationProperties(prefix = "app")` bound record parsing the `application.yml` file. Maps JWT secrets, token expiries, and frontend CORS allowed origins into strongly typed fields injectable into other services.

### `AuditConfig.java`
**Path:** `src/main/java/com/university/alumni/common/config/AuditConfig.java`

Initializes Spring Data JPA Auditing. Extracts the current Username/Email from the active `SecurityContextHolder` to automatically populate the `@CreatedBy` and `@LastModifiedBy` columns on entities natively.

---

## 2. Shared Entities (`/entity/`)

### `BaseEntity.java`
**Path:** `src/main/java/com/university/alumni/common/entity/BaseEntity.java`

An abstract `@MappedSuperclass` inherited by all database models in the project.

#### Key Variables
- `id` (UUID): Standardized GenerationType.UUID primary keys.
- `createdAt` / `updatedAt` (Instant): Timestamped automatically via `@EntityListeners(AuditingEntityListener.class)`.
- `deletedAt` (Instant): Centralizes the **Soft Delete** logic. If this column is not null, the entity is considered deleted across the application. Contains a convenience `softDelete()` method.

---

## 3. Global Exception Handling (`/exception/`)

### `GlobalExceptionHandler.java`
**Path:** `src/main/java/com/university/alumni/common/exception/GlobalExceptionHandler.java`

A standard `@RestControllerAdvice` controller that intercepts unhandled exceptions bubbling out of business services, transforming them into stylized `ApiResponse.error()` JSON payloads.

#### Methods
- **`handleValidation()`**: Catches `MethodArgumentNotValidException` (triggered by `@Valid` on DTO payloads). Parses inner array field errors map and returns a clean 422 HTTP response.
- **`handleNotFound()` / `handleConflict()` / `handleBadRequest()`**: Map domain-specific runtime exceptions to `404`, `409`, and `400` respectively.
- **`handleGeneric()`**: A catch-all net preventing Spring's default Whitelabel Error Pages or Raw Stack Traces from leaking into API responses. Returns a simple HTTP `500`.

---

## 4. Shared Services (`/service/`)

### `FileStorageService.java`
**Path:** `src/main/java/com/university/alumni/common/service/FileStorageService.java`

Standardized IO router writing volatile `MultipartFile` bites to the `uploads/` volume mapped locally.

#### Methods
- **`storeProfilePhoto()`, `storePostImage()`, `storeEventMedia()`, `storeEventDocument()`**: Specialized public routers targeting sub-directories (e.g. `uploads/posts/`). 
  - They enforce granular hard-coded verification limits via internal constraints: images max out at 5MB, Event Videos up to 100MB, PDFs/Documents up to 50MB.
- **`store()`**: Core Java `java.nio.file.Files.copy()` executor returning final formatted URL access strings. Includes failsafes that create necessary missing directory paths on the fly.
