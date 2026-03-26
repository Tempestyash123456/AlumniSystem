-- ============================================================
-- V2__alumni_profiles.sql
-- Alumni profile data, separate from the auth users table
-- ============================================================

CREATE TABLE alumni_profiles (
                                 id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 user_id             UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Academic info
                                 student_id          VARCHAR(50) UNIQUE,
                                 graduation_year     INT,
                                 degree              VARCHAR(100),           -- 'B.Tech', 'MBA', 'M.Sc'
                                 department          VARCHAR(150),           -- 'Computer Science'
                                 specialization      VARCHAR(150),

    -- Professional info
                                 current_job_title   VARCHAR(150),
                                 current_company     VARCHAR(150),
                                 industry            VARCHAR(100),
                                 experience_years    INT,
                                 linkedin_url        VARCHAR(500),
                                 github_url          VARCHAR(500),
                                 portfolio_url       VARCHAR(500),

    -- Personal
                                 bio                 TEXT,
                                 city                VARCHAR(100),
                                 state               VARCHAR(100),
                                 country             VARCHAR(100) DEFAULT 'India',
                                 date_of_birth       DATE,

    -- Skills stored as array
                                 skills              TEXT[],

    -- Profile completeness (0-100), recomputed on update
                                 profile_score       INT NOT NULL DEFAULT 0,

    -- Visibility settings
                                 is_profile_public   BOOLEAN NOT NULL DEFAULT TRUE,
                                 is_open_to_mentor   BOOLEAN NOT NULL DEFAULT FALSE,
                                 is_open_to_hire     BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit
                                 created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                 updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                 created_by  VARCHAR(255),
                                 updated_by  VARCHAR(255),
                                 deleted_at  TIMESTAMPTZ
);

-- Full-text search index using pg_trgm
CREATE INDEX idx_alumni_graduation_year ON alumni_profiles(graduation_year) WHERE deleted_at IS NULL;
CREATE INDEX idx_alumni_department      ON alumni_profiles(department)      WHERE deleted_at IS NULL;
CREATE INDEX idx_alumni_country         ON alumni_profiles(country)         WHERE deleted_at IS NULL;
CREATE INDEX idx_alumni_user_id         ON alumni_profiles(user_id);

-- GIN index on skills array for fast array contains queries
CREATE INDEX idx_alumni_skills ON alumni_profiles USING GIN(skills);