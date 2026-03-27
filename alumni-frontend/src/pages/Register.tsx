import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { UiButton, UiInput, UiLinkButton } from '../components/ui/ModernUI';

const registerSchema = z.object({
    firstName: z.string().min(2, 'Required'),
    lastName:  z.string().min(2, 'Required'),
    email:     z.string().email('Invalid email'),
    password:  z.string().min(8, 'Min 8 chars'),
    phone:     z.string().min(10, 'Invalid phone'),
});
type RegisterFormInputs = z.infer<typeof registerSchema>;

const Register = () => {
    const [serverError,     setServerError]     = useState<string | null>(null);
    const [successMessage,  setSuccessMessage]  = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormInputs>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormInputs) => {
        setServerError(null); setSuccessMessage(null);
        try {
            const response = await api.post('/auth/register', data);
            setSuccessMessage(response.data.data.message || 'Registration successful! Check your email.');
        } catch (error: any) {
            setServerError(error.response?.data?.error?.message || 'REGISTRATION_FAILED: Try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 py-10 cp-grid-bg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.18) 0%, transparent 70%)' }} />

            <div className="w-full max-w-md relative z-10 cp-slide-up">
                <div className="text-center mb-8">
                    <p className="font-mono-cp text-xs tracking-[0.3em] text-cyan-500/60 mb-3">ALUMNI_NETWORK // v2.0</p>
                    <h1 className="font-display text-3xl font-bold tracking-widest glow-cyan" style={{ color: 'var(--cyan)' }}>PORTAL</h1>
                    <p className="font-mono-cp text-xs text-cyan-500/40 mt-2 tracking-widest">NEW OPERATIVE REGISTRATION</p>
                </div>

                <div className="cp-card cp-scanlines cp-soft-glass p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(148,163,184,0.28)' }}>
                        <span className="font-display text-xs tracking-widest" style={{ color: 'rgba(191,219,254,0.9)' }}>REGISTER_OPERATIVE.EXE</span>
                        <div className="flex gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500/60" />
                            <span className="w-2 h-2 rounded-full bg-amber-500/60" />
                            <span className="w-2 h-2 rounded-full bg-green-500/60" />
                        </div>
                    </div>

                    {serverError    && <div className="cp-alert-error"><span className="cp-status-offline mr-2" />{serverError}</div>}
                    {successMessage && (
                        <div className="cp-alert-success space-y-3">
                            <div><span className="cp-status-online mr-2" />{successMessage}</div>
                            <UiLinkButton to="/login" className="w-full h-9 text-xs block text-center leading-9">
                                → PROCEED TO LOGIN
                            </UiLinkButton>
                        </div>
                    )}

                    {!successMessage && (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="cp-label">// first_name</label>
                                    <UiInput type="text" {...register('firstName')} placeholder="John" />
                                    {errors.firstName && <p className="font-mono-cp text-xs mt-1" style={{ color: 'var(--pink)' }}>⚠ {errors.firstName.message}</p>}
                                </div>
                                <div>
                                    <label className="cp-label">// last_name</label>
                                    <UiInput type="text" {...register('lastName')} placeholder="Doe" />
                                    {errors.lastName && <p className="font-mono-cp text-xs mt-1" style={{ color: 'var(--pink)' }}>⚠ {errors.lastName.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="cp-label">// email_address</label>
                                <UiInput type="email" {...register('email')} placeholder="operative@network.sys" />
                                {errors.email && <p className="font-mono-cp text-xs mt-1" style={{ color: 'var(--pink)' }}>⚠ {errors.email.message}</p>}
                            </div>
                            <div>
                                <label className="cp-label">// phone_number</label>
                                <UiInput type="tel" {...register('phone')} placeholder="+91 98765 43210" />
                                {errors.phone && <p className="font-mono-cp text-xs mt-1" style={{ color: 'var(--pink)' }}>⚠ {errors.phone.message}</p>}
                            </div>
                            <div>
                                <label className="cp-label">// passphrase</label>
                                <UiInput type="password" {...register('password')} placeholder="Min 8 chars, mixed case + symbol" />
                                {errors.password && <p className="font-mono-cp text-xs mt-1" style={{ color: 'var(--pink)' }}>⚠ {errors.password.message}</p>}
                            </div>
                            <UiButton type="submit" disabled={isSubmitting} className="w-full h-10 mt-2">
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                        REGISTERING...
                                    </span>
                                ) : '[ REQUEST_ACCESS ]'}
                            </UiButton>
                        </form>
                    )}

                    <div className="text-center pt-2" style={{ borderTop: '1px solid rgba(148,163,184,0.24)' }}>
                        <p className="font-mono-cp text-xs" style={{ color: 'rgba(191,219,254,0.84)' }}>
                            ALREADY REGISTERED?{' '}
                            <Link to="/login" className="cp-link" style={{ color: 'var(--cyan)' }}>LOGIN →</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;