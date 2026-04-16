import React, { useState, useEffect, useMemo } from 'react';
import { alumniApi } from '../../lib/api';
import type { AlumniDto } from '../../types';
import { Spinner } from '../../components/ui';
import './Peers.css';

// Custom LinkedIn Icon
const LinkedinIcon = ({ size = 20 }: { size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} height={size} 
        viewBox="0 0 24 24" fill="none" 
        stroke="currentColor" strokeWidth="2" 
        strokeLinecap="round" strokeLinejoin="round"
    >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
    </svg>
);

// ── Filter Sidebar Component ──────────────────────────────────────────────────
interface Filters {
    program: string;
    year: string;
    country: string;
    state: string;
    city: string;
}

const FilterSidebar: React.FC<{
    filters: Filters;
    onChange: (key: keyof Filters, value: string) => void;
    onClear: () => void;
    options: { [key in keyof Filters]: string[] };
    isOpen: boolean;
}> = ({ filters, onChange, onClear, options, isOpen }) => (
    <div className={`peers-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="peers-sidebar-title">Filters</div>
        
        {(['program', 'year', 'country', 'state', 'city'] as const).map((key) => (
            <div className="filter-group" key={key}>
                <label className="filter-label">{key.replace('program', 'Program').replace('year', 'Graduation Year')}</label>
                <select 
                    className="filter-select"
                    value={filters[key]}
                    onChange={(e) => onChange(key, e.target.value)}
                >
                    <option value="">All {key.charAt(0).toUpperCase() + key.slice(1)}s</option>
                    {options[key].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>
        ))}

        <button className="filter-clear-btn" onClick={onClear}>
            ✕ CLEAR FILTERS
        </button>
    </div>
);

// ── Peer Card View ────────────────────────────────────────────────────────────
const PeerCard: React.FC<{ peer: AlumniDto }> = ({ peer }) => {
    return (
        <div className="peer-card">
            <img 
                src={peer.profilePhotoUrl || 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/avatars/01.png'} 
                alt={`${peer.firstName} ${peer.lastName}`} 
                className="peer-avatar"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/avatars/01.png'; }}
            />
            <div className="peer-info">
                <div className="peer-name">{peer.firstName} {peer.lastName}</div>
                <div className="peer-work-info">
                    {(() => {
                        const title = peer.currentJobTitle;
                        const company = peer.currentCompany;
                        if (title && company) return `${title} @ ${company}`;
                        if (title || company) return title || company;
                        return <span style={{ opacity: 0.4 }}>Professional details hidden</span>;
                    })()}
                </div>
                <div className="peer-footer">
                    <a href={`mailto:${peer.email}`} className="peer-email">
                        {peer.email}
                    </a>
                    {peer.linkedinUrl && (
                        <a 
                            href={peer.linkedinUrl.startsWith('http') ? peer.linkedinUrl : `https://${peer.linkedinUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="peer-linkedin-link"
                        >
                            <LinkedinIcon size={18} />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Main Page Component ───────────────────────────────────────────────────────
export const ConnectWithPeersPage: React.FC = () => {
    const [allPeers, setAllPeers]         = useState<AlumniDto[]>([]);
    const [filteredPeers, setFilteredPeers] = useState<AlumniDto[]>([]);
    const [loading, setLoading]           = useState(true);
    const [sidebarOpen, setSidebarOpen]   = useState(false);
    
    const [filters, setFilters] = useState<Filters>({
        program: '',
        year: '',
        country: '',
        state: '',
        city: ''
    });

    const [debouncedFilters, setDebouncedFilters] = useState<Filters>(filters);

    // Fetch all peers on mount
    useEffect(() => {
        const fetchPeers = async () => {
            try {
                const res = await alumniApi.getAll();
                if (res.success && res.data) {
                    setAllPeers(res.data);
                    setFilteredPeers(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch peers:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPeers();
    }, []);

    // Debounce filter changes
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedFilters(filters);
        }, 300);
        return () => clearTimeout(handler);
    }, [filters]);

    // Apply filtering whenever debounced filters or data changes
    useEffect(() => {
        let result = [...allPeers];

        if (debouncedFilters.program) {
            result = result.filter(p => p.program === debouncedFilters.program);
        }
        if (debouncedFilters.year) {
            result = result.filter(p => String(p.graduationYear) === debouncedFilters.year);
        }
        if (debouncedFilters.country) {
            result = result.filter(p => p.country === debouncedFilters.country);
        }
        if (debouncedFilters.state) {
            result = result.filter(p => p.state === debouncedFilters.state);
        }
        if (debouncedFilters.city) {
            result = result.filter(p => p.city === debouncedFilters.city);
        }

        setFilteredPeers(result);
    }, [debouncedFilters, allPeers]);

    // Compute unique options for dropdowns dynamically
    const filterOptions = useMemo(() => {
        return {
            program: Array.from(new Set(allPeers.map(p => p.program).filter(Boolean))).sort() as string[],
            year:    Array.from(new Set(allPeers.map(p => p.graduationYear).filter(Boolean).map(String))).sort((a,b) => b.localeCompare(a)) as string[],
            country: Array.from(new Set(allPeers.map(p => p.country).filter(Boolean))).sort() as string[],
            state:   Array.from(new Set(allPeers.map(p => p.state).filter(Boolean))).sort() as string[],
            city:    Array.from(new Set(allPeers.map(p => p.city).filter(Boolean))).sort() as string[],
        };
    }, [allPeers]);

    const handleFilterChange = (key: keyof Filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ program: '', year: '', country: '', state: '', city: '' });
    };

    return (
        <div className="peers-container animate-fade-in">
            <header>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '0.15em', marginBottom: 6 }}>
                    NETWORK_CORE › PEER_CONNECT
                </div>
                <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '28px', fontWeight: 800, letterSpacing: '0.05em' }}>
                    CONNECT WITH PEERS
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 8, maxWidth: '600px' }}>
                    Collaborate, mentor, and grow within your alumni network. Use the filters to find peers by program, year, or location.
                </p>
            </header>

            <button 
                className="mobile-filter-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? '✕ HIDE FILTERS' : '☰ SHOW FILTERS'}
            </button>

            <div className="peers-layout">
                <main className="peers-main">
                    {loading ? (
                        <div className="loading-container">
                            <Spinner size={40} />
                            <span>SYNCHRONIZING NETWORK DATA...</span>
                        </div>
                    ) : (
                        <div className="peers-grid">
                            {filteredPeers.map((peer) => (
                                <PeerCard key={peer.id} peer={peer} />
                            ))}
                            {filteredPeers.length === 0 && (
                                <div className="empty-state">
                                    <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.3 }}>◈</div>
                                    <p>No peers match your current filter criteria.</p>
                                    <button onClick={clearFilters} className="cp-btn cp-btn-ghost cp-btn-sm" style={{ marginTop: '16px' }}>
                                        Reset Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <FilterSidebar 
                    filters={filters}
                    onChange={handleFilterChange}
                    onClear={clearFilters}
                    options={filterOptions}
                    isOpen={sidebarOpen}
                />
            </div>
        </div>
    );
};
