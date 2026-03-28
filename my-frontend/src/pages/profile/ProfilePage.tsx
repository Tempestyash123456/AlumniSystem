import React, { useEffect, useState, useCallback } from 'react';
import { profileApi } from '../../lib/api.ts';
import type { ProfileResponse, UpdateProfileRequest } from '../../types';
import { Input, Textarea, Select, Button, Alert, ProgressBar, Toggle, SkillsInput, Spinner } from '../../components/ui';

const INDUSTRY_OPTIONS = ['Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Media', 'Consulting', 'Government', 'Non-profit', 'Other'].map((v) => ({ value: v, label: v }));
const DEGREE_OPTIONS = ['B.Tech', 'B.E.', 'B.Sc', 'BCA', 'M.Tech', 'M.E.', 'M.Sc', 'MCA', 'MBA', 'Ph.D', 'Other'].map((v) => ({ value: v, label: v }));
const YEAR_OPTIONS = Array.from({ length: 40 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: y, label: String(y) };
});

type Section = 'personal' | 'academic' | 'professional' | 'visibility';

export const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [activeSection, setActiveSection] = useState<Section>('personal');
    const [form, setForm] = useState<UpdateProfileRequest>({});

    const loadProfile = useCallback(async () => {
        setLoading(true);
        const res = await profileApi.getMyProfile();
        if (res.data) {
            setProfile(res.data);
            setForm({ ...res.data });
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const setField = (field: keyof UpdateProfileRequest) => (e: any) => {
        const value = e.target ? e.target.value : e;
        setForm(prev => ({ ...prev, [field]: value === '' ? null : value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const res = await profileApi.updateMyProfile(form);
        if (res.success) {
            setSuccess('Profile updated');
            setProfile(res.data || null);
        } else {
            setError(res.error?.message || 'Update failed');
        }
        setSaving(false);
    };

    const SECTIONS: { id: Section; label: string; icon: string }[] = [
        { id: 'personal', label: 'Personal', icon: '👤' },
        { id: 'academic', label: 'Academic', icon: '🎓' },
        { id: 'professional', label: 'Professional', icon: '💼' },
        { id: 'visibility', label: 'Visibility', icon: '🔒' },
    ];

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={32} /></div>;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '0.15em' }}>USER_CONFIGURATION</div>
                    <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px' }}>My Profile</h1>
                </div>
                <div style={{ width: 200 }}><ProgressBar label="COMPLETENESS" value={profile?.profileScore || 0} /></div>
            </div>

            {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}
            {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

            <div style={{ display: 'flex', gap: 20 }}>
                <div className="cp-panel" style={{ padding: '12px', width: 180, flexShrink: 0, alignSelf: 'flex-start', position: 'sticky', top: 80 }}>
                    {SECTIONS.map((s) => (
                        <button key={s.id} onClick={() => setActiveSection(s.id)} className={`cp-nav-item ${activeSection === s.id ? 'active' : ''}`} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}>
                            <span>{s.icon}</span> <span>{s.label}</span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSave} style={{ flex: 1 }}>
                    <div className="cp-panel" style={{ padding: '28px' }}>
                        {activeSection === 'personal' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <Input label="First Name" value={form.firstName || ''} onChange={setField('firstName')} />
                                    <Input label="Last Name" value={form.lastName || ''} onChange={setField('lastName')} />
                                </div>
                                <Textarea label="Bio" value={form.bio || ''} onChange={setField('bio')} />
                            </div>
                        )}
                        {/* Other sections follow same pattern... */}
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" loading={saving}>Save Changes</Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};