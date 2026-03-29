import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore.ts';
import { authApi, tokenStorage } from './lib/api.ts';
import { Layout } from './components/layout/Layout.tsx';
import { LoadingScreen } from './components/ui';

import { LoginPage } from './pages/auth/LoginPage.tsx';
import { RegisterPage } from './pages/auth/RegisterPage.tsx';
import { ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from './pages/auth/AuthPages.tsx';
import { DashboardPage } from './pages/dashboard/DashboardPage.tsx';
import { AlumniDirectoryPage, AlumniProfileViewPage } from './pages/alumni/AlumniDirectory.tsx';
import { ProfilePage } from './pages/profile/ProfilePage.tsx';
import { AdminPage } from './pages/admin/AdminPage.tsx';

// ── Guards ────────────────────────────────────────────────────────────────────
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();
    if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
    return <>{children}</>;
};

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isAdmin } = useAuthStore();
    const location = useLocation();
    if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
    if (!isAdmin) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

const RedirectIfAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuthStore();
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

// ── Bootstrap: verify stored token on cold start ──────────────────────────────
const AppBootstrap: React.FC<{ onDone: () => void }> = ({ onDone }) => {
    const { isAuthenticated, setUser, clearAuth } = useAuthStore();

    useEffect(() => {
        const token = tokenStorage.getAccess();
        if (!token || !isAuthenticated) { onDone(); return; }

        authApi.me().then((res) => {
            if (res.data) {
                setUser(res.data, tokenStorage.getAccess()!, tokenStorage.getRefresh()!);
            } else {
                clearAuth();
            }
        }).catch(() => clearAuth()).finally(onDone);
    }, []);

    return null;
};

// ── App ───────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
    const [booting, setBooting] = useState(true);

    if (booting) {
        return (
            <BrowserRouter>
                <AppBootstrap onDone={() => setBooting(false)} />
                <LoadingScreen />
            </BrowserRouter>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Public auth routes */}
                <Route path="/login"          element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
                <Route path="/register"       element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password"  element={<ResetPasswordPage />} />
                <Route path="/verify-email"    element={<VerifyEmailPage />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<RequireAuth><Layout><DashboardPage /></Layout></RequireAuth>} />
                <Route path="/alumni"    element={<RequireAuth><Layout><AlumniDirectoryPage /></Layout></RequireAuth>} />
                <Route path="/alumni/:userId" element={<RequireAuth><Layout><AlumniProfileViewPage /></Layout></RequireAuth>} />
                <Route path="/profile"   element={<RequireAuth><Layout><ProfilePage /></Layout></RequireAuth>} />

                {/* Admin routes */}
                <Route path="/admin" element={<RequireAdmin><Layout><AdminPage /></Layout></RequireAdmin>} />

                {/* Fallbacks */}
                <Route path="/"  element={<Navigate to="/dashboard" replace />} />
                <Route path="*"  element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;