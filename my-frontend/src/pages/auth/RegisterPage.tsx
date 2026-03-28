import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../lib/api.ts';
import { Input, Button, Alert } from '../../components/ui';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', password: '', phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState('');

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setLoading(true);
        try {
            const res = await authApi.register(form);
            if (res.success && res.data) {
                setSuccess(res.data.message);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                if (res.error?.fieldErrors) setFieldErrors(res.error.fieldErrors);
                else setError(res.error?.message || 'Registration failed');
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
            <div
                style={{
                    position: 'absolute', top: '15%', right: '8%',
                    width: 450, height: 450, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(191,90,242,0.05) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }}
            />

            <div
                className="cp-panel cp-corners animate-fade-in"
                style={{ width: '100%', maxWidth: 480, padding: '40px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div
                        style={{
                            fontFamily: 'Orbitron, monospace',
                            fontSize: '20px',
                            fontWeight: 800,
                            color: 'var(--neon-purple)',
                            letterSpacing: '0.2em',
                            textShadow: '0 0 20px var(--neon-purple)',
                            marginBottom: 8,
                        }}
                    >
                        NEW_USER
                    </div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
                        REGISTRATION TERMINAL
                    </div>
                    <hr className="cp-divider" style={{ margin: '20px 0 0', borderColor: 'rgba(191,90,242,0.3)' }} />
                </div>

                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <Alert type="success">{success}</Alert>
                        <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', marginTop: 16 }}>
                            Redirecting to login...
                        </p>
                    </div>
                ) : (
                    <>
                        {error && <div style={{ marginBottom: 20 }}><Alert type="error" onClose={() => setError('')}>{error}</Alert></div>}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <Input label="First Name" value={form.firstName} onChange={set('firstName')} placeholder="Ada" error={fieldErrors.firstName} required />
                                <Input label="Last Name" value={form.lastName} onChange={set('lastName')} placeholder="Lovelace" error={fieldErrors.lastName} required />
                            </div>
                            <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="ada@university.edu" error={fieldErrors.email} required />
                            <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min 8 chars, upper, lower, digit, symbol" error={fieldErrors.password} required />
                            <Input label="Phone (optional)" type="tel" value={form.phone} onChange={set('phone')} placeholder="+1-555-0100" />
                            <Button type="submit" loading={loading} style={{ width: '100%', marginTop: 4, background: 'linear-gradient(135deg, var(--neon-purple), #7b2fbf)' }}>
                                {loading ? 'REGISTERING...' : 'CREATE ACCOUNT'}
                            </Button>
                        </form>
                    </>
                )}

                <hr className="cp-divider" style={{ margin: '24px 0' }} />
                <p style={{ textAlign: 'center', fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Already have access?{' '}
                    <Link to="/login" style={{ color: 'var(--neon-cyan)', textDecoration: 'none' }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
};