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

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                
                {/* Protected Routes wrapped in MainLayout */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }>
                    {/* These render inside the <Outlet /> of MainLayout */}
                    <Route index element={<DashboardHome />} />
                    <Route path="directory" element={<Directory />} />
                </Route>
            </Routes>
        </Router>
    </AuthProvider>
  );
}

export default App;