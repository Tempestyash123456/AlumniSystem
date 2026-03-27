import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!token) { setStatus('error'); setMessage('No verification token found in URL.'); return; }
        if (hasFetched.current) return;
        hasFetched.current = true;
        api.post('/auth/verify-email', { token })
            .then(res => { setStatus('success'); setMessage(res.data.data.message || 'Email verified!'); })
            .catch(err => { setStatus('error'); setMessage(err.response?.data?.error?.message || 'Verification failed. Link may be expired.'); });
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 cp-grid-bg relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0,245,255,0.04) 0%, transparent 60%)' }} />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <h1 className="font-display text-3xl font-bold tracking-widest glow-cyan" style={{ color: 'var(--cyan)' }}>PORTAL</h1>
                    <p className="font-mono-cp text-xs text-cyan-500/40 mt-2 tracking-widest">EMAIL VERIFICATION PROTOCOL</p>
                </div>

                <div className="cp-card cp-scanlines p-8 text-center space-y-6">
                    <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(0,245,255,0.1)' }}>
                        <span className="font-display text-xs tracking-widest text-cyan-400/80">VERIFY_IDENTITY.EXE</span>
                        <div className="flex gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500/60" />
                            <span className="w-2 h-2 rounded-full bg-amber-500/60" />
                            <span className="w-2 h-2 rounded-full bg-green-500/60" />
                        </div>
                    </div>

                    {status === 'loading' && (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-center">
                                <div className="cp-spinner" />
                            </div>
                            <p className="font-mono-cp text-sm animate-pulse" style={{ color: 'var(--cyan)' }}>
                                SCANNING TOKEN... PLEASE WAIT
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-5 py-2">
                            <div className="flex justify-center">
                                <div className="w-14 h-14 rounded-sm flex items-center justify-center text-2xl"
                                    style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.4)', boxShadow: '0 0 20px rgba(0,255,136,0.2)' }}>
                                    ✓
                                </div>
                            </div>
                            <div className="cp-alert-success">{message}</div>
                            <Link to="/login" className="cp-btn-primary w-full h-10 block text-center leading-10">
                                [ PROCEED TO LOGIN ]
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-5 py-2">
                            <div className="flex justify-center">
                                <div className="w-14 h-14 rounded-sm flex items-center justify-center text-2xl"
                                    style={{ background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.4)', boxShadow: '0 0 20px rgba(255,45,120,0.2)' }}>
                                    ✕
                                </div>
                            </div>
                            <div className="cp-alert-error">{message}</div>
                            <Link to="/register" className="cp-btn-secondary w-full h-10 block text-center leading-10 text-xs">
                                REQUEST NEW CREDENTIALS →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;