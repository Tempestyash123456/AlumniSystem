import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
            <header className="sticky top-0 z-50 cp-scanlines"
                style={{
                    background: 'rgba(5,5,8,0.92)',
                    borderBottom: '1px solid rgba(0,245,255,0.12)',
                    backdropFilter: 'blur(12px)',
                }}>
                {/* Top accent line */}
                <div className="h-[2px] w-full"
                    style={{ background: 'linear-gradient(90deg, transparent, var(--cyan), var(--pink), transparent)' }} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-14 items-center justify-between">
                        {/* Logo + nav */}
                        <div className="flex items-center gap-6">
                            <Link to="/" className="flex items-center gap-2 group">
                                <span className="font-display text-base font-bold tracking-widest glow-cyan transition-all"
                                    style={{ color: 'var(--cyan)' }}>
                                    ALUMNI
                                </span>
                                <span className="font-display text-base tracking-widest"
                                    style={{ color: 'rgba(0,245,255,0.35)' }}>
                                    PORTAL
                                </span>
                            </Link>

                            <nav className="hidden md:flex items-center gap-1">
                                {navLinks.map(({ to, label, icon }) => {
                                    const active = isActive(to);
                                    const adminLink = label === 'ADMIN_SYS';
                                    return (
                                        <Link key={to} to={to}
                                            className="flex items-center gap-1.5 px-3 py-1.5 font-display text-xs tracking-widest transition-all duration-200"
                                            style={{
                                                color: active
                                                    ? (adminLink ? 'var(--pink)' : 'var(--cyan)')
                                                    : (adminLink ? 'rgba(255,45,120,0.5)' : 'rgba(0,245,255,0.45)'),
                                                background: active
                                                    ? (adminLink ? 'rgba(255,45,120,0.08)' : 'rgba(0,245,255,0.08)')
                                                    : 'transparent',
                                                borderBottom: active
                                                    ? `1px solid ${adminLink ? 'var(--pink)' : 'var(--cyan)'}`
                                                    : '1px solid transparent',
                                                textShadow: active
                                                    ? (adminLink ? '0 0 8px rgba(255,45,120,0.6)' : '0 0 8px rgba(0,245,255,0.6)')
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
                                style={{ color: 'rgba(0,245,255,0.35)' }}>
                                <span className="cp-status-online" />
                                <span>ONLINE</span>
                            </div>

                            {/* Avatar */}
                            <Link to="/profile" className="flex items-center gap-2 group">
                                <div className="w-7 h-7 flex items-center justify-center text-xs font-display font-bold transition-all"
                                    style={{
                                        background: 'rgba(0,245,255,0.08)',
                                        border: '1px solid rgba(0,245,255,0.3)',
                                        color: 'var(--cyan)',
                                        boxShadow: '0 0 8px rgba(0,245,255,0.15)',
                                    }}>
                                    {user?.profilePhotoUrl
                                        ? <img src={user.profilePhotoUrl} className="w-full h-full object-cover" alt="" />
                                        : `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`
                                    }
                                </div>
                                <span className="hidden sm:block font-mono-cp text-xs transition-colors"
                                    style={{ color: 'rgba(0,245,255,0.5)' }}>
                                    {user?.firstName?.toUpperCase()}
                                </span>
                            </Link>

                            {/* Logout */}
                            <button onClick={logout}
                                className="font-display text-xs tracking-widest px-3 py-1.5 transition-all duration-200"
                                style={{
                                    border: '1px solid rgba(255,45,120,0.3)',
                                    color: 'rgba(255,45,120,0.6)',
                                    background: 'transparent',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.color = 'var(--pink)';
                                    e.currentTarget.style.borderColor = 'var(--pink)';
                                    e.currentTarget.style.boxShadow = '0 0 10px rgba(255,45,120,0.2)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.color = 'rgba(255,45,120,0.6)';
                                    e.currentTarget.style.borderColor = 'rgba(255,45,120,0.3)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}>
                                LOGOUT
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
                <Outlet />
            </main>

            {/* Footer line */}
            <div className="h-[1px]"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.1), transparent)' }} />
        </div>
    );
};

export default MainLayout;