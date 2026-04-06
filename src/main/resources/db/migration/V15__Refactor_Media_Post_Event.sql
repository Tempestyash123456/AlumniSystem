-- ============================================================
-- V15__Refactor_Media_Post_Event.sql
-- Refactor posts and events to support multiple media files.
-- Migrates existing single-media data to new collection tables.
-- Removes old media and document columns.
-- ============================================================

-- 1. Create collection table for Post images
CREATE TABLE post_images (
    post_id    UUID         NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    image_url  VARCHAR(500) NOT NULL,
    PRIMARY KEY (post_id, image_url)
);

-- 2. Create collection table for Event media (IMAGE | VIDEO)
CREATE TABLE event_media (
    event_id   UUID         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    url        VARCHAR(500) NOT NULL,
    type       VARCHAR(20)  NOT NULL DEFAULT 'IMAGE', -- 'IMAGE' | 'VIDEO'
    PRIMARY KEY (event_id, url)
);

-- 3. Data Migration: Move existing Post images
INSERT INTO post_images (post_id, image_url)
SELECT id, image_url 
FROM posts 
WHERE image_url IS NOT NULL AND image_url != '';

-- 4. Data Migration: Move existing Event media
INSERT INTO event_media (event_id, url, type)
SELECT id, media_url, COALESCE(media_type, 'IMAGE')
FROM events 
WHERE media_url IS NOT NULL AND media_url != '';

-- 5. Cleanup: Drop old columns from posts
ALTER TABLE posts DROP COLUMN image_url;

-- 6. Cleanup: Drop old columns from events
ALTER TABLE events 
    DROP COLUMN media_url,
    DROP COLUMN media_type,
    DROP COLUMN document_url,
    DROP COLUMN document_name;
