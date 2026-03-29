import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api.ts';
import type { AdminUserDto } from '../../types';
import { Button, Badge, Spinner, Alert, Confirm, Modal, Input } from '../../components/ui';
import { getImageUrl } from '../../lib/api';

export const AdminPage: React.FC = () => {
    const [users, setUsers] = useState<AdminUserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');

    const [deleteTarget, setDeleteTarget] = useState<AdminUserDto | null>(null);
    const [roleTarget, setRoleTarget] = useState<AdminUserDto | null>(null);
    const [newRole, setNewRole] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const load = () => {
        setLoading(true);
        adminApi.getAllUsers().then((res) => {
            if (res.data) setUsers(res.data.users);
            else setError(res.error?.message || 'Failed to load users');
        }).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 4000);
    };

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        return (
            !q ||
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.roles.some((r) => r.toLowerCase().includes(q))
        );
    });

    const handleLock = async (user: AdminUserDto) => {
        setActionLoading(true);
        const res = await adminApi.setLock(user.id, !user.accountLocked);
        if (res.data) {
            setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data! : u)));
            showSuccess(`Account ${res.data.accountLocked ? 'locked' : 'unlocked'}`);
        }
        setActionLoading(false);
    };

    const handleEnable = async (user: AdminUserDto) => {
        setActionLoading(true);
        const res = await adminApi.setEnabled(user.id, !user.enabled);
        if (res.data) {
            setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data! : u)));
            showSuccess(`Account ${res.data.enabled ? 'enabled' : 'disabled'}`);
        }
        setActionLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionLoading(true);
        const res = await adminApi.deleteUser(deleteTarget.id);
        if (res.success) {
            setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
            showSuccess(`User ${deleteTarget.email} deleted`);
        }
        setDeleteTarget(null);
        setActionLoading(false);
    };

    const handleAssignRole = async () => {
        if (!roleTarget || !newRole.trim()) return;
        setActionLoading(true);
        const roleName = newRole.startsWith('ROLE_') ? newRole.trim() : `ROLE_${newRole.trim().toUpperCase()}`;
        const res = await adminApi.assignRole(roleTarget.id, roleName);
        if (res.data) {
            setUsers((prev) => prev.map((u) => (u.id === roleTarget.id ? res.data! : u)));
            showSuccess(`Role assigned`);
        } else {
            setError(res.error?.message || 'Failed to assign role');
        }
        setRoleTarget(null);
        setNewRole('');
        setActionLoading(false);
    };

    const handleRemoveRole = async (user: AdminUserDto, role: string) => {
        setActionLoading(true);
        const res = await adminApi.removeRole(user.id, role);
        if (res.data) {
            setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data! : u)));
            showSuccess(`Role removed`);
        }
        setActionLoading(false);
    };

    const stats = {
        total: users.length,
        enabled: users.filter((u) => u.enabled).length,
        locked: users.filter((u) => u.accountLocked).length,
        admins: users.filter((u) => u.roles.includes('ROLE_ADMIN')).length,
    };

    return (
        // height + minHeight: 0 fills the Layout flex column
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 0 }}>

            {/* ── Header ── */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-pink)', letterSpacing: '0.15em', marginBottom: 6 }}>
                    ADMIN_CONSOLE
                </div>
                <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 700, letterSpacing: '0.05em' }}>
                    User Management
                </h1>
            </div>

            {/* ── Stat cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, flexShrink: 0 }}>
                {[
                    { label: 'Total Users', value: stats.total,   color: 'cyan'   },
                    { label: 'Enabled',     value: stats.enabled, color: 'green'  },
                    { label: 'Locked',      value: stats.locked,  color: 'pink'   },
                    { label: 'Admins',      value: stats.admins,  color: 'purple' },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`cp-stat-card ${color}`}>
                        <div className={`cp-stat-value text-neon-${color}`}>{value}</div>
                        <div className="cp-stat-label">{label}</div>
                    </div>
                ))}
            </div>

            {/* ── Alerts ── */}
            {success && <Alert type="success" onClose={() => setSuccess('')} style={{ flexShrink: 0 }}>{success}</Alert>}
            {error   && <Alert type="error"   onClose={() => setError('')}   style={{ flexShrink: 0 }}>{error}</Alert>}

            {/* ── Scrollable table panel ── */}
            <div className="cp-panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Search + controls bar — stays fixed */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <div style={{ flex: 1, maxWidth: 340 }}>
                        <Input
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={<span>🔍</span>}
                        />
                    </div>
                    <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {filtered.length} of {users.length}
                    </span>
                    <Button variant="outline" size="sm" onClick={load}>🔄 Refresh</Button>
                </div>

                {/* Scrollable table body */}
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
                                    <th>Status</th>
                                    <th>Profile</th>
                                    <th>Last Login</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filtered.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: '50%',
                                                    overflow: 'hidden', border: '1px solid var(--border-subtle)',
                                                    background: 'var(--bg-card)', flexShrink: 0,
                                                }}>
                                                    {user.profilePhotoUrl ? (
                                                        <img
                                                            src={getImageUrl(user.profilePhotoUrl)!}
                                                            alt=""
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
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                {user.roles.map((r) => {
                                                    const isAdminRole = r === 'ROLE_ADMIN';
                                                    return (
                                                        <span
                                                            key={r}
                                                            className={`cp-badge ${isAdminRole ? 'cp-badge-pink' : 'cp-badge-cyan'}`}
                                                            style={{ cursor: isAdminRole ? 'default' : 'pointer' }}
                                                            title={isAdminRole ? 'Admin role cannot be revoked' : 'Click to remove'}
                                                            onClick={() => !isAdminRole && handleRemoveRole(user, r)}
                                                        >
                                                            {r.replace('ROLE_', '')} {!isAdminRole && '×'}
                                                        </span>
                                                    );
                                                })}
                                                <button
                                                    onClick={() => setRoleTarget(user)}
                                                    style={{ background: 'none', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', borderRadius: 2, padding: '2px 6px', cursor: 'pointer', fontSize: '10px', fontFamily: 'Orbitron, monospace' }}
                                                >
                                                    + ADD
                                                </button>
                                            </div>
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
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.profileScore}%</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                <Button variant="ghost" size="sm" onClick={() => handleEnable(user)} disabled={actionLoading}>
                                                    {user.enabled ? 'Disable' : 'Enable'}
                                                </Button>
                                                <Button variant={user.accountLocked ? 'outline' : 'ghost'} size="sm" onClick={() => handleLock(user)} disabled={actionLoading}>
                                                    {user.accountLocked ? 'Unlock' : 'Lock'}
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(user)} disabled={actionLoading}>
                                                    Delete
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
            <Confirm
                open={!!deleteTarget}
                title="DELETE_USER"
                message={`Permanently delete ${deleteTarget?.email}? This action cannot be undone.`}
                danger
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />

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
        </div>
    );
};