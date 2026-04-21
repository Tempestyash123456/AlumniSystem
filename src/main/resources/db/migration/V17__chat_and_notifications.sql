-- ============================================================
-- V17__chat_and_notifications.sql
-- Creates tables for chat messages and notifications
-- ============================================================

-- ── Chat Messages ───────────────────────────────────────────────────────────
CREATE TABLE chat_messages (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content      VARCHAR(100) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by   VARCHAR(255),
    updated_by   VARCHAR(255),
    deleted_at   TIMESTAMPTZ
);

-- ── Notifications ───────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message      VARCHAR(255) NOT NULL,
    link         VARCHAR(255) NOT NULL,
    is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by   VARCHAR(255),
    updated_by   VARCHAR(255),
    deleted_at   TIMESTAMPTZ
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_chat_messages_sender    ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_recipient ON chat_messages(recipient_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_read      ON notifications(recipient_id) WHERE is_read = FALSE;
