-- ============================================================
-- V9__add_revoke_admin_permission.sql
-- Adds REVOKE_ADMIN_ACCESS permission for secure role management.
-- ============================================================

-- 1. Insert new permission
INSERT INTO permissions (name, description)
VALUES ('REVOKE_ADMIN_ACCESS', 'Ability to remove ROLE_ADMIN from other users')
ON CONFLICT (name) DO NOTHING;

-- 2. Grant it directly to the default super admin
DO $$
    DECLARE
        super_admin_id UUID;
        perm_id        UUID;
    BEGIN
        SELECT id INTO super_admin_id FROM users WHERE email = 'admin@alumni.portal';
        SELECT id INTO perm_id        FROM permissions WHERE name = 'REVOKE_ADMIN_ACCESS';

        IF super_admin_id IS NOT NULL AND perm_id IS NOT NULL THEN
            INSERT INTO user_permissions (user_id, permission_id)
            VALUES (super_admin_id, perm_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END $$;
