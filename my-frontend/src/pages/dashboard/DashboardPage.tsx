import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { profileApi, adminApi } from '../../lib/api';
import { ProgressBar, Spinner, Badge } from '../../components/ui';
import type { ProfileResponse, AdminUserDto } from '../../types';

export const DashboardPage: React.FC = () => {
    const { user, isAdmin } = useAuthStore();
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [users, setUsers] = useState<AdminUserDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                if (isAdmin) {
                    const userRes = await adminApi.getAllUsers();
                    if (userRes.data) setUsers(userRes.data.users);
                } else {
                    const profileRes = await profileApi.getMyProfile();
                    if (profileRes.data) setProfile(profileRes.data);
                }
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [isAdmin]);

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
        /* The main container is now fixed to the remaining viewport height */
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 120px)', // Adjust 120px based on your navbar height
            overflow: 'hidden',
            gap: 24
        }}>

            {/* STATIC TOP SECTION (Doesn't scroll) */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '0.15em', marginBottom: 6 }}>
                    {greeting}
                </div>
                <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                    {user?.firstName} {user?.lastName}
                </h1>

                <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                    {isAdmin ? (
                        <>
                            <div className="cp-stat-card pink" style={{ flex: 1 }}>
                                <div className="cp-stat-value text-neon-pink">{users.length}</div>
                                <div className="cp-stat-label">Total Users</div>
                            </div>
                            <div className="cp-stat-card cyan" style={{ flex: 1 }}>
                                <div className="cp-stat-value text-neon-cyan">
                                    {users.filter(u => u.enabled && !u.accountLocked).length}
                                </div>
                                <div className="cp-stat-label">Active Users</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="cp-stat-card cyan" style={{ flex: 1 }}>
                                <div className="cp-stat-value text-neon-cyan">{profile?.profileScore ?? 0}%</div>
                                <div className="cp-stat-label">Profile Score</div>
                            </div>
                            <div className="cp-stat-card purple" style={{ flex: 1 }}>
                                <div className="cp-stat-value text-neon-purple">{profile?.skills?.length ?? 0}</div>
                                <div className="cp-stat-label">Skills</div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* SCROLLABLE GRID SECTION */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isAdmin ? '1fr' : '1fr 340px',
                gap: 24,
                flexGrow: 1,
                minHeight: 0 // Crucial for independent scrolling in flex containers
            }}>

                {/* LEFT COLUMN - Independent Scroll */}
                <div className="custom-scrollbar" style={{ overflowY: 'auto', paddingRight: 8 }}>
                    {!isAdmin ? (
                        <div className="cp-panel" style={{ padding: '24px' }}>
                            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 20 }}>
                                ◈ PROFILE_DATA
                            </div>
                            <ProgressBar label="COMPLETENESS" value={profile?.profileScore ?? 0} />

                            {/* Dummy content to ensure it scrolls */}
                            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {[
                                    { label: 'Current Role', value: profile?.currentJobTitle },
                                    { label: 'Company', value: profile?.currentCompany },
                                    { label: 'Degree', value: profile?.degree },
                                    { label: 'Industry', value: profile?.industry },
                                    { label: 'Bio', value: profile?.bio },
                                    { label: 'Graduation Year', value: profile?.graduationYear },
                                ].map(item => (
                                    <div key={item.label}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label?.toUpperCase()}</div>
                                        <div style={{ color: 'var(--text-primary)' }}>{item.value || 'N/A'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="cp-panel" style={{ padding: '24px' }}>
                            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 20 }}>
                                ◈ SYSTEM_DIAGNOSTICS
                            </div>
                            <div style={{ display: 'grid', gap: 16 }}>
                                <div style={{ padding: 16, border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                                    <span style={{ color: 'var(--neon-pink)', fontSize: '12px' }}>DATABASE: </span>
                                    <span style={{ color: 'var(--neon-green)' }}>STABLE</span>
                                </div>
                                <div style={{ padding: 16, border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                                    <span style={{ color: 'var(--neon-pink)', fontSize: '12px' }}>API_GATEWAY: </span>
                                    <span style={{ color: 'var(--neon-green)' }}>ACTIVE</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN - Independent Scroll (Alumni Only) */}
                {!isAdmin && (
                    <div className="custom-scrollbar-purple" style={{ overflowY: 'auto', paddingRight: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="cp-panel" style={{ padding: '20px' }}>
                                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 16 }}>
                                    ◆ SETTINGS
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <span style={{ fontSize: '12px' }}>Public Profile</span>
                                    <span style={{ color: 'var(--neon-green)' }}>ON</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                                    <span style={{ fontSize: '12px' }}>Open to Hire</span>
                                    <span style={{ color: 'var(--neon-purple)' }}>YES</span>
                                </div>
                            </div>

                            <div className="cp-panel" style={{ padding: '20px' }}>
                                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 12 }}>
                                    ⬡ SKILLS_LOG
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {profile?.skills?.map(s => <Badge key={s} variant="cyan">{s}</Badge>)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Scoped CSS for the neon scrollbars */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar, 
                .custom-scrollbar-purple::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--neon-cyan);
                    border-radius: 4px;
                }
                .custom-scrollbar-purple::-webkit-scrollbar-thumb {
                    background: var(--neon-purple);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track,
                .custom-scrollbar-purple::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </div>
    );
};