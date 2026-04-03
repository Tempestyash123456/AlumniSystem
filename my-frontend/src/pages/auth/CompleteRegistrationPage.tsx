import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../lib/api';
import { GraduationCap, Briefcase, ChevronRight, Loader2 } from 'lucide-react';

export const CompleteRegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();
    const [selectedRole, setSelectedRole] = useState<'alumni' | 'faculty' | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!selectedRole) return;

        setLoading(true);
        setError(null);

        try {
            const res = await authApi.completeOAuthRegistration(selectedRole);
            if (res.success && res.data) {
                // Update local store with new user info (roles + roleSelected flag)
                setUser(res.data.user, res.data.accessToken, res.data.refreshToken);
                navigate('/dashboard', { replace: true });
            } else {
                setError(res.error?.message || 'Failed to complete registration');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-grid" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div className="bg-scanlines" style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none', zIndex: 0 }}></div>
            
            <div className="cp-panel cp-corners animate-fade-in" style={{ width: '100%', maxWidth: '800px', padding: '40px', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div className="font-display glow-cyan" style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
                        USER_IDENTIFICATION
                    </div>
                    <div className="font-mono text-muted" style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        Welcome, <span className="text-neon-cyan">{user?.firstName} {user?.lastName}</span>. Select your access protocol.
                    </div>
                    <hr className="cp-divider-glow" style={{ margin: '24px 0 0' }} />
                </div>

                {error && (
                    <div className="cp-alert cp-alert-error" style={{ marginBottom: '24px' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    {/* Alumni Option */}
                    <button
                        onClick={() => setSelectedRole('alumni')}
                        className={`cp-card ${selectedRole === 'alumni' ? 'animate-pulse-glow' : ''}`}
                        style={{
                            padding: '32px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            borderStyle: 'solid',
                            borderWidth: '1px',
                            borderColor: selectedRole === 'alumni' ? 'var(--neon-cyan)' : 'var(--border-subtle)',
                            boxShadow: selectedRole === 'alumni' ? 'var(--shadow-cyan)' : 'none',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ 
                            width: '56px', 
                            height: '56px', 
                            borderRadius: '8px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            background: selectedRole === 'alumni' ? 'var(--neon-cyan)' : 'var(--bg-dark)',
                            color: selectedRole === 'alumni' ? 'var(--bg-void)' : 'var(--neon-cyan)',
                            transition: 'all 0.3s ease'
                        }}>
                            <GraduationCap size={32} />
                        </div>
                        <div>
                            <h3 className="font-display" style={{ fontSize: '20px', marginBottom: '8px', color: selectedRole === 'alumni' ? 'var(--neon-cyan)' : 'var(--text-primary)' }}>ALUMNI</h3>
                            <p className="font-body" style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                Connect with the community, mentor students, find career opportunities, and stay in touch with your batch.
                            </p>
                        </div>
                        {selectedRole === 'alumni' && (
                            <div className="font-mono" style={{ fontSize: '11px', color: 'var(--neon-cyan)', alignSelf: 'flex-end', display: 'flex', alignItems: 'center' }}>
                                PROTOCOL_SELECTED <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                            </div>
                        )}
                    </button>

                    {/* Faculty Option */}
                    <button
                        onClick={() => setSelectedRole('faculty')}
                        className={`cp-card ${selectedRole === 'faculty' ? 'animate-pulse-glow' : ''}`}
                        style={{
                            padding: '32px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            borderStyle: 'solid',
                            borderWidth: '1px',
                            borderColor: selectedRole === 'faculty' ? 'var(--neon-purple)' : 'var(--border-subtle)',
                            boxShadow: selectedRole === 'faculty' ? '0 0 20px rgba(191, 90, 242, 0.2)' : 'none',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ 
                            width: '56px', 
                            height: '56px', 
                            borderRadius: '8px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            background: selectedRole === 'faculty' ? 'var(--neon-purple)' : 'var(--bg-dark)',
                            color: selectedRole === 'faculty' ? '#fff' : 'var(--neon-purple)',
                            transition: 'all 0.3s ease'
                        }}>
                            <Briefcase size={32} />
                        </div>
                        <div>
                            <h3 className="font-display" style={{ fontSize: '20px', marginBottom: '8px', color: selectedRole === 'faculty' ? 'var(--neon-purple)' : 'var(--text-primary)' }}>FACULTY</h3>
                            <p className="font-body" style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                Manage campus resources, engage with students and alumni, and support the university's academic mission.
                            </p>
                        </div>
                        {selectedRole === 'faculty' && (
                            <div className="font-mono" style={{ fontSize: '11px', color: 'var(--neon-purple)', alignSelf: 'flex-end', display: 'flex', alignItems: 'center' }}>
                                PROTOCOL_SELECTED <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                            </div>
                        )}
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedRole || loading}
                        className={`cp-btn cp-btn-primary cp-btn-lg ${selectedRole ? 'animate-pulse-glow' : ''}`}
                        style={{ width: '100%', maxWidth: '400px' }}
                    >
                        {loading && <Loader2 className="animate-spin" size={20} />}
                        {loading ? 'INITIALIZING_PROFILE...' : 'COMPLETE_REGISTRATION'}
                    </button>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Note: Chosen protocol can be updated via administrative terminals post-registration.
                    </div>
                </div>
            </div>
        </div>
    );
};
