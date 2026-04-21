import React, { useState, useEffect, useCallback } from 'react';
import { alumniApi } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import type { AlumniDto } from '../../types';
import { Spinner, Button } from '../../components/ui';
import { maskId } from '../../lib/mask';
import './Peers.css';

// ── Icons ──────────────────────────────────────────────────────────────────
const SearchIcon = ({ size = 20 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);

const ChevronLeft = ({ size = 20 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);

const ChevronRight = ({ size = 20 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

// ── Types ────────────────────────────────────────────────────────────────────
interface Filters {
    program: string;
    year: string;
    country: string;
    state: string;
    city: string;
    search: string;
}

// ── Filter Sidebar Component ─────────────────────────────────────────────────
const SidebarFilterSection: React.FC<{
    label: string;
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ label, active, onClick, children }) => (
    <div className={`filter-section ${active ? 'active' : ''}`}>
        <div className="filter-section-header" onClick={onClick}>
            <div className="filter-checkbox-custom" />
            <span className="filter-section-title">{label}</span>
        </div>
        {active && (
            <div className="filter-content animate-fade-in">
                {children}
            </div>
        )}
    </div>
);

const FilterSidebar: React.FC<{
    filters: Filters;
    onChange: (key: keyof Filters, value: string) => void;
    onClear: () => void;
    options: { [key: string]: string[] };
    isOpen: boolean;
}> = ({ filters, onChange, onClear, options, isOpen }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        program: true,
        year: true,
        country: true,
        state: false,
        city: false
    });

    const toggleSection = (key: string) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className={`peers-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-search-area">
                <div className="sidebar-search-box">
                    <input
                        type="search"
                        placeholder="Search by Name, Email, ID..."
                        className="sidebar-search-input"
                        value={filters.search}
                        onChange={(e) => onChange('search', e.target.value)}
                    />
                    <button className="sidebar-search-btn">
                        <SearchIcon size={18} />
                    </button>
                </div>
            </div>

            <div className="sidebar-filters-area">
                {(['program', 'year', 'country', 'state', 'city'] as const).map((key) => (
                    <SidebarFilterSection
                        key={key}
                        label={
                            key === 'program' ? 'Program' :
                            key === 'year' ? 'Graduation Year' :
                            key.charAt(0).toUpperCase() + key.slice(1)
                        }
                        active={expanded[key]}
                        onClick={() => toggleSection(key)}
                    >
                        {(options[key] || []).map(opt => (
                            <label key={opt} className="filter-option">
                                <input
                                    type="checkbox"
                                    checked={filters[key] === opt}
                                    onChange={() => onChange(key, filters[key] === opt ? '' : opt)}
                                />
                                {opt}
                            </label>
                        ))}
                        {(!options[key] || options[key].length === 0) && <span style={{ fontSize: 12, opacity: 0.5 }}>No options available</span>}
                    </SidebarFilterSection>
                ))}
            </div>

            <div className="sidebar-actions">
                <button className="btn-clear-all" onClick={onClear}>
                    ✕ Clear Filters
                </button>
            </div>
        </div>
    );
};

// ── Peer Card Component ──────────────────────────────────────────────────────
const PeerCard: React.FC<{ peer: AlumniDto }> = ({ peer }) => {
    const navigate = useNavigate();
    return (
        <div className="peer-card-new animate-fade-in">
            <div className="peer-card-header">
                <img 
                    src={peer.profilePhotoUrl || 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/avatars/01.png'} 
                    alt={peer.firstName}
                    className="peer-card-avatar"
                    onError={(e) => { 
                        const img = e.target as HTMLImageElement;
                        img.onerror = null; 
                        img.src = 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/avatars/01.png'; 
                    }}
                />
                <div className="peer-card-info">
                    <h3 className="peer-card-name">{peer.firstName} {peer.lastName}</h3>
                    {peer.currentJobTitle && (
                        <p className="peer-card-role">{peer.currentJobTitle}</p>
                    )}
                </div>
            </div>
            
            <div className="peer-card-actions">
                <button 
                    className="card-message-btn"
                    onClick={() => navigate(`/chat?to=${maskId(peer.id)}`)}
                >
                    Message
                </button>
            </div>
        </div>
    );
};

// ── Peer Grid Component ──────────────────────────────────────────────────────
interface PeerGridProps {
    peers: AlumniDto[];
    loading: boolean;
    onClear: () => void;
}

const PeerCardGrid: React.FC<PeerGridProps> = ({ peers, loading, onClear }) => {
    if (loading) {
        return (
            <div className="peer-loading-container">
                <Spinner size={40} />
                <p>Synchronizing Directory...</p>
            </div>
        );
    }

    if (peers.length === 0) {
        return (
            <div className="peer-empty-container">
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.2 }}>🔍</div>
                <p>No profiles match your filters.</p>
                <button onClick={onClear} className="cp-btn cp-btn-ghost cp-btn-sm" style={{ marginTop: '16px' }}>
                    Reset All
                </button>
            </div>
        );
    }

    return (
        <div className="peer-card-grid">
            {peers.map(peer => (
                <PeerCard key={peer.id} peer={peer} />
            ))}
        </div>
    );
};

// ── Main Page Component ───────────────────────────────────────────────────────
export const ConnectWithPeersPage: React.FC = () => {
    const [peers, setPeers] = useState<AlumniDto[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const pageSize = 12;

    const [filters, setFilters] = useState<Filters>({
        program: '',
        year: '',
        country: '',
        state: '',
        city: '',
        search: ''
    });

    const [options, setOptions] = useState<Record<string, string[]>>({});

    // Fetch filters options
    useEffect(() => {
        const fetchFilters = async () => {
            const programsRes = await alumniApi.getPeerPrograms();
            if (programsRes.success && programsRes.data) {
                setOptions(prev => ({ 
                    ...prev, 
                    program: programsRes.data!.map(d => d.name) 
                }));
            }
        };
        fetchFilters();
    }, []);

    // Fetch dependent filters - REFACTORED TO BE SEMI-INDEPENDENT
    useEffect(() => {
        const fetchDependent = async () => {
            const yearsRes = await alumniApi.getPeerYears(filters.program || '');
            if (yearsRes.success && yearsRes.data) {
                setOptions(prev => ({ ...prev, year: yearsRes.data!.map(d => d.name) }));
            }
        };
        fetchDependent();
    }, [filters.program]);

    useEffect(() => {
        const fetchCountries = async () => {
            const res = await alumniApi.getPeerCountries(filters.program || '', filters.year ? parseInt(filters.year) : undefined);
            if (res.success && res.data) {
                setOptions(prev => ({ ...prev, country: res.data!.map(d => d.name) }));
            }
        };
        fetchCountries();
    }, [filters.program, filters.year]);

    useEffect(() => {
        const fetchStates = async () => {
            const res = await alumniApi.getPeerStates(
                filters.program || '', 
                filters.year ? parseInt(filters.year) : undefined, 
                filters.country || ''
            );
            if (res.success && res.data) {
                setOptions(prev => ({ ...prev, state: res.data!.map(d => d.name) }));
            }
        };
        fetchStates();
    }, [filters.program, filters.year, filters.country]);

    useEffect(() => {
        const fetchCities = async () => {
            const res = await alumniApi.getPeerCities(
                filters.program || '', 
                filters.year ? parseInt(filters.year) : undefined, 
                filters.country || '', 
                filters.state || ''
            );
            if (res.success && res.data) {
                setOptions(prev => ({ ...prev, city: res.data!.map(d => d.name) }));
            }
        };
        fetchCities();
    }, [filters.program, filters.year, filters.country, filters.state]);

    // Fetch Peers with debouncing for search
    const fetchPeers = useCallback(async (currentFilters: Filters, currentPage: number) => {
        setLoading(true);
        try {
            const res = await alumniApi.getPeers({
                query: currentFilters.search,
                program: currentFilters.program,
                year: currentFilters.year,
                country: currentFilters.country,
                state: currentFilters.state,
                city: currentFilters.city,
                page: currentPage,
                size: pageSize
            });

            if (res.success && res.data) {
                setPeers(res.data.alumni);
                setTotalCount(res.data.totalCount);
            }
        } catch (err) {
            console.error('Failed to fetch peers:', err);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchPeers(filters, page);
        }, 300);
        return () => clearTimeout(handler);
    }, [filters, page, fetchPeers]);

    const handleFilterChange = (key: keyof Filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0); // Reset to first page on filter change
    };

    const clearFilters = () => {
        setFilters({ program: '', year: '', country: '', state: '', city: '', search: '' });
        setPage(0);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="peers-container animate-fade-in">
            <header className="peers-header-modern">
                <div className="header-eyebrow">
                    <span className="neon-tag">NETWORK_CORE</span>
                    <span className="separator">›</span>
                    <span className="dim-tag">PEER_CONNECT</span>
                </div>
                <div className="header-content">
                    <div>
                        <h1 className="peers-title-new">Connect with Peers</h1>
                        <p className="peers-subtitle">Collaborate, mentor, and grow within your alumni network. Use the filters to find peers by program, year, or location.</p>
                    </div>
                </div>
            </header>

            <div className="peers-layout">
                <FilterSidebar
                    filters={filters}
                    onChange={handleFilterChange}
                    onClear={clearFilters}
                    options={options}
                    isOpen={false}
                />

                <main className="peers-main">
                    <div className="table-controls">
                        <div className="result-count">
                            <span className="count-num">{totalCount}</span>
                            <span className="count-label">Peers Found</span>
                        </div>
                    </div>

                    <PeerCardGrid 
                        peers={peers} 
                        loading={loading} 
                        onClear={clearFilters}
                    />

                    {totalPages > 1 && (
                        <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px', marginBottom: '32px' }}>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0 || loading}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <ChevronLeft size={16} /> Previous
                            </Button>
                            
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontFamily: 'Orbitron, sans-serif' }}>
                                PAGE <span style={{ color: 'var(--neon-cyan)' }}>{page + 1}</span> OF {totalPages}
                            </span>

                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1 || loading}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                Next <ChevronRight size={16} />
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
