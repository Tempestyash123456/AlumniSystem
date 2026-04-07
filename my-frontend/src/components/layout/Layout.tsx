import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { authApi, tokenStorage } from '../../lib/api';
import { ToastContainer, GlobalConfirmContainer } from '../ui';

const BASE_URL = '';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, isAdmin, hasPermission, clearAuth } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        const refreshToken = tokenStorage.getRefresh();
        if (refreshToken) {
            try { await authApi.logout(refreshToken); } catch { }
        }
        clearAuth();
        navigate('/');
    };

    const NavItem = ({
        path, icon, label, exact = false,
    }: { path: string; icon: string; label: string; exact?: boolean }) => {
        const active = exact
            ? location.pathname === path
            : location.pathname === path || location.pathname.startsWith(path + '/');
        return (
            <Link to={path} className={`cp-nav-item ${active ? 'active' : ''}`}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
            </Link>
        );
    };

    const SectionLabel = ({ text }: { text: string }) => (
        <div style={{
            padding: '24px 16px 8px',
            fontSize: '12px',
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
            ? user.profilePhotoUrl
            : `${BASE_URL}${user.profilePhotoUrl}`
        : null;

    const avatarContent = photoUrl ? (
        <img
            src={photoUrl}
            alt=""
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
    ) : (
        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '14px', fontWeight: 700, color: 'var(--bg-void)' }}>
            {`${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()}
        </span>
    );

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-main)' }}>

            {/* ── SIDEBAR ────────────────────────────────────────────────── */}
            <aside style={{
                width: 280,
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-panel)',
                flexShrink: 0,
                overflow: 'hidden',
            }}>
                {/* Static Logo Area */}
                <div style={{ padding: '24px', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                    <Link to="/" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img
                            src="/cu-logo.png"
                            alt="University Logo"
                            style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }}
                        />
                    </Link>
                </div>

                {/* Scrollable Nav Area */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <nav style={{ flex: 1, padding: '0 12px', paddingBottom: '24px' }}>
                        <SectionLabel text="MAIN" />
                        <NavItem path="/dashboard" icon="⬡" label="Dashboard" exact />
                        <NavItem path="/profile" icon="◉" label="My Profile" exact />
                        {user?.enabled && (!user?.accountLocked || isAdmin) && (
                            <>
                                <NavItem path="/posts" icon="◇" label="Posts" exact />
                                <NavItem path="/events" icon="◎" label="Events" exact />
                                <NavItem path="/membership" icon="🪪" label="Membership" exact />
                                <NavItem path="/connect-with-peers" icon="👥" label="Connect with peers" exact />
                                <NavItem path="/bug-report" icon="🐞" label="Bug Report" exact />
                            </>
                        )}

                        {/* Administration Section */}
                        {(hasPermission('VIEW_DIRECTORY') || hasPermission('MANAGE_PERMISSION') || hasPermission('SEND_EMAIL') || hasPermission('CREATE_POST') || hasPermission('CREATE_EVENT')) && (
                            <>
                                <SectionLabel text="ADMINISTRATION" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {hasPermission('VIEW_DIRECTORY') && (
                                        <NavItem path="/alumni" icon="👥" label="Users directory" exact />
                                    )}
                                    {hasPermission('MANAGE_PERMISSION') && (
                                        <NavItem path="/admin/users/status" icon="🛡️" label="Manage Permissions" exact />
                                    )}
                                    {hasPermission('SEND_EMAIL') && (
                                        <NavItem path="/admin/email" icon="✉" label="Broadcast Email" exact />
                                    )}
                                    {hasPermission('CREATE_POST') && (
                                        <NavItem path="/admin/posts" icon="✦" label="Manage Posts" exact />
                                    )}
                                    {hasPermission('CREATE_EVENT') && (
                                        <NavItem path="/admin/events" icon="◎" label="Manage Events" exact />
                                    )}
                                </div>
                            </>
                        )}
                    </nav>
                </div>
            </aside>

            {/* ── MAIN ───────────────────────────────────────────────────── */}
            <main style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                minWidth: 0, background: 'var(--bg-main)', position: 'relative',
            }}>
                {/* Top bar */}
                <header style={{
                    height: 68, padding: '0 32px',
                    display: 'flex', alignItems: 'center',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--header-bg)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 10, flexShrink: 0,
                }}>

                    {/* ALUMNI PORTAL */}
                    <Link to="/" style={{
                        fontFamily: 'Orbitron, monospace', fontSize: '20px', fontWeight: 800,
                        letterSpacing: '0.12em', color: 'var(--text-primary)',
                        textDecoration: 'none',
                    }}>
                        ALUMNI PORTAL
                    </Link>

                    {/* Header Actions */}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>

                        {/* User Pill moved to Header */}
                        {user && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '6px 16px 6px 6px', borderRadius: '30px',
                                background: 'rgba(0,245,255,0.04)',
                                border: '1px solid var(--border-subtle)',
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                    background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden',
                                    border: '1.5px solid rgba(0,245,255,0.3)',
                                }}>
                                    {avatarContent}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{
                                        fontFamily: 'Rajdhani, sans-serif', fontSize: '15px', fontWeight: 600,
                                        color: 'var(--text-primary)', lineHeight: '1.2',
                                        maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                    }}>
                                        {user.firstName} {user.lastName}
                                    </div>
                                    <div style={{
                                        fontFamily: 'Share Tech Mono, monospace', fontSize: '10px',
                                        color: isAdmin ? 'var(--neon-pink)' : 'var(--neon-cyan)',
                                        letterSpacing: '0.08em', marginTop: '2px'
                                    }}>
                                        {isAdmin ? '◆ ADMIN' : '◉ MEMBER'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Controls Container */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', borderLeft: '1px solid var(--border-subtle)' }}>
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: 'transparent',
                                    border: '1px solid var(--border-subtle)',
                                    padding: '8px 14px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <span style={{ fontSize: '16px', color: theme === 'dark' ? 'var(--neon-amber)' : 'var(--neon-cyan)' }}>
                                    {theme === 'dark' ? '☀' : '☾'}
                                </span>
                                <span style={{
                                    fontFamily: 'Share Tech Mono, monospace',
                                    fontSize: '12px',
                                    color: 'var(--text-muted)',
                                    letterSpacing: '0.1em'
                                }}>
                                    {theme === 'dark' ? 'DARK' : 'LIGHT'}
                                </span>
                            </button>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                disabled={loggingOut}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: 'transparent',
                                    border: '1px solid var(--border-subtle)',
                                    padding: '8px 14px',
                                    borderRadius: '4px',
                                    cursor: loggingOut ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: loggingOut ? 0.5 : 1,
                                }}
                                onMouseEnter={e => {
                                    if (!loggingOut) {
                                        e.currentTarget.style.borderColor = 'var(--neon-pink)';
                                        e.currentTarget.style.background = 'rgba(255, 45, 120, 0.05)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!loggingOut) {
                                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <span style={{ fontSize: '16px', color: 'var(--neon-pink)' }}>⏻</span>
                                <span style={{
                                    fontFamily: 'Share Tech Mono, monospace',
                                    fontSize: '12px',
                                    color: 'var(--text-muted)',
                                    letterSpacing: '0.1em'
                                }}>
                                    {loggingOut ? 'LOGGING OUT...' : 'LOGOUT'}
                                </span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Scrollable content */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '32px 36px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ maxWidth: 1400, margin: '0 auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%' }}>
                        {children}
                    </div>
                </div>
            </main>
            <ToastContainer />
            <GlobalConfirmContainer />
        </div>
    );
};