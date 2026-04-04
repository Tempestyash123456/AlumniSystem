-- ============================================================
-- V13__refined_permissions.sql
-- Renames permissions to ACTION_ENTITY format and adds granular admin controls.
-- ============================================================

-- 1. Rename existing permissions to ACTION_ENTITY format
UPDATE permissions SET name = 'VIEW_POST' WHERE name = 'POST_VIEW';
UPDATE permissions SET name = 'CREATE_POST' WHERE name = 'POST_CREATE';
UPDATE permissions SET name = 'EDIT_POST' WHERE name = 'POST_EDIT';
UPDATE permissions SET name = 'DELETE_POST' WHERE name = 'POST_DELETE';

UPDATE permissions SET name = 'VIEW_EVENT' WHERE name = 'EVENT_VIEW';
UPDATE permissions SET name = 'CREATE_EVENT' WHERE name = 'EVENT_CREATE';
UPDATE permissions SET name = 'EDIT_EVENT' WHERE name = 'EVENT_EDIT';
UPDATE permissions SET name = 'DELETE_EVENT' WHERE name = 'EVENT_DELETE';

UPDATE permissions SET name = 'VIEW_DIRECTORY' WHERE name = 'USER_VIEW';
UPDATE permissions SET name = 'MANAGE_USER' WHERE name = 'USER_MANAGE';
UPDATE permissions SET name = 'MANAGE_PERMISSION' WHERE name = 'PERMISSION_MANAGE';
UPDATE permissions SET name = 'MANAGE_SETTINGS' WHERE name = 'PORTAL_SETTINGS';

-- 2. Insert new permissions
INSERT INTO permissions (name, description) VALUES
                                                ('SEND_EMAIL',        'Ability to send bulk emails'),
                                                ('DELETE_ADMIN',      'Ability to delete admin accounts'),
                                                ('ASSIGN_ADMIN_ROLE', 'Ability to assign administrator role'),
                                                ('REVOKE_ADMIN_ROLE', 'Ability to revoke administrator role')
ON CONFLICT (name) DO NOTHING;

-- 3. Delete ROLE_STUDENT (as requested: there should be no ROLE_STUDENT)
-- Foreign keys on user_roles and role_permissions will cascade.
DELETE FROM roles WHERE name = 'ROLE_STUDENT';

-- 4. Set default permissions for roles
DO $$
    DECLARE
role_admin_id UUID;
        role_alumni_id UUID;
        role_faculty_id UUID;
    BEGIN
        SELECT id INTO role_admin_id FROM roles WHERE name = 'ROLE_ADMIN';
        SELECT id INTO role_alumni_id FROM roles WHERE name = 'ROLE_ALUMNI';
        SELECT id INTO role_faculty_id FROM roles WHERE name = 'ROLE_FACULTY';

        -- Alumni & Faculty: Default view permissions
        IF role_alumni_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT role_alumni_id, id FROM permissions WHERE name IN ('VIEW_POST', 'VIEW_EVENT')
            ON CONFLICT DO NOTHING;
        END IF;

        IF role_faculty_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT role_faculty_id, id FROM permissions WHERE name IN ('VIEW_POST', 'VIEW_EVENT')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Admin: View Posts, Events, and Directory by default
        IF role_admin_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT role_admin_id, id FROM permissions WHERE name IN ('VIEW_POST', 'VIEW_EVENT', 'VIEW_DIRECTORY')
            ON CONFLICT DO NOTHING;
        END IF;
    END $$;

-- 5. Strategy: yashdubey262@gmail.com gets BOTH roles and ALL current/new permissions
DO $$
    DECLARE
target_user_id UUID;
        role_admin_id  UUID;
        role_alumni_id UUID;
    BEGIN
        SELECT id INTO target_user_id FROM users WHERE email = 'yashdubey262@gmail.com';
        SELECT id INTO role_admin_id  FROM roles WHERE name = 'ROLE_ADMIN';
        SELECT id INTO role_alumni_id FROM roles WHERE name = 'ROLE_ALUMNI';

        IF target_user_id IS NOT NULL THEN
            -- Ensure roles are assigned
            IF role_admin_id IS NOT NULL THEN
                INSERT INTO user_roles (user_id, role_id) VALUES (target_user_id, role_admin_id) ON CONFLICT DO NOTHING;
            END IF;
            IF role_alumni_id IS NOT NULL THEN
                INSERT INTO user_roles (user_id, role_id) VALUES (target_user_id, role_alumni_id) ON CONFLICT DO NOTHING;
            END IF;

            -- Assign ALL available permissions directly to this user
            INSERT INTO user_permissions (user_id, permission_id)
            SELECT target_user_id, id FROM permissions
            ON CONFLICT DO NOTHING;
        END IF;
    END $$;
