import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen flex flex-col">
            {/* Shadcn-style Glassmorphism Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-14 items-center justify-between">
                        <div className="flex items-center gap-6">
                            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
                                Alumni<span className="text-zinc-500">Portal</span>
                            </h1>
                            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
                                <Link to="/" className="hover:text-zinc-50 transition-colors">Dashboard</Link>
                                <Link to="/directory" className="hover:text-zinc-50 transition-colors">Directory</Link>
                            </nav>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-zinc-300">
                                {user?.firstName} {user?.lastName}
                            </span>
                            <button onClick={logout} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 border border-zinc-800 bg-transparent shadow-sm hover:bg-zinc-800 hover:text-zinc-50 h-8 px-3">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;