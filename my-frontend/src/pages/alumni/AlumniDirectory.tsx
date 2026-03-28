import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { alumniApi } from '../../lib/api.ts';
import type { AlumniDto } from '../../types';
import { Spinner, Input } from '../../components/ui';

export const AlumniDirectoryPage: React.FC = () => {
    const [alumni, setAlumni] = useState<AlumniDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        alumniApi.getAll().then((res) => {
            if (res.data) setAlumni(res.data);
            else setError(res.error?.message || 'Failed to load alumni');
        }).finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return alumni;
        const q = search.toLowerCase();
        return alumni.filter(
            (a) =>
                `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
                a.email.toLowerCase().includes(q)
        );
    }, [alumni, search]);

    const initials = (a: AlumniDto) =>
        `${a.firstName?.[0] ?? ''}${a.lastName?.[0] ?? ''}`.toUpperCase();

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

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '0.15em', marginBottom: 6 }}>
                        NETWORK_DATABASE
                    </div>
                    <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                        Alumni Directory
                    </h1>
                    <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                        {loading ? '...' : `${alumni.length} verified members`}
                    </p>
                </div>
                {/* View toggle */}
                <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                    {(['grid', 'list'] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            style={{
                                padding: '8px 16px',
                                background: view === v ? 'rgba(0,245,255,0.12)' : 'transparent',
                                border: 'none',
                                color: view === v ? 'var(--neon-cyan)' : 'var(--text-muted)',
                                fontFamily: 'Orbitron, monospace',
                                fontSize: '10px',
                                letterSpacing: '0.1em',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {v === 'grid' ? '⊞' : '☰'} {v.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div style={{ maxWidth: 480 }}>
                <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<span style={{ fontSize: '14px' }}>⌕</span>}
                />
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                    <Spinner size={32} />
                </div>
            ) : error ? (
                <div style={{ color: 'var(--neon-pink)', fontFamily: 'Share Tech Mono, monospace', padding: 40, textAlign: 'center' }}>
                    ⚠ {error}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 80 }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◈</div>
                    <p style={{ fontFamily: 'Share Tech Mono, monospace', color: 'var(--text-muted)' }}>
                        {search ? `No matches for "${search}"` : 'No alumni found'}
                    </p>
                </div>
            ) : view === 'grid' ? (
                <div
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}
                >
                    {filtered.map((a, i) => {
                        const [c1, c2] = avatarColor(a.id);
                        return (
                            <div
                                key={a.id}
                                className="cp-card"
                                style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', animation: `fadeIn 0.3s ease-out ${i * 0.03}s both`, gap: 12 }}
                            >
                                {a.profilePhotoUrl ? (
                                    <img src={a.profilePhotoUrl} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${c1}` }} />
                                ) : (
                                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg, ${c1}, ${c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, monospace', fontSize: '18px', fontWeight: 700, color: 'var(--bg-void)', boxShadow: `0 0 16px ${c1}40` }}>
                                        {initials(a)}
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>
                                        {a.firstName} {a.lastName}
                                    </div>
                                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                                        {a.email}
                                    </div>
                                </div>
                                <Link
                                    to={`/alumni/${a.id}`}
                                    className="cp-btn cp-btn-outline cp-btn-sm"
                                    style={{ marginTop: 4, width: '100%' }}
                                >
                                    VIEW PROFILE
                                </Link>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* List view */
                <div className="cp-panel" style={{ overflow: 'hidden' }}>
                    <table className="cp-table">
                        <thead>
                        <tr>
                            <th>Member</th>
                            <th>Email</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((a, i) => {
                            const [c1, c2] = avatarColor(a.id);
                            return (
                                <tr key={a.id} style={{ animation: `fadeIn 0.2s ease-out ${i * 0.02}s both` }}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            {a.profilePhotoUrl ? (
                                                <img src={a.profilePhotoUrl} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${c1}, ${c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, monospace', fontSize: '12px', fontWeight: 700, color: 'var(--bg-void)', flexShrink: 0 }}>
                                                    {initials(a)}
                                                </div>
                                            )}
                                            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                          {a.firstName} {a.lastName}
                        </span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{a.email}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link to={`/alumni/${a.id}`} className="cp-btn cp-btn-ghost cp-btn-sm">
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ── Public profile view ───────────────────────────────────────────────────────
import { profileApi } from '../../lib/api.ts';
import type { ProfileResponse } from '../../types';
import { useParams } from 'react-router-dom';
import { Badge, ProgressBar } from '../../components/ui';

export const AlumniProfileViewPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userId) return;
        profileApi.getProfileById(userId).then((res) => {
            if (res.data) setProfile(res.data);
            else setError(res.error?.message || 'Profile not found');
        }).finally(() => setLoading(false));
    }, [userId]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={32} /></div>;
    if (error || !profile) return <div style={{ color: 'var(--neon-pink)', fontFamily: 'Share Tech Mono, monospace', padding: 40, textAlign: 'center' }}>⚠ {error || 'Profile not found'}</div>;

    return (
        <div className="animate-fade-in" style={{ maxWidth: 800 }}>
            <div style={{ marginBottom: 24 }}>
                <Link to="/alumni" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--neon-cyan)', textDecoration: 'none' }}>← Back to Directory</Link>
            </div>

            <div className="cp-panel cp-corners" style={{ padding: '32px' }}>
                {/* Avatar & name */}
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 28 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, monospace', fontSize: '28px', fontWeight: 700, color: 'var(--bg-void)', flexShrink: 0, boxShadow: '0 0 20px rgba(0,245,255,0.3)' }}>
                        {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                            {profile.firstName} {profile.lastName}
                        </h1>
                        {profile.currentJobTitle && (
                            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '16px', color: 'var(--text-secondary)', marginBottom: 8 }}>
                                {profile.currentJobTitle}{profile.currentCompany && ` @ ${profile.currentCompany}`}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {profile.openToMentor && <Badge variant="cyan">Open to Mentor</Badge>}
                            {profile.openToHire && <Badge variant="green">Open to Hire</Badge>}
                            {profile.graduationYear && <Badge variant="purple">Class of {profile.graduationYear}</Badge>}
                        </div>
                    </div>
                    <div>
                        <ProgressBar value={profile.profileScore} />
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '9px', color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.1em', textAlign: 'center' }}>
                            SCORE
                        </div>
                    </div>
                </div>

                <hr className="cp-divider" style={{ marginBottom: 24 }} />

                {profile.bio && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 8 }}>BIO</div>
                        <p style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{profile.bio}</p>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                    {[
                        { label: 'Email', value: profile.email },
                        { label: 'Location', value: [profile.city, profile.country].filter(Boolean).join(', ') },
                        { label: 'Department', value: profile.department },
                        { label: 'Degree', value: profile.degree },
                        { label: 'Industry', value: profile.industry },
                        { label: 'Experience', value: profile.experienceYears != null ? `${profile.experienceYears} years` : null },
                    ].filter(f => f.value).map(({ label, value }) => (
                        <div key={label}>
                            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 4 }}>{label.toUpperCase()}</div>
                            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', color: 'var(--text-primary)' }}>{value}</div>
                        </div>
                    ))}
                </div>

                {profile.skills && profile.skills.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 10 }}>SKILLS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {profile.skills.map((s) => <span key={s} className="cp-skill-tag">{s}</span>)}
                        </div>
                    </div>
                )}

                {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) && (
                    <div>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 10 }}>LINKS</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="cp-btn cp-btn-outline cp-btn-sm">LinkedIn ↗</a>}
                            {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="cp-btn cp-btn-ghost cp-btn-sm">GitHub ↗</a>}
                            {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="cp-btn cp-btn-ghost cp-btn-sm">Portfolio ↗</a>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};