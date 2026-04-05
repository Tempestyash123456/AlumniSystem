-- V14__add_admission_year_to_alumni_profiles.sql
ALTER TABLE alumni_profiles ADD COLUMN IF NOT EXISTS admission_year INTEGER;
