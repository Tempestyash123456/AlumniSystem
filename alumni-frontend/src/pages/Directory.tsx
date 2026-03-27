import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';

interface Alumni {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhotoUrl: string | null;
}

const Directory = () => {
    const [alumniList, setAlumniList] = useState<Alumni[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState<string | null>(null);
    const [search,    setSearch]    = useState('');

    useEffect(() => {
        api.get('/alumni')
            .then(r => setAlumniList(r.data.data))
            .catch(() => setError('DIRECTORY_FETCH_ERROR: Unable to load network nodes.'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = alumniList.filter(a =>
        `${a.firstName} ${a.lastName} ${a.email}`.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="cp-spinner" />
            <p className="font-mono-cp text-xs tracking-widest animate-pulse" style={{ color: 'var(--cyan)' }}>
                SCANNING NETWORK NODES...
            </p>
        </div>
    );

    if (error) return (
        <div className="cp-alert-error max-w-lg mt-8 font-mono-cp text-sm">{error}</div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <p className="font-mono-cp text-xs tracking-widest mb-1" style={{ color: 'rgba(0,245,255,0.4)' }}>
                        // NETWORK_DIRECTORY
                    </p>
                    <h2 className="font-display text-2xl font-bold tracking-widest glow-cyan" style={{ color: 'var(--cyan)' }}>
                        ALUMNI NODES
                    </h2>
                    <p className="font-mono-cp text-xs mt-1" style={{ color: 'rgba(0,245,255,0.35)' }}>
                        {filtered.length} operative{filtered.length !== 1 ? 's' : ''} found in network
                    </p>
                </div>
                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-cp text-xs"
                        style={{ color: 'rgba(0,245,255,0.4)' }}>⌕</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="search operatives..."
                        className="cp-input pl-8 w-full"
                    />
                </div>
            </div>

            <hr className="cp-divider" />

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((alumni) => (
                    <div key={alumni.id} className="cp-card group transition-all duration-300 cursor-pointer"
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,245,255,0.4)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,245,255,0.12), inset 0 0 20px rgba(0,245,255,0.03)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,245,255,0.12)';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        }}>
                        <div className="p-5 flex flex-col items-center text-center space-y-3">
                            {/* Avatar */}
                            <div className="relative w-16 h-16 flex items-center justify-center font-display text-lg font-bold flex-shrink-0"
                                style={{
                                    background: 'rgba(0,245,255,0.06)',
                                    border: '1px solid rgba(0,245,255,0.25)',
                                    color: 'var(--cyan)',
                                    boxShadow: '0 0 15px rgba(0,245,255,0.1)',
                                }}>
                                {alumni.profilePhotoUrl
                                    ? <img src={alumni.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                                    : `${alumni.firstName[0]}${alumni.lastName[0]}`
                                }
                                {/* Online dot */}
                                <span className="cp-status-online absolute bottom-0 right-0" />
                            </div>

                            {/* Name */}
                            <div>
                                <h3 className="font-display text-sm font-semibold tracking-wide" style={{ color: '#e2e8f0' }}>
                                    {alumni.firstName} {alumni.lastName}
                                </h3>
                                <p className="font-mono-cp text-xs mt-0.5 truncate max-w-[160px]"
                                    style={{ color: 'rgba(0,245,255,0.4)' }}>
                                    {alumni.email}
                                </p>
                            </div>

                            {/* Action */}
                            <Link to={`/profile/${alumni.id}`}
                                className="cp-btn-secondary w-full text-xs h-8 mt-1"
                                style={{ textDecoration: 'none' }}>
                                VIEW_PROFILE →
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="cp-card p-12 text-center space-y-2"
                    style={{ borderStyle: 'dashed' }}>
                    <p className="font-display text-xs tracking-widest" style={{ color: 'rgba(0,245,255,0.3)' }}>
                        NO_NODES_FOUND
                    </p>
                    <p className="font-mono-cp text-xs" style={{ color: 'rgba(0,245,255,0.2)' }}>
                        {search ? 'Adjust search parameters.' : 'No verified alumni in the network yet.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Directory;