-- V7: Create audit_logs table for real-time dashboard activity tracking
CREATE TABLE audit_logs (
    id            UUID PRIMARY KEY,
    action_type   VARCHAR(255) NOT NULL,
    first_name    VARCHAR(255) NOT NULL,
    last_name     VARCHAR(255) NOT NULL,
    resource_name TEXT,
    created_at    TIMESTAMP NOT NULL
);

-- Index for faster retrieval of recent logs on the Admin Dashboard
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
