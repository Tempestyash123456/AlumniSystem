-- ============================================================
-- V16__add_bug_report_photo_url.sql
-- Add missing column bug_report_photo_url to alumni_profiles table.
-- ============================================================

ALTER TABLE alumni_profiles
ADD COLUMN bug_report_photo_url VARCHAR(500);
