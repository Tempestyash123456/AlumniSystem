import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi, tokenStorage } from '../../lib/api';
import { cookies } from '../../lib/cookies';
import { LoadingScreen } from '../../components/ui';

export const OAuth2Callback = () => {
    const navigate = useNavigate();
    const { setUser, clearAuth } = useAuthStore();

    useEffect(() => {
        const token = cookies.get('oauth2_token');

        if (!token) {
            console.error('No oauth2_token found in cookies');
            navigate('/login?error=oauth2_failed', { replace: true });
            return;
        }

        // Clean up the temporary cookie immediately
        cookies.delete('oauth2_token');

        // Save token first so apiFetch can use it
        tokenStorage.set(token, '');

        // Fetch the user, populate store, then navigate
        authApi.me()
            .then((res) => {
                if (res.data) {
                    setUser(res.data, token, '');
                    if (!res.data.roleSelected) {
                        navigate('/complete-registration', { replace: true });
                    } else {
                        navigate('/dashboard', { replace: true });
                    }
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