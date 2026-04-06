import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { profileApi } from '../../lib/api';
import type { ProfileResponse } from '../../types';
import { LoadingScreen } from '../../components/ui';

interface MembershipCardProps {
    isDark: boolean;
    profile: ProfileResponse | null;
    roles?: string[]; // Added roles for dynamic labeling
    qrData: string;
    cardRef?: React.RefObject<HTMLDivElement | null>;
    style?: React.CSSProperties;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ isDark, profile, roles = [], qrData, cardRef, style }) => {
    // Role labeling logic
    let roleLabel = '';
    if (roles.includes('ROLE_FACULTY')) roleLabel = 'FACULTY';
    else if (roles.includes('ROLE_ALUMNI')) roleLabel = 'ALUMNI';
    // ADMIN only -> hide label

    return (
        <div
            ref={cardRef}
            className="cp-corners"
            style={{
                width: '600px',
                height: '340px',
                background: isDark 
                    ? 'linear-gradient(135deg, rgba(13, 21, 40, 0.95), rgba(7, 11, 20, 0.98))'
                    : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${isDark ? 'var(--border-active)' : '#00f5ff'}`, // Fixed color for light mode capture
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isDark 
                    ? '0 0 40px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 245, 255, 0.05)'
                    : '0 10px 30px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                color: isDark ? '#e2eaf8' : '#050505', // Explicit colors for capture reliability
                ...style
            }}
        >
            {/* Background Decorations */}
            <div className="bg-grid bg-scanlines" style={{ position: 'absolute', inset: 0, opacity: isDark ? 0.3 : 0.1, pointerEvents: 'none' }}></div>
            <div style={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                padding: '12px 24px', 
                borderLeft: `1px solid ${isDark ? '#1a2540' : 'rgba(0, 245, 255, 0.2)'}`, 
                borderBottom: `1px solid ${isDark ? '#1a2540' : 'rgba(0, 245, 255, 0.2)'}`, 
                fontFamily: 'Orbitron, sans-serif', 
                fontSize: '11px', 
                color: isDark ? '#00f5ff' : '#0099aa', // Use explicit cyan tone for light mode
                background: isDark ? 'rgba(0,245,255,0.08)' : 'rgba(0,245,255,0.05)', 
                backdropFilter: 'blur(4px)', 
                borderBottomLeftRadius: 'var(--radius-md)' 
            }}>
                ID: {profile?.studentId || 'N/A'}
            </div>

            {/* Top Section */}
            <div style={{ display: 'flex', gap: '28px', marginBottom: '36px', zIndex: 1, alignItems: 'center' }}>
                <div style={{
                    width: '110px',
                    height: '110px',
                    border: `2px solid ${isDark ? '#00f5ff' : '#ff2d78'}`, // Using explicit pink for light accent
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: isDark ? '0 0 15px rgba(0,245,255,0.3)' : '0 4px 12px rgba(255, 45, 120, 0.15)',
                    background: isDark ? '#030409' : '#fff',
                    flexShrink: 0
                }}>
                    {profile?.profilePhotoUrl ? (
                        <img src={profile.profilePhotoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontFamily: 'Orbitron', background: 'linear-gradient(135deg, #00f5ff, #bf5af2)', color: '#fff' }}>
                            {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h2 className="font-display" style={{ 
                        fontSize: '28px', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em', 
                        margin: 0,
                        color: isDark ? '#e2eaf8' : '#1a1a1a', 
                        textShadow: isDark ? '0 0 10px rgba(0, 245, 255, 0.4)' : 'none'
                    }}>
                        {profile?.firstName} {profile?.lastName}
                    </h2>
                    {roleLabel && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '40px', height: '1px', background: isDark ? '#00f5ff' : '#ff2d78' }}></div>
                            <p style={{ 
                                color: isDark ? '#00f5ff' : '#ff2d78', 
                                fontFamily: 'Rajdhani, sans-serif', 
                                fontSize: '14px', 
                                letterSpacing: '2px', 
                                margin: 0,
                                fontWeight: 700
                            }}>
                                {roleLabel} MEMBER
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Details / QR Section */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 40px' }}>
                    <DetailRow label="PROGRAM" value={profile?.program || 'N/A'} isDark={isDark} />
                    <DetailRow label="DISCIPLINE" value={profile?.discipline || 'N/A'} isDark={isDark} />
                    <DetailRow label="GRAD YEAR" value={profile?.graduationYear?.toString() || 'N/A'} isDark={isDark} />
                </div>

                <div style={{
                    padding: '10px',
                    background: '#fff',
                    borderRadius: '4px',
                    boxShadow: isDark ? '0 0 25px rgba(0, 245, 255, 0.2)' : '0 4px 15px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${isDark ? '#00f5ff' : 'rgba(211, 47, 47, 0.3)'}`
                }}>
                    <QRCodeSVG
                        value={qrData}
                        size={90}
                        level="H"
                        includeMargin={false}
                        fgColor="#050505"
                    />
                </div>
            </div>

            {/* Bottom Decoration */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: isDark 
                    ? 'linear-gradient(90deg, #00f5ff, #bf5af2, #ff2d78)'
                    : 'linear-gradient(90deg, #d32f2f, #9a0007, #424242)',
                boxShadow: isDark ? '0 -2px 10px rgba(0, 245, 255, 0.3)' : 'none'
            }}></div>
        </div>
    );
};

