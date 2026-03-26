import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const registerSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

const Register = () => {
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormInputs>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormInputs) => {
        setServerError(null);
        setSuccessMessage(null);
        try {
            const response = await api.post('/auth/register', data);
            setSuccessMessage(response.data.data.message || 'Registration successful! Please check your email to verify.');
        } catch (error: any) {
            setServerError(error.response?.data?.error?.message || 'Failed to register. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Join the Alumni Network</h2>

                {serverError && <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm">{serverError}</div>}
                {successMessage && <div className="bg-green-100 text-green-700 px-4 py-3 rounded mb-4 text-sm">{successMessage}</div>}

                {!successMessage && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-gray-700 text-sm font-bold mb-2">First Name</label>
                                <input type="text" {...register('firstName')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 border-gray-300" />
                                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                            </div>
                            <div className="w-1/2">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Last Name</label>
                                <input type="text" {...register('lastName')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 border-gray-300" />
                                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                            <input type="email" {...register('email')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 border-gray-300" />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Phone</label>
                            <input type="tel" {...register('phone')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 border-gray-300" />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                            <input type="password" {...register('password')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 border-gray-300" />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                            {isSubmitting ? 'Registering...' : 'Create Account'}
                        </button>
                    </form>
                )}

                <p className="text-center text-sm text-gray-600 mt-4">
                    Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;