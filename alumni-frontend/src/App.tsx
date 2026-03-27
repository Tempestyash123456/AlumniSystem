import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import MainLayout from './components/MainLayout';
import Directory from './pages/Directory';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import { type JSX } from 'react';

const DashboardHome = () => {
    const { user } = useAuth();
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

    return (
        <div className="space-y-6">
            {/* Hero banner */}
            <div className="cp-card cp-scanlines cp-grid-bg p-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(0,245,255,0.06) 0%, transparent 60%)' }} />
                <div className="relative z-10">
                    <p className="font-mono-cp text-xs tracking-[0.2em] mb-2" style={{ color: 'rgba(0,245,255,0.5)' }}>
                        {dateStr} // {timeStr} // SESSION_ACTIVE
                    </p>
                    <h1 className="font-display text-2xl md:text-3xl font-bold tracking-widest glow-cyan mb-1" style={{ color: 'var(--cyan)' }}>
                        TERMINAL_ACCESS: GRANTED
                    </h1>
                    <p className="font-mono-cp text-sm" style={{ color: 'rgba(0,245,255,0.5)' }}>
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
                            <div key={label} className="p-4 space-y-1"
                                style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid rgba(0,245,255,0.1)`, borderLeft: `2px solid ${color}` }}>
                                <p className="font-mono-cp text-xs" style={{ color: 'rgba(0,245,255,0.4)' }}>{label}</p>
                                <p className="font-display text-sm font-semibold tracking-wide" style={{ color }}>{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick action grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { to: '/directory', label: 'ALUMNI_DIRECTORY', desc: 'Browse the network. Connect with peers.', icon: '◈', color: 'var(--cyan)' },
                    { to: '/profile',   label: 'MY_PROFILE',       desc: 'Update your operative dossier.',         icon: '◉', color: 'var(--purple)' },
                    ...(isAdmin ? [{ to: '/admin', label: 'ADMIN_CONSOLE', desc: 'Manage operatives and system access.', icon: '⬟', color: 'var(--pink)' }] : []),
                ].map(({ to, label, desc, icon, color }) => (
                    <a key={to} href={to}
                        className="cp-card p-6 block group transition-all duration-300 cursor-pointer"
                        style={{ textDecoration: 'none' }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = color;
                            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${color}22`;
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,245,255,0.12)';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        }}>
                        <div className="text-2xl mb-3" style={{ color }}>{icon}</div>
                        <p className="font-display text-xs tracking-widest mb-1" style={{ color }}>{label}</p>
                        <p className="font-mono-cp text-xs" style={{ color: 'rgba(0,245,255,0.35)' }}>{desc}</p>
                        <p className="font-mono-cp text-xs mt-4 transition-all group-hover:translate-x-1"
                            style={{ color }}>→ ACCESS</p>
                    </a>
                ))}
            </div>
        </div>
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