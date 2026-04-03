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
import { ManageUserStatusPage } from './pages/admin/ManageUserStatusPage.tsx';
import { AdminEmailPage } from './pages/admin/AdminEmailPage.tsx';
import { PostsPage } from './pages/admin/PostsPage.tsx';
import { EventsPage } from './pages/admin/EventsPage.tsx';
import { PostsFeedPage } from './pages/posts/PostsFeedPage.tsx';
import { AlumniEventsPage } from './pages/alumni/AlumniEventsPage.tsx';
import { OAuth2Callback } from './pages/auth/OAuth2Callback.tsx';
import { LandingPage } from './pages/landing/LandingPage.tsx';
import { MembershipPage } from './pages/membership/MembershipPage.tsx';
import { CompleteRegistrationPage } from './pages/auth/CompleteRegistrationPage.tsx';

// ── Guards ──────────────────────────────────────────────────────────────────
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();
    if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
    
    if (isAuthenticated && !user?.roleSelected && location.pathname !== '/complete-registration') {
        return <Navigate to="/complete-registration" replace />;
    }
    
    return <>{children}</>;
};

const RequirePermission: React.FC<{ children: React.ReactNode; permission?: string }> = ({ children, permission }) => {
    const { isAuthenticated, isAdmin, user, hasPermission } = useAuthStore();
    const location = useLocation();
    if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
    
    if (isAuthenticated && !user?.roleSelected && location.pathname !== '/complete-registration') {
        return <Navigate to="/complete-registration" replace />;
    }

    if (isAuthenticated && (!user?.enabled || (user?.accountLocked && !isAdmin))) {
        return <Navigate to="/dashboard" replace />;
    }

    // Admin routes strictly require isAdmin role
    if (location.pathname.startsWith('/admin') && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    if (permission && !hasPermission(permission)) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return <>{children}</>;
};

const RedirectIfAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();
    if (isAuthenticated) {
        if (!user?.roleSelected) return <Navigate to="/complete-registration" replace />;
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

// ── Bootstrap ────────────────────────────────────────────────────────────────
const AppBootstrap: React.FC<{ onDone: () => void }> = ({ onDone }) => {
    const { setUser, clearAuth } = useAuthStore();

    useEffect(() => {
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
                <Route path="/complete-registration" element={<RequireAuth><CompleteRegistrationPage /></RequireAuth>} />

                {/* Protected – all authenticated users */}
                <Route path="/dashboard"    element={<RequireAuth><Layout><DashboardPage /></Layout></RequireAuth>} />
                <Route path="/profile"      element={<RequireAuth><Layout><ProfilePage /></Layout></RequireAuth>} />
                <Route path="/posts"        element={<RequirePermission permission="POST_VIEW"><Layout><PostsFeedPage /></Layout></RequirePermission>} />
                <Route path="/events"       element={<RequirePermission permission="EVENT_VIEW"><Layout><AlumniEventsPage /></Layout></RequirePermission>} />
                <Route path="/membership"   element={<RequirePermission><Layout><MembershipPage /></Layout></RequirePermission>} />

                {/* Alumni directory */}
                <Route path="/alumni"         element={<RequirePermission permission="USER_VIEW"><Layout><AlumniDirectoryPage /></Layout></RequirePermission>} />
                <Route path="/alumni/:userId" element={<RequirePermission permission="USER_VIEW"><Layout><AlumniProfileViewPage /></Layout></RequirePermission>} />

                {/* Admin-only */}
                <Route path="/admin/users/status"      element={<RequirePermission permission="USER_ADMIN_ACCESS"><Layout><ManageUserStatusPage /></Layout></RequirePermission>} />
                <Route path="/admin/email"             element={<RequirePermission permission="PERMISSION_MANAGE"><Layout><AdminEmailPage /></Layout></RequirePermission>} />
                <Route path="/admin/posts"             element={<RequirePermission permission="POST_MANAGE"><Layout><PostsPage /></Layout></RequirePermission>} />
                <Route path="/admin/events"            element={<RequirePermission permission="EVENT_MANAGE"><Layout><EventsPage /></Layout></RequirePermission>} />

                {/* Landing / Fallbacks */}
                <Route path="/"  element={<LandingPage />} />
                <Route path="*"  element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;