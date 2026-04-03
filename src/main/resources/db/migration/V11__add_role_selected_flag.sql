-- ============================================================
-- V11__add_role_selected_flag.sql
-- Force new Google users to pick their role.
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS role_selected BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing users are grandfathered in (assume their roles are correct)
UPDATE users SET role_selected = TRUE WHERE deleted_at IS NULL;
