import React, { useEffect, useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { adminApi, profileApi } from '../../lib/api.ts';
import { useAuthStore } from '../../store/authStore.ts';
import type { AdminUserDto, ProfileResponse } from '../../types';
import { Spinner, Input, Badge, ProgressBar } from '../../components/ui';
import { getImageUrl } from '../../lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const avatarColor = (id: string) => {
    const colors = [
        ['#00f5ff', '#0099aa'],
        ['#ff2d78', '#8b0030'],
        ['#bf5af2', '#7b2fbf'],
        ['#39ff14', '#1a8800'],
        ['#ffb800', '#b07a00'],
    ];
    const idx = parseInt(id.replace(/-/g, '').slice(0, 8), 16) % colors.length;
    return colors[idx];
};

const initials = (u: AdminUserDto) =>
    `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();

const isAlumni = (u: AdminUserDto) =>
    u.roles.includes('ROLE_ALUMNI') && !u.roles.includes('ROLE_ADMIN');

const isAdmin = (u: AdminUserDto) => u.roles.includes('ROLE_ADMIN');

// ── Types ─────────────────────────────────────────────────────────────────────
type DirectoryTab = 'alumni' | 'admins';
type ViewMode    = 'grid' | 'list';

interface ProfileCache {
    [userId: string]: ProfileResponse | null;
}

// ── Filter Select ─────────────────────────────────────────────────────────────
const FilterSelect: React.FC<{
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
    placeholder: string;
}> = ({ label, value, onChange, options, placeholder }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
        <label style={{
            fontFamily: 'Orbitron, monospace', fontSize: '9px',
            letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase',
        }}>
            {label}
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="cp-input cp-select"
            style={{ padding: '8px 36px 8px 12px', fontSize: '12px' }}
        >
            <option value="">{placeholder}</option>
            {options.map((o) => (
                <option key={o} value={o}>{o}</option>
            ))}
        </select>
    </div>
);

// ── User Card (grid) ──────────────────────────────────────────────────────────
const UserCard: React.FC<{
    user: AdminUserDto;
    profile: ProfileResponse | null | undefined;
    index: number;
    showAdminBadge?: boolean;
}> = ({ user, profile, index, showAdminBadge }) => {
    const [c1, c2] = avatarColor(user.id);
    return (
        <div
            className="cp-card"
            style={{
                padding: '24px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', gap: 12,
                animation: `fadeIn 0.3s ease-out ${index * 0.03}s both`,
            }}
        >
            {user.profilePhotoUrl ? (
                <img
                    src={getImageUrl(user.profilePhotoUrl)!}
                    alt=""
                    style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${c1}` }}
                />
            ) : (
                <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${c1}, ${c2})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Orbitron, monospace', fontSize: '18px', fontWeight: 700,
                    color: 'var(--bg-void)', boxShadow: `0 0 16px ${c1}40`, flexShrink: 0,
                }}>
                    {initials(user)}
                </div>
            )}

            <div style={{ width: '100%' }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>
                    {user.firstName} {user.lastName}
                </div>
                <div style={{
                    fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)',
                    marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {user.email}
                </div>

                {profile && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {profile.currentJobTitle && (
                            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-cyan)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {profile.currentJobTitle}
                            </div>
                        )}
                        {profile.department && (
                            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: 'var(--text-muted)' }}>
                                {profile.department}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                            {profile.graduationYear && (
                                <span className="cp-badge cp-badge-purple" style={{ fontSize: '8px' }}>
                                    {profile.graduationYear}
                                </span>
                            )}
                            {profile.degree && (
                                <span className="cp-badge cp-badge-cyan" style={{ fontSize: '8px' }}>
                                    {profile.degree}
                                </span>
                            )}
                            {showAdminBadge && (
                                <span className="cp-badge cp-badge-pink" style={{ fontSize: '8px' }}>ADMIN</span>
                            )}
                        </div>
                    </div>
                )}
                {typeof user.profileScore === 'number' && user.profileScore > 0 && (
                    <div style={{ marginTop: 10 }}>
                        <div className="cp-progress">
                            <div className="cp-progress-fill" style={{ width: `${user.profileScore}%` }} />
                        </div>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '8px', color: 'var(--text-disabled)', marginTop: 3, letterSpacing: '0.1em' }}>
                            PROFILE {user.profileScore}%
                        </div>
                    </div>
                )}
            </div>

            <Link
                to={`/alumni/${user.id}`}
                className="cp-btn cp-btn-outline cp-btn-sm"
                style={{ marginTop: 4, width: '100%' }}
            >
                VIEW PROFILE
            </Link>
        </div>
    );
};

