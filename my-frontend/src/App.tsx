// my-frontend/src/App.tsx

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
import { PostsPage } from './pages/admin/PostsPage.tsx';
import { EventsPage } from './pages/admin/EventsPage.tsx';
import { PostsFeedPage } from './pages/posts/PostsFeedPage.tsx';
import { OAuth2Callback } from './pages/auth/OAuth2Callback.tsx';

// ── Guards ──────────────────────────────────────────────────────────────────
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

// ── Bootstrap ────────────────────────────────────────────────────────────────
// Runs once on every hard load. If a token exists (persisted or just set by
// OAuth2Callback), it fetches /me and populates the user, then calls onDone.
const AppBootstrap: React.FC<{ onDone: () => void }> = ({ onDone }) => {
    const { setUser, clearAuth } = useAuthStore();

    useEffect(() => {
        // If this is the OAuth callback page, the token isn't in storage yet.
        // OAuth2Callback will handle it — skip bootstrap entirely.
        if (window.location.pathname === '/oauth2/callback') {
            onDone();
            return;
        }

        const token = tokenStorage.getAccess();
        if (!token) {
            clearAuth();
            onDone();
            return;
        }

        authApi.me()
            .then((res) => {
                if (res.data) {
                    setUser(res.data, token, tokenStorage.getRefresh() ?? '');
                } else {
                    clearAuth();
                }
            })
            .catch(() => clearAuth())
            .finally(() => onDone());
    }, []);

    return null;
};

// ── App ───────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
    const [booting, setBooting] = useState(true);

    // Always show loader + run bootstrap until /me resolves.
    // This covers both normal page load AND the OAuth2 redirect land.
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
                <Route path="/login"           element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
                <Route path="/register"        element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />
                <Route path="/oauth2/callback" element={<OAuth2Callback />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password"  element={<ResetPasswordPage />} />
                <Route path="/verify-email"    element={<VerifyEmailPage />} />

                {/* Protected – all authenticated users */}
                <Route path="/dashboard"    element={<RequireAuth><Layout><DashboardPage /></Layout></RequireAuth>} />
                <Route path="/profile"      element={<RequireAuth><Layout><ProfilePage /></Layout></RequireAuth>} />
                <Route path="/posts"        element={<RequireAuth><Layout><PostsFeedPage /></Layout></RequireAuth>} />

                {/* Alumni directory */}
                <Route path="/alumni"         element={<RequireAuth><Layout><AlumniDirectoryPage /></Layout></RequireAuth>} />
                <Route path="/alumni/:userId" element={<RequireAuth><Layout><AlumniProfileViewPage /></Layout></RequireAuth>} />

                {/* Admin-only */}
                <Route path="/admin"       element={<RequireAdmin><Layout><AdminPage /></Layout></RequireAdmin>} />
                <Route path="/admin/posts" element={<RequireAdmin><Layout><PostsPage /></Layout></RequireAdmin>} />
                <Route path="/admin/events" element={<RequireAdmin><Layout><EventsPage /></Layout></RequireAdmin>} />

                {/* Fallbacks */}
                <Route path="/"  element={<Navigate to="/dashboard" replace />} />
                <Route path="*"  element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;