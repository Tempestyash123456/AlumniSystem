import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import MainLayout from './components/MainLayout';
import Directory from './pages/Directory';
import { type JSX } from 'react';

const DashboardHome = () => {
    const { user } = useAuth();
    return (
        <div className="metallic-panel p-8 border-l-4 border-l-cyan-500 relative overflow-hidden">
            {/* Background Tech Grid */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.5)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            
            <div className="relative z-10">
                <h1 className="text-3xl font-bold text-cyan-400 uppercase tracking-widest neon-text-cyan">
                    TERMINAL_ACCESS: GRANTED
                </h1>
                <p className="text-gray-400 mt-2 font-mono text-sm">
                    {'>'} Welcome, Operative {user?.firstName}. System status is optimal.
                </p>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-900/50 border border-cyan-900 p-4 rounded-sm border-l-2 border-l-cyan-400">
                        <p className="text-xs text-gray-500 uppercase">Clearance Level</p>
                        <p className="text-lg text-cyan-100">{user?.roles?.join(', ')}</p>
                    </div>
                    <div className="bg-gray-900/50 border border-pink-900 p-4 rounded-sm border-l-2 border-l-pink-500">
                        <p className="text-xs text-gray-500 uppercase">Network Status</p>
                        <p className="text-lg text-pink-400">ONLINE</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 1. Protected Route: Keeps unauthorized users OUT of the app
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    // Using 'replace' prevents them from hitting the "Back" button to bypass the redirect
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// 2. Public Route: Keeps authorized users OUT of the login/register pages
const PublicRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
        <Router>
            <Routes>
                {/* Public Routes (Only accessible if NOT logged in) */}
                <Route path="/login" element={
                    <PublicRoute><Login /></PublicRoute>
                } />
                <Route path="/register" element={
                    <PublicRoute><Register /></PublicRoute>
                } />
                
                {/* Verify Email doesn't need shielding, anyone with a link can hit it */}
                <Route path="/verify-email" element={<VerifyEmail />} />
                
                {/* Protected Routes (Only accessible if LOGGED IN) */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<DashboardHome />} />
                    <Route path="directory" element={<Directory />} />
                </Route>
                
                {/* Catch-all route: If they type a random URL, send them to the root */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    </AuthProvider>
  );
}

export default App;