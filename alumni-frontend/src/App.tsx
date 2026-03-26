import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from "./pages/VerifyEmail.tsx";
import {type JSX} from "react";

const Dashboard = () => {
    const { user, logout } = useAuth();
    return (
        <div className="min-h-screen bg-gray-50 p-10">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
                <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.firstName}! 👋</h1>
                <p className="text-gray-600 mt-2">Email: {user?.email}</p>
                <p className="text-gray-600">Roles: {user?.roles?.join(', ')}</p>

                <button
                    onClick={logout}
                    className="mt-6 bg-red-500 text-white font-semibold px-6 py-2 rounded shadow hover:bg-red-600 transition"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

// Protect Routes component
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

                    {/* Protected Routes */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;