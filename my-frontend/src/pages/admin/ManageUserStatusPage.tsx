import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// @ts-ignore
import { adminApi } from '../../lib/api';
import type { AdminUserDto } from '../../types';
import { Button, Badge, Spinner, Input } from '../../components/ui';
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
    const [filterTab, setFilterTab] = useState<'ALL' | 'ALUMNI' | 'ADMINS'>('ALL');

    const [actionLoading, setActionLoading] = useState(false);

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
        if (filterTab === 'ALUMNI') return !u.roles.includes('ROLE_ADMIN');

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

    const handleRevokeAdmin = async (user: AdminUserDto) => {
        const ok = await confirm({
            title: 'REVOKE_ADMIN',
            message: `Are you sure you want to revoke admin access from ${user.firstName}?`
        });
        if (!ok) return;

        setActionLoading(true);
        const res = await adminApi.removeRole(user.id, 'ROLE_ADMIN');
        if (res.data) {
            setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data! : u)));
            toast.success(`Admin role revoked from ${user.email}`);
        } else {
            toast.error(res.error?.message || 'Failed to revoke admin role');
        }
        setActionLoading(false);
    };

    const stats = {
        total: users.length,
        enabled: users.filter((u) => u.enabled).length,
        locked: users.filter((u) => u.accountLocked).length,
        admins: users.filter((u) => u.roles.includes('ROLE_ADMIN')).length,
        alumni: users.filter((u) => !u.roles.includes('ROLE_ADMIN')).length,
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 0 }}>

            {/* ── Header ── */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-pink)', letterSpacing: '0.15em', marginBottom: 6 }}>
                    ADMIN_CONSOLE › USERS
                </div>
                <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Manage User Status
                </h1>
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                {(['ALL', 'ALUMNI', 'ADMINS'] as const).map(tab => (
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
                        {tab} ({tab === 'ALL' ? stats.total : tab === 'ALUMNI' ? stats.alumni : stats.admins})
                        {filterTab === tab && (
                            <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--neon-cyan)', boxShadow: '0 0 8px var(--neon-cyan)' }} />
                        )}
                    </button>
                ))}
            </div>

            {/* ── Stat cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, flexShrink: 0 }}>
                {[
                    { label: 'Total Users', value: stats.total,   color: 'cyan'   },
                    { label: 'Enabled Accounts', value: stats.enabled, color: 'green'  },
                    { label: 'Locked Accounts',  value: stats.locked,  color: 'pink'   },
                    { label: 'Admins',      value: stats.admins,  color: 'purple' },
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
                                    fontSize: '11px',
                                    fontFamily: 'Share Tech Mono, monospace',
                                    cursor: 'pointer',
                                    background: filterLock === option ? 'var(--bg-hover)' : 'transparent',
                                    color: filterLock === option ? 'var(--neon-pink)' : 'var(--text-muted)',
                                    fontWeight: filterLock === option ? 700 : 400,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {option}
                            </button>
                        ))}
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
                                                        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '15px' }}>
                                                            {user.firstName} {user.lastName}
                                                        </div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{user.email}</div>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    {user.roles.map(r => (
                                                        <Badge key={r} variant={r === 'ROLE_ADMIN' ? 'pink' : 'cyan'}>
                                                            {r.replace('ROLE_', '')}
                                                        </Badge>
                                                    ))}
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
                                            <td>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    {isAdmin && hasPermission('REVOKE_ADMIN_ACCESS') && !isSelf && (
                                                        <Button variant="outline" size="sm" onClick={() => handleRevokeAdmin(user)} disabled={actionLoading} style={{ color: 'var(--neon-pink)', borderColor: 'rgba(255, 45, 120, 0.3)' }}>
                                                            Revoke Admin
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
        </div>
    );
};
