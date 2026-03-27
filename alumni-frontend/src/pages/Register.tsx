import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const registerSchema = z.object({
    firstName: z.string().min(2, 'Required'),
    lastName: z.string().min(2, 'Required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Min 8 chars'),
    phone: z.string().min(10, 'Invalid phone'),
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

const Register = () => {
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormInputs>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormInputs) => {
        setServerError(null); setSuccessMessage(null);
        try {
            const response = await api.post('/auth/register', data);
            setSuccessMessage(response.data.data.message || 'Registration successful! Please check your email.');
        } catch (error: any) {
            setServerError(error.response?.data?.error?.message || 'Failed to register.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 py-10">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-50 shadow w-full max-w-md backdrop-blur-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="font-semibold tracking-tight text-2xl">Create an account</h3>
                    <p className="text-sm text-zinc-400">Enter your information to join the alumni network.</p>
                </div>
                
                <div className="p-6 pt-0">
                    {serverError && <div className="rounded-md border border-red-900/50 bg-red-900/20 p-3 mb-6 text-sm text-red-400">{serverError}</div>}
                    {successMessage && <div className="rounded-md border border-green-900/50 bg-green-900/20 p-3 mb-6 text-sm text-green-400">{successMessage}</div>}

                    {!successMessage && (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="shadcn-label">First name</label>
                                    <input type="text" {...register('firstName')} className="shadcn-input" />
                                    {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="shadcn-label">Last name</label>
                                    <input type="text" {...register('lastName')} className="shadcn-input" />
                                    {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="shadcn-label">Email</label>
                                <input type="email" {...register('email')} className="shadcn-input" />
                                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="shadcn-label">Phone</label>
                                <input type="tel" {...register('phone')} className="shadcn-input" />
                                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="shadcn-label">Password</label>
                                <input type="password" {...register('password')} className="shadcn-input" />
                                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                            </div>

                            <button type="submit" disabled={isSubmitting} className="shadcn-button mt-4">
                                {isSubmitting ? 'Creating account...' : 'Create account'}
                            </button>
                        </form>
                    )}
                </div>

                <div className="flex items-center justify-center p-6 pt-0">
                    <p className="text-sm text-zinc-400">
                        Already have an account? <Link to="/login" className="text-zinc-50 hover:underline underline-offset-4">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;