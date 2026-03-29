import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi, tokenStorage } from '../../lib/api';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    // @ts-ignore
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

    const NavItem = ({ path, icon, label }: { path: string; icon: string; label: string }) => {
        const active = location.pathname === path || location.pathname.startsWith(path + '/');
        return (
            <Link
                to={path}
                className={`cp-nav-item ${active ? 'active' : ''}`}
            >
                <span className="cp-nav-icon">{icon}</span>
                <span className="cp-nav-label">{label}</span>
                {active && <div className="cp-nav-indicator" />}
            </Link>
        );
    };

    return (
        /* FIXED: Set height to 100vh and hidden overflow to lock the screen */
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-main)' }}>

            {/* SIDEBAR - Independent Scroll */}
            <aside style={{
                width: 260,
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-panel)',
                flexShrink: 0,
                overflowY: 'auto' // Allows sidebar to scroll if many nav items exist
            }}>
                <div style={{ padding: '32px 24px' }}>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '18px', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))', borderRadius: '6px', display: 'grid', placeItems: 'center', color: '#000', fontSize: '18px' }}>
                            ◈
                        </div>
                        ALUMNI PORTAL
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '0 16px' }}>
                    <div style={{ padding: '0 12px 12px', fontSize: '10px', fontFamily: 'Orbitron, monospace', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
                        NAVIGATION
                    </div>
                    <NavItem path="/dashboard" icon="⬡" label="Dashboard" />
                    <NavItem path="/profile" icon="◉" label="Profile" />

                    {isAdmin && (
                        <>
                            <div style={{ padding: '32px 12px 12px', fontSize: '10px', fontFamily: 'Orbitron, monospace', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
                                ADMINISTRATION
                            </div>
                            <NavItem path="/alumni" icon="◈" label="Directory" />
                            <NavItem path="/admin" icon="◆" label="Admin Panel" />
                        </>
                    )}
                </nav>

                <div style={{ padding: 20, borderTop: '1px solid var(--border-subtle)' }}>
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

            {/* MAIN CONTENT AREA - Independent Scroll */}
            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                background: 'var(--bg-main)',
                position: 'relative'
            }}>
                {/* Fixed Top Header */}
                <header style={{
                    height: 64,
                    padding: '0 32px',
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'rgba(10, 11, 14, 0.8)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 10,
                    flexShrink: 0
                }}>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                        <span style={{ color: 'var(--neon-cyan)' }}>SYS</span>
                        {' › '}
                        {location.pathname.replace('/', '').toUpperCase() || 'DASHBOARD'}
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)', animation: 'pulse-glow 2s ease-in-out infinite' }} />
                        <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                            ONLINE
                        </span>
                    </div>
                </header>

                {/* SCROLLABLE BODY */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto', // This allows the dashboard content to scroll independently
                    padding: '28px 32px'
                }}>
                    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};