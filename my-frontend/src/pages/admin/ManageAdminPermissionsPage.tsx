import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// @ts-ignore
import { adminApi } from '../../lib/api';
import type { AdminUserDto, PermissionDto } from '../../types';
import { Button, Badge, Spinner, Modal, Input, Checkbox } from '../../components/ui';
// @ts-ignore
import { getImageUrl } from '../../lib/api';
import { toast } from '../../store/toastStore';

import { useAuthStore } from '../../store/authStore';

export const ManageAdminPermissionsPage: React.FC = () => {
    const { hasPermission } = useAuthStore();
    const [users, setUsers] = useState<AdminUserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [roleTarget, setRoleTarget] = useState<AdminUserDto | null>(null);
    const [newRole, setNewRole] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const [permissionsTarget, setPermissionsTarget] = useState<AdminUserDto | null>(null);
    const [availablePermissions, setAvailablePermissions] = useState<PermissionDto[]>([]);
    const [targetPermissions, setTargetPermissions] = useState<string[]>([]);

    const load = () => {
        setLoading(true);
        adminApi.getAllUsers().then((res) => {
            if (res.data) setUsers(res.data.users);
            else toast.error(res.error?.message || 'Failed to load users');
        }).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        return !q ||
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.roles.some((r) => r.toLowerCase().includes(q));
    });

    const handleAssignRole = async () => {
        if (!roleTarget || !newRole.trim()) return;
        setActionLoading(true);
        const roleName = newRole.startsWith('ROLE_') ? newRole.trim() : `ROLE_${newRole.trim().toUpperCase()}`;
        const res = await adminApi.assignRole(roleTarget.id, roleName);
        if (res.data) {
            setUsers((prev) => prev.map((u) => (u.id === roleTarget.id ? res.data! : u)));
            toast.success(`Role assigned to ${roleTarget.email}`);
            setRoleTarget(null);
            setNewRole('');
        } else {
            toast.error(res.error?.message || 'Failed to assign role');
        }
        setActionLoading(false);
    };

    const handleRemoveRole = async (user: AdminUserDto, role: string) => {
        setActionLoading(true);
        const res = await adminApi.removeRole(user.id, role);
        if (res.data) {
            setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data! : u)));
            toast.success(`Role ${role} removed from ${user.email}`);
        } else {
            toast.error(res.error?.message || 'Failed to remove role');
        }
        setActionLoading(false);
    };

    const handlePermissions = async (user: AdminUserDto) => {
        setPermissionsTarget(user);
        setTargetPermissions(user.permissions); // Direct permissions only for editing
        if (availablePermissions.length === 0) {
            const res = await adminApi.getPermissions();
            if (res.data) setAvailablePermissions(res.data);
        }
    };

    const handleUpdatePermissions = async () => {
        if (!permissionsTarget) return;
        setActionLoading(true);
        const res = await adminApi.updatePermissions(permissionsTarget.id, targetPermissions);
        if (res.data) {
            setUsers((prev) => prev.map((u) => (u.id === permissionsTarget.id ? res.data! : u)));
            toast.success(`Permissions updated for ${permissionsTarget.email}`);
            setPermissionsTarget(null);
        } else {
            toast.error(res.error?.message || 'Failed to update permissions');
        }
        setActionLoading(false);
    };

    const stats = {
        total: users.length,
        admins: users.filter((u) => u.roles.includes('ROLE_ADMIN')).length,
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 0 }}>

            {/* ── Header ── */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-pink)', letterSpacing: '0.15em', marginBottom: 6 }}>
                    ADMIN_CONSOLE › PERMISSIONS
                </div>
                <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Manage Admin Permissions
                </h1>
            </div>

            {/* ── Stat cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, flexShrink: 0 }}>
                {[
                    { label: 'Total Users', value: stats.total,   color: 'cyan'   },
                    { label: 'System Admins', value: stats.admins,  color: 'purple' },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`cp-stat-card ${color}`}>
                        <div className={`cp-stat-value text-neon-${color}`}>{value}</div>
                        <div className="cp-stat-label">{label}</div>
                    </div>
                ))}
            </div>

            {/* ── Scrollable table panel ── */}
            <div className="cp-panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
                        <Input
                            placeholder="Search users/roles..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={<span>🔍</span>}
                        />
                    </div>
                    
                    <div style={{ flex: 1 }} />
                    <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {filtered.length} of {users.length}
                    </span>
                    <Button variant="outline" size="sm" onClick={load}>🔄 Refresh</Button>
                </div>

                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                            <Spinner size={28} />
                        </div>
                    ) : (
                        <>
                            <table className="cp-table">
                                <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Roles</th>
                                    <th>Direct Permissions</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filtered.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <Link
                                                to={`/alumni/${user.id}`}
                                                style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}
                                            >
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: '50%',
                                                    overflow: 'hidden', border: '1px solid var(--border-subtle)',
                                                    background: 'var(--bg-card)', flexShrink: 0,
                                                }}>
                                                    {user.profilePhotoUrl ? (
                                                        <img
                                                            src={getImageUrl(user.profilePhotoUrl)!}
                                                            alt={user.firstName}
                                                            referrerPolicy="no-referrer"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                                            👤
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '15px' }}>
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{user.email}</div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                {user.roles.map((r) => {
                                                    const isAdminRole = r === 'ROLE_ADMIN';
                                                    const canRemove = hasPermission('PERMISSION_MANAGE') && !isAdminRole;
                                                    return (
                                                        <span
                                                            key={r}
                                                            className={`cp-badge ${isAdminRole ? 'cp-badge-pink' : 'cp-badge-cyan'}`}
                                                            style={{ cursor: canRemove ? 'pointer' : 'default' }}
                                                            title={isAdminRole ? 'Admin role cannot be revoked' : canRemove ? 'Click to remove' : ''}
                                                            onClick={() => canRemove && handleRemoveRole(user, r)}
                                                        >
                                                            {r.replace('ROLE_', '')} {canRemove && '×'}
                                                        </span>
                                                    );
                                                })}
                                                {hasPermission('PERMISSION_MANAGE') && (
                                                    <button
                                                        onClick={() => setRoleTarget(user)}
                                                        style={{ background: 'none', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', borderRadius: 2, padding: '2px 6px', cursor: 'pointer', fontSize: '10px', fontFamily: 'Orbitron, monospace' }}
                                                    >
                                                        + ADD
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    {user.allPermissions.slice(0, 3).map(p => (
                                                        <span key={p} style={{ fontSize: '9px', color: 'var(--neon-cyan)', border: '1px solid var(--neon-cyan)', padding: '1px 4px', borderRadius: 2 }}>
                                                            {p}
                                                        </span>
                                                    ))}
                                                    {user.allPermissions.length > 3 && (
                                                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>+{user.allPermissions.length - 3}</span>
                                                    )}
                                                </div>
                                                {hasPermission('PERMISSION_MANAGE') && (
                                                    <button
                                                        onClick={() => handlePermissions(user)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--neon-pink)', padding: 0, cursor: 'pointer', fontSize: '10px', fontFamily: 'Share Tech Mono, monospace', textDecoration: 'underline' }}
                                                    >
                                                        MANAGE_PERMISSIONS
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                <Button variant="ghost" size="sm" onClick={() => handlePermissions(user)} disabled={actionLoading}>
                                                    Permissions
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => setRoleTarget(user)} disabled={actionLoading}>
                                                    Roles
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            {filtered.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace' }}>
                                    NO_USERS_FOUND
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Modals ── */}
            <Modal open={!!roleTarget} title="ASSIGN_ROLE" onClose={() => setRoleTarget(null)} width={400}>
                <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', marginBottom: 20 }}>
                    Manage roles for {roleTarget?.email}
                </p>
                <Input
                    label="Role Name"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="ALUMNI"
                    hint="Prefix ROLE_ will be added automatically"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAssignRole(); }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                    <Button variant="ghost" onClick={() => setRoleTarget(null)}>Cancel</Button>
                    <Button loading={actionLoading} onClick={handleAssignRole}>Assign</Button>
                </div>
            </Modal>

            <Modal open={!!permissionsTarget} title="GRANULAR_PERMISSIONS" onClose={() => setPermissionsTarget(null)} width={500}>
                <div style={{ marginBottom: 20 }}>
                    <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', marginBottom: 4 }}>
                        MANAGING_ACCESS_FOR
                    </p>
                    <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '16px', color: 'var(--neon-cyan)' }}>
                        {permissionsTarget?.email}
                    </p>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {availablePermissions.map((perm) => {
                            const isInherited = !!(permissionsTarget?.allPermissions.includes(perm.name) && !permissionsTarget?.permissions.includes(perm.name));
                            return (
                                <div key={perm.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 10, background: 'var(--bg-input)', borderRadius: 4, border: '1px solid var(--border-subtle)', opacity: isInherited ? 0.7 : 1 }}>
                                    <div style={{ marginTop: 2 }}>
                                        <Checkbox
                                            checked={targetPermissions.includes(perm.name) || isInherited}
                                            disabled={isInherited}
                                            onChange={(checked: boolean) => {
                                                if (checked) setTargetPermissions([...targetPermissions, perm.name]);
                                                else setTargetPermissions(targetPermissions.filter(p => p !== perm.name));
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '14px', fontWeight: 600 }}>{perm.name}</span>
                                            {isInherited && <Badge variant="cyan">INHERITED</Badge>}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>{perm.description}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                    <Button variant="ghost" onClick={() => setPermissionsTarget(null)}>Cancel</Button>
                    <Button loading={actionLoading} onClick={handleUpdatePermissions}>Save Permissions</Button>
                </div>
            </Modal>
        </div>
    );
};
