-- ============================================================
-- V10__assign_role_to_yash_email.sql
-- Assigns ROLE_ADMIN and all permissions to the specific user.
-- ============================================================

DO $$
    DECLARE
        target_user_id UUID;
        admin_role_id  UUID;
    BEGIN
        -- 1. Get the User ID
        SELECT id INTO target_user_id FROM users WHERE email = 'yashdubey262@gmail.com';

        -- 2. Get the Role ID
        SELECT id INTO admin_role_id FROM roles WHERE name = 'ROLE_ADMIN';

        -- 3. Proceed only if user exists
        IF target_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
            -- Assign ROLE_ADMIN to user
            INSERT INTO user_roles (user_id, role_id)
            VALUES (target_user_id, admin_role_id)
            ON CONFLICT DO NOTHING;

            -- Assign ALL individual permissions to user (same as super admin in V8)
            INSERT INTO user_permissions (user_id, permission_id)
            SELECT target_user_id, id FROM permissions
            ON CONFLICT DO NOTHING;
        END IF;
    END $$;
