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
        <div className="bg-white p-8 rounded-xl shadow border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-800">Welcome to your Dashboard, {user?.firstName}!</h1>
            <p className="text-gray-600 mt-4">Use the navigation bar above to explore the Alumni Directory.</p>
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