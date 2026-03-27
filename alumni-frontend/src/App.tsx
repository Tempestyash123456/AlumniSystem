import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import MainLayout from './components/MainLayout';
import Directory from './pages/Directory';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import { GlassCard, PageContainer, UiStatCard } from './components/ui/ModernUI';
import { type JSX } from 'react';

const DashboardHome = () => {
    const { user } = useAuth();
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

    return (
        <PageContainer>
            {/* Hero banner */}
            <GlassCard className="cp-scanlines cp-grid-bg p-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(96,165,250,0.24) 0%, transparent 60%)' }} />
                <div className="relative z-10">
                    <p className="font-mono-cp text-xs tracking-[0.2em] mb-2" style={{ color: 'rgba(191,219,254,0.8)' }}>
                        {dateStr} // {timeStr} // SESSION_ACTIVE
                    </p>
                    <h1 className="font-display text-2xl md:text-3xl font-bold tracking-widest glow-cyan mb-1" style={{ color: 'var(--cyan)' }}>
                        TERMINAL_ACCESS: GRANTED
                    </h1>
                    <p className="font-mono-cp text-sm" style={{ color: 'rgba(226,232,240,0.9)' }}>
                        {'>'} Welcome back, Operative{' '}
                        <span style={{ color: 'var(--cyan)' }}>{user?.firstName?.toUpperCase()}</span>.
                        System integrity nominal.
                    </p>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'CLEARANCE_LEVEL', value: (user?.roles ?? []).map(r => r.replace('ROLE_','')).join(' + '), color: 'var(--cyan)' },
                            { label: 'NETWORK_STATUS',  value: 'ONLINE',  color: 'var(--green)' },
                            { label: 'SYSTEM_MODE',     value: isAdmin ? 'ADMIN' : 'OPERATIVE', color: isAdmin ? 'var(--pink)' : 'var(--cyan)' },
                        ].map(({ label, value, color }) => (
                            <UiStatCard
                                key={label}
                                label={label}
                                value={<span className="text-sm">{value}</span>}
                                accent={color}
                                className="cp-stat-tile"
                            />
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* Quick action grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { to: '/directory', label: 'ALUMNI_DIRECTORY', desc: 'Browse the network. Connect with peers.', icon: '◈', color: 'var(--cyan)' },
                    { to: '/profile',   label: 'MY_PROFILE',       desc: 'Update your operative dossier.',         icon: '◉', color: 'var(--purple)' },
                    ...(isAdmin ? [{ to: '/admin', label: 'ADMIN_CONSOLE', desc: 'Manage operatives and system access.', icon: '⬟', color: 'var(--pink)' }] : []),
                ].map(({ to, label, desc, icon, color }) => (
                    <Link key={to} to={to}
                        className="cp-card cp-soft-glass cp-hover-lift p-6 block group cursor-pointer"
                        style={{ textDecoration: 'none' }}>
                        <div className="text-2xl mb-3" style={{ color }}>{icon}</div>
                        <p className="font-display text-xs tracking-widest mb-1" style={{ color }}>{label}</p>
                        <p className="font-mono-cp text-xs" style={{ color: 'rgba(203,213,225,0.9)' }}>{desc}</p>
                        <p className="font-mono-cp text-xs mt-4 transition-all group-hover:translate-x-1"
                            style={{ color }}>→ ACCESS</p>
                    </Link>
                ))}
            </div>
        </PageContainer>
    );
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};
const PublicRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/" replace /> : children;
};
const AdminRoute = ({ children }: { children: JSX.Element }) => {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!user?.roles?.includes('ROLE_ADMIN')) return <Navigate to="/" replace />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login"        element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/register"     element={<PublicRoute><Register /></PublicRoute>} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        <Route index          element={<DashboardHome />} />
                        <Route path="directory" element={<Directory />} />
                        <Route path="profile"   element={<ProfilePage />} />
                        <Route path="admin"     element={<AdminRoute><AdminPage /></AdminRoute>} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;