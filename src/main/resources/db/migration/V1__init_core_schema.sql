-- ============================================================
-- V1__init_core_schema.sql
-- Creates the foundational tables for auth and user management
-- ============================================================

-- Enable UUID generation (PostgreSQL extension)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- For fuzzy text search later

-- ── Roles ──────────────────────────────────────────────────────────────────
CREATE TABLE roles (
                       id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                       name        VARCHAR(50) NOT NULL UNIQUE,   -- ROLE_ADMIN, ROLE_ALUMNI, etc.
                       description VARCHAR(255),
                       created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
                                          ('ROLE_ADMIN',   'Full administrative access'),
                                          ('ROLE_ALUMNI',  'Verified alumni member'),
                                          ('ROLE_STUDENT', 'Current student'),
                                          ('ROLE_FACULTY', 'Faculty / Staff member');

-- ── Users ──────────────────────────────────────────────────────────────────
CREATE TABLE users (
                       id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                       email               VARCHAR(255) NOT NULL UNIQUE,
                       password_hash       VARCHAR(255) NOT NULL,
                       first_name          VARCHAR(100) NOT NULL,
                       last_name           VARCHAR(100) NOT NULL,
                       phone               VARCHAR(20),
                       profile_photo_url   VARCHAR(500),
                       is_enabled          BOOLEAN     NOT NULL DEFAULT FALSE,   -- Email not verified yet
                       is_account_locked   BOOLEAN     NOT NULL DEFAULT FALSE,
                       last_login_at       TIMESTAMPTZ,
                       failed_login_count  INT         NOT NULL DEFAULT 0,
    -- Audit columns (populated by Spring Data Auditing)
                       created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       created_by          VARCHAR(255),
                       updated_by          VARCHAR(255),
                       deleted_at          TIMESTAMPTZ            -- Soft delete
);

-- ── User ↔ Role (many-to-many) ──────────────────────────────────────────────
CREATE TABLE user_roles (
                            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
                            PRIMARY KEY (user_id, role_id)
);

-- ── Refresh Tokens ──────────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
                                id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                                user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                token_hash  VARCHAR(500) NOT NULL UNIQUE,   -- Store hashed, never plaintext
                                device_info VARCHAR(255),                    -- "Chrome on Windows"
                                expires_at  TIMESTAMPTZ NOT NULL,
                                revoked_at  TIMESTAMPTZ,
                                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Email Verification Tokens ───────────────────────────────────────────────
CREATE TABLE email_verification_tokens (
                                           id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                                           user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                           token       VARCHAR(255) NOT NULL UNIQUE,
                                           expires_at  TIMESTAMPTZ NOT NULL,
                                           used_at     TIMESTAMPTZ,
                                           created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Password Reset Tokens ───────────────────────────────────────────────────
CREATE TABLE password_reset_tokens (
                                       id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                                       user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                       token_hash  VARCHAR(255) NOT NULL UNIQUE,
                                       expires_at  TIMESTAMPTZ NOT NULL,
                                       used_at     TIMESTAMPTZ,
                                       created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_email          ON users(email)     WHERE deleted_at IS NULL;
CREATE INDEX idx_users_deleted_at     ON users(deleted_at);
CREATE INDEX idx_refresh_tokens_user  ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash  ON refresh_tokens(token_hash);