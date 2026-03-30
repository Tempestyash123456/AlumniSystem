# Alumni Portal Documentation

Welcome to the deep-dive technical documentation for the Alumni Portal. 
This directory contains comprehensive explanations profiling every module, controller, service, entity, and frontend component within the monolithic stack.

## 🗄️ Backend Modules (Spring Boot)
Situated in `src/main/java/com/university/alumni/`:

- **[Security & JWT](backend/security.md)**: Explains the Spring Security Filter chains, JWT generation, and OAuth2 login workflows.
- **[Authentication Core](backend/auth.md)**: Details traditional Email/Password login, registration schemas, mathematical Refresh Token rotation, and Email verification.
- **[Users & Profiles](backend/user.md)**: Covers the heavily utilized `ProfileService`, `AdminService`, and the `AlumniProfile` entity mapping capabilities.
- **[Community & Feeds](backend/community.md)**: Explains the internal logic behind Blog Posting and Event scheduling features.
- **[Common Infrastructure](backend/common.md)**: Explores system-wide implementations like the Redis Cache Layer, global JSON exception intercepts, and local `FileStorageService` IO bindings.

## 💻 Frontend Application (Vite / React)
Situated in `my-frontend/src/`:

- **[React Components](frontend/components.md)**: Details the overarching layout geometries, pre-boot splash sequences, and generic UI styling primitives.
- **[View Pages](frontend/pages.md)**: Breaks down interactive logic within the Dashboard, Auth Terminals, and complex Admin Workbench tables.
- **[API Orchestration](frontend/api.md)**: Deep dive into the custom Fetch wrapper handling automated token intercepting, queueing, and error parsing.
- **[Zustand Stores](frontend/store.md)**: Explains global persistence strategies tying active authentication data seamlessly into the DOM.
