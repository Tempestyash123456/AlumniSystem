import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../lib/api';
import { GraduationCap, Briefcase, ChevronRight, Loader2 } from 'lucide-react';

export const CompleteRegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();
    const [selectedRole, setSelectedRole] = useState<'alumni' | 'faculty' | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!selectedRole) return;

        setLoading(true);
        setError(null);

        try {
            const res = await authApi.completeOAuthRegistration(selectedRole);
            if (res.success && res.data) {
                // Update local store with new user info (roles + roleSelected flag)
                setUser(res.data.user, res.data.accessToken, res.data.refreshToken);
                navigate('/dashboard', { replace: true });
            } else {
                setError(res.error?.message || 'Failed to complete registration');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        Welcome, <span className="text-primary">{user?.firstName}</span>!
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        To tailor your experience, please let us know your primary role.
                    </p>
                </div>

                {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-center">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Alumni Option */}
                    <button
                        onClick={() => setSelectedRole('alumni')}
                        className={`group relative p-8 rounded-2xl border-2 text-left transition-all duration-300 hover:shadow-2xl ${
                            selectedRole === 'alumni'
                                ? 'border-primary bg-primary/5 shadow-primary/10'
                                : 'border-border/50 bg-card hover:border-primary/50'
                        }`}
                    >
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors ${
                            selectedRole === 'alumni' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground'
                        }`}>
                            <GraduationCap size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Alumni</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Join the network, mentor students, find career opportunities, and stay connected with your batch.
                        </p>
                        <div className={`mt-6 flex items-center font-semibold transition-opacity ${selectedRole === 'alumni' ? 'opacity-100 text-primary' : 'opacity-0'}`}>
                            Selected <ChevronRight size={20} className="ml-1" />
                        </div>
                    </button>

                    {/* Faculty Option */}
                    <button
                        onClick={() => setSelectedRole('faculty')}
                        className={`group relative p-8 rounded-2xl border-2 text-left transition-all duration-300 hover:shadow-2xl ${
                            selectedRole === 'faculty'
                                ? 'border-secondary-foreground bg-secondary/5 shadow-secondary-foreground/10'
                                : 'border-border/50 bg-card hover:border-secondary-foreground/50'
                        }`}
                    >
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors ${
                            selectedRole === 'faculty' ? 'bg-secondary-foreground text-background' : 'bg-secondary text-secondary-foreground group-hover:bg-secondary-foreground group-hover:text-background'
                        }`}>
                            <Briefcase size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Faculty</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Engage with the portal as a staff member or educator to support the alumni community.
                        </p>
                        <div className={`mt-6 flex items-center font-semibold transition-opacity ${selectedRole === 'faculty' ? 'opacity-100 text-secondary-foreground' : 'opacity-0'}`}>
                            Selected <ChevronRight size={20} className="ml-1" />
                        </div>
                    </button>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedRole || loading}
                        className="w-full max-w-sm py-4 px-8 rounded-xl bg-foreground text-background font-bold text-lg transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" />}
                        {loading ? 'Finalizing...' : 'Complete Registration'}
                    </button>
                    <p className="text-xs text-muted-foreground">
                        You can change your role details later in your profile settings.
                    </p>
                </div>
            </div>
        </div>
    );
};
