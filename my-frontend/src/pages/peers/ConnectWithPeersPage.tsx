import React, { useState, useEffect, useMemo } from 'react';
import { alumniApi } from '../../lib/api';
import type { AlumniDto } from '../../types';
import { Spinner } from '../../components/ui';
import './Peers.css';

// ── Icons ──────────────────────────────────────────────────────────────────
const SearchIcon = ({ size = 20 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
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
    options: { [key in keyof Omit<Filters, 'search'>]: string[] };
    isOpen: boolean;
}> = ({ filters, onChange, onClear, options, isOpen }) => {
    // Local state for which sections are expanded
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        program: !!filters.program,
        year: !!filters.year,
        country: !!filters.country,
        state: !!filters.state,
        city: !!filters.city
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
                        placeholder="Enter Keyword.." 
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
                        label={key.replace('program', 'Program').replace('year', 'Graduation Year').charAt(0).toUpperCase() + key.slice(1).replace('program', 'rogram').replace('year', 'ear')}
                        active={expanded[key]}
                        onClick={() => toggleSection(key)}
                    >
                        {options[key].map(opt => (
                            <label key={opt} className="filter-option">
                                <input 
                                    type="checkbox" 
                                    checked={filters[key] === opt}
                                    onChange={() => onChange(key, filters[key] === opt ? '' : opt)}
                                />
                                {opt}
                            </label>
                        ))}
                        {options[key].length === 0 && <span style={{fontSize: 12, opacity: 0.5}}>No options available</span>}
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

// ── Peer Table Component ──────────────────────────────────────────────────────
interface PeerTableProps {
    peers: AlumniDto[];
    loading: boolean;
    onClear: () => void;
    selectedIds: Set<string>;
    onSelectAll: (checked: boolean) => void;
    onSelectRow: (id: string) => void;
}

const PeerTable: React.FC<PeerTableProps> = ({ 
    peers, 
    loading, 
    onClear, 
    selectedIds, 
    onSelectAll, 
    onSelectRow 
}) => {
    if (loading) {
        return (
            <div className="peer-table-container">
                <table className="peer-table">
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}><input type="checkbox" disabled /></th>
                            <th>NAME</th>
                            <th>PROGRAM</th>
                            <th>GRAD YEAR</th>
                            <th>LOCATION</th>
                            <th>EMAIL</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={6} className="loading-row">
                                <Spinner size={30} />
                                <p style={{ marginTop: 12 }}>Synchronizing Directory...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    const allSelected = peers.length > 0 && selectedIds.size === peers.length;

    return (
        <div className="peer-table-container">
            <table className="peer-table">
                <thead>
                    <tr>
                        <th style={{ width: 40 }}>
                            <input 
                                type="checkbox" 
                                className="row-checkbox" 
                                checked={allSelected}
                                onChange={(e) => onSelectAll(e.target.checked)}
                            />
                        </th>
                        <th>NAME</th>
                        <th>PROGRAM</th>
                        <th>GRAD YEAR</th>
                        <th>LOCATION</th>
                        <th>EMAIL</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {peers.map((peer) => (
                        <tr key={peer.id} className={`animate-fade-in ${selectedIds.has(peer.id) ? 'row-selected' : ''}`}>
                            <td>
                                <input 
                                    type="checkbox" 
                                    className="row-checkbox" 
                                    checked={selectedIds.has(peer.id)}
                                    onChange={() => onSelectRow(peer.id)}
                                />
                            </td>
                            <td className="peer-profile-cell">
                                <img 
                                    src={peer.profilePhotoUrl || 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/avatars/01.png'} 
                                    alt={peer.firstName}
                                    className="peer-table-avatar"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/avatars/01.png'; }}
                                />
                                <div>
                                    <div className="peer-table-name">{peer.firstName} {peer.lastName}</div>
                                    <div className="peer-table-role">
                                        {peer.currentJobTitle || 'Professional details hidden'}
                                    </div>
                                </div>
                            </td>
                            <td><span className="table-tag">{peer.program || 'N/A'}</span></td>
                            <td>{peer.graduationYear || 'N/A'}</td>
                            <td>
                                <div className="location-cell">
                                    <span className="city">{peer.city || 'N/A'}</span>
                                    <span className="state-country">{[peer.state, peer.country].filter(Boolean).join(', ')}</span>
                                </div>
                            </td>
                            <td>
                                <a href={`mailto:${peer.email}`} className="peer-table-email">
                                    {peer.email}
                                </a>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <div className="table-actions">
                                    <button className="icon-btn" title="View Profile">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {peers.length === 0 && (
                        <tr>
                            <td colSpan={7} className="empty-row">
                                <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.2 }}>🔍</div>
                                <p>No profiles match your filters.</p>
                                <button onClick={onClear} className="cp-btn cp-btn-ghost cp-btn-sm" style={{ marginTop: '16px' }}>
                                    Reset All
                                </button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

// ── Main Page Component ───────────────────────────────────────────────────────
export const ConnectWithPeersPage: React.FC = () => {
    const [allPeers, setAllPeers]         = useState<AlumniDto[]>([]);
    const [filteredPeers, setFilteredPeers] = useState<AlumniDto[]>([]);
    const [loading, setLoading]           = useState(true);
    const [sidebarOpen, setSidebarOpen]   = useState(false);
    const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
    
    const [filters, setFilters] = useState<Filters>({
        program: '',
        year: '',
        country: '',
        state: '',
        city: '',
        search: ''
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

    // Apply filtering
    useEffect(() => {
        let result = [...allPeers];

        if (debouncedFilters.search) {
            const s = debouncedFilters.search.toLowerCase();
            result = result.filter(p => 
                p.firstName.toLowerCase().includes(s) || 
                p.lastName.toLowerCase().includes(s) || 
                p.email.toLowerCase().includes(s) ||
                (p.currentJobTitle || '').toLowerCase().includes(s) ||
                (p.currentCompany || '').toLowerCase().includes(s)
            );
        }

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

    // Options for sidebar
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
        setFilters({ program: '', year: '', country: '', state: '', city: '', search: '' });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredPeers.map(p => p.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

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

            <button 
                className="mobile-filter-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? '✕ HIDE FILTERS' : '☰ SHOW FILTERS'}
            </button>

            <div className="peers-layout">
                <FilterSidebar 
                    filters={filters}
                    onChange={handleFilterChange}
                    onClear={clearFilters}
                    options={filterOptions}
                    isOpen={sidebarOpen}
                />
                
                <main className="peers-main">
                    <div className="table-controls">
                        <div className="result-count">
                            <span className="count-num">{filteredPeers.length}</span>
                            <span className="count-label">Peers Found</span>
                        </div>
                        {selectedIds.size > 0 && (
                            <div className="bulk-actions animate-fade-in">
                                <span>{selectedIds.size} selected</span>
                                <button className="cp-btn cp-btn-primary cp-btn-sm">Bulk Message</button>
                            </div>
                        )}
                    </div>
                    
                    <PeerTable 
                        peers={filteredPeers} 
                        loading={loading} 
                        onClear={clearFilters}
                        selectedIds={selectedIds}
                        onSelectAll={handleSelectAll}
                        onSelectRow={handleSelectRow}
                    />
                </main>
            </div>
        </div>
    );
};

