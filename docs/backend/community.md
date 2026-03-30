# Backend Community Modules

This document provides a deep-dive into the Post and Event generation subsystems utilized by the Alumni Portal. 

## 1. Posts Subsystem

### `Post.java`
**Path:** `src/main/java/com/university/alumni/post/entity/Post.java`

Maps to the `posts` database table. Designed to function as an Admin-authored chronological blog/announcement board.

#### Key Variables
- `title` (String): Standard headline.
- `description` (String): Defined with `columnDefinition = "TEXT"`. Designed to ingest and serve raw Markdown formatting from the frontend WYSIWYG editors without truncating.
- `imageUrl` (String): Can be null. Maps to local disk storage (`/uploads/...`) or external URLs.
- `author` (User): Foreign Key mapped as `ManyToOne (fetch = LAZY)`.

### `PostService.java`
**Path:** `src/main/java/com/university/alumni/post/service/PostService.java`

Manages CRUD operations and multipart file offloading for Posts.

#### Methods
- **`getAllPosts()`**: Executes a strict `findAllActive()` JPQL query filtering out soft-deleted posts, returning a formatted `PostResponse` list.
- **`createPost(...)`**:
  1. Validates the `authorId`.
  2. Receives an optional `MultipartFile image`. If present, offloads processing to the `FileStorageService.storePostImage(image)` intercept, immediately retrieving the saved local path string (e.g., `/uploads/posts/xxx.jpg`).
  3. Builds and persists the `Post`.
- **`updatePost(...)`**: Iterates through incoming DTO properties. Crucially includes a `request.removeImage()` boolean toggle allowing frontend clients to delete an existing image without replacing it with a new one.
- **`deletePost(UUID)`**: Finds the `Post` and invokes `softDelete()`, inherited from `BaseEntity`. 

---

## 2. Events Subsystem

### `Event.java`
**Path:** `src/main/java/com/university/alumni/event/entity/Event.java`

Maps to the `events` database table. Represents scheduled occurrences that support rich media and downloadable assets.

#### Key Variables
- `startTime` / `endTime` (Instant): Strict UTC time boundaries.
- `place` (String): Physical location or virtual URL.
- `mediaUrl` / `mediaType` (String): Supports an embedded header asset. `mediaType` strictly stores `"IMAGE"` or `"VIDEO"` hints for the frontend renderer.
- `documentUrl` / `documentName` (String): Allow events to distribute a downloadable payload (e.g., a PDF itinerary). `documentName` stores the original uploaded filename rather than a stripped UUID so downloads feel natural to the end user.

### `EventService.java`
**Path:** `src/main/java/com/university/alumni/event/service/EventService.java`

Administers event generation and specialized visibility filtering.

#### Methods
- **`getAllEvents(CachedUserDetails)`**: 
  - **Business Logic Layer Hook**: Extracts the Spring Security roles (`ADMIN` / `ALUMNI`). 
  - If the viewing user is purely an `ALUMNI`, it actively filters the stream and **only returns events authored by a user possessing the `ADMIN` role**. This prevents the main dashboard feed from being flooded if Alumni were ever given event creation permissions, turning it into a curated administrative board.
- **`createEvent(...)`**: 
  1. Accepts parallel `MultipartFile` arrays (`media` and `document`).
  2. Parses the MIME type `media.getContentType().startsWith("video")` intelligently setting the `mediaType` flag on the entity automatically.
  3. Uses two different file processor queues in `FileStorageService` (`storeEventMedia` and `storeEventDocument`).
- **`updateEvent(...)`**: Performs patch-like mutations on fields. Honors specific boolean deletion toggles (`removeMedia()`, `removeDocument()`) granting high flexibility to Admin editors.
- **`deleteEvent(UUID)`**: Executes a `softDelete()`.
