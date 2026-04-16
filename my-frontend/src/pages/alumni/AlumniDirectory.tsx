import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { alumniApi, profileApi } from '../../lib/api.ts';
import { useAuthStore } from '../../store/authStore.ts';
import type { AlumniDto, ProfileResponse } from '../../types';
import { Spinner, Input, Badge, Alert } from '../../components/ui';
import { getImageUrl } from '../../lib/api';
import { PermissionGuard } from '../../components/auth/PermissionGuard';

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Returns the most recent / current job from a jobs array, or undefined. */
const getCurrentJob = (jobs?: import('../../types').JobExperience[]) =>
    jobs?.find(j => !j.endYear) ?? jobs?.[jobs.length - 1];
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

const initials = (u: AlumniDto) =>
    `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewMode = 'grid' | 'list';

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
            fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)',
            letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase',
        }}>
            {label}
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="cp-input cp-select"
            style={{ padding: '8px 36px 8px 12px', fontSize: 'var(--font-size-sm)' }}
        >
            <option value="" style={{ fontSize: 'var(--font-size-sm)' }}>{placeholder}</option>
            {options.map((o) => (
                <option key={o} value={o}>{o}</option>
            ))}
        </select>
    </div>
);

// ── User Card (grid) ──────────────────────────────────────────────────────────
const UserCard: React.FC<{
    user: AlumniDto;
    profile: ProfileResponse | null | undefined;
    index: number;
}> = ({ user, profile, index }) => {
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
                    fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)',
                    marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {user.email}
                </div>

                {profile && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {(() => { const job = getCurrentJob(profile.jobs); return job?.jobTitle && (
                            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--neon-cyan)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {job.jobTitle}
                            </div>
                        ); })()}
                        {profile.program && (
                            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                {profile.program}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                            {(user.admissionYear || profile.admissionYear) && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span className="cp-badge cp-badge-cyan" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        {user.admissionYear || profile.admissionYear}
                                    </span>
                                </div>
                            )}
                            {(user.graduationYear || profile.graduationYear) && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span className="cp-badge cp-badge-purple" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        {user.graduationYear || profile.graduationYear}
                                    </span>
                                </div>
                            )}
                            {profile.discipline && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span className="cp-badge cp-badge-amber" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        {profile.discipline}
                                    </span>
                                </div>
                            )}
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
    user: AlumniDto;
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
                            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${c1}` }}
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
                        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                            {user.email}
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                    {profile?.program || '—'}
                </div>
            </td>
            <td>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                    {profile?.discipline || '—'}
                </div>
            </td>
            <td>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--neon-cyan)' }}>
                    {user.admissionYear || profile?.admissionYear || '—'}
                </div>
            </td>
            <td>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--neon-purple)' }}>
                    {user.graduationYear || profile?.graduationYear || '—'}
                </div>
            </td>
            <td>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                    {(() => { const job = getCurrentJob(profile?.jobs); return job?.jobTitle
                        ? `${job.jobTitle}${job.company ? ` @ ${job.company}` : ''}`
                        : '—'; })()}
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
    const [users, setUsers]                     = useState<AlumniDto[]>([]);
    const [profileCache, setProfileCache]       = useState<ProfileCache>({});
    const [loading, setLoading]                 = useState(true);
    const [profilesLoading, setProfilesLoading] = useState(false);
    const [error, setError]                     = useState('');

    const [view, setView]                 = useState<ViewMode>('grid');
    const [search, setSearch]             = useState('');
    const [filterProgram, setFilterProgram]   = useState('');
    const [filterDiscipline, setFilterDiscipline] = useState('');
    const [filterYear, setFilterYear]             = useState('');
    const [filterAdmissionYear, setFilterAdmissionYear] = useState('');

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const res = await alumniApi.getAll();
                if (res.data) {
                    setUsers(res.data);
                } else {
                    setError(res.error?.message || 'Failed to load users');
                }
            } catch (err) {
                setError('A network error occurred while loading users');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, []);

    useEffect(() => {
        if (users.length === 0) return;
        
        const loadProfiles = async () => {
            setProfilesLoading(true);
            try {
                const results = await Promise.all(
                    users.map(async (u) => {
                        try {
                            const res = await profileApi.getProfileById(u.id);
                            return { id: u.id, profile: res.data ?? null };
                        } catch {
                            return { id: u.id, profile: null };
                        }
                    })
                );
                const cache: ProfileCache = {};
                results.forEach(({ id, profile }) => { cache[id] = profile; });
                setProfileCache(cache);
            } catch (err) {
                console.error('Error batch loading profiles:', err);
            } finally {
                setProfilesLoading(false);
            }
        };
        
        loadProfiles();
    }, [users]);

    const filterOptions = useMemo(() => {
        const profiles = Object.values(profileCache).filter(Boolean) as ProfileResponse[];
        const programs    = [...new Set(profiles.map(p => p.program).filter(Boolean) as string[])].sort();
        const disciplines = [...new Set(profiles.map(p => p.discipline).filter(Boolean) as string[])].sort();
        const years       = [...new Set(profiles.map(p => p.graduationYear).filter(Boolean) as number[])].sort((a, b) => b - a).map(String);
        const admissionYears = [...new Set(users.map(u => u.admissionYear).filter(Boolean) as number[])].sort((a, b) => b - a).map(String);
        return { programs, disciplines, years, admissionYears };
    }, [profileCache, users]);

    const filteredUsers = useMemo(() => {
        const q = search.toLowerCase().trim();
        return users.filter(u => {
            const profile = profileCache[u.id];
            if (q && !`${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)) return false;
            if (filterProgram    && profile?.program             !== filterProgram)    return false;
            if (filterDiscipline && profile?.discipline          !== filterDiscipline) return false;
            if (filterYear       && String(u.graduationYear || profile?.graduationYear) !== filterYear)   return false;
            if (filterAdmissionYear && String(u.admissionYear) !== filterAdmissionYear) return false;
            return true;
        });
    }, [users, profileCache, search, filterProgram, filterDiscipline, filterYear, filterAdmissionYear]);

    const hasFilters = !!(filterProgram || filterDiscipline || filterYear);

    const resetFilters = () => {
        setFilterProgram('');
        setFilterDiscipline('');
        setFilterYear('');
        setFilterAdmissionYear('');
        setSearch('');
    };

    return (
        <div
            className="animate-fade-in"
            style={{ display: 'flex', flexDirection: 'column', gap: 24, minHeight: '100%' }}
        >

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, flexShrink: 0 }}>
                <div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '0.15em', marginBottom: 6 }}>
                        ALUMNI_PORTAL › NETWORK_DATABASE
                    </div>
                    <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 700, letterSpacing: '0.05em' }}>
                        User Directory
                    </h1>
                    <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                        {loading ? '...' : `${users.length} members`}
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

            {/* ── Search + Filters ── */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', flexShrink: 0 }}>
                <div style={{ flex: '1 1 220px', maxWidth: 340 }}>
                    <Input
                        placeholder="Search members..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={<span style={{ fontSize: '14px' }}>⌕</span>}
                    />
                </div>
                <FilterSelect label="Program"      value={filterProgram}   onChange={setFilterProgram}   options={filterOptions.programs} placeholder="All Programs" />
                <FilterSelect label="Discipline"   value={filterDiscipline} onChange={setFilterDiscipline} options={filterOptions.disciplines} placeholder="All Disciplines" />
                <FilterSelect label="Admission Year" value={filterAdmissionYear} onChange={setFilterAdmissionYear} options={filterOptions.admissionYears} placeholder="All Adm. Years" />
                <FilterSelect label="Graduation Year" value={filterYear}   onChange={setFilterYear}   options={filterOptions.years}      placeholder="All Grad. Years" />
                {hasFilters && (
                    <button
                        onClick={resetFilters}
                        style={{
                            padding: '8px 14px',
                            background: 'rgba(255,45,120,0.08)',
                            border: '1px solid rgba(255,45,120,0.3)',
                            borderRadius: 4,
                            color: 'var(--neon-pink)',
                            fontFamily: 'Orbitron, sans-serif',
                            fontSize: 'var(--font-size-xs)',
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
            </div>

            {/* ── Active filter chips ── */}
            {hasFilters && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
                    {filterProgram    && <span className="cp-badge cp-badge-cyan">Program: {filterProgram}</span>}
                    {filterDiscipline && <span className="cp-badge cp-badge-purple">Discipline: {filterDiscipline}</span>}
                    {filterAdmissionYear && <span className="cp-badge cp-badge-cyan">Adm. Year: {filterAdmissionYear}</span>}
                    {filterYear       && <span className="cp-badge cp-badge-amber">Grad. Year: {filterYear}</span>}
                    <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        → {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* ── Profile loading indicator ── */}
            {profilesLoading && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
                    fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)',
                }}>
                    <span className="cp-spinner" style={{ width: 14, height: 14 }} />
                    Loading profile data for filters...
                </div>
            )}

            {/* ── Results Container ── */}
            <div style={{ flex: 1, paddingBottom: 60 }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                        <Spinner size={32} />
                    </div>
                ) : error ? (
                    <div style={{ padding: '20px 0' }}>
                        <Alert type="error" onClose={() => setError('')}>
                            {error}
                        </Alert>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◈</div>
                        <p style={{ fontFamily: 'Share Tech Mono, monospace', color: 'var(--text-muted)' }}>
                            {search || hasFilters ? 'No matches for current filters' : 'No members found'}
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
                        {filteredUsers.map((u, i) => (
                            <UserCard
                                key={u.id}
                                user={u}
                                profile={profileCache[u.id]}
                                index={i}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="cp-panel" style={{ overflow: 'hidden' }}>
                        <table className="cp-table">
                            <thead>
                            <tr>
                                <th>Member</th>
                                <th>Program</th>
                                <th>Discipline</th>
                                <th>Adm. Year</th>
                                <th>Grad. Year</th>
                                <th>Current Role</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredUsers.map((u, i) => (
                                <UserRow
                                    key={u.id}
                                    user={u}
                                    profile={profileCache[u.id]}
                                    index={i}
                                />
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Scroll Reveal Hook ────────────────────────────────────────────────────────
const useScrollReveal = () => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return { ref, isVisible };
};

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }> = ({ children, delay = 0, className = '', style = {} }) => {
    const { ref, isVisible } = useScrollReveal();
    return (
        <div
            ref={ref}
            className={`reveal-hidden ${isVisible ? 'reveal-visible' : ''} ${className}`}
            style={{ ...style, transitionDelay: `${delay}s` }}
        >
            {children}
        </div>
    );
};

// ── Profile View Page ─────────────────────────────────────────────────────────
export const AlumniProfileViewPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { hasPermission: hp } = useAuthStore();
    const canViewDirectory = hp('VIEW_DIRECTORY');
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    // For progress bar reveal (unused since removal)
    // const { ref: progressRef, isVisible: progressVisible } = useScrollReveal();

    useEffect(() => {
        if (!userId) return;
        
        const loadProfile = async () => {
            try {
                const res = await profileApi.getProfileById(userId);
                if (res.data) {
                    setProfile(res.data);
                } else {
                    setError(res.error?.message || 'Profile not found');
                }
            } catch (err) {
                setError('Failed to reach server. Please check your connection.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        
        loadProfile();
    }, [userId]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Spinner size={32} />
        </div>
    );

    if (error || !profile) return (
        <div style={{ maxWidth: 820 }}>
            <div style={{ marginBottom: 24 }}>
                <Link
                    to={canViewDirectory ? '/alumni' : '/dashboard'}
                    style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--neon-cyan)', textDecoration: 'none' }}
                >
                    ← {canViewDirectory ? 'Back to Directory' : 'Back to Dashboard'}
                </Link>
            </div>
            <Alert type="error" onClose={() => setError('')}>
                {error || 'Profile not found'}
            </Alert>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ maxWidth: 820, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flexShrink: 0, marginBottom: 24 }}>
                <Link
                    to={canViewDirectory ? '/alumni' : '/dashboard'}
                    style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--neon-cyan)', textDecoration: 'none' }}
                >
                    ← {canViewDirectory ? 'Back to Directory' : 'Back to Dashboard'}
                </Link>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 10 }}>
                <Reveal className="cp-panel cp-corners" style={{ padding: '32px' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap' }}>

                        <div style={{ 
                            position: 'relative', 
                            animation: 'pulse-glow 5s infinite alternate ease-in-out',
                            borderRadius: '50%',
                            width: 120,
                            height: 120,
                            padding: 3,
                            background: 'rgba(0, 245, 255, 0.1)',
                            border: '1px solid rgba(0, 245, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {profile.profilePhotoUrl ? (
                                <img
                                    src={getImageUrl(profile.profilePhotoUrl)!}
                                    alt="Profile"
                                    referrerPolicy="no-referrer"
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        borderRadius: '50%', 
                                        objectFit: 'cover', 
                                        border: '2px solid var(--neon-cyan)',
                                        boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%', flexShrink: 0,
                                    background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: 'Orbitron, monospace', fontSize: '32px', fontWeight: 700,
                                    color: 'var(--bg-void)', boxShadow: '0 0 20px rgba(0,245,255,0.3)',
                                }}>
                                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                                </div>
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: 200 }}>
                            <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                                {profile.firstName} {profile.lastName}
                            </h1>
                            {(() => { const job = getCurrentJob(profile.jobs); return job?.jobTitle && (
                                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '16px', color: 'var(--text-secondary)', marginBottom: 10 }}>
                                    {job.jobTitle}{job.company && ` @ ${job.company}`}
                                </div>
                            ); })()}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {profile.openToMentor   && <Badge variant="cyan">Open to Mentor</Badge>}
                                {profile.openToHire     && <Badge variant="green">Open to Hire</Badge>}
                                {profile.admissionYear  && <Badge variant="cyan">Class of {profile.admissionYear} (Admission)</Badge>}
                                {profile.graduationYear && <Badge variant="purple">Class of {profile.graduationYear} (Graduation)</Badge>}
                                {profile.discipline     && <Badge variant="amber">{profile.discipline}</Badge>}
                            </div>
                        </div>

                        {/* Profile score removed */}

                    </div>

                    <hr className="cp-divider" style={{ marginBottom: 24 }} />

                    {profile.bio && (
                        <Reveal delay={0.1} style={{ marginBottom: 24 }}>
                            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 8 }}>BIO</div>
                            <p style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 'var(--font-size-base)' }}>{profile.bio}</p>
                        </Reveal>
                    )}

                    <Reveal delay={0.2} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
                        {[
                            { label: 'Email',          value: profile.email },
                            { label: 'Phone',          value: profile.phone },
                            { label: 'Location',       value: [profile.city, profile.state, profile.country].filter(Boolean).join(', ') },
                            { label: 'Admission Year',  value: profile.admissionYear },
                            { label: 'Graduation Year', value: profile.graduationYear },
                            { label: 'Program',        value: profile.program },
                            { label: 'Discipline',     value: profile.discipline },
                            { label: 'Industry',       value: getCurrentJob(profile.jobs)?.industry },
                            { label: 'Experience',     value: profile.jobs?.length ? `${profile.jobs.reduce((s, j) => s + (j.experienceMonths ?? 0), 0)} months` : null },
                            { label: 'Student / Employee ID', value: profile.studentId },
                        ].filter(f => f.value).map(({ label, value }, idx) => (
                            <div key={label} className={`reveal-hidden reveal-visible`} style={{ transitionDelay: `${0.3 + idx * 0.05}s` }}>
                                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 4 }}>
                                    {label.toUpperCase()}
                                </div>
                                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                                    {value}
                                </div>
                            </div>
                        ))}
                    </Reveal>

                    {profile.skills && profile.skills.length > 0 && (
                        <Reveal delay={0.4} style={{ marginBottom: 24 }}>
                            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 10 }}>
                                SKILLS
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {profile.skills.map((s, i) => (
                                    <span 
                                        key={s} 
                                        className="cp-skill-tag reveal-hidden reveal-visible"
                                        style={{ transitionDelay: `${0.5 + i * 0.03}s` }}
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </Reveal>
                    )}

                    {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) && (
                        <Reveal delay={0.6} style={{ marginBottom: 24 }}>
                            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 10 }}>
                                LINKS
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {profile.linkedinUrl  && <a href={profile.linkedinUrl}  target="_blank" rel="noreferrer" className="cp-btn cp-btn-outline cp-btn-sm">LinkedIn ↗</a>}
                                {profile.githubUrl    && <a href={profile.githubUrl}    target="_blank" rel="noreferrer" className="cp-btn cp-btn-ghost cp-btn-sm">GitHub ↗</a>}
                                {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="cp-btn cp-btn-ghost cp-btn-sm">Portfolio ↗</a>}
                            </div>
                        </Reveal>
                    )}

                    {/* Admin Actions */}
                    <PermissionGuard permission="MANAGE_PERMISSION">
                        <Reveal delay={0.7} style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--neon-pink)', letterSpacing: '0.2em', marginBottom: 16 }}>
                                ADMIN_ACTIONS
                            </div>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <Link to="/admin/users/status" state={{ highlightUser: userId }} className="cp-btn cp-btn-primary cp-btn-sm">
                                    🛡️ MANAGE PERMISSIONS
                                </Link>
                            </div>
                        </Reveal>
                    </PermissionGuard>
                </Reveal>
            </div>
        </div>
    );
};