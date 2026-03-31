import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { profileApi, adminApi, tokenStorage } from '../../lib/api';
import { ProgressBar, Spinner, Badge, Button } from '../../components/ui';
import type { ProfileResponse, AdminUserDto } from '../../types';

// ── Audit log type ────────────────────────────────────────────────────────────
interface AuditEntry {
    id: string;
    actionType: string;
    firstName: string;
    lastName: string;
    resourceName: string;
    createdAt: string;
}

// ── Log color + label map ─────────────────────────────────────────────────────
const LOG_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
    REGISTERED:     { color: '#00f5ff', icon: '✦', label: 'New user registered'   },
    LOGGED_IN:      { color: '#39ff14', icon: '▶', label: 'Logged in'              },
    UPDATED_PROFILE:{ color: '#bf94ff', icon: '◎', label: 'Updated profile'        },
    CREATED_POST:   { color: '#00fa9a', icon: '+', label: 'Created post'           },
    UPDATED_POST:   { color: '#ffd700', icon: '✎', label: 'Updated post'           },
    DELETED_POST:   { color: '#ff4d6b', icon: '✕', label: 'Deleted post'           },
    CREATED_EVENT:  { color: '#00cfff', icon: '★', label: 'Created event'          },
    UPDATED_EVENT:  { color: '#ffaa33', icon: '✎', label: 'Updated event'          },
    DELETED_EVENT:  { color: '#ff4d6b', icon: '✕', label: 'Deleted event'          },
};

const LiveLogEntry: React.FC<{ log: AuditEntry }> = ({ log }) => {
    const cfg = LOG_CONFIG[log.actionType] ?? { color: 'var(--text-muted)', icon: '·', label: log.actionType };
    const time = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const resource = log.resourceName ? ` (${log.resourceName})` : '';
    return (
        <div style={{
            display: 'flex', alignItems: 'baseline', gap: 10,
            padding: '8px 12px', borderRadius: 6,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${cfg.color}22`,
            animation: 'fadeSlideIn 0.3s ease',
        }}>
            <span style={{ color: cfg.color, fontSize: 13, flexShrink: 0 }}>{cfg.icon}</span>
            <span style={{ color: cfg.color, flex: 1 }}>
                {cfg.label}{resource} —{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {log.firstName} {log.lastName}
                </span>
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>{time}</span>
        </div>
    );
};

export const DashboardPage: React.FC = () => {
    const { user, isAdmin } = useAuthStore();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [users, setUsers] = useState<AdminUserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
    const sseRef = useRef<EventSource | null>(null);

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

    // ── SSE for live audit logs (admin only) ──────────────────────────────────
    useEffect(() => {
        if (!isAdmin) return;
        const token = tokenStorage.getAccess();
        if (!token) return;

        const es = new EventSource(`/api/v1/admin/logs/stream?token=${token}`);
        sseRef.current = es;

        es.addEventListener('log', (e) => {
            try {
                const entry: AuditEntry = JSON.parse(e.data);
                // Reverse manner: keep最新的 at the end
                setAuditLogs(prev => [...prev, entry].slice(-10));
            } catch { /* ignore parse errors */ }
        });
        es.onerror = () => es.close();

        return () => {
            es.close();
            sseRef.current = null;
        };
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
                gridTemplateColumns: isAdmin ? '400px 1fr' : '1fr 340px',
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
                        <div className="cp-panel" style={{ padding: '24px', height: 'fit-content' }}>
                            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--neon-green)', letterSpacing: '0.15em', marginBottom: 20 }}>
                                ◈ QUICK_ACTIONS
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <Button variant="primary" onClick={() => navigate('/admin/email')}>✉ Send Email</Button>
                                <Button variant="outline" onClick={() => navigate('/admin/events')}>+ Manage Events</Button>
                                <Button variant="outline" onClick={() => navigate('/admin/posts')}>✦ Manage Posts</Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN - Independent Scroll (Live Logs for Admin, Stats for Alumni) */}
                <div className={isAdmin ? "custom-scrollbar" : "custom-scrollbar-purple"} style={{ overflowY: 'auto', paddingRight: 8 }}>
                    {isAdmin ? (
                        <div className="cp-panel" style={{ padding: '24px', minHeight: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '0.15em' }}>
                                    ◈ LIVE_LOGS
                                </div>
                                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)', animation: 'pulse 2s infinite' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'Share Tech Mono, monospace', fontSize: '12px' }}>
                                {auditLogs.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Waiting for activity...</div>
                                ) : (
                                    auditLogs.map(log => <LiveLogEntry key={log.id} log={log} />)
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="cp-panel" style={{ padding: '20px' }}>
                                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 12 }}>
                                    ⬡ SKILLS_LOG
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {profile?.skills?.map(s => <Badge key={s} variant="cyan">{s}</Badge>)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
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