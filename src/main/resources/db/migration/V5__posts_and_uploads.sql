-- ============================================================
-- V5__posts_and_uploads.sql
-- Blog/post system for admins; profile photo storage column
-- ============================================================

CREATE TABLE posts (
                       id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
                       title        VARCHAR(300) NOT NULL,
                       description  TEXT         NOT NULL,         -- Markdown content
                       image_url    VARCHAR(500),                   -- Relative path to uploaded image
                       author_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Audit
                       created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                       updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                       created_by   VARCHAR(255),
                       updated_by   VARCHAR(255),
                       deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_posts_author    ON posts(author_id);
CREATE INDEX idx_posts_created   ON posts(created_at DESC) WHERE deleted_at IS NULL;