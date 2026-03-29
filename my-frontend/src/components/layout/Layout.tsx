import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi, tokenStorage } from '../../lib/api';

const NAV_ITEMS = [
    { path: '/dashboard', icon: '⬡', label: 'Dashboard' },
    { path: '/profile',   icon: '◉', label: 'Profile' },
];

const ADMIN_NAV = [
    { path: '/alumni', icon: '◈', label: 'Directory' },
    { path: '/admin',  icon: '◆', label: 'Admin Panel' },
];

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, isAdmin, clearAuth } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

    const NavItem = ({ path, icon, label }: { path: string; icon: string; label: string }) => {
        const active = location.pathname === path || location.pathname.startsWith(path + '/');
        return (
            <Link
                to={path}
                className={`cp-nav-item ${active ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
            >
                <span style={{ fontSize: '18px', opacity: active ? 1 : 0.6 }}>{icon}</span>
                <span>{label}</span>
                {active && (
                    <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-cyan)', boxShadow: '0 0 6px var(--neon-cyan)' }} />
                )}
            </Link>
        );
    };

    const Sidebar = () => (
        <aside
            style={{
                width: 240,
                minHeight: '100vh',
                background: 'var(--bg-panel)',
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: 0,
                flexShrink: 0,
            }}
        >
            {/* Logo */}
            <div
                style={{
                    padding: '24px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                }}
            >
                <div
                    style={{
                        fontFamily: 'Orbitron, monospace',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: 'var(--neon-cyan)',
                        letterSpacing: '0.2em',
                        textShadow: '0 0 10px var(--neon-cyan)',
                    }}
                >
                    ALUMNI
                </div>
                <div
                    style={{
                        fontFamily: 'Share Tech Mono, monospace',
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.15em',
                        marginTop: 2,
                    }}
                >
                    PORTAL_v2.0
                </div>
            </div>

            {/* User info */}
            <div
                style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'Orbitron, monospace',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--bg-void)',
                            flexShrink: 0,
                            boxShadow: '0 0 12px rgba(0,245,255,0.3)',
                        }}
                    >
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div
                            style={{
                                fontFamily: 'Rajdhani, sans-serif',
                                fontWeight: 600,
                                fontSize: '14px',
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {user?.firstName} {user?.lastName}
                        </div>
                        <div
                            style={{
                                fontFamily: 'Share Tech Mono, monospace',
                                fontSize: '10px',
                                color: isAdmin ? 'var(--neon-pink)' : 'var(--text-muted)',
                                letterSpacing: '0.05em',
                            }}
                        >
                            {isAdmin ? '◆ ADMIN' : '◈ ALUMNI'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ padding: '12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                    style={{
                        fontFamily: 'Orbitron, monospace',
                        fontSize: '9px',
                        letterSpacing: '0.15em',
                        color: 'var(--text-disabled)',
                        padding: '8px 4px 4px',
                    }}
                >
                    NAVIGATION
                </div>
                {NAV_ITEMS.map((item) => <NavItem key={item.path} {...item} />)}

                {isAdmin && (
                    <>
                        <div
                            style={{
                                fontFamily: 'Orbitron, monospace',
                                fontSize: '9px',
                                letterSpacing: '0.15em',
                                color: 'var(--text-disabled)',
                                padding: '16px 4px 4px',
                            }}
                        >
                            ADMIN
                        </div>
                        {ADMIN_NAV.map((item) => <NavItem key={item.path} {...item} />)}
                    </>
                )}
            </nav>

            {/* Logout */}
            <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="cp-nav-item"
                    style={{
                        width: '100%',
                        background: 'none',
                        border: '1px solid transparent',
                        cursor: 'pointer',
                        color: loggingOut ? 'var(--text-disabled)' : 'var(--neon-pink)',
                    }}
                >
                    <span style={{ fontSize: '16px' }}>⏻</span>
                    <span>{loggingOut ? 'LOGGING OUT...' : 'Logout'}</span>
                </button>
            </div>
        </aside>
    );

    return (
        <div className="bg-grid" style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar — desktop */}
            <div style={{ display: 'flex' }}>
                <Sidebar />
            </div>

            {/* Main content */}
            <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {/* Top bar */}
                <header
                    style={{
                        height: 60,
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 24px',
                        background: 'rgba(7, 11, 20, 0.8)',
                        backdropFilter: 'blur(8px)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                    }}
                >
                    <div
                        style={{
                            fontFamily: 'Share Tech Mono, monospace',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            letterSpacing: '0.05em',
                        }}
                    >
                        <span style={{ color: 'var(--neon-cyan)' }}>SYS</span>
                        {' › '}
                        {location.pathname.replace('/', '').toUpperCase() || 'DASHBOARD'}
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
                style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--neon-green)',
                    boxShadow: '0 0 6px var(--neon-green)',
                    animation: 'pulse-glow 2s ease-in-out infinite',
                }}
            />
                        <span
                            style={{
                                fontFamily: 'Share Tech Mono, monospace',
                                fontSize: '10px',
                                color: 'var(--text-muted)',
                                letterSpacing: '0.1em',
                            }}
                        >
              ONLINE
            </span>
                    </div>
                </header>

                <div style={{ flex: 1, padding: '28px 32px', maxWidth: 1400 }}>
                    {children}
                </div>
            </main>
        </div>
    );
};