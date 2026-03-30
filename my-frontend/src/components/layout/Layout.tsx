import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi, tokenStorage } from '../../lib/api';

const BASE_URL = 'http://localhost:8080';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, isAdmin, clearAuth } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        const refreshToken = tokenStorage.getRefresh();
        if (refreshToken) {
            try { await authApi.logout(refreshToken); } catch {}
        }
        clearAuth();
        navigate('/login');
    };

    const NavItem = ({
                         path, icon, label, exact = false,
                     }: { path: string; icon: string; label: string; exact?: boolean }) => {
        const active = exact
            ? location.pathname === path
            : location.pathname === path || location.pathname.startsWith(path + '/');
        return (
            <Link to={path} className={`cp-nav-item ${active ? 'active' : ''}`}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
            </Link>
        );
    };

    const SectionLabel = ({ text }: { text: string }) => (
        <div style={{
            padding: '24px 12px 8px',
            fontSize: '9px',
            fontFamily: 'Orbitron, monospace',
            color: 'var(--text-disabled)',
            letterSpacing: '0.18em',
        }}>
            {text}
        </div>
    );

    // Avatar initials / photo
    const photoUrl = user?.profilePhotoUrl
        ? user.profilePhotoUrl.startsWith('http')
            ? user.profilePhotoUrl          // Google / absolute URL — use as-is
            : `${BASE_URL}${user.profilePhotoUrl}`  // local upload — prepend host
        : null;

    const avatarContent = photoUrl ? (
        <img
            src={photoUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
    ) : (
        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', fontWeight: 700, color: 'var(--bg-void)' }}>
        {`${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()}
    </span>
    );

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-main)' }}>

            {/* ── SIDEBAR ────────────────────────────────────────────────── */}
            <aside style={{
                width: 256,
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-panel)',
                flexShrink: 0,
                overflowY: 'auto',
            }}>
                {/* Logo */}
                <div style={{ padding: '28px 20px 20px' }}>
                    <div style={{
                        fontFamily: 'Orbitron, monospace', fontSize: '15px', fontWeight: 800,
                        letterSpacing: '0.12em', color: 'var(--text-primary)',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <div style={{
                            width: 34, height: 34, flexShrink: 0,
                            background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
                            borderRadius: '8px', display: 'grid', placeItems: 'center',
                            color: '#000', fontSize: '18px', boxShadow: '0 0 12px rgba(0,245,255,0.3)',
                        }}>
                            ◈
                        </div>
                        ALUMNI PORTAL
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '0 10px' }}>
                    <SectionLabel text="MAIN" />
                    <NavItem path="/dashboard" icon="⬡" label="Dashboard" exact />
                    <NavItem path="/profile"   icon="◉" label="My Profile" exact />
                    <NavItem path="/posts"     icon="◇" label="Posts" exact />
                    <NavItem path="/events"     icon="◇" label="Events" exact />

                    {isAdmin && (
                        <>
                            <SectionLabel text="ADMINISTRATION" />
                            <NavItem path="/alumni"      icon="◈" label="Directory" exact />
                            <NavItem path="/admin"       icon="◆" label="Users"     exact />
                            <NavItem path="/admin/posts" icon="✦" label="Manage Posts" exact />
                            <NavItem path="/admin/events" icon="◎" label="Manage Events" exact />
                        </>
                    )}
                </nav>

                {/* User pill + logout */}
                <div style={{ padding: '12px 12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                    {user && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 6, marginBottom: 10,
                            background: 'rgba(0,245,255,0.04)',
                            border: '1px solid var(--border-subtle)',
                        }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden',
                                border: '1.5px solid rgba(0,245,255,0.3)',
                            }}>
                                {avatarContent}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {user.firstName} {user.lastName}
                                </div>
                                <div style={{
                                    fontFamily: 'Share Tech Mono, monospace', fontSize: '9px',
                                    color: isAdmin ? 'var(--neon-pink)' : 'var(--neon-cyan)',
                                    letterSpacing: '0.08em',
                                }}>
                                    {isAdmin ? '◆ ADMIN' : '◉ ALUMNI'}
                                </div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="cp-btn cp-btn-ghost cp-btn-sm"
                        style={{ width: '100%', justifyContent: 'flex-start', gap: 10 }}
                    >
                        <span>⏻</span> {loggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                </div>
            </aside>

            {/* ── MAIN ───────────────────────────────────────────────────── */}
            <main style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                minWidth: 0, background: 'var(--bg-main)', position: 'relative',
            }}>
                {/* Top bar */}
                <header style={{
                    height: 60, padding: '0 28px',
                    display: 'flex', alignItems: 'center',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'rgba(10, 11, 14, 0.85)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 10, flexShrink: 0,
                }}>
                    <div style={{
                        fontFamily: 'Share Tech Mono, monospace', fontSize: '11px',
                        color: 'var(--text-muted)', letterSpacing: '0.05em',
                    }}>
                        <span style={{ color: 'var(--neon-cyan)' }}>SYS</span>
                        {' › '}
                        {location.pathname
                            .replace(/^\//, '')
                            .split('/')
                            .map(s => s.toUpperCase())
                            .join(' › ') || 'DASHBOARD'}
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: 'var(--neon-green)',
                            boxShadow: '0 0 6px var(--neon-green)',
                            animation: 'pulse-glow 2s ease-in-out infinite',
                        }} />
                        <span style={{
                            fontFamily: 'Share Tech Mono, monospace', fontSize: '10px',
                            color: 'var(--text-muted)', letterSpacing: '0.1em',
                        }}>
                            ONLINE
                        </span>
                    </div>
                </header>

                {/* Scrollable content */}
                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '28px 32px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ maxWidth: 1400, margin: '0 auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%' }}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};