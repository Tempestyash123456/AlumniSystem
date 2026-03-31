-- ============================================================
-- V8__permissions_system.sql
-- Implements granular permissions and assigns them to roles/users.
-- ============================================================

-- 1. Create Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
                             id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                             name        VARCHAR(100) NOT NULL UNIQUE,
                             description VARCHAR(255),
                             created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                             updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Join Tables
CREATE TABLE IF NOT EXISTS role_permissions (
                                  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
                                  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
                                  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
                                  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
                                  PRIMARY KEY (user_id, permission_id)
);

-- 3. Seed Default Permissions
INSERT INTO permissions (name, description) VALUES
                                                ('POST_VIEW',         'Ability to view posts'),
                                                ('POST_CREATE',       'Ability to create new posts'),
                                                ('POST_EDIT',         'Ability to edit existing posts'),
                                                ('POST_DELETE',       'Ability to delete posts'),
                                                ('EVENT_VIEW',        'Ability to view events'),
                                                ('EVENT_CREATE',      'Ability to create new events'),
                                                ('EVENT_EDIT',        'Ability to edit existing events'),
                                                ('EVENT_DELETE',      'Ability to delete events'),
                                                ('USER_VIEW',         'Ability to view users list and profiles'),
                                                ('USER_MANAGE',       'Ability to lock, unlock, enable or delete users'),
                                                ('PERMISSION_MANAGE', 'Ability to assign or revoke permissions from users'),
                                                ('PORTAL_SETTINGS',   'Ability to change site-wide settings')
ON CONFLICT (name) DO NOTHING;

-- 4. Strategy: ROLE_ADMIN gets limited base permissions
-- We assume ROLE_ADMIN already exists (from V1)
DO $$
    DECLARE
admin_role_id UUID;
    BEGIN
        SELECT id INTO admin_role_id FROM roles WHERE name = 'ROLE_ADMIN';

        IF admin_role_id IS NOT NULL THEN
            -- Assign limited permissions to ROLE_ADMIN
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT admin_role_id, id FROM permissions
            WHERE name IN ('POST_VIEW', 'EVENT_VIEW', 'USER_VIEW')
            ON CONFLICT DO NOTHING;
        END IF;
    END $$;

-- 5. Strategy: Current admin user gets ALL permissions directly
DO $$
    DECLARE
super_admin_id UUID;
    BEGIN
        -- Find the default admin user
        SELECT id INTO super_admin_id FROM users WHERE email = 'admin@alumni.portal';

        IF super_admin_id IS NOT NULL THEN
            -- Assign ALL permissions to the super admin directly
            INSERT INTO user_permissions (user_id, permission_id)
            SELECT super_admin_id, id FROM permissions
            ON CONFLICT DO NOTHING;
        END IF;
    END $$;
