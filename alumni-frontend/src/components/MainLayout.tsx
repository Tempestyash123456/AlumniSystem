import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="bg-blue-700 text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-8">
                            <h1 className="text-xl font-bold tracking-wider">Alumni Portal</h1>
                            <nav className="hidden md:flex space-x-4">
                                <Link to="/" className="hover:bg-blue-600 px-3 py-2 rounded-md transition">Dashboard</Link>
                                <Link to="/directory" className="hover:bg-blue-600 px-3 py-2 rounded-md transition">Directory</Link>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
                            <button onClick={logout} className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded text-sm font-bold transition">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area (Outlet renders the child routes) */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-6">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;