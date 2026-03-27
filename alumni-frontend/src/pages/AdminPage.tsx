import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { GlassCard, PageContainer, SectionHeading, UiBadge, UiButton, UiInput, UiStatCard, UiAvatar } from '../components/ui/ModernUI';

interface AdminUser {
    id: string; firstName: string; lastName: string; email: string;
    phone: string | null; profilePhotoUrl: string | null;
    roles: string[]; enabled: boolean; accountLocked: boolean;
    profileScore: number; lastLoginAt: string | null; createdAt: string;
}

const ROLES = ['ROLE_ALUMNI','ROLE_STUDENT','ROLE_FACULTY','ROLE_ADMIN'];

const roleColor = (role: string) => {
    const map: Record<string,string> = {
        ROLE_ADMIN:'var(--pink)', ROLE_ALUMNI:'var(--cyan)',
        ROLE_STUDENT:'var(--purple)', ROLE_FACULTY:'var(--amber)',
    };
    return map[role] || 'rgba(191,219,254,0.75)';
};

const RoleBadge = ({ role }: { role: string }) => (
    <UiBadge className="font-mono-cp" style={{
        background: `${roleColor(role)}11`,
        border: `1px solid ${roleColor(role)}44`,
        color: roleColor(role),
    }}>
        {role.replace('ROLE_','')}
    </UiBadge>
);

