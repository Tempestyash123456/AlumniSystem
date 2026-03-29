// my-frontend/src/pages/auth/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../lib/api.ts';
import { useAuthStore } from '../../store/authStore.ts';
import { Input, Button, Alert } from '../../components/ui';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { setUser } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setLoading(true);
        try {
            const res = await authApi.login(email, password);
            if (res.success && res.data) {
                setUser(res.data.user, res.data.accessToken, res.data.refreshToken);
                navigate('/dashboard');
            } else {
                if (res.error?.fieldErrors) setFieldErrors(res.error.fieldErrors);
                else setError(res.error?.message || 'Login failed');
            }
        } catch {
            setError('Network error. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };

    return (
        <div className="bg-grid" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div className="cp-panel cp-corners animate-fade-in" style={{ width: '100%', maxWidth: 440, padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 800, color: 'var(--neon-cyan)', letterSpacing: '0.25em', textShadow: '0 0 20px var(--neon-cyan)', marginBottom: 8 }}>
                        ALUMNI_PORTAL
                    </div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
                        SECURE ACCESS TERMINAL
                    </div>
                    <hr className="cp-divider-glow" style={{ margin: '20px 0 0' }} />
                </div>

                {error && <div style={{ marginBottom: 20 }}><Alert type="error" onClose={() => setError('')}>{error}</Alert></div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@university.edu" error={fieldErrors.email} required />
                    <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" error={fieldErrors.password} required />

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Link to="/forgot-password" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--neon-cyan)', textDecoration: 'none', opacity: 0.8 }}>Forgot password?</Link>
                    </div>

                    <Button type="submit" loading={loading} style={{ width: '100%' }}>
                        {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
                    </Button>
                </form>

                <div style={{ margin: '24px 0', position: 'relative', textAlign: 'center' }}>
                    <span style={{ background: 'var(--bg-void)', padding: '0 10px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace', position: 'relative', zIndex: 1 }}>OR_EXTERNAL_AUTH</span>
                    <hr style={{ position: 'absolute', top: '50%', width: '100%', border: 'none', height: '1px', background: 'rgba(0, 245, 255, 0.1)' }} />
                </div>

                <button
                    onClick={handleGoogleLogin}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '11px',
                        background: 'transparent',
                        border: '1px solid rgba(0,245,255,0.25)',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                        fontFamily: 'Share Tech Mono, monospace',
                        fontSize: '12px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--neon-cyan)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--neon-cyan)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 12px rgba(0,245,255,0.15), inset 0 0 12px rgba(0,245,255,0.04)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,245,255,0.25)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 16, height: 16, opacity: 0.85 }} />
                    Continue with Google
                </button>

                <hr className="cp-divider" style={{ margin: '28px 0' }} />
                <p style={{ textAlign: 'center', fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                    New user? <Link to="/register" style={{ color: 'var(--neon-cyan)', textDecoration: 'none', fontWeight: 600 }}>Create Account</Link>
                </p>
            </div>
        </div>
    );
};