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

    return (
        <div
            className="bg-grid"
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Ambient glow blobs */}
            <div
                style={{
                    position: 'absolute',
                    top: '20%',
                    left: '10%',
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0,245,255,0.06) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '10%',
                    width: 350,
                    height: 350,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,45,120,0.05) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }}
            />

            <div
                className="cp-panel cp-corners animate-fade-in"
                style={{ width: '100%', maxWidth: 440, padding: '40px' }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div
                        style={{
                            fontFamily: 'Orbitron, monospace',
                            fontSize: '22px',
                            fontWeight: 800,
                            color: 'var(--neon-cyan)',
                            letterSpacing: '0.25em',
                            textShadow: '0 0 20px var(--neon-cyan)',
                            marginBottom: 8,
                        }}
                    >
                        ALUMNI_PORTAL
                    </div>
                    <div
                        style={{
                            fontFamily: 'Share Tech Mono, monospace',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            letterSpacing: '0.15em',
                        }}
                    >
                        SECURE ACCESS TERMINAL
                    </div>
                    <hr className="cp-divider-glow" style={{ margin: '20px 0 0' }} />
                </div>

                {error && (
                    <div style={{ marginBottom: 20 }}>
                        <Alert type="error" onClose={() => setError('')}>{error}</Alert>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <Input
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@university.edu"
                        error={fieldErrors.email}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        error={fieldErrors.password}
                        required
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Link
                            to="/forgot-password"
                            style={{
                                fontFamily: 'Share Tech Mono, monospace',
                                fontSize: '12px',
                                color: 'var(--neon-cyan)',
                                textDecoration: 'none',
                                opacity: 0.8,
                            }}
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <Button type="submit" loading={loading} style={{ width: '100%', marginTop: 4 }}>
                        {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
                    </Button>
                </form>

                <hr className="cp-divider" style={{ margin: '28px 0' }} />

                <p
                    style={{
                        textAlign: 'center',
                        fontFamily: 'Share Tech Mono, monospace',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                    }}
                >
                    New user?{' '}
                    <Link
                        to="/register"
                        style={{ color: 'var(--neon-cyan)', textDecoration: 'none', fontWeight: 600 }}
                    >
                        Create Account
                    </Link>
                </p>
            </div>
        </div>
    );
};