const DetailRow: React.FC<{ label: string; value: string; isDark: boolean }> = ({ label, value, isDark }) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ 
            fontSize: '10px', 
            color: isDark ? '#8a99b3' : '#666', 
            fontFamily: 'Orbitron, sans-serif', 
            letterSpacing: '1px',
            marginBottom: '2px'
        }}>{label}</span>
        <span style={{ 
            fontSize: '15px', 
            fontWeight: 600, 
            color: isDark ? '#e2eaf8' : '#1a1a1a',
            fontFamily: 'Outfit, sans-serif'
        }}>{value}</span>
    </div>
);

export const MembershipPage: React.FC = () => {
    const { user } = useAuthStore();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cardType, setCardType] = useState<'general' | 'exclusive'>('general');
    
    // UI Ref
    const cardRef = useRef<HTMLDivElement>(null);
    // Hidden Ref for capturing light mode PNG
    const downloadRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await profileApi.getMyProfile();
                if (res.success && res.data) {
                    setProfile(res.data);
                } else {
                    setError(res.error?.message || 'Failed to load profile');
                }
            } catch {
                setError('A network error occurred while fetching profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleDownload = async () => {
        if (!downloadRef.current) return;
        try {
            // pixelRatio: 3 for high resolution
            const dataUrl = await toPng(downloadRef.current, { 
                cacheBust: true, 
                pixelRatio: 3,
                style: {
                    visibility: 'visible' // Ensure it's rendered for capture
                }
            });
            const link = document.createElement('a');
            link.download = `membership-card-${user?.firstName}-${user?.lastName}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Download failed', err);
        }
    };

    if (loading) return <LoadingScreen />;

    if (error) {
        return (
            <div className="cp-panel" style={{ padding: '40px', textAlign: 'center' }}>
                <div className="cp-error" style={{ justifyContent: 'center', fontSize: '20px' }}>
                    ⚠️ {error}
                </div>
            </div>
        );
    }

    const qrData = JSON.stringify({
        id: profile?.studentId || profile?.userId,
        name: `${profile?.firstName} ${profile?.lastName}`,
        program: profile?.program,
        discipline: profile?.discipline,
        gradYear: profile?.graduationYear,
        type: cardType === 'general' ? 'GENERAL' : 'EXCLUSIVE'
    });

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Hidden export version (always light) */}
            <div style={{ position: 'fixed', top: '-2000px', left: '-2000px', pointerEvents: 'none' }}>
                <MembershipCard 
                    cardRef={downloadRef}
                    isDark={false} 
                    profile={profile} 
                    roles={user?.roles || []}
                    qrData={qrData} 
                />
            </div>

            {/* Header / Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                <div>
                    <h1 className="glow-cyan" style={{ fontSize: 'var(--font-size-3xl)', marginBottom: '8px' }}>MEMBERSHIP STATUS</h1>
                    <p style={{ color: 'var(--text-secondary)', fontFamily: 'Share Tech Mono, monospace' }}>
                        ID: {profile?.studentId || profile?.userId} | LEVEL: {cardType.toUpperCase()}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', background: 'var(--bg-dark)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <button
                        onClick={() => setCardType('general')}
                        className={`cp-btn cp-btn-sm ${cardType === 'general' ? 'cp-btn-primary' : 'cp-btn-ghost'}`}
                        style={{ padding: '8px 24px', minWidth: '150px' }}
                    >
                        GENERAL
                    </button>
                    <button
                        onClick={() => setCardType('exclusive')}
                        className={`cp-btn cp-btn-sm ${cardType === 'exclusive' ? 'cp-btn-primary' : 'cp-btn-ghost'}`}
                        style={{ padding: '8px 24px', minWidth: '150px' }}
                    >
                        EXCLUSIVE
                    </button>
                </div>
            </div>

            {cardType === 'exclusive' ? (
                <div className="cp-panel animate-pulse-glow" style={{ padding: '80px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                    <div style={{ fontSize: '64px', color: 'var(--neon-amber)', filter: 'drop-shadow(0 0 10px var(--neon-amber))' }}>⭐</div>
                    <h2 className="font-display" style={{ color: 'var(--neon-amber)', fontSize: '36px' }}>EXCLUSIVE RIGHTS</h2>
                    <div className="cp-divider-glow" style={{ width: '200px', background: 'linear-gradient(90deg, transparent, var(--neon-amber), transparent)', boxShadow: '0 0 8px var(--neon-amber)' }}></div>
                    <p style={{ maxWidth: '500px', color: 'var(--text-secondary)', fontSize: 'var(--font-size-md)' }}>
                        The Exclusive Membership Card for distinguished alumni is currently under preparation.
                        Elevated access and elite privileges are coming soon.
                    </p>
                    <div className="cp-badge cp-badge-amber" style={{ fontSize: '14px', padding: '8px 20px' }}>STATUS: PENDING UPGRADE</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
                    
                    {/* UI version (theme-dependent) */}
                    <MembershipCard 
                        cardRef={cardRef}
                        isDark={isDark} 
                        profile={profile} 
                        roles={user?.roles || []}
                        qrData={qrData} 
                    />

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button className="cp-btn cp-btn-primary cp-btn-lg" onClick={handleDownload}>
                            <span>📥</span> DOWNLOAD CARD
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
