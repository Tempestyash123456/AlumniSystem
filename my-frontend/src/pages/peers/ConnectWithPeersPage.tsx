import React, { useState, useEffect } from 'react';
import { alumniApi } from '../../lib/api';
import type { AlumniDto, PeerGroupDto } from '../../types';
import './Peers.css';

type Step = 'program' | 'year' | 'country' | 'state' | 'city' | 'peers';

export const ConnectWithPeersPage: React.FC = () => {
    const [step, setStep] = useState<Step>('program');
    const [loading, setLoading] = useState(false);
    
    const [filters, setFilters] = useState({
        program: '',
        year: 0,
        country: '',
        state: '',
        city: ''
    });

    const [groups, setGroups] = useState<PeerGroupDto[]>([]);
    const [peers, setPeers] = useState<AlumniDto[]>([]);

    useEffect(() => {
        fetchCurrentLevel();
    }, [step, filters]);

    const fetchCurrentLevel = async () => {
        setLoading(true);
        try {
            let res;
            switch (step) {
                case 'program':
                    res = await alumniApi.getPeerPrograms();
                    if (res.success) setGroups(res.data || []);
                    break;
                case 'year':
                    res = await alumniApi.getPeerYears(filters.program);
                    if (res.success) setGroups(res.data || []);
                    break;
                case 'country':
                    res = await alumniApi.getPeerCountries(filters.program, filters.year);
                    if (res.success) setGroups(res.data || []);
                    break;
                case 'state':
                    res = await alumniApi.getPeerStates(filters.program, filters.year, filters.country);
                    if (res.success) setGroups(res.data || []);
                    break;
                case 'city':
                    res = await alumniApi.getPeerCities(filters.program, filters.year, filters.country, filters.state);
                    if (res.success) setGroups(res.data || []);
                    break;
                case 'peers':
                    res = await alumniApi.getPeers(filters.program, filters.year, filters.country, filters.state, filters.city);
                    if (res.success) setPeers(res.data || []);
                    break;
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGroupClick = (name: string) => {
        switch (step) {
            case 'program':
                setFilters(f => ({ ...f, program: name }));
                setStep('year');
                break;
            case 'year':
                setFilters(f => ({ ...f, year: parseInt(name) }));
                setStep('country');
                break;
            case 'country':
                setFilters(f => ({ ...f, country: name }));
                setStep('state');
                break;
            case 'state':
                setFilters(f => ({ ...f, state: name }));
                setStep('city');
                break;
            case 'city':
                setFilters(f => ({ ...f, city: name }));
                setStep('peers');
                break;
        }
    };

    const goBackTo = (targetStep: Step) => {
        setStep(targetStep);
        if (targetStep === 'program') setFilters({ program: '', year: 0, country: '', state: '', city: '' });
        else if (targetStep === 'year') setFilters(f => ({ ...f, year: 0, country: '', state: '', city: '' }));
        else if (targetStep === 'country') setFilters(f => ({ ...f, country: '', state: '', city: '' }));
        else if (targetStep === 'state') setFilters(f => ({ ...f, state: '', city: '' }));
        else if (targetStep === 'city') setFilters(f => ({ ...f, city: '' }));
    };

    const renderHeader = () => {
        const steps: { key: Step; label: string; value?: string | number }[] = [
            { key: 'program', label: 'Programs', value: filters.program },
            { key: 'year', label: 'Graduation Year', value: filters.year || undefined },
            { key: 'country', label: 'Country', value: filters.country },
            { key: 'state', label: 'State', value: filters.state },
            { key: 'city', label: 'City', value: filters.city },
            { key: 'peers', label: 'Peers' }
        ];

        return (
            <div className="peers-breadcrumb">
                <span onClick={() => goBackTo('program')} className={step === 'program' ? 'active' : ''}>Connect</span>
                {steps.map((s, idx) => {
                    const isVisible = steps.slice(0, idx).every(prev => prev.value);
                    if (!isVisible && s.key !== 'program') return null;
                    if (s.key === 'peers' && step !== 'peers') return null;
                    
                    return (
                        <React.Fragment key={s.key}>
                            <span> / </span>
                            <span 
                                onClick={() => goBackTo(s.key)}
                                className={step === s.key ? 'active' : ''}
                            >
                                {s.value || s.label}
                            </span>
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    if (loading) return <div className="loading-state">Loading connection data...</div>;

    return (
        <div className="peers-container">
            <h1 style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em', marginBottom: '8px' }}>
                CONNECT WITH PEERS
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Find alumni from your program, year, or location.
            </p>

            {renderHeader()}

            {step !== 'peers' ? (
                <div className="peers-grid">
                    {groups.map((g, i) => (
                        <div 
                            key={`${g.name}-${i}`} 
                            className="peer-group-card"
                            onClick={() => handleGroupClick(g.name)}
                        >
                            <div className="peer-group-title">
                                {step === 'year' ? `Class of ${g.name}` : g.name}
                            </div>
                            <div className="peer-group-count">
                                {g.count} Member{g.count !== 1 ? 's' : ''}
                            </div>
                        </div>
                    ))}
                    {groups.length === 0 && (
                        <div className="empty-state">No matching peer groups found.</div>
                    )}
                </div>
            ) : (
                <div className="peers-grid">
                    {peers.map((peer) => (
                        <div key={peer.id} className="peer-card">
                            <img 
                                src={peer.profilePhotoUrl || '/default-avatar.png'} 
                                alt={`${peer.firstName} ${peer.lastName}`} 
                                className="peer-avatar"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }}
                            />
                            <div className="peer-info">
                                <div className="peer-name">{peer.firstName} {peer.lastName}</div>
                                <div className="peer-email">{peer.email}</div>
                            </div>
                        </div>
                    ))}
                    {peers.length === 0 && (
                        <div className="empty-state">No peers found in this city.</div>
                    )}
                </div>
            )}
        </div>
    );
};
