import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Min 6 characters'),
});
type LoginFormInputs = z.infer<typeof loginSchema>;

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormInputs) => {
        setServerError(null);
        try {
            const response = await api.post('/auth/login', data);
            const { accessToken, refreshToken, user } = response.data.data;
            login(accessToken, refreshToken, user);
            navigate('/');
        } catch (error: any) {
            setServerError(error.response?.data?.error?.message || 'ACCESS_DENIED: Invalid credentials.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 cp-grid-bg relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(0,245,255,0.06) 0%, transparent 70%)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,45,120,0.05) 0%, transparent 70%)' }} />

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="font-mono-cp text-xs tracking-[0.3em] text-cyan-500/60 mb-3">ALUMNI_NETWORK // v2.0</p>
                    <h1 className="font-display text-3xl font-bold tracking-widest glow-cyan" style={{ color: 'var(--cyan)' }}>
                        PORTAL
                    </h1>
                    <p className="font-mono-cp text-xs text-cyan-500/40 mt-2 tracking-widest">INITIALIZE AUTHENTICATION SEQUENCE</p>
                </div>

                {/* Card */}
                <div className="cp-card cp-scanlines p-8 space-y-6">
                    {/* Title bar */}
                    <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(0,245,255,0.1)' }}>
                        <span className="font-display text-xs tracking-widest text-cyan-400/80">AUTH_LOGIN.EXE</span>
                        <div className="flex gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500/60" />
                            <span className="w-2 h-2 rounded-full bg-amber-500/60" />
                            <span className="w-2 h-2 rounded-full bg-green-500/60" />
                        </div>
                    </div>

                    {serverError && (
                        <div className="cp-alert-error flex items-center gap-2">
                            <span className="cp-status-offline" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="cp-label">// email_address</label>
                            <input type="email" {...register('email')} className="cp-input" placeholder="operative@network.sys" />
                            {errors.email && <p className="font-mono-cp text-xs mt-1" style={{ color: 'var(--pink)' }}>⚠ {errors.email.message}</p>}
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="cp-label mb-0">// passphrase</label>
                                <Link to="/forgot-password" className="font-mono-cp text-xs tracking-wide transition-colors"
                                    style={{ color: 'rgba(0,245,255,0.4)' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,245,255,0.4)')}>
                                    [FORGOT?]
                                </Link>
                            </div>
                            <input type="password" {...register('password')} className="cp-input" placeholder="••••••••••••" />
                            {errors.password && <p className="font-mono-cp text-xs mt-1" style={{ color: 'var(--pink)' }}>⚠ {errors.password.message}</p>}
                        </div>

                        <button type="submit" disabled={isSubmitting} className="cp-btn-primary w-full mt-2 h-10">
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                    AUTHENTICATING...
                                </span>
                            ) : '[ AUTHENTICATE ]'}
                        </button>
                    </form>

                    <div className="text-center pt-2" style={{ borderTop: '1px solid rgba(0,245,255,0.08)' }}>
                        <p className="font-mono-cp text-xs" style={{ color: 'rgba(0,245,255,0.4)' }}>
                            NO CREDENTIALS?{' '}
                            <Link to="/register" className="transition-colors"
                                style={{ color: 'var(--cyan)' }}
                                onMouseEnter={e => (e.currentTarget.style.textShadow = '0 0 8px rgba(0,245,255,0.8)')}
                                onMouseLeave={e => (e.currentTarget.style.textShadow = 'none')}>
                                REQUEST_ACCESS →
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="font-mono-cp text-xs text-center mt-4" style={{ color: 'rgba(0,245,255,0.2)' }}>
                    SECURE_CHANNEL :: JWT_ENCRYPTED :: TLS_v1.3
                </p>
            </div>
        </div>
    );
};

export default Login;