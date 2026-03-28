import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.ts';
import { authApi, tokenStorage } from './lib/api.ts';
import { Layout } from './components/layout/Layout.tsx';
import { LoadingScreen } from './components/ui';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { DashboardPage } from './pages/dashboard/DashboardPage.tsx';
import { AdminPage } from './pages/admin/AdminPage.tsx';
// Import other pages...

const App: React.FC = () => {
    const { isAuthenticated, setUser, clearAuth } = useAuthStore();
    const [booting, setBooting] = useState(true);

    useEffect(() => {
        const init = async () => {
            const token = tokenStorage.getAccess();
            if (token && isAuthenticated) {
                const res = await authApi.me();
                if (res.data) {
                    setUser(res.data, token, tokenStorage.getRefresh()!);
                } else {
                    clearAuth();
                }
            }
            setBooting(false);
        };
        init();
    }, []);

    if (booting) return <LoadingScreen />;

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={isAuthenticated ? <Layout><DashboardPage /></Layout> : <Navigate to="/login" />} />
                <Route path="/admin" element={isAuthenticated && useAuthStore.getState().isAdmin ? <Layout><AdminPage /></Layout> : <Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;