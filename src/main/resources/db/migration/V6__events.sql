-- ============================================================
-- V6__events.sql
-- Events table: name, timings, place, media, optional document
-- ============================================================

CREATE TABLE events (
                        id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
                        name          VARCHAR(300) NOT NULL,
                        start_time    TIMESTAMPTZ  NOT NULL,
                        end_time      TIMESTAMPTZ,
                        place         VARCHAR(500) NOT NULL,
                        description   TEXT,

    -- Media: image or video
                        media_url     VARCHAR(500),
                        media_type    VARCHAR(20),   -- 'IMAGE' | 'VIDEO'

    -- Optional document attachment (PDF / DOCX / PPTX)
                        document_url  VARCHAR(500),
                        document_name VARCHAR(255),  -- original filename shown in UI

                        author_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Audit
                        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                        updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                        created_by    VARCHAR(255),
                        updated_by    VARCHAR(255),
                        deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_events_start_time ON events(start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_author     ON events(author_id);