const AdminPage = () => {
    const [users,         setUsers]         = useState<AdminUser[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState<string | null>(null);
    const [search,        setSearch]        = useState('');
    const [selected,      setSelected]      = useState<AdminUser | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        api.get('/admin/users')
            .then(r => setUsers(r.data.data.users))
            .catch(() => setError('ACCESS_DENIED or NETWORK_ERROR: Cannot load user list.'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = users.filter(u =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    );

    const withAction = async (fn: () => Promise<AdminUser | void>, msg: string) => {
        setActionLoading(true);
        try {
            const updated = await fn();
            if (updated && typeof updated === 'object' && 'id' in updated) {
                const u = updated as AdminUser;
                setUsers(prev => prev.map(x => x.id === u.id ? u : x));
                setSelected(u);
            }
            showToast(msg, true);
        } catch (e: any) {
            showToast(e.response?.data?.error?.message || 'OPERATION_FAILED', false);
        } finally { setActionLoading(false); }
    };

    const assignRole = (uid: string, role: string) => withAction(async () => {
        const r = await api.post(`/admin/users/${uid}/roles`, { roleName: role }); return r.data.data;
    }, `ROLE_ASSIGNED :: ${role.replace('ROLE_','')}`);

    const removeRole = (uid: string, role: string) => withAction(async () => {
        const r = await api.delete(`/admin/users/${uid}/roles/${role}`); return r.data.data;
    }, `ROLE_REVOKED :: ${role.replace('ROLE_','')}`);

    const toggleLock = (u: AdminUser) => withAction(async () => {
        const r = await api.patch(`/admin/users/${u.id}/lock`, { lock: !u.accountLocked }); return r.data.data;
    }, u.accountLocked ? 'ACCOUNT_UNLOCKED' : 'ACCOUNT_LOCKED');

    const toggleEnable = (u: AdminUser) => withAction(async () => {
        const r = await api.patch(`/admin/users/${u.id}/enable?enabled=${!u.enabled}`); return r.data.data;
    }, u.enabled ? 'ACCOUNT_DISABLED' : 'ACCOUNT_ENABLED');

    const deleteUser = (u: AdminUser) => {
        if (!confirm(`CONFIRM DELETE: ${u.firstName} ${u.lastName}\nThis action is irreversible.`)) return;
        withAction(async () => {
            await api.delete(`/admin/users/${u.id}`);
            setUsers(prev => prev.filter(x => x.id !== u.id));
            setSelected(null);
        }, 'OPERATIVE_PURGED');
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="cp-spinner" />
            <p className="font-mono-cp text-xs tracking-widest animate-pulse" style={{ color: 'var(--cyan)' }}>
                ACCESSING ADMIN_CONSOLE...
            </p>
        </div>
    );

    if (error) return <div className="cp-alert-error font-mono-cp text-sm max-w-lg mt-8">{error}</div>;

    return (
        <PageContainer className="space-y-5">
            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 font-mono-cp text-sm px-4 py-3 cp-toast"
                    style={{
                        background: toast.ok ? 'rgba(16,185,129,0.2)' : 'rgba(225,29,72,0.2)',
                        border: `1px solid ${toast.ok ? 'rgba(52,211,153,0.45)' : 'rgba(244,114,182,0.45)'}`,
                        color: toast.ok ? 'var(--green)' : 'var(--pink)',
                        boxShadow: `0 14px 28px ${toast.ok ? 'rgba(16,185,129,0.25)' : 'rgba(190,24,93,0.25)'}`,
                    }}>
                    {toast.ok ? '✓' : '⚠'} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div>
                <SectionHeading overline="// ADMIN_CONSOLE" title="SYSTEM_CONTROL" accent="var(--pink)" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'TOTAL_NODES',  value: users.length,                                   color: 'var(--cyan)'   },
                    { label: 'ACTIVE',       value: users.filter(u => u.enabled).length,             color: 'var(--green)'  },
                    { label: 'LOCKED',       value: users.filter(u => u.accountLocked).length,       color: 'var(--amber)'  },
                    { label: 'ADMINS',       value: users.filter(u => u.roles.includes('ROLE_ADMIN')).length, color: 'var(--pink)' },
                ].map(s => (
                    <UiStatCard key={s.label} label={s.label} value={s.value} accent={s.color} />
                ))}
            </div>

            <div className="flex gap-5 items-start">
                {/* User list */}
                <div className="flex-1 min-w-0 space-y-3">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-cp text-xs" style={{ color: 'rgba(148,163,184,0.95)' }}>⌕</span>
                        <UiInput value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="search operatives..." className="pl-8 w-full" />
                    </div>

                    <GlassCard className="overflow-hidden">
                        <table className="cp-table">
                            <thead>
                                <tr>
                                    <th>OPERATIVE</th>
                                    <th className="hidden sm:table-cell">ROLES</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => (
                                    <tr key={u.id}
                                        className={selected?.id === u.id ? 'selected' : ''}
                                        onClick={() => setSelected(u)}
                                        style={{ cursor: 'pointer' }}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <UiAvatar
                                                    size="md"
                                                    src={u.profilePhotoUrl}
                                                    initials={`${u.firstName[0]}${u.lastName[0]}`}
                                                    className="flex-shrink-0"
                                                />
                                                <div>
                                                    <p className="font-display text-xs tracking-wide" style={{ color: '#e2e8f0' }}>{u.firstName} {u.lastName}</p>
                                                    <p className="font-mono-cp text-xs truncate max-w-[160px]" style={{ color: 'rgba(148,163,184,0.95)' }}>{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {u.roles.map(r => <RoleBadge key={r} role={r} />)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1.5 font-mono-cp text-xs"
                                                    style={{ color: u.enabled ? 'var(--green)' : 'var(--pink)' }}>
                                                    <span className={u.enabled ? 'cp-status-online' : 'cp-status-offline'} />
                                                    {u.enabled ? 'ACTIVE' : 'DISABLED'}
                                                </span>
                                                {u.accountLocked && (
                                                    <span className="flex items-center gap-1.5 font-mono-cp text-xs" style={{ color: 'var(--amber)' }}>
                                                        <span className="cp-status-locked" /> LOCKED
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={3} className="text-center py-8 font-mono-cp text-xs" style={{ color: 'rgba(191,219,254,0.72)' }}>NO_NODES_FOUND</td></tr>
                                )}
                            </tbody>
                        </table>
                    </GlassCard>
                </div>

                {/* Detail panel */}
                {selected && (
                    <div className="w-72 shrink-0 space-y-4">
                        <GlassCard className="p-5 space-y-5">
                            {/* Avatar + name */}
                            <div className="flex flex-col items-center text-center gap-3 pb-4"
                                style={{ borderBottom: '1px solid rgba(148,163,184,0.28)' }}>
                                <UiAvatar
                                    size="lg"
                                    src={selected.profilePhotoUrl}
                                    initials={`${selected.firstName[0]}${selected.lastName[0]}`}
                                />
                                <div>
                                    <p className="font-display text-sm font-semibold tracking-wide" style={{ color: '#e2e8f0' }}>
                                        {selected.firstName} {selected.lastName}
                                    </p>
                                    <p className="font-mono-cp text-xs mt-0.5" style={{ color: 'rgba(148,163,184,0.95)' }}>{selected.email}</p>
                                </div>
                            </div>

                            {/* Profile score */}
                            <div className="space-y-1">
                                <div className="flex justify-between font-mono-cp text-xs" style={{ color: 'rgba(191,219,254,0.75)' }}>
                                    <span>PROFILE_SCORE</span><span style={{ color: 'var(--cyan)' }}>{selected.profileScore}%</span>
                                </div>
                                <div className="cp-bar-track">
                                    <div className="cp-bar-fill" style={{ width: `${selected.profileScore}%`, background: 'var(--cyan)', boxShadow: '0 8px 16px rgba(96,165,250,0.45)' }} />
                                </div>
                            </div>

                            {/* Meta */}
                            <div className="font-mono-cp text-xs space-y-1" style={{ color: 'rgba(148,163,184,0.9)' }}>
                                <p>LAST_LOGIN :: {selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleDateString() : 'NEVER'}</p>
                                <p>CREATED   :: {new Date(selected.createdAt).toLocaleDateString()}</p>
                            </div>

                            {/* Role management */}
                            <div className="space-y-2 pt-1" style={{ borderTop: '1px solid rgba(148,163,184,0.28)' }}>
                                <p className="cp-section-title pt-2">ROLE_MANAGEMENT</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {selected.roles.map(r => <RoleBadge key={r} role={r} />)}
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                    {ROLES.map(r => {
                                        const has = selected.roles.includes(r);
                                        const c = roleColor(r);
                                        return (
                                            <button key={r} disabled={actionLoading}
                                                onClick={() => has ? removeRole(selected.id, r) : assignRole(selected.id, r)}
                                                className="font-mono-cp text-xs px-2 py-1.5 transition-all disabled:opacity-40 cp-hover-lift"
                                                style={{
                                                    background: has ? `${c}15` : 'rgba(0,0,0,0.3)',
                                                    border: `1px solid ${has ? c + '50' : 'rgba(148,163,184,0.35)'}`,
                                                    color: has ? c : 'rgba(191,219,254,0.75)',
                                                }}>
                                                {has ? '− ' : '+ '}{r.replace('ROLE_','')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Account actions */}
                            <div className="space-y-2 pt-1" style={{ borderTop: '1px solid rgba(148,163,184,0.28)' }}>
                                <p className="cp-section-title pt-2">ACCOUNT_CONTROLS</p>
                                <UiButton disabled={actionLoading} onClick={() => toggleEnable(selected)}
                                    variant="ghost" className="w-full font-mono-cp text-xs py-2">
                                    {selected.enabled ? 'DISABLE_ACCOUNT' : 'ENABLE_ACCOUNT'}
                                </UiButton>
                                <UiButton disabled={actionLoading} onClick={() => toggleLock(selected)}
                                    variant="amber" className="w-full font-mono-cp text-xs py-2">
                                    {selected.accountLocked ? 'UNLOCK_ACCOUNT' : 'LOCK_ACCOUNT'}
                                </UiButton>
                                <UiButton disabled={actionLoading} onClick={() => deleteUser(selected)}
                                    variant="danger" className="w-full font-mono-cp text-xs py-2">
                                    PURGE_OPERATIVE
                                </UiButton>
                            </div>
                        </GlassCard>
                    </div>
                )}
            </div>
        </PageContainer>
    );
};

export default AdminPage;