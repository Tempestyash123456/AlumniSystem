import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { UiButton, UiInput } from '../components/ui/ModernUI';

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
                style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.2) 0%, transparent 70%)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)' }} />

            <div className="w-full max-w-md relative z-10 cp-slide-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="font-mono-cp text-xs tracking-[0.3em] text-cyan-500/60 mb-3">ALUMNI_NETWORK // v2.0</p>
                    <h1 className="font-display text-3xl font-bold tracking-widest glow-cyan" style={{ color: 'var(--cyan)' }}>
                        PORTAL
                    </h1>
                    <p className="font-mono-cp text-xs text-cyan-500/40 mt-2 tracking-widest">INITIALIZE AUTHENTICATION SEQUENCE</p>
                </div>

                {/* Card */}
                <div className="cp-card cp-scanlines cp-soft-glass p-8 space-y-6">
                    {/* Title bar */}
                    <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(148,163,184,0.28)' }}>
                        <span className="font-display text-xs tracking-widest" style={{ color: 'rgba(191,219,254,0.9)' }}>AUTH_LOGIN.EXE</span>
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
                            <UiInput type="email" {...register('email')} placeholder="operative@network.sys" />
                            {errors.email && <p className="font-mono-cp text-xs mt-1" style={{ color: 'var(--pink)' }}>⚠ {errors.email.message}</p>}
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="cp-label mb-0">// passphrase</label>
                                <Link to="/forgot-password" className="font-mono-cp text-xs tracking-wide cp-link">
                                    [FORGOT?]
                                </Link>
                            </div>
                            <UiInput type="password" {...register('password')} placeholder="••••••••••••" />
                            {errors.password && <p className="font-mono-cp text-xs mt-1" style={{ color: 'var(--pink)' }}>⚠ {errors.password.message}</p>}
                        </div>

                        <UiButton type="submit" disabled={isSubmitting} className="w-full mt-2 h-10">
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                    AUTHENTICATING...
                                </span>
                            ) : '[ AUTHENTICATE ]'}
                        </UiButton>
                    </form>

                    <div className="text-center pt-2" style={{ borderTop: '1px solid rgba(148,163,184,0.24)' }}>
                        <p className="font-mono-cp text-xs" style={{ color: 'rgba(191,219,254,0.84)' }}>
                            NO CREDENTIALS?{' '}
                            <Link to="/register" className="cp-link"
                                style={{ color: 'var(--cyan)' }}>
                                REQUEST_ACCESS →
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="font-mono-cp text-xs text-center mt-4" style={{ color: 'rgba(148,163,184,0.84)' }}>
                    SECURE_CHANNEL :: JWT_ENCRYPTED :: TLS_v1.3
                </p>
            </div>
        </div>
    );
};

export default Login;