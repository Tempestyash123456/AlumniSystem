import React, { useEffect, useState, useCallback, useRef } from 'react';
import { profileApi } from '../../lib/api.ts';
import { useAuthStore } from '../../store/authStore.ts';
import type { ProfileResponse, UpdateProfileRequest } from '../../types';
// @ts-ignore
import { Input, Textarea, Select, Button, Alert, ProgressBar, Toggle, SkillsInput, Spinner } from '../../components/ui';

const BASE_URL = 'http://localhost:8080';

// --- Static options ---
const INDUSTRY_OPTIONS = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
    'Retail', 'Media', 'Consulting', 'Government', 'Non-profit', 'Other',
].map((v) => ({ value: v, label: v }));

const DEGREE_OPTIONS = [
    'B.Tech', 'B.E.', 'B.Sc', 'BCA', 'M.Tech', 'M.E.',
    'M.Sc', 'MCA', 'MBA', 'Ph.D', 'Other',
].map((v) => ({ value: v, label: v }));

const YEAR_OPTIONS = Array.from({ length: 40 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: y, label: String(y) };
});

type Section = 'personal' | 'academic' | 'professional' ;

const SECTIONS: { id: Section; label: string; icon: string }[] = [
    { id: 'personal',     label: 'PERSONAL',     icon: '👤' },
    { id: 'academic',     label: 'ACADEMIC',      icon: '🎓' },
    { id: 'professional', label: 'PROFESSIONAL',  icon: '💼' },
];

