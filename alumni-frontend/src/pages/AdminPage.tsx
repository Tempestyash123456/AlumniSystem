import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

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
    return map[role] || 'rgba(0,245,255,0.5)';
};

const RoleBadge = ({ role }: { role: string }) => (
    <span className="cp-badge font-mono-cp" style={{
        background: `${roleColor(role)}11`,
        border: `1px solid ${roleColor(role)}44`,
        color: roleColor(role),
    }}>
        {role.replace('ROLE_','')}
    </span>
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
        <div className="space-y-5">
            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 font-mono-cp text-sm px-4 py-3"
                    style={{
                        background: toast.ok ? 'rgba(0,255,136,0.08)' : 'rgba(255,45,120,0.08)',
                        border: `1px solid ${toast.ok ? 'rgba(0,255,136,0.4)' : 'rgba(255,45,120,0.4)'}`,
                        color: toast.ok ? 'var(--green)' : 'var(--pink)',
                        boxShadow: `0 0 20px ${toast.ok ? 'rgba(0,255,136,0.15)' : 'rgba(255,45,120,0.15)'}`,
                    }}>
                    {toast.ok ? '✓' : '⚠'} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div>
                <p className="font-mono-cp text-xs tracking-widest mb-1" style={{ color: 'rgba(255,45,120,0.5)' }}>// ADMIN_CONSOLE</p>
                <h2 className="font-display text-2xl font-bold tracking-widest glow-pink" style={{ color: 'var(--pink)' }}>SYSTEM_CONTROL</h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'TOTAL_NODES',  value: users.length,                                   color: 'var(--cyan)'   },
                    { label: 'ACTIVE',       value: users.filter(u => u.enabled).length,             color: 'var(--green)'  },
                    { label: 'LOCKED',       value: users.filter(u => u.accountLocked).length,       color: 'var(--amber)'  },
                    { label: 'ADMINS',       value: users.filter(u => u.roles.includes('ROLE_ADMIN')).length, color: 'var(--pink)' },
                ].map(s => (
                    <div key={s.label} className="cp-card p-4 space-y-1"
                        style={{ borderLeft: `2px solid ${s.color}` }}>
                        <p className="font-mono-cp text-xs" style={{ color: 'rgba(0,245,255,0.4)' }}>{s.label}</p>
                        <p className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-5 items-start">
                {/* User list */}
                <div className="flex-1 min-w-0 space-y-3">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-cp text-xs" style={{ color: 'rgba(0,245,255,0.4)' }}>⌕</span>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="search operatives..." className="cp-input pl-8 w-full" />
                    </div>

                    <div className="cp-card overflow-hidden">
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
                                                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center font-display text-xs font-bold"
                                                    style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.2)', color: 'var(--cyan)' }}>
                                                    {u.profilePhotoUrl
                                                        ? <img src={u.profilePhotoUrl} className="w-full h-full object-cover" alt="" />
                                                        : `${u.firstName[0]}${u.lastName[0]}`
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-display text-xs tracking-wide" style={{ color: '#e2e8f0' }}>{u.firstName} {u.lastName}</p>
                                                    <p className="font-mono-cp text-xs truncate max-w-[160px]" style={{ color: 'rgba(0,245,255,0.35)' }}>{u.email}</p>
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
                                    <tr><td colSpan={3} className="text-center py-8 font-mono-cp text-xs" style={{ color: 'rgba(0,245,255,0.3)' }}>NO_NODES_FOUND</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail panel */}
                {selected && (
                    <div className="w-72 shrink-0 space-y-4">
                        <div className="cp-card p-5 space-y-5">
                            {/* Avatar + name */}
                            <div className="flex flex-col items-center text-center gap-3 pb-4"
                                style={{ borderBottom: '1px solid rgba(0,245,255,0.1)' }}>
                                <div className="w-14 h-14 flex items-center justify-center font-display text-lg font-bold"
                                    style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.3)', color: 'var(--cyan)', boxShadow: '0 0 15px rgba(0,245,255,0.1)' }}>
                                    {selected.profilePhotoUrl
                                        ? <img src={selected.profilePhotoUrl} className="w-full h-full object-cover" alt="" />
                                        : `${selected.firstName[0]}${selected.lastName[0]}`
                                    }
                                </div>
                                <div>
                                    <p className="font-display text-sm font-semibold tracking-wide" style={{ color: '#e2e8f0' }}>
                                        {selected.firstName} {selected.lastName}
                                    </p>
                                    <p className="font-mono-cp text-xs mt-0.5" style={{ color: 'rgba(0,245,255,0.4)' }}>{selected.email}</p>
                                </div>
                            </div>

                            {/* Profile score */}
                            <div className="space-y-1">
                                <div className="flex justify-between font-mono-cp text-xs" style={{ color: 'rgba(0,245,255,0.4)' }}>
                                    <span>PROFILE_SCORE</span><span style={{ color: 'var(--cyan)' }}>{selected.profileScore}%</span>
                                </div>
                                <div className="cp-bar-track">
                                    <div className="cp-bar-fill" style={{ width: `${selected.profileScore}%`, background: 'var(--cyan)', boxShadow: '0 0 6px rgba(0,245,255,0.5)' }} />
                                </div>
                            </div>

                            {/* Meta */}
                            <div className="font-mono-cp text-xs space-y-1" style={{ color: 'rgba(0,245,255,0.35)' }}>
                                <p>LAST_LOGIN :: {selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleDateString() : 'NEVER'}</p>
                                <p>CREATED   :: {new Date(selected.createdAt).toLocaleDateString()}</p>
                            </div>

                            {/* Role management */}
                            <div className="space-y-2 pt-1" style={{ borderTop: '1px solid rgba(0,245,255,0.1)' }}>
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
                                                className="font-mono-cp text-xs px-2 py-1.5 transition-all disabled:opacity-40"
                                                style={{
                                                    background: has ? `${c}15` : 'rgba(0,0,0,0.3)',
                                                    border: `1px solid ${has ? c + '50' : 'rgba(0,245,255,0.15)'}`,
                                                    color: has ? c : 'rgba(0,245,255,0.4)',
                                                }}>
                                                {has ? '− ' : '+ '}{r.replace('ROLE_','')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Account actions */}
                            <div className="space-y-2 pt-1" style={{ borderTop: '1px solid rgba(0,245,255,0.1)' }}>
                                <p className="cp-section-title pt-2">ACCOUNT_CONTROLS</p>
                                <button disabled={actionLoading} onClick={() => toggleEnable(selected)}
                                    className="w-full font-mono-cp text-xs py-2 transition-all disabled:opacity-40"
                                    style={{ border: '1px solid rgba(0,245,255,0.2)', color: 'rgba(0,245,255,0.6)', background: 'transparent' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,245,255,0.5)'; (e.currentTarget as HTMLElement).style.color = 'var(--cyan)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,245,255,0.2)'; (e.currentTarget as HTMLElement).style.color = 'rgba(0,245,255,0.6)'; }}>
                                    {selected.enabled ? 'DISABLE_ACCOUNT' : 'ENABLE_ACCOUNT'}
                                </button>
                                <button disabled={actionLoading} onClick={() => toggleLock(selected)}
                                    className="w-full font-mono-cp text-xs py-2 transition-all disabled:opacity-40"
                                    style={{ border: '1px solid rgba(255,184,0,0.25)', color: 'rgba(255,184,0,0.6)', background: 'transparent' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--amber)'; (e.currentTarget as HTMLElement).style.color = 'var(--amber)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,184,0,0.25)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,184,0,0.6)'; }}>
                                    {selected.accountLocked ? 'UNLOCK_ACCOUNT' : 'LOCK_ACCOUNT'}
                                </button>
                                <button disabled={actionLoading} onClick={() => deleteUser(selected)}
                                    className="w-full font-mono-cp text-xs py-2 transition-all disabled:opacity-40"
                                    style={{ border: '1px solid rgba(255,45,120,0.3)', color: 'rgba(255,45,120,0.6)', background: 'transparent' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pink)'; (e.currentTarget as HTMLElement).style.color = 'var(--pink)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 10px rgba(255,45,120,0.15)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,45,120,0.3)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,45,120,0.6)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                                    PURGE_OPERATIVE
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;