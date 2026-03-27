import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UiAvatar, UiButton } from './ui/ModernUI';

const MainLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    const navLinks = [
        { to: '/',          label: 'DASHBOARD',  icon: '⬡' },
        { to: '/directory', label: 'DIRECTORY',  icon: '◈' },
        { to: '/profile',   label: 'MY_PROFILE', icon: '◉' },
        ...(isAdmin ? [{ to: '/admin', label: 'ADMIN_SYS', icon: '⬟' }] : []),
    ];

    const isActive = (path: string) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
            {/* Navbar */}
            <header className="sticky top-0 z-50 cp-scanlines cp-fade-in"
                style={{
                    background: 'rgba(10,14,34,0.7)',
                    borderBottom: '1px solid rgba(148,163,184,0.24)',
                    backdropFilter: 'blur(14px)',
                }}>
                {/* Top accent line */}
                <div className="h-[2px] w-full"
                    style={{ background: 'linear-gradient(90deg, transparent, var(--cyan), var(--pink), transparent)' }} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-14 items-center justify-between">
                        {/* Logo + nav */}
                        <div className="flex items-center gap-6">
                            <Link to="/" className="flex items-center gap-2 group cp-hover-lift">
                                <span className="font-display text-base font-bold tracking-widest glow-cyan transition-all"
                                    style={{ color: 'var(--cyan)' }}>
                                    ALUMNI
                                </span>
                                <span className="font-display text-base tracking-widest"
                                    style={{ color: 'rgba(191,219,254,0.5)' }}>
                                    PORTAL
                                </span>
                            </Link>

                            <nav className="hidden md:flex items-center gap-1">
                                {navLinks.map(({ to, label, icon }) => {
                                    const active = isActive(to);
                                    const adminLink = label === 'ADMIN_SYS';
                                    return (
                                        <Link key={to} to={to}
                                            className={`cp-nav-item ${active ? 'active' : ''}`}
                                            style={{
                                                color: active
                                                    ? (adminLink ? 'var(--pink)' : 'var(--cyan)')
                                                    : (adminLink ? 'rgba(244,114,182,0.72)' : 'rgba(191,219,254,0.84)'),
                                                background: active
                                                    ? (adminLink ? 'rgba(244,114,182,0.2)' : 'rgba(96,165,250,0.2)')
                                                    : 'transparent',
                                                textShadow: active
                                                    ? (adminLink ? '0 2px 14px rgba(244,114,182,0.45)' : '0 2px 14px rgba(96,165,250,0.45)')
                                                    : 'none',
                                            }}>
                                            <span style={{ fontSize: '10px' }}>{icon}</span>
                                            {label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-3">
                            {/* Status */}
                            <div className="hidden sm:flex items-center gap-2 font-mono-cp text-xs"
                                style={{ color: 'rgba(191,219,254,0.65)' }}>
                                <span className="cp-status-online" />
                                <span>ONLINE</span>
                            </div>

                            {/* Avatar */}
                            <Link to="/profile" className="flex items-center gap-2 group cp-hover-lift">
                                <UiAvatar
                                    size="sm"
                                    src={user?.profilePhotoUrl}
                                    initials={`${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`}
                                />
                                <span className="hidden sm:block font-mono-cp text-xs cp-link"
                                    style={{ color: 'rgba(226,232,240,0.9)' }}>
                                    {user?.firstName?.toUpperCase()}
                                </span>
                            </Link>

                            {/* Logout */}
                            <UiButton onClick={logout}
                                variant="danger"
                                className="text-xs px-3 py-1.5"
                                style={{
                                    letterSpacing: '0.12em',
                                }}>
                                LOGOUT
                            </UiButton>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
                <Outlet />
            </main>

            {/* Footer line */}
            <div className="h-[1px]"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.32), transparent)' }} />
        </div>
    );
};

export default MainLayout;