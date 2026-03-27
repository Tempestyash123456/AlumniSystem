import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { PageContainer, SectionHeading, GlassCard, UiInput, UiAvatar, UiLinkButton } from '../components/ui/ModernUI';

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
        <PageContainer>
            {/* Header */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <SectionHeading
                    overline="// NETWORK_DIRECTORY"
                    title="ALUMNI NODES"
                    subtitle={`${filtered.length} operative${filtered.length !== 1 ? 's' : ''} found in network`}
                />
                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-cp text-xs"
                        style={{ color: 'rgba(148,163,184,0.95)' }}>⌕</span>
                    <UiInput
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="search operatives..."
                        className="pl-8 w-full"
                    />
                </div>
            </div>

            <hr className="cp-divider" />

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((alumni) => (
                    <div key={alumni.id} className="cp-card cp-soft-glass cp-hover-lift group cursor-pointer">
                        <div className="p-5 flex flex-col items-center text-center space-y-3">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <UiAvatar
                                    size="lg"
                                    src={alumni.profilePhotoUrl}
                                    initials={`${alumni.firstName[0]}${alumni.lastName[0]}`}
                                />
                                {/* Online dot */}
                                <span className="cp-status-online absolute bottom-0 right-0" />
                            </div>

                            {/* Name */}
                            <div>
                                <h3 className="font-display text-sm font-semibold tracking-wide" style={{ color: '#e2e8f0' }}>
                                    {alumni.firstName} {alumni.lastName}
                                </h3>
                                <p className="font-mono-cp text-xs mt-0.5 truncate max-w-[160px]"
                                    style={{ color: 'rgba(148,163,184,0.95)' }}>
                                    {alumni.email}
                                </p>
                            </div>

                            {/* Action */}
                            <UiLinkButton to={`/profile/${alumni.id}`}
                                variant="secondary"
                                className="w-full text-xs h-8 mt-1 inline-flex"
                                style={{ textDecoration: 'none' }}>
                                VIEW_PROFILE →
                            </UiLinkButton>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <GlassCard className="p-12 text-center space-y-2"
                    style={{ borderStyle: 'dashed' }}>
                    <p className="font-display text-xs tracking-widest" style={{ color: 'rgba(191,219,254,0.7)' }}>
                        NO_NODES_FOUND
                    </p>
                    <p className="font-mono-cp text-xs" style={{ color: 'rgba(148,163,184,0.88)' }}>
                        {search ? 'Adjust search parameters.' : 'No verified alumni in the network yet.'}
                    </p>
                </GlassCard>
            )}
        </PageContainer>
    );
};

export default Directory;