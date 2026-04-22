-- ============================================================
-- V18__add_is_read_to_chat_messages.sql
-- Adds is_read column to chat_messages table
-- ============================================================

-- Add the column with a default value of false (unread)
ALTER TABLE chat_messages 
ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE;

-- Index to optimize querying unread message counts
CREATE INDEX idx_chat_messages_unread ON chat_messages(recipient_id) 
WHERE is_read = FALSE;
