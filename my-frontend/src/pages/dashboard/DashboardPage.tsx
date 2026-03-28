import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.ts';
import { profileApi, alumniApi } from '../../lib/api.ts';
import { ProgressBar, Spinner, Badge } from '../../components/ui';
import type { ProfileResponse } from '../../types';

export const DashboardPage: React.FC = () => {
    const { user, isAdmin } = useAuthStore();
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [alumniCount, setAlumniCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            profileApi.getMyProfile(),
            alumniApi.getAll(),
        ]).then(([profileRes, alumniRes]) => {
            if (profileRes.data) setProfile(profileRes.data);
            if (alumniRes.data) setAlumniCount(alumniRes.data.length);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                <Spinner size={32} />
            </div>
        );
    }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'GOOD_MORNING' : hour < 17 ? 'GOOD_AFTERNOON' : 'GOOD_EVENING';

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Header */}
            <div>
                <div
                    style={{
                        fontFamily: 'Share Tech Mono, monospace',
                        fontSize: '11px',
                        color: 'var(--neon-cyan)',
                        letterSpacing: '0.15em',
                        marginBottom: 6,
                    }}
                >
                    {greeting}
                </div>
                <h1
                    style={{
                        fontFamily: 'Orbitron, monospace',
                        fontSize: '24px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        letterSpacing: '0.05em',
                    }}
                >
                    {user?.firstName} {user?.lastName}
                </h1>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {user?.roles.map((r) => (
                        <Badge key={r} variant={r.includes('ADMIN') ? 'pink' : 'cyan'}>
                            {r.replace('ROLE_', '')}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <div className="cp-stat-card cyan">
                    <div className="cp-stat-value text-neon-cyan">{profile?.profileScore ?? 0}%</div>
                    <div className="cp-stat-label">Profile Score</div>
                </div>
                <div className="cp-stat-card pink">
                    <div className="cp-stat-value text-neon-pink">{alumniCount ?? '—'}</div>
                    <div className="cp-stat-label">Total Alumni</div>
                </div>
                <div className="cp-stat-card purple">
                    <div className="cp-stat-value text-neon-purple">{profile?.skills?.length ?? 0}</div>
                    <div className="cp-stat-label">Skills Listed</div>
                </div>
                <div className="cp-stat-card green">
                    <div className="cp-stat-value text-neon-green">
                        {profile?.graduationYear ?? '—'}
                    </div>
                    <div className="cp-stat-label">Grad Year</div>
                </div>
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                {/* Profile snapshot */}
                <div className="cp-panel" style={{ padding: '24px' }}>
                    <div
                        style={{
                            fontFamily: 'Orbitron, monospace',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            letterSpacing: '0.15em',
                            marginBottom: 20,
                        }}
                    >
                        ◈ PROFILE_OVERVIEW
                    </div>

                    <ProgressBar label="PROFILE COMPLETENESS" value={profile?.profileScore ?? 0} />

                    <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {[
                            { label: 'Current Role', value: profile?.currentJobTitle || '—' },
                            { label: 'Company', value: profile?.currentCompany || '—' },
                            { label: 'Department', value: profile?.department || '—' },
                            { label: 'Degree', value: profile?.degree || '—' },
                            { label: 'Location', value: [profile?.city, profile?.country].filter(Boolean).join(', ') || '—' },
                            { label: 'Industry', value: profile?.industry || '—' },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>
                                    {label.toUpperCase()}
                                </div>
                                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {profile?.skills && profile.skills.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10 }}>
                                SKILLS
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {profile.skills.slice(0, 8).map((s) => (
                                    <span key={s} className="cp-skill-tag">{s}</span>
                                ))}
                                {profile.skills.length > 8 && (
                                    <span className="cp-skill-tag" style={{ color: 'var(--text-muted)' }}>+{profile.skills.length - 8}</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 12 }}>
                        <Link to="/profile" className="cp-btn cp-btn-outline cp-btn-sm">Edit Profile</Link>
                        {profile?.linkedinUrl && (
                            <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="cp-btn cp-btn-ghost cp-btn-sm">LinkedIn ↗</a>
                        )}
                    </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Status panel */}
                    <div className="cp-panel" style={{ padding: '20px' }}>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 16 }}>
                            ◆ ACCOUNT_STATUS
                        </div>
                        {[
                            { label: 'Profile Public', value: profile?.profilePublic ?? true, color: 'var(--neon-green)' },
                            { label: 'Open to Mentor', value: profile?.openToMentor ?? false, color: 'var(--neon-cyan)' },
                            { label: 'Open to Hire', value: profile?.openToHire ?? false, color: 'var(--neon-purple)' },
                        ].map(({ label, value, color }) => (
                            <div
                                key={label}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}
                            >
                                <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
                                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: value ? color : 'var(--text-disabled)' }}>
                  {value ? 'YES' : 'NO'}
                </span>
                            </div>
                        ))}
                        <Link to="/profile" className="cp-btn cp-btn-ghost cp-btn-sm" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
                            Update Preferences
                        </Link>
                    </div>

                    {/* Quick links */}
                    <div className="cp-panel" style={{ padding: '20px' }}>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 16 }}>
                            ⬡ QUICK_ACCESS
                        </div>
                        {[
                            { to: '/alumni', icon: '◈', label: 'Browse Directory' },
                            { to: '/profile', icon: '◉', label: 'Edit Profile' },
                            ...(isAdmin ? [{ to: '/admin', icon: '◆', label: 'Admin Panel' }] : []),
                        ].map(({ to, icon, label }) => (
                            <Link key={to} to={to} className="cp-nav-item" style={{ marginBottom: 4 }}>
                                <span style={{ fontSize: '16px', opacity: 0.7 }}>{icon}</span>
                                <span>{label}</span>
                                <span style={{ marginLeft: 'auto', color: 'var(--text-disabled)', fontSize: 14 }}>→</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};