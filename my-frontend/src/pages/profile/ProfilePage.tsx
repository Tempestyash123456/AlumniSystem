import React, { useEffect, useState, useCallback } from 'react';
import { profileApi } from '../../lib/api.ts';
import type { ProfileResponse, UpdateProfileRequest } from '../../types';
import {
    Input, Textarea, Select, Button, Alert,
    ProgressBar, Toggle, SkillsInput, Spinner,
} from '../../components/ui';

// ── Static options ────────────────────────────────────────────────────────────
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

type Section = 'personal' | 'academic' | 'professional' | 'visibility';

const SECTIONS: { id: Section; label: string; icon: string }[] = [
    { id: 'personal',     label: 'Personal',     icon: '◉' },
    { id: 'academic',     label: 'Academic',      icon: '◈' },
    { id: 'professional', label: 'Professional',  icon: '◆' },
    { id: 'visibility',   label: 'Visibility',    icon: '⬡' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
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

    // Generic string field setter
    const setStr = (field: keyof UpdateProfileRequest) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.value }));

    // Numeric field setter
    const setNum = (field: keyof UpdateProfileRequest) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.value ? Number(e.target.value) : undefined }));

    // Boolean setter (for Toggle)
    const setBool = (field: keyof UpdateProfileRequest) => (val: boolean) =>
        setForm(prev => ({ ...prev, [field]: val }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        // Convert empty strings to null before sending
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
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Page header */}
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

            {/* Alerts */}
            {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}
            {error   && <Alert type="error"   onClose={() => setError('')}>{error}</Alert>}

            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                {/* Section sidebar */}
                <div
                    className="cp-panel"
                    style={{ padding: '12px', width: 180, flexShrink: 0, position: 'sticky', top: 80 }}
                >
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '9px', color: 'var(--text-disabled)', letterSpacing: '0.15em', padding: '8px 4px 8px', marginBottom: 4 }}>
                        SECTIONS
                    </div>
                    {SECTIONS.map(({ id, label, icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveSection(id)}
                            className={`cp-nav-item ${activeSection === id ? 'active' : ''}`}
                            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}
                        >
                            <span style={{ fontSize: 16 }}>{icon}</span>
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSave} style={{ flex: 1, minWidth: 0 }}>
                    <div className="cp-panel" style={{ padding: '28px' }}>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 24 }}>
                            {SECTIONS.find(s => s.id === activeSection)?.icon}{' '}
                            {activeSection.toUpperCase()}_DATA
                        </div>

                        {/* ── Personal ───────────────────────────────────────────────── */}
                        {activeSection === 'personal' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <Input label="First Name" value={form.firstName ?? ''} onChange={setStr('firstName')} placeholder="Ada" />
                                    <Input label="Last Name"  value={form.lastName  ?? ''} onChange={setStr('lastName')}  placeholder="Lovelace" />
                                </div>
                                <Input label="Phone" value={form.phone ?? ''} onChange={setStr('phone')} placeholder="+91-9876543210" />
                                <Textarea label="Bio" value={form.bio ?? ''} onChange={setStr('bio')} placeholder="Tell the community about yourself..." />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                    <Input label="City"    value={form.city    ?? ''} onChange={setStr('city')}    placeholder="Mumbai" />
                                    <Input label="State"   value={form.state   ?? ''} onChange={setStr('state')}   placeholder="Maharashtra" />
                                    <Input label="Country" value={form.country ?? ''} onChange={setStr('country')} placeholder="India" />
                                </div>
                                <Input label="Date of Birth" type="date" value={form.dateOfBirth ?? ''} onChange={setStr('dateOfBirth')} />
                            </div>
                        )}

                        {/* ── Academic ───────────────────────────────────────────────── */}
                        {activeSection === 'academic' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <Input
                                        label="Student ID"
                                        value={form.studentId ?? ''}
                                        onChange={setStr('studentId')}
                                        placeholder="2020CS001"
                                    />
                                    <Select
                                        label="Graduation Year"
                                        value={form.graduationYear ?? ''}
                                        onChange={setNum('graduationYear')}
                                        options={YEAR_OPTIONS}
                                        placeholder="Select year..."
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <Select
                                        label="Degree"
                                        value={form.degree ?? ''}
                                        onChange={setStr('degree')}
                                        options={DEGREE_OPTIONS}
                                        placeholder="Select degree..."
                                    />
                                    <Input
                                        label="Department"
                                        value={form.department ?? ''}
                                        onChange={setStr('department')}
                                        placeholder="Computer Science"
                                    />
                                </div>
                                <Input
                                    label="Specialization"
                                    value={form.specialization ?? ''}
                                    onChange={setStr('specialization')}
                                    placeholder="Machine Learning, Web Dev..."
                                />
                            </div>
                        )}

                        {/* ── Professional ───────────────────────────────────────────── */}
                        {activeSection === 'professional' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <Input
                                        label="Job Title"
                                        value={form.currentJobTitle ?? ''}
                                        onChange={setStr('currentJobTitle')}
                                        placeholder="Senior Engineer"
                                    />
                                    <Input
                                        label="Company"
                                        value={form.currentCompany ?? ''}
                                        onChange={setStr('currentCompany')}
                                        placeholder="Acme Corp"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <Select
                                        label="Industry"
                                        value={form.industry ?? ''}
                                        onChange={setStr('industry')}
                                        options={INDUSTRY_OPTIONS}
                                        placeholder="Select industry..."
                                    />
                                    <Input
                                        label="Years of Experience"
                                        type="number"
                                        min={0}
                                        max={60}
                                        value={form.experienceYears ?? ''}
                                        onChange={setNum('experienceYears')}
                                        placeholder="5"
                                    />
                                </div>
                                <Input
                                    label="LinkedIn URL"
                                    type="url"
                                    value={form.linkedinUrl ?? ''}
                                    onChange={setStr('linkedinUrl')}
                                    placeholder="https://linkedin.com/in/username"
                                />
                                <Input
                                    label="GitHub URL"
                                    type="url"
                                    value={form.githubUrl ?? ''}
                                    onChange={setStr('githubUrl')}
                                    placeholder="https://github.com/username"
                                />
                                <Input
                                    label="Portfolio URL"
                                    type="url"
                                    value={form.portfolioUrl ?? ''}
                                    onChange={setStr('portfolioUrl')}
                                    placeholder="https://mysite.dev"
                                />
                                <div>
                                    <div className="cp-label" style={{ marginBottom: 10 }}>Skills</div>
                                    <SkillsInput
                                        skills={form.skills ?? []}
                                        onChange={(skills) => setForm(prev => ({ ...prev, skills }))}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── Visibility ─────────────────────────────────────────────── */}
                        {activeSection === 'visibility' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', marginBottom: 8 }}>
                                    Control how you appear in the alumni network.
                                </p>
                                {[
                                    {
                                        field: 'profilePublic' as const,
                                        label: 'Public Profile',
                                        desc: 'Allow other alumni to view your full profile',
                                    },
                                    {
                                        field: 'openToMentor' as const,
                                        label: 'Open to Mentoring',
                                        desc: 'Show that you are available to mentor others',
                                    },
                                    {
                                        field: 'openToHire' as const,
                                        label: 'Open to Opportunities',
                                        desc: 'Signal that you are open to job opportunities',
                                    },
                                ].map(({ field, label, desc }) => (
                                    <div
                                        key={field}
                                        className="cp-card"
                                        style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}
                                    >
                                        <div>
                                            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', marginBottom: 4 }}>
                                                {label}
                                            </div>
                                            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {desc}
                                            </div>
                                        </div>
                                        <Toggle
                                            checked={(form[field] as boolean) ?? false}
                                            onChange={setBool(field)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Save button */}
                        <hr className="cp-divider" style={{ margin: '28px 0 24px' }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <Button type="submit" loading={saving} size="lg">
                                {saving ? 'SAVING...' : 'SAVE CHANGES'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};