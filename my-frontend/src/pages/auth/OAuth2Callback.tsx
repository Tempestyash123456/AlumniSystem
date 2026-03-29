import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi, tokenStorage } from '../../lib/api';
import { LoadingScreen } from '../../components/ui';

export const OAuth2Callback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser, clearAuth } = useAuthStore();

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            navigate('/login?error=oauth2_failed', { replace: true });
            return;
        }

        // Save token first so apiFetch can use it
        tokenStorage.set(token, '');

        // Fetch the user, populate store, then navigate
        authApi.me()
            .then((res) => {
                if (res.data) {
                    setUser(res.data, token, '');
                    navigate('/dashboard', { replace: true });
                } else {
                    clearAuth();
                    navigate('/login?error=oauth2_failed', { replace: true });
                }
            })
            .catch(() => {
                clearAuth();
                navigate('/login?error=oauth2_failed', { replace: true });
            });
    }, []);

    return <LoadingScreen />;
};