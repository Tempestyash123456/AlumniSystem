import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { profileApi, adminApi, tokenStorage, postsApi, eventsApi } from '../../lib/api';
import { Spinner, Button } from '../../components/ui';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import type { ProfileResponse, AdminUserDto, PostDto, EventDto } from '../../types';

const BASE_URL = '';

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
    REGISTERED: { color: '#00f5ff', icon: '✦', label: 'New user registered' },
    LOGGED_IN: { color: '#39ff14', icon: '▶', label: 'Logged in' },
    UPDATED_PROFILE: { color: '#bf94ff', icon: '◎', label: 'Updated profile' },
    CREATED_POST: { color: '#00fa9a', icon: '+', label: 'Created post' },
    UPDATED_POST: { color: '#ffd700', icon: '✎', label: 'Updated post' },
    DELETED_POST: { color: '#ff4d6b', icon: '✕', label: 'Deleted post' },
    CREATED_EVENT: { color: '#00cfff', icon: '★', label: 'Created event' },
    UPDATED_EVENT: { color: '#ffaa33', icon: '✎', label: 'Updated event' },
    DELETED_EVENT: { color: '#ff4d6b', icon: '✕', label: 'Deleted event' },
};

const LiveLogEntry: React.FC<{ log: AuditEntry }> = ({ log }) => {
    const cfg = LOG_CONFIG[log.actionType] ?? { color: 'var(--text-muted)', icon: '·', label: log.actionType };
    const time = new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' });
    const resource = log.resourceName ? ` (${log.resourceName})` : '';
    return (
        <div style={{
            display: 'flex', alignItems: 'baseline', gap: 10,
            padding: '8px 12px', borderRadius: 6,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${cfg.color}22`,
            animation: 'fadeSlideIn 0.3s ease',
        }}>
            <span style={{ color: cfg.color, fontSize: 'var(--font-size-base)', flexShrink: 0 }}>{cfg.icon}</span>
            <span style={{ color: cfg.color, flex: 1 }}>
                {cfg.label}{resource} —{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {log.firstName} {log.lastName}
                </span>
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', flexShrink: 0 }}>{time}</span>
        </div>
    );
};

export const DashboardPage: React.FC = () => {
    const { user, hasPermission } = useAuthStore();
    const navigate = useNavigate();

    // Determine if the user should see the "Admin" version of the dashboard
    const hasAnyAdminPermission =
        hasPermission('VIEW_DIRECTORY') ||
        hasPermission('MANAGE_PERMISSION') ||
        hasPermission('SEND_EMAIL') ||
        hasPermission('CREATE_POST') ||
        hasPermission('CREATE_EVENT');

    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [users, setUsers] = useState<AdminUserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
    const [recentPost, setRecentPost] = useState<PostDto | null>(null);
    const [recentEvent, setRecentEvent] = useState<EventDto | null>(null);
    const sseRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const canViewStats = hasPermission('VIEW_DIRECTORY');
                if (canViewStats) {
                    const userRes = await adminApi.getAllUsers();
                    if (userRes.data) setUsers(userRes.data.users);
                }

                // Always load profile for the greeting/score if not strictly admin-only view
                const profileRes = await profileApi.getMyProfile();
                if (profileRes.data) setProfile(profileRes.data);

                // Fetch recent content for alumni/dashboard
                const [postsRes, eventsRes] = await Promise.all([
                    postsApi.getAll(),
                    eventsApi.getAll()
                ]);

                if (postsRes.data && postsRes.data.length > 0) {
                    setRecentPost(postsRes.data[0]);
                }
                if (eventsRes.data && eventsRes.data.length > 0) {
                    // Find most recent (upcoming) event or just the first
                    setRecentEvent(eventsRes.data[0]);
                }
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [hasAnyAdminPermission]);

    // ── SSE for live audit logs (admin only) ──────────────────────────────────
    useEffect(() => {
        if (!hasPermission('VIEW_DIRECTORY')) return;
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
    }, [hasAnyAdminPermission]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                <Spinner size={32} />
            </div>
        );
    }

    const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hour = istNow.getHours();
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
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--neon-cyan)', letterSpacing: '0.15em', marginBottom: 6, fontWeight: 700 }}>
                    {greeting}
                </div>
                <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                    {user?.firstName} {user?.lastName}
                </h1>

                <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                    {hasPermission('VIEW_DIRECTORY') ? (
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
                    ) : null}
                </div>
            </div>

            {/* SCROLLABLE GRID SECTION */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: hasAnyAdminPermission ? '400px 1fr' : '1fr 340px',
                gap: 24,
                flexGrow: 1,
                minHeight: 0 // Crucial for independent scrolling in flex containers
            }}>

                {/* LEFT COLUMN - Independent Scroll */}
                <div className="custom-scrollbar" style={{ overflowY: 'auto', paddingRight: 8 }}>
                    {!hasAnyAdminPermission ? (
                        /* Alumni Dashboard Header Component (Quick Actions + Highlights) */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Alumni Quick Actions */}
                            <div className="cp-panel" style={{ padding: '24px' }}>
                                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--neon-purple)', letterSpacing: '0.15em', marginBottom: 20 }}>
                                    ⬡ QUICK_ACTIONS
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <Button variant="outline" onClick={() => navigate('/profile')} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--font-size-sm)', justifyContent: 'flex-start' }}>
                                        <span style={{ fontSize: 20 }}>👤</span>
                                        <span>PROFILE</span>
                                    </Button>
                                    <Button variant="outline" onClick={() => navigate('/membership')} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--font-size-sm)', justifyContent: 'flex-start' }}>
                                        <span style={{ fontSize: 20 }}>💳</span>
                                        <span>MEMBERSHIP</span>
                                    </Button>
                                    <PermissionGuard permission="VIEW_DIRECTORY">
                                        <Button variant="outline" onClick={() => navigate('/alumni')} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--font-size-sm)', justifyContent: 'flex-start' }}>
                                            <span style={{ fontSize: 20 }}>🔍</span>
                                            <span>DIRECTORY</span>
                                        </Button>
                                    </PermissionGuard>
                                    <PermissionGuard permission="VIEW_POST">
                                        <Button variant="outline" onClick={() => navigate('/posts')} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--font-size-sm)', justifyContent: 'flex-start' }}>
                                            <span style={{ fontSize: 20 }}>📑</span>
                                            <span>POSTS</span>
                                        </Button>
                                    </PermissionGuard>
                                    <PermissionGuard permission="VIEW_EVENT">
                                        <Button variant="outline" onClick={() => navigate('/events')} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--font-size-sm)', justifyContent: 'flex-start' }}>
                                            <span style={{ fontSize: 20 }}>🗓</span>
                                            <span>EVENTS</span>
                                        </Button>
                                    </PermissionGuard>
                                </div>
                            </div>

                            {/* Latest Post */}
                            <div className="cp-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--neon-green)', letterSpacing: '0.15em', marginBottom: 20 }}>
                                    ✦ LATEST_POST
                                </div>
                                {recentPost ? (
                                    <div style={{ display: 'flex', gap: 20 }}>
                                        {recentPost.imageUrls && recentPost.imageUrls.length > 0 && (
                                            <div style={{ width: 120, height: 120, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                                                <img src={`${BASE_URL}${recentPost.imageUrls[0]}`} alt={recentPost.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{recentPost.title}</h3>
                                            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {recentPost.description.replace(/[#*`>\-[]()!]/g, '').trim()}
                                            </p>
                                            <Button variant="ghost" size="sm" onClick={() => navigate('/posts')} style={{ marginTop: 12, padding: 0 }}>READ MORE →</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)' }}>No recent stories found.</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="cp-panel" style={{ padding: '24px', height: 'fit-content' }}>
                            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--neon-green)', letterSpacing: '0.15em', marginBottom: 20 }}>
                                ◈ QUICK_ACTIONS
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <PermissionGuard permission="MANAGE_USER">
                                    <Button variant="primary" onClick={() => navigate('/admin/users/status')} style={{ minHeight: 48, justifyContent: 'flex-start', paddingLeft: 20 }}>👥 Manage Users</Button>
                                </PermissionGuard>
                                <PermissionGuard permission="SEND_EMAIL">
                                    <Button variant="primary" onClick={() => navigate('/admin/email')} style={{ minHeight: 48, justifyContent: 'flex-start', paddingLeft: 20 }}>✉ Send Broadcast</Button>
                                </PermissionGuard>
                                <PermissionGuard permission="CREATE_EVENT">
                                    <Button variant="outline" onClick={() => navigate('/admin/events')} style={{ minHeight: 48, justifyContent: 'flex-start', paddingLeft: 20 }}>📅 Manage Events</Button>
                                </PermissionGuard>
                                <PermissionGuard permission="CREATE_POST">
                                    <Button variant="outline" onClick={() => navigate('/admin/posts')} style={{ minHeight: 48, justifyContent: 'flex-start', paddingLeft: 20 }}>✦ Manage Posts</Button>
                                </PermissionGuard>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN - Independent Scroll (Live Logs for Admin, Stats for Alumni) */}
                <div className={hasAnyAdminPermission ? "custom-scrollbar" : "custom-scrollbar-purple"} style={{ overflowY: 'auto', paddingRight: 8 }}>
                    {hasAnyAdminPermission ? (
                        <div className="cp-panel" style={{ padding: '24px', minHeight: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--neon-cyan)', letterSpacing: '0.15em' }}>
                                    ◈ SYSTEM_ACTIVITY
                                </div>
                                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)', animation: 'pulse 2s infinite' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)' }}>
                                {auditLogs.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>Waiting for activity...</div>
                                ) : (
                                    auditLogs.map(log => <LiveLogEntry key={log.id} log={log} />)
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Latest Event */}
                            <div className="cp-panel" style={{ padding: '24px' }}>
                                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--neon-cyan)', letterSpacing: '0.15em', marginBottom: 20 }}>
                                    ★ LATEST_ADDED_EVENT
                                </div>
                                {recentEvent ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{recentEvent.name}</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif' }}>
                                                <span style={{ color: 'var(--neon-cyan)' }}>📅</span>
                                                {new Date(recentEvent.startTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif' }}>
                                                <span style={{ color: 'var(--neon-pink)' }}>📍</span>
                                                {recentEvent.place}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => navigate('/events')} style={{ alignSelf: 'flex-start' }}>VIEW EVENT</Button>
                                    </div>
                                ) : (
                                    <div style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)' }}>No upcoming events.</div>
                                )}
                            </div>

                            {/* Legacy Skills Stats (Condensed) */}
                            <div className="cp-panel" style={{ padding: '20px' }}>
                                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 12 }}>
                                    &lt; SKILLS_INVENTORY /&gt;
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {profile?.skills?.map(s => (
                                        <span key={s} style={{ fontSize: 'var(--font-size-xs)', padding: '2px 8px', borderRadius: 100, border: '1px solid var(--border-subtle)', color: 'var(--neon-cyan)', background: 'rgba(0,245,255,0.05)' }}>
                                            {s}
                                        </span>
                                    ))}
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