// ── User Row (list) ───────────────────────────────────────────────────────────
const UserRow: React.FC<{
    user: AdminUserDto;
    profile: ProfileResponse | null | undefined;
    index: number;
}> = ({ user, profile, index }) => {
    const [c1, c2] = avatarColor(user.id);
    return (
        <tr style={{ animation: `fadeIn 0.2s ease-out ${index * 0.02}s both` }}>
            <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {user.profilePhotoUrl ? (
                        <img
                            src={getImageUrl(user.profilePhotoUrl)!}
                            alt=""
                            style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${c1}` }}
                        />
                    ) : (
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${c1}, ${c2})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'Orbitron, monospace', fontSize: '12px', fontWeight: 700,
                            color: 'var(--bg-void)', flexShrink: 0,
                        }}>
                            {initials(user)}
                        </div>
                    )}
                    <div>
                        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '14px' }}>
                            {user.firstName} {user.lastName}
                        </div>
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {user.email}
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {profile?.department || '—'}
                </div>
            </td>
            <td>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {profile?.degree || '—'}
                </div>
            </td>
            <td>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--neon-purple)' }}>
                    {profile?.graduationYear || '—'}
                </div>
            </td>
            <td>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {profile?.currentJobTitle
                        ? `${profile.currentJobTitle}${profile.currentCompany ? ` @ ${profile.currentCompany}` : ''}`
                        : '—'}
                </div>
            </td>
            <td style={{ textAlign: 'right' }}>
                <Link to={`/alumni/${user.id}`} className="cp-btn cp-btn-ghost cp-btn-sm">
                    View →
                </Link>
            </td>
        </tr>
    );
};

// ── Main Directory Page ───────────────────────────────────────────────────────
export const AlumniDirectoryPage: React.FC = () => {
    const { isAdmin: currentUserIsAdmin } = useAuthStore();

    if (!currentUserIsAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    const [users, setUsers]                       = useState<AdminUserDto[]>([]);
    const [profileCache, setProfileCache]         = useState<ProfileCache>({});
    const [loading, setLoading]                   = useState(true);
    const [profilesLoading, setProfilesLoading]   = useState(false);
    const [error, setError]                       = useState('');

    const [tab, setTab]             = useState<DirectoryTab>('alumni');
    const [view, setView]           = useState<ViewMode>('grid');
    const [search, setSearch]       = useState('');
    const [filterDept, setFilterDept]     = useState('');
    const [filterDegree, setFilterDegree] = useState('');
    const [filterYear, setFilterYear]     = useState('');

    useEffect(() => {
        adminApi.getAllUsers().then((res) => {
            if (res.data) {
                setUsers(res.data.users);
            } else {
                setError(res.error?.message || 'Failed to load users');
            }
        }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (users.length === 0) return;
        setProfilesLoading(true);
        const alumniUsers = users.filter(isAlumni);
        Promise.all(
            alumniUsers.map(u =>
                profileApi.getProfileById(u.id)
                    .then(res => ({ id: u.id, profile: res.data ?? null }))
                    .catch(() => ({ id: u.id, profile: null }))
            )
        ).then(results => {
            const cache: ProfileCache = {};
            results.forEach(({ id, profile }) => { cache[id] = profile; });
            setProfileCache(cache);
        }).finally(() => setProfilesLoading(false));
    }, [users]);

    const filterOptions = useMemo(() => {
        const profiles = Object.values(profileCache).filter(Boolean) as ProfileResponse[];
        const departments = [...new Set(profiles.map(p => p.department).filter(Boolean) as string[])].sort();
        const degrees     = [...new Set(profiles.map(p => p.degree).filter(Boolean) as string[])].sort();
        const years       = [...new Set(profiles.map(p => p.graduationYear).filter(Boolean) as number[])].sort((a, b) => b - a).map(String);
        return { departments, degrees, years };
    }, [profileCache]);

    const alumniUsers = useMemo(() => users.filter(u => u.enabled && isAlumni(u)), [users]);
    const adminUsers  = useMemo(() => users.filter(u => u.enabled && isAdmin(u)), [users]);

    const filteredAlumni = useMemo(() => {
        const q = search.toLowerCase().trim();
        return alumniUsers.filter(u => {
            const profile = profileCache[u.id];
            if (q && !`${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)) return false;
            if (filterDept   && profile?.department              !== filterDept)   return false;
            if (filterDegree && profile?.degree                  !== filterDegree) return false;
            if (filterYear   && String(profile?.graduationYear)  !== filterYear)   return false;
            return true;
        });
    }, [alumniUsers, profileCache, search, filterDept, filterDegree, filterYear]);

    const filteredAdmins = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return adminUsers;
        return adminUsers.filter(u =>
            `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)
        );
    }, [adminUsers, search]);

    const activeUsers = tab === 'alumni' ? filteredAlumni : filteredAdmins;
    const hasFilters  = !!(filterDept || filterDegree || filterYear);

    const resetFilters = () => {
        setFilterDept('');
        setFilterDegree('');
        setFilterYear('');
        setSearch('');
    };

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        // height: 100% + minHeight: 0 lets this fill the Layout's flex column
        // so only the cards area scrolls, not the whole page
        <div
            className="animate-fade-in"
            style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 0 }}
        >

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, flexShrink: 0 }}>
                <div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '0.15em', marginBottom: 6 }}>
                        ADMIN_CONSOLE › NETWORK_DATABASE
                    </div>
                    <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 700, letterSpacing: '0.05em' }}>
                        User Directory
                    </h1>
                    <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                        {loading ? '...' : `${alumniUsers.length} alumni · ${adminUsers.length} admins`}
                    </p>
                </div>

                <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                    {(['grid', 'list'] as const).map((v) => (
                        <button key={v} onClick={() => setView(v)} style={{
                            padding: '8px 16px', background: view === v ? 'rgba(0,245,255,0.12)' : 'transparent',
                            border: 'none', color: view === v ? 'var(--neon-cyan)' : 'var(--text-muted)',
                            fontFamily: 'Orbitron, monospace', fontSize: '10px', letterSpacing: '0.1em',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                            {v === 'grid' ? '⊞' : '☰'} {v.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Tab bar ── */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                {([
                    { id: 'alumni' as const, label: 'Alumni', count: alumniUsers.length, color: 'var(--neon-cyan)' },
                    { id: 'admins' as const, label: 'Admins', count: adminUsers.length,  color: 'var(--neon-pink)' },
                ] as const).map(({ id, label, count, color }) => (
                    <button
                        key={id}
                        onClick={() => { setTab(id); resetFilters(); }}
                        style={{
                            padding: '12px 28px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: tab === id ? `2px solid ${color}` : '2px solid transparent',
                            color: tab === id ? color : 'var(--text-muted)',
                            fontFamily: 'Orbitron, monospace',
                            fontSize: '11px',
                            letterSpacing: '0.12em',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: -1,
                        }}
                    >
                        {label}
                        <span style={{
                            background: tab === id ? `${color}22` : 'var(--bg-hover)',
                            color: tab === id ? color : 'var(--text-disabled)',
                            border: `1px solid ${tab === id ? color + '44' : 'var(--border-subtle)'}`,
                            borderRadius: 2,
                            padding: '1px 7px',
                            fontFamily: 'Share Tech Mono, monospace',
                            fontSize: '10px',
                        }}>
                            {count}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Search + Filters ── */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', flexShrink: 0 }}>
                <div style={{ flex: '1 1 220px', maxWidth: 340 }}>
                    <Input
                        placeholder={tab === 'alumni' ? 'Search alumni...' : 'Search admins...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={<span style={{ fontSize: '14px' }}>⌕</span>}
                    />
                </div>

                {tab === 'alumni' && (
                    <>
                        <FilterSelect
                            label="Department"
                            value={filterDept}
                            onChange={setFilterDept}
                            options={filterOptions.departments}
                            placeholder="All Departments"
                        />
                        <FilterSelect
                            label="Degree"
                            value={filterDegree}
                            onChange={setFilterDegree}
                            options={filterOptions.degrees}
                            placeholder="All Degrees"
                        />
                        <FilterSelect
                            label="Graduation Year"
                            value={filterYear}
                            onChange={setFilterYear}
                            options={filterOptions.years}
                            placeholder="All Years"
                        />
                        {hasFilters && (
                            <button
                                onClick={resetFilters}
                                style={{
                                    padding: '8px 14px',
                                    background: 'rgba(255,45,120,0.08)',
                                    border: '1px solid rgba(255,45,120,0.3)',
                                    borderRadius: 4,
                                    color: 'var(--neon-pink)',
                                    fontFamily: 'Orbitron, monospace',
                                    fontSize: '9px',
                                    letterSpacing: '0.1em',
                                    cursor: 'pointer',
                                    alignSelf: 'flex-end',
                                    height: 38,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                ✕ CLEAR
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* ── Active filter chips ── */}
            {tab === 'alumni' && hasFilters && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
                    {filterDept   && <span className="cp-badge cp-badge-cyan">Dept: {filterDept}</span>}
                    {filterDegree && <span className="cp-badge cp-badge-purple">Degree: {filterDegree}</span>}
                    {filterYear   && <span className="cp-badge cp-badge-amber">Year: {filterYear}</span>}
                    <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        → {filteredAlumni.length} result{filteredAlumni.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* ── Profiles loading indicator ── */}
            {profilesLoading && tab === 'alumni' && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
                    fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)',
                }}>
                    <span className="cp-spinner" style={{ width: 14, height: 14 }} />
                    Loading profile data for filters...
                </div>
            )}

            {/* ── Scrollable content area ── */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 2 }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                        <Spinner size={32} />
                    </div>
                ) : error ? (
                    <div style={{ color: 'var(--neon-pink)', fontFamily: 'Share Tech Mono, monospace', padding: 40, textAlign: 'center' }}>
                        ⚠ {error}
                    </div>
                ) : activeUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◈</div>
                        <p style={{ fontFamily: 'Share Tech Mono, monospace', color: 'var(--text-muted)' }}>
                            {search || hasFilters ? 'No matches for current filters' : `No ${tab} found`}
                        </p>
                        {(search || hasFilters) && (
                            <button
                                onClick={resetFilters}
                                className="cp-btn cp-btn-ghost cp-btn-sm"
                                style={{ marginTop: 16 }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : view === 'grid' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                        {activeUsers.map((u, i) => (
                            <UserCard
                                key={u.id}
                                user={u}
                                profile={profileCache[u.id]}
                                index={i}
                                showAdminBadge={tab === 'admins'}
                            />
                        ))}
                    </div>
                ) : (
                    /* List view */
                    <div className="cp-panel" style={{ overflow: 'hidden' }}>
                        <table className="cp-table">
                            <thead>
                            <tr>
                                <th>Member</th>
                                {tab === 'alumni' ? (
                                    <>
                                        <th>Department</th>
                                        <th>Degree</th>
                                        <th>Grad Year</th>
                                        <th>Current Role</th>
                                    </>
                                ) : (
                                    <>
                                        <th>Roles</th>
                                        <th>Last Login</th>
                                        <th>Profile</th>
                                        <th></th>
                                    </>
                                )}
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {tab === 'alumni'
                                ? activeUsers.map((u, i) => (
                                    <UserRow
                                        key={u.id}
                                        user={u}
                                        profile={profileCache[u.id]}
                                        index={i}
                                    />
                                ))
                                : activeUsers.map((u, i) => (
                                    <tr key={u.id} style={{ animation: `fadeIn 0.2s ease-out ${i * 0.02}s both` }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {(() => {
                                                    const [c1, c2] = avatarColor(u.id);
                                                    return (
                                                        <div style={{
                                                            width: 34, height: 34, borderRadius: '50%',
                                                            background: `linear-gradient(135deg, ${c1}, ${c2})`,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontFamily: 'Orbitron, monospace', fontSize: '12px', fontWeight: 700,
                                                            color: 'var(--bg-void)', flexShrink: 0,
                                                        }}>
                                                            {initials(u)}
                                                        </div>
                                                    );
                                                })()}
                                                <div>
                                                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '14px' }}>
                                                        {u.firstName} {u.lastName}
                                                    </div>
                                                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        {u.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                {u.roles.map(r => (
                                                    <span key={r} className={`cp-badge ${r.includes('ADMIN') ? 'cp-badge-pink' : 'cp-badge-cyan'}`}>
                                                        {r.replace('ROLE_', '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 50, height: 4, background: 'var(--bg-hover)', borderRadius: 2, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${u.profileScore}%`, background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))' }} />
                                                </div>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace' }}>{u.profileScore}%</span>
                                            </div>
                                        </td>
                                        <td></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <Link to={`/alumni/${u.id}`} className="cp-btn cp-btn-ghost cp-btn-sm">
                                                View →
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            }
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Public / Admin Profile View ───────────────────────────────────────────────
export const AlumniProfileViewPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { isAdmin: currentUserIsAdmin } = useAuthStore();
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        if (!userId) return;
        profileApi.getProfileById(userId)
            .then((res) => {
                if (res.data) setProfile(res.data);
                else setError(res.error?.message || 'Profile not found');
            })
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Spinner size={32} />
        </div>
    );

    if (error || !profile) return (
        <div style={{ color: 'var(--neon-pink)', fontFamily: 'Share Tech Mono, monospace', padding: 40, textAlign: 'center' }}>
            ⚠ {error || 'Profile not found'}
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ maxWidth: 820 }}>
            <div style={{ marginBottom: 24 }}>
                <Link
                    to={currentUserIsAdmin ? '/alumni' : '/dashboard'}
                    style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--neon-cyan)', textDecoration: 'none' }}
                >
                    ← {currentUserIsAdmin ? 'Back to Directory' : 'Back to Dashboard'}
                </Link>
            </div>

            <div className="cp-panel cp-corners" style={{ padding: '32px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap' }}>

                    {profile.profilePhotoUrl ? (
                        <img
                            src={getImageUrl(profile.profilePhotoUrl)!}
                            alt="Profile"
                            referrerPolicy="no-referrer"
                            style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'Orbitron, monospace', fontSize: '28px', fontWeight: 700,
                            color: 'var(--bg-void)', boxShadow: '0 0 20px rgba(0,245,255,0.3)',
                        }}>
                            {profile.firstName?.[0]}{profile.lastName?.[0]}
                        </div>
                    )}

                    <div style={{ flex: 1, minWidth: 200 }}>
                        <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                            {profile.firstName} {profile.lastName}
                        </h1>
                        {profile.currentJobTitle && (
                            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '16px', color: 'var(--text-secondary)', marginBottom: 10 }}>
                                {profile.currentJobTitle}{profile.currentCompany && ` @ ${profile.currentCompany}`}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {profile.openToMentor   && <Badge variant="cyan">Open to Mentor</Badge>}
                            {profile.openToHire     && <Badge variant="green">Open to Hire</Badge>}
                            {profile.graduationYear && <Badge variant="purple">Class of {profile.graduationYear}</Badge>}
                            {profile.degree         && <Badge variant="amber">{profile.degree}</Badge>}
                        </div>
                    </div>

                    <div style={{ minWidth: 120 }}>
                        <ProgressBar value={profile.profileScore} />
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '9px', color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.1em', textAlign: 'center' }}>
                            PROFILE SCORE
                        </div>
                    </div>
                </div>

                <hr className="cp-divider" style={{ marginBottom: 24 }} />

                {profile.bio && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 8 }}>BIO</div>
                        <p style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '15px' }}>{profile.bio}</p>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
                    {[
                        { label: 'Email',          value: profile.email },
                        { label: 'Phone',          value: profile.phone },
                        { label: 'Location',       value: [profile.city, profile.state, profile.country].filter(Boolean).join(', ') },
                        { label: 'Department',     value: profile.department },
                        { label: 'Degree',         value: profile.degree },
                        { label: 'Specialization', value: profile.specialization },
                        { label: 'Industry',       value: profile.industry },
                        { label: 'Experience',     value: profile.experienceYears != null ? `${profile.experienceYears} yrs` : null },
                        { label: 'Student ID',     value: profile.studentId },
                    ].filter(f => f.value).map(({ label, value }) => (
                        <div key={label}>
                            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 4 }}>
                                {label.toUpperCase()}
                            </div>
                            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                                {value}
                            </div>
                        </div>
                    ))}
                </div>

                {profile.skills && profile.skills.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 10 }}>
                            SKILLS
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {profile.skills.map((s) => <span key={s} className="cp-skill-tag">{s}</span>)}
                        </div>
                    </div>
                )}

                {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) && (
                    <div>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 10 }}>
                            LINKS
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {profile.linkedinUrl  && <a href={profile.linkedinUrl}  target="_blank" rel="noreferrer" className="cp-btn cp-btn-outline cp-btn-sm">LinkedIn ↗</a>}
                            {profile.githubUrl    && <a href={profile.githubUrl}    target="_blank" rel="noreferrer" className="cp-btn cp-btn-ghost cp-btn-sm">GitHub ↗</a>}
                            {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="cp-btn cp-btn-ghost cp-btn-sm">Portfolio ↗</a>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};