// ── Photo Upload Section ──────────────────────────────────────────────────────
const PhotoUpload: React.FC<{
    currentUrl?: string;
    userId: string;
    onSuccess: (url: string) => void;
}> = ({ currentUrl, userId, onSuccess }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError]         = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const displayUrl = previewUrl
        || (currentUrl
            ? currentUrl.startsWith('http') ? currentUrl : `${BASE_URL}${currentUrl}`
            : null);

    const initials = userId.slice(0, 2).toUpperCase();

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) { setError('Only image files allowed'); return; }
        if (file.size > 5 * 1024 * 1024)   { setError('File exceeds 5 MB'); return; }

        // Optimistic preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setUploading(true);
        setError('');

        const res = await profileApi.uploadPhoto(file);
        setUploading(false);

        if (res.data) {
            onSuccess(res.data.profilePhotoUrl);
            // Keep the preview until page refresh
        } else {
            setError(res.error?.message || 'Upload failed');
            setPreviewUrl(null);
        }
    };

    return (
        <div className="cp-panel" style={{ padding: '24px', marginBottom: 4 }}>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 20 }}>
                ◉ PROFILE_PHOTO
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                        border: '2px solid var(--neon-cyan)',
                        boxShadow: '0 0 16px rgba(0,245,255,0.3)',
                        background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {displayUrl ? (
                            <img src={displayUrl} alt="Profile"
                                 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                 onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '24px', fontWeight: 700, color: 'var(--bg-void)' }}>
                                {initials}
                            </span>
                        )}
                    </div>
                    {uploading && (
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span className="cp-spinner" style={{ width: 20, height: 20 }} />
                        </div>
                    )}
                </div>

                {/* Info + Button */}
                <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                        Upload a profile photo. JPG, PNG or WEBP — max 5 MB.
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Button
                            variant="outline" size="sm"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? 'UPLOADING...' : currentUrl || previewUrl ? 'CHANGE PHOTO' : 'UPLOAD PHOTO'}
                        </Button>
                        {(currentUrl || previewUrl) && !uploading && (
                            <Button variant="ghost" size="sm"
                                    onClick={() => {
                                        setPreviewUrl(null);
                                        onSuccess('');
                                    }}
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                    {error && (
                        <div style={{ marginTop: 8, fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-pink)' }}>
                            ⚠ {error}
                        </div>
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = '';
                }}
            />
        </div>
    );
};

// ── Main Profile Page ─────────────────────────────────────────────────────────
export const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuthStore();
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]      = useState(false);
    const [success, setSuccess]   = useState('');
    const [error, setError]       = useState('');
    const [activeSection, setActiveSection] = useState<Section>('personal');
    const [form, setForm] = useState<UpdateProfileRequest>({});

    const loadProfile = useCallback(async () => {
        setLoading(true);
        const res = await profileApi.getMyProfile();
        if (res.data) {
            setProfile(res.data);
            setForm({
                firstName:       res.data.firstName,
                lastName:        res.data.lastName,
                phone:           res.data.phone           ?? '',
                bio:             res.data.bio             ?? '',
                city:            res.data.city            ?? '',
                state:           res.data.state           ?? '',
                country:         res.data.country         ?? '',
                dateOfBirth:     res.data.dateOfBirth     ?? '',
                studentId:       res.data.studentId       ?? '',
                graduationYear:  res.data.graduationYear  ?? undefined,
                degree:          res.data.degree          ?? '',
                department:      res.data.department      ?? '',
                specialization:  res.data.specialization  ?? '',
                currentJobTitle: res.data.currentJobTitle ?? '',
                currentCompany:  res.data.currentCompany  ?? '',
                industry:        res.data.industry        ?? '',
                experienceYears: res.data.experienceYears ?? undefined,
                linkedinUrl:     res.data.linkedinUrl     ?? '',
                githubUrl:       res.data.githubUrl       ?? '',
                portfolioUrl:    res.data.portfolioUrl    ?? '',
                skills:          res.data.skills          ?? [],
                profilePublic:   res.data.profilePublic,
                openToMentor:    res.data.openToMentor,
                openToHire:      res.data.openToHire,
            });
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const setStr = (field: keyof UpdateProfileRequest) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.value }));

    const setNum = (field: keyof UpdateProfileRequest) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.value ? Number(e.target.value) : undefined }));

    // @ts-ignore
    const setBool = (field: keyof UpdateProfileRequest) => (val: boolean) =>
        setForm(prev => ({ ...prev, [field]: val }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        const clean: UpdateProfileRequest = Object.fromEntries(
            Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
        ) as UpdateProfileRequest;

        const res = await profileApi.updateMyProfile(clean);
        if (res.success && res.data) {
            setProfile(res.data);
            setSuccess('Profile updated successfully');
            setTimeout(() => setSuccess(''), 4000);
        } else {
            setError(res.error?.message || 'Update failed');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                <Spinner size={32} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', overflow: 'hidden', gap: 20 }}>

            {/* FIXED TOP SECTION */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '0.15em', marginBottom: 6 }}>
                            USER_CONFIGURATION
                        </div>
                        <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 700, letterSpacing: '0.05em' }}>
                            My Profile
                        </h1>
                    </div>
                    <div style={{ minWidth: 220 }}>
                        <ProgressBar label="COMPLETENESS" value={profile?.profileScore ?? 0} />
                    </div>
                </div>

                {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}
                {error   && <Alert type="error"   onClose={() => setError('')}>{error}</Alert>}

                {/* HORIZONTAL NAVIGATION */}
                <div
                    className="cp-panel"
                    style={{
                        marginTop: 20,
                        padding: '4px',
                        display: 'flex',
                        gap: 4,
                        overflowX: 'auto',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '4px'
                    }}
                >
                    {SECTIONS.map(({ id, label, icon }) => {
                        const active = activeSection === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveSection(id)}
                                style={{
                                    flex: 1,
                                    minWidth: '140px',
                                    background: active ? 'rgba(0, 255, 255, 0.05)' : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                    fontFamily: 'Orbitron, monospace',
                                    fontSize: '11px',
                                    letterSpacing: '0.1em',
                                    position: 'relative',
                                    transition: 'all 0.2s ease',
                                    color: active ? 'var(--neon-cyan)' : 'var(--text-muted)',
                                    borderRadius: '2px'
                                }}
                            >
                                <span style={{ fontSize: 16, filter: active ? 'drop-shadow(0 0 5px var(--neon-cyan))' : 'none' }}>
                                    {icon}
                                </span>
                                <span style={{ textShadow: active ? '0 0 8px rgba(0, 255, 255, 0.5)' : 'none' }}>
                                    {label}
                                </span>
                                {active && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: '10%',
                                            right: '10%',
                                            height: '2px',
                                            background: 'var(--neon-cyan)',
                                            boxShadow: '0 0 10px var(--neon-cyan)',
                                            borderRadius: '2px'
                                        }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleSave} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div
                    className="cp-panel custom-scrollbar"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'rgba(10, 11, 14, 0.6)'
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: 'var(--neon-cyan)', textShadow: '0 0 5px var(--neon-cyan)' }}>◈</span> {activeSection.toUpperCase()}_DATA
                        </div>

                        {activeSection === 'personal' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {/* Photo Upload — only shown in personal section */}
                                <PhotoUpload
                                    currentUrl={profile?.profilePhotoUrl}
                                    userId={user?.id ?? 'XX'}
                                    onSuccess={(url) => {
                                        setProfile(prev => prev ? { ...prev, profilePhotoUrl: url } : prev);
                                        updateUser({ profilePhotoUrl: url });
                                    }}
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <Input label="First Name" value={form.firstName ?? ''} onChange={setStr('firstName')} />
                                    <Input label="Last Name"  value={form.lastName  ?? ''} onChange={setStr('lastName')} />
                                </div>
                                <Input label="Phone" value={form.phone ?? ''} onChange={setStr('phone')} />
                                <Textarea label="Bio" value={form.bio ?? ''} onChange={setStr('bio')} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                                    <Input label="City" value={form.city ?? ''} onChange={setStr('city')} />
                                    <Input label="State" value={form.state ?? ''} onChange={setStr('state')} />
                                    <Input label="Country" value={form.country ?? ''} onChange={setStr('country')} />
                                </div>
                                <Input label="Date of Birth" type="date" value={form.dateOfBirth ?? ''} onChange={setStr('dateOfBirth')} />
                            </div>
                        )}

                        {activeSection === 'academic' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <Input label="Student ID" value={form.studentId ?? ''} onChange={setStr('studentId')} />
                                    <Select label="Graduation Year" value={form.graduationYear ?? ''} onChange={setNum('graduationYear')} options={YEAR_OPTIONS} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <Select label="Degree" value={form.degree ?? ''} onChange={setStr('degree')} options={DEGREE_OPTIONS} />
                                    <Input label="Department" value={form.department ?? ''} onChange={setStr('department')} />
                                </div>
                                <Input label="Specialization" value={form.specialization ?? ''} onChange={setStr('specialization')} />
                            </div>
                        )}

                        {activeSection === 'professional' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <Input label="Job Title" value={form.currentJobTitle ?? ''} onChange={setStr('currentJobTitle')} />
                                    <Input label="Company" value={form.currentCompany ?? ''} onChange={setStr('currentCompany')} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <Select label="Industry" value={form.industry ?? ''} onChange={setStr('industry')} options={INDUSTRY_OPTIONS} />
                                    <Input label="Experience Years" type="number" value={form.experienceYears ?? ''} onChange={setNum('experienceYears')} />
                                </div>
                                <Input label="LinkedIn URL" value={form.linkedinUrl ?? ''} onChange={setStr('linkedinUrl')} />
                                <Input label="GitHub URL" value={form.githubUrl ?? ''} onChange={setStr('githubUrl')} />
                                <Input label="Portfolio URL" value={form.portfolioUrl ?? ''} onChange={setStr('portfolioUrl')} />
                                <SkillsInput skills={form.skills ?? []} onChange={(skills) => setForm(prev => ({ ...prev, skills }))} />
                            </div>
                        )}
                    </div>

                    {/* FIXED SAVE AREA */}
                    <div style={{ flexShrink: 0, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="submit" loading={saving} size="lg" style={{ minWidth: '200px' }}>
                            {saving ? 'SYNCING_DATA...' : 'UPDATE_PROFILE'}
                        </Button>
                    </div>
                </div>
            </form>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--neon-cyan);
                    border-radius: 4px;
                    box-shadow: 0 0 5px var(--neon-cyan);
                }
            `}</style>
        </div>
    );
};