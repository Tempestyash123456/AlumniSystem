import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../lib/api.ts';
import { Input, Button, Alert } from '../../components/ui';

// ── Shared auth page shell ────────────────────────────────────────────────────
const AuthShell: React.FC<{
    title: string;
    subtitle: string;
    color?: string;
    children: React.ReactNode;
}> = ({ title, subtitle, color = 'var(--neon-cyan)', children }) => (
    <div
        className="bg-grid"
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
        <div className="cp-panel cp-corners animate-fade-in" style={{ width: '100%', maxWidth: 440, padding: 40 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '18px', fontWeight: 800, color, letterSpacing: '0.2em', textShadow: `0 0 20px ${color}`, marginBottom: 8 }}>
                    {title}
                </div>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
                    {subtitle}
                </div>
                <hr style={{ margin: '20px 0 0', border: 'none', height: 1, background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
            </div>
            {children}
        </div>
    </div>
);

// ── Forgot Password ───────────────────────────────────────────────────────────
export const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await authApi.forgotPassword(email);
            if (res.success && res.data) setMessage(res.data.message);
            else setError(res.error?.message || 'Request failed');
        } catch {
            setError('Network error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title="PWD_RESET" subtitle="ACCOUNT RECOVERY TERMINAL" color="var(--neon-amber)">
            {message ? (
                <Alert type="success">{message}</Alert>
            ) : (
                <>
                    {error && <div style={{ marginBottom: 20 }}><Alert type="error">{error}</Alert></div>}
                    <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', marginBottom: 24 }}>
                        Enter your email and we'll send a password reset link.
                    </p>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@university.edu" required />
                        <Button type="submit" loading={loading} style={{ width: '100%', background: 'linear-gradient(135deg, var(--neon-amber), #b07a00)', color: 'var(--bg-void)' }}>
                            {loading ? 'SENDING...' : 'SEND RESET LINK'}
                        </Button>
                    </form>
                </>
            )}
            <hr className="cp-divider" style={{ margin: '24px 0' }} />
            <p style={{ textAlign: 'center', fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                <Link to="/login" style={{ color: 'var(--neon-cyan)', textDecoration: 'none' }}>← Back to Login</Link>
            </p>
        </AuthShell>
    );
};

// ── Reset Password ────────────────────────────────────────────────────────────
export const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) { setError('Passwords do not match'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await authApi.resetPassword(token, password);
            if (res.success && res.data) {
                setMessage(res.data.message);
                setTimeout(() => navigate('/login'), 2500);
            } else {
                setError(res.error?.message || 'Reset failed');
            }
        } catch {
            setError('Network error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title="NEW_PASSWORD" subtitle="SET CREDENTIALS TERMINAL" color="var(--neon-green)">
            {message ? (
                <Alert type="success">{message}</Alert>
            ) : (
                <>
                    {error && <div style={{ marginBottom: 20 }}><Alert type="error">{error}</Alert></div>}
                    {!token && (
                        <Alert type="error">Invalid or missing reset token. Please request a new reset link.</Alert>
                    )}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars..." required disabled={!token} />
                        <Input label="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" required disabled={!token} />
                        <Button
                            type="submit"
                            loading={loading}
                            disabled={!token}
                            style={{ width: '100%', background: 'linear-gradient(135deg, var(--neon-green), #1a8800)', color: 'var(--bg-void)' }}
                        >
                            {loading ? 'SAVING...' : 'SET NEW PASSWORD'}
                        </Button>
                    </form>
                </>
            )}
        </AuthShell>
    );
};

// ── Verify Email ──────────────────────────────────────────────────────────────
export const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) { setStatus('error'); setMessage('No verification token found.'); return; }
        authApi.verifyEmail(token).then((res) => {
            if (res.success && res.data) { setStatus('success'); setMessage(res.data.message); }
            else { setStatus('error'); setMessage(res.error?.message || 'Verification failed.'); }
        }).catch(() => { setStatus('error'); setMessage('Network error.'); });
    }, [token]);

    return (
        <AuthShell title="EMAIL_VERIFY" subtitle="ACCOUNT ACTIVATION TERMINAL">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                {status === 'loading' && (
                    <>
                        <div className="cp-spinner" style={{ width: 40, height: 40, margin: '0 auto 20px' }} />
                        <p style={{ fontFamily: 'Share Tech Mono, monospace', color: 'var(--text-muted)' }}>Verifying token...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
                        <Alert type="success">{message}</Alert>
                        <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', marginTop: 16 }}>
                            <Link to="/login" style={{ color: 'var(--neon-cyan)', textDecoration: 'none' }}>Proceed to Login →</Link>
                        </p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div style={{ fontSize: 48, marginBottom: 16, color: 'var(--neon-pink)' }}>✕</div>
                        <Alert type="error">{message}</Alert>
                        <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', marginTop: 16 }}>
                            <Link to="/login" style={{ color: 'var(--neon-cyan)', textDecoration: 'none' }}>← Back to Login</Link>
                        </p>
                    </>
                )}
            </div>
        </AuthShell>
    );
};