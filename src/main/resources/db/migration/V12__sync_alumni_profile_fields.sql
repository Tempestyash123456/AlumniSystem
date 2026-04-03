-- ============================================================
-- V12__sync_alumni_profile_fields.sql
-- Sync database columns with AlumniProfile.java and Frontend naming.
-- ============================================================

DO $$
    BEGIN
        -- Rename 'degree' to 'discipline' (B.Tech, MBA, etc.)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alumni_profiles' AND column_name = 'degree') THEN
            ALTER TABLE alumni_profiles RENAME COLUMN degree TO discipline;
        END IF;

        -- Rename 'department' to 'program' (Computer Science, etc.)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alumni_profiles' AND column_name = 'department') THEN
            ALTER TABLE alumni_profiles RENAME COLUMN department TO program;
            IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_alumni_department') THEN
                ALTER INDEX idx_alumni_department RENAME TO idx_alumni_program;
            END IF;
        END IF;

        -- Ensure 'specialization' is gone (User mentioned it is already dropped, but for safety in new environments)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alumni_profiles' AND column_name = 'specialization') THEN
            ALTER TABLE alumni_profiles DROP COLUMN specialization;
        END IF;
    END $$;
