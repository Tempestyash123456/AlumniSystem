import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
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
            setServerError(error.response?.data?.error?.message || 'Invalid email or password.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
            {/* Shadcn Card Equivalent */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-50 shadow w-full max-w-md backdrop-blur-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="font-semibold tracking-tight text-2xl">Welcome back</h3>
                    <p className="text-sm text-zinc-400">Enter your email to sign in to your account.</p>
                </div>
                
                <div className="p-6 pt-0">
                    {serverError && (
                        <div className="rounded-md border border-red-900/50 bg-red-900/20 p-3 mb-6 text-sm text-red-400">
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="shadcn-label">Email</label>
                            <input type="email" {...register('email')} className="shadcn-input" placeholder="m@example.com" />
                            {errors.email && <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="shadcn-label !mb-0">Password</label>
                                <Link to="/forgot-password" className="text-sm font-medium text-zinc-400 hover:text-zinc-50 hover:underline">Forgot password?</Link>
                            </div>
                            <input type="password" {...register('password')} className="shadcn-input" />
                            {errors.password && <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>}
                        </div>

                        <button type="submit" disabled={isSubmitting} className="shadcn-button mt-4">
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <div className="flex items-center justify-center p-6 pt-0">
                    <p className="text-sm text-zinc-400">
                        Don't have an account? <Link to="/register" className="text-zinc-50 hover:underline underline-offset-4">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;