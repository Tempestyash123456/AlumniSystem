import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// @ts-ignore
import { adminApi } from '../../lib/api';
import type { AdminUserDto, PermissionDto } from '../../types';
import { Button, Badge, Spinner, Input, Modal, Checkbox } from '../../components/ui';
// @ts-ignore
import { getImageUrl } from '../../lib/api';
import { toast } from '../../store/toastStore';
import { confirm } from '../../store/confirmStore';

import { useAuthStore } from '../../store/authStore';

export const ManageUserStatusPage: React.FC = () => {
    const { hasPermission, user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<AdminUserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterLock, setFilterLock] = useState<'ALL' | 'LOCKED' | 'UNLOCKED'>('ALL');
    const [filterTab, setFilterTab] = useState<'ALUMNI' | 'FACULTY' | 'ADMINS'>('ALUMNI');

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
        // Core search
        const q = search.toLowerCase();
        const matchesSearch = !q ||
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q);

        if (!matchesSearch) return false;

        // Lock filter
        if (filterLock === 'LOCKED' && !u.accountLocked) return false;
        if (filterLock === 'UNLOCKED' && u.accountLocked) return false;

        // Role tab filter
        if (filterTab === 'ADMINS') return u.roles.includes('ROLE_ADMIN');
        if (filterTab === 'ALUMNI') return u.roles.includes('ROLE_ALUMNI');
        if (filterTab === 'FACULTY') return u.roles.includes('ROLE_FACULTY');

        return true;
    });

    const handleLock = async (user: AdminUserDto) => {
        setActionLoading(true);
        const res = await adminApi.setLock(user.id, !user.accountLocked);
        if (res.data) {
            setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data! : u)));
            toast.success(`Account ${res.data.accountLocked ? 'locked' : 'unlocked'}`);
        } else {
            toast.error(res.error?.message || 'Failed to update lock status');
        }
        setActionLoading(false);
    };

    const handleEnable = async (user: AdminUserDto) => {
        setActionLoading(true);
        const res = await adminApi.setEnabled(user.id, !user.enabled);
        if (res.data) {
            setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data! : u)));
            toast.success(`Account ${res.data.enabled ? 'enabled' : 'disabled'}`);
        } else {
            toast.error(res.error?.message || 'Failed to update activation status');
        }
        setActionLoading(false);
    };

    const handleDelete = async (user: AdminUserDto) => {
        const ok = await confirm({
            title: 'DELETE_USER',
            message: `Permanently delete ${user.email}? This action cannot be undone.`,
            danger: true
        });
        if (!ok) return;

        setActionLoading(true);
        const res = await adminApi.deleteUser(user.id);
        if (res.success) {
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
            toast.success(`User ${user.email} deleted`);
        } else {
            toast.error(res.error?.message || 'Failed to delete user');
        }
        setActionLoading(false);
    };

    const handlePermissions = async (user: AdminUserDto) => {
        setPermissionsTarget(user);
        setTargetPermissions(user.permissions); // Direct permissions only for editing
        if (availablePermissions.length === 0) {
            const res = await adminApi.getPermissions();
            if (res.data) {
                // Filter out default permissions
                const filtered = res.data.filter(p => !['POST_VIEW', 'EVENT_VIEW', 'USER_VIEW'].includes(p.name));
                setAvailablePermissions(filtered);
            }
        }
    };

    const handleRevokeAdmin = async (user: AdminUserDto) => {
        const ok = await confirm({
            title: 'REVOKE_ADMIN',
            message: `Are you sure you want to revoke admin access from ${user.firstName}?`
        });
        if (!ok) return;

        setActionLoading(true);
        try {
            // First remove the role
            const roleRes = await adminApi.removeRole(user.id, 'ROLE_ADMIN');
            if (roleRes.data) {
                // Then remove all granular permissions
                const permRes = await adminApi.updatePermissions(user.id, []);
                if (permRes.data) {
                    setUsers((prev) => prev.map((u) => (u.id === user.id ? permRes.data! : u)));
                    toast.success(`Admin role and permissions revoked from ${user.email}`);
                } else {
                    // Update user state with the role removal even if permission removal failed (unlikely)
                    setUsers((prev) => prev.map((u) => (u.id === user.id ? roleRes.data! : u)));
                    toast.info(`Admin role revoked, but failed to clear permissions for ${user.email}`);
                }
            } else {
                toast.error(roleRes.error?.message || 'Failed to revoke admin role');
            }
        } catch (err) {
            toast.error('An error occurred during admin revocation');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdatePermissions = async () => {
        if (!permissionsTarget) return;
        setActionLoading(true);

        try {
            // Check if we need to promote to admin
            const isCurrentlyAdmin = permissionsTarget.roles.includes('ROLE_ADMIN');
            const isAssigningPermissions = targetPermissions.length > 0;

            if (!isCurrentlyAdmin && isAssigningPermissions) {
                await adminApi.assignRole(permissionsTarget.id, 'ROLE_ADMIN');
            }

            // Always ensure USER_VIEW is physically granted if they are an admin
            const finalPermissions = [...targetPermissions];
            if (finalPermissions.length > 0 && !finalPermissions.includes('USER_VIEW')) {
                finalPermissions.push('USER_VIEW');
            }

            const res = await adminApi.updatePermissions(permissionsTarget.id, finalPermissions);
            if (res.data) {
                setUsers((prev) => prev.map((u) => (u.id === permissionsTarget.id ? res.data! : u)));
                toast.success(`Permissions updated for ${permissionsTarget.email}`);
                setPermissionsTarget(null);
            } else {
                toast.error(res.error?.message || 'Failed to update permissions');
            }
        } catch (err) {
            toast.error('Failed to process permission updates');
        } finally {
            setActionLoading(false);
        }
    };

    const stats = {
        total: users.length,
        enabled: users.filter((u) => u.enabled).length,
        locked: users.filter((u) => u.accountLocked).length,
        admins: users.filter((u) => u.roles.includes('ROLE_ADMIN')).length,
        alumni: users.filter((u) => u.roles.includes('ROLE_ALUMNI')).length,
        faculty: users.filter((u) => u.roles.includes('ROLE_FACULTY')).length,
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 0 }}>

            {/* ── Header ── */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--neon-pink)', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>
                    ADMIN_CONSOLE › USERS
                </div>
                <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-2xl)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Manage Users
                </h1>
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                {(['ALUMNI', 'FACULTY', 'ADMINS'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilterTab(tab)}
                        style={{
                            padding: '12px 14px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: filterTab === tab ? 'var(--neon-cyan)' : 'var(--text-muted)',
                            fontFamily: 'Orbitron, sans-serif',
                            fontSize: '13px',
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            position: 'relative',
                            transition: 'color 0.2s'
                        }}
                    >
                        {tab} ({tab === 'ALUMNI' ? stats.alumni : tab === 'FACULTY' ? stats.faculty : stats.admins})
                        {filterTab === tab && (
                            <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--neon-cyan)', boxShadow: '0 0 8px var(--neon-cyan)' }} />
                        )}
                    </button>
                ))}
            </div>



            {/* ── Scrollable table panel ── */}
            <div className="cp-panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
                        <Input
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={<span>🔍</span>}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', padding: 4, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                        {(['ALL', 'LOCKED', 'UNLOCKED'] as const).map(option => (
                            <button
                                key={option}
                                onClick={() => setFilterLock(option)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: 4,
                                    border: 'none',
                                    fontSize: 'var(--font-size-sm)',
                                    fontFamily: 'Outfit, sans-serif',
                                    cursor: 'pointer',
                                    background: filterLock === option ? 'var(--bg-hover)' : 'transparent',
                                    color: filterLock === option ? 'var(--neon-pink)' : 'var(--text-muted)',
                                    fontWeight: filterLock === option ? 700 : 500,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    <div style={{ flex: 1 }} />
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
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
                                    <th>Status</th>
                                    <th>Profile Score</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filtered.map((user) => {
                                    const isAdmin = user.roles.includes('ROLE_ADMIN');
                                    const isSelf = currentUser?.id === user.id;

                                    return (
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
                                                        <div style={{ 
                                                            fontFamily: 'Rajdhani, sans-serif', 
                                                            fontWeight: 600, 
                                                            fontSize: 'var(--font-size-md)',
                                                            color: isAdmin ? 'var(--neon-pink)' : 'inherit'
                                                        }}>
                                                            {user.firstName} {user.lastName}
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: 'var(--font-size-sm)', 
                                                            fontFamily: 'Outfit, sans-serif',
                                                            color: isAdmin ? 'var(--neon-cyan)' : 'var(--text-muted)',
                                                            fontWeight: isAdmin ? 700 : 400,
                                                            textShadow: isAdmin ? '0 0 8px var(--neon-cyan)' : 'none',
                                                            transition: 'all 0.3s ease'
                                                        }} className={isAdmin ? 'admin-highlight' : ''}>
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </Link>
                                            </td>

                                            <td>
                                                <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                                                    <Badge variant={user.enabled ? 'green' : 'amber'}>
                                                        {user.enabled ? 'ENABLED' : 'DISABLED'}
                                                    </Badge>
                                                    {user.accountLocked && <Badge variant="pink">LOCKED</Badge>}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 50, height: 4, background: 'var(--bg-hover)', borderRadius: 2, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${user.profileScore}%`, background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))' }} />
                                                    </div>
                                                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>{user.profileScore}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    {isAdmin && hasPermission('REVOKE_ADMIN_ACCESS') && !isSelf && (
                                                        <Button variant="outline" size="sm" onClick={() => handleRevokeAdmin(user)} disabled={actionLoading} style={{ color: 'var(--neon-pink)', borderColor: 'rgba(255, 45, 120, 0.3)' }}>
                                                            Revoke Admin
                                                        </Button>
                                                    )}
                                                    
                                                    {hasPermission('PERMISSION_MANAGE') && (
                                                        <Button variant="ghost" size="sm" onClick={() => handlePermissions(user)} disabled={actionLoading}>
                                                            Permissions
                                                        </Button>
                                                    )}
                                                    
                                                    {hasPermission('USER_MANAGE') && (
                                                        <>
                                                            <Button variant="ghost" size="sm" onClick={() => handleEnable(user)} disabled={actionLoading}>
                                                                {user.enabled ? 'Disable' : 'Enable'}
                                                            </Button>
                                                            <Button variant={user.accountLocked ? 'outline' : 'ghost'} size="sm" onClick={() => handleLock(user)} disabled={actionLoading}>
                                                                {user.accountLocked ? 'Unlock' : 'Lock'}
                                                            </Button>
                                                            <Button variant="danger" size="sm" onClick={() => handleDelete(user)} disabled={actionLoading || isSelf}>
                                                                Delete
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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

            {/* ── Granular Permissions Modal ── */}
            <Modal open={!!permissionsTarget} title="GRANULAR_PERMISSIONS" onClose={() => setPermissionsTarget(null)} width={500}>
                <div style={{ marginBottom: 20 }}>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
                        MANAGING_ACCESS_FOR
                    </p>
                    <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-lg)', color: 'var(--neon-cyan)' }}>
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
                                            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-base)', fontWeight: 600 }}>{perm.name}</span>
                                            {isInherited && <Badge variant="cyan">INHERITED</Badge>}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'Outfit, sans-serif' }}>{perm.description}</div>
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
