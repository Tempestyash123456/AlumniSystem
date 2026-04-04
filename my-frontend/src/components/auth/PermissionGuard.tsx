import React from 'react';
import { useAuthStore } from '../../store/authStore';

interface PermissionGuardProps {
    /**
     * The permission string required to render the children.
     * e.g. "CREATE_POST", "VIEW_DIRECTORY"
     */
    permission: string;
    /**
     * Content to render if the user has the required permission.
     */
    children: React.ReactNode;
    /**
     * Optional content to render if the user does NOT have permission.
     */
    fallback?: React.ReactNode;
}

/**
 * PermissionGuard
 * A declarative way to show/hide UI components based on user permissions.
 * Inherits the "Admin-as-Superuser" logic from authStore.
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
    permission, 
    children, 
    fallback = null 
}) => {
    const { hasPermission } = useAuthStore();

    if (hasPermission(permission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
