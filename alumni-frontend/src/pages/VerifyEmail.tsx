import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    // Add a ref to track if we've already made the API call
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token found in the URL.');
            return;
        }

        // If we already fired the request, don't do it again! (Fixes React Strict Mode double-fire)
        if (hasFetched.current) return;
        hasFetched.current = true;

        const verifyAccount = async () => {
            try {
                const response = await api.post('/auth/verify-email', { token: token });
                setStatus('success');
                setMessage(response.data.data.message || 'Email verified successfully!');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.error?.message || 'Verification failed. The link may be expired.');
            }
        };

        verifyAccount();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Account Verification</h2>

                {status === 'loading' && <p className="text-blue-600 animate-pulse">{message}</p>}

                {status === 'success' && (
                    <div>
                        <p className="text-green-600 mb-6">{message}</p>
                        <Link to="/login" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                            Go to Login
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div>
                        <p className="text-red-600 mb-6">{message}</p>
                        <Link to="/register" className="text-blue-600 hover:underline">
                            Register a new account
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;