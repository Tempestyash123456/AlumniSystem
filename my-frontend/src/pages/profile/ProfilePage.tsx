import React, { useEffect, useState, useCallback, useRef } from 'react';
import { profileApi } from '../../lib/api.ts';
import { useAuthStore } from '../../store/authStore.ts';
import type { ProfileResponse, UpdateProfileRequest } from '../../types';
import { Input, Textarea, Select, Button, Alert, ProgressBar, SkillsInput, Spinner } from '../../components/ui';
import { PROGRAM_OPTIONS, DISCIPLINE_OPTIONS, INDUSTRY_OPTIONS, YEAR_OPTIONS, MONTH_OPTIONS } from '../../lib/constants';
import type { JobExperience } from '../../types';
import {
    CitySelect,
    CountrySelect,
    StateSelect,
    GetCountries,
    GetState,
} from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";

const BASE_URL = '';

type Section = 'personal' | 'academic' | 'professional';

const SECTIONS: { id: Section; label: string; icon: string }[] = [
    { id: 'personal', label: 'PERSONAL', icon: '👤' },
    { id: 'academic', label: 'ACADEMIC', icon: '🎓' },
    { id: 'professional', label: 'PROFESSIONAL', icon: '💼' },
];

// ── Photo Upload Section ──────────────────────────────────────────────────────
const PhotoUpload: React.FC<{
    currentUrl?: string;
    userId: string;
    onSuccess: (url: string) => void;
}> = ({ currentUrl, userId, onSuccess }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const displayUrl = previewUrl
        || (currentUrl
            ? currentUrl.startsWith('http') ? currentUrl : `${BASE_URL}${currentUrl}`
            : null);

    const initials = userId.slice(0, 2).toUpperCase();

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) { setError('Only image files allowed'); return; }
        if (file.size > 5 * 1024 * 1024) { setError('File exceeds 5 MB'); return; }

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
                <div style={{
                    position: 'relative',
                    flexShrink: 0,
                    animation: 'pulse-glow 5s infinite alternate ease-in-out',
                    borderRadius: '50%',
                    width: 120,
                    height: 120,
                    padding: 3,
                    background: 'rgba(0, 245, 255, 0.1)',
                    border: '1px solid rgba(0, 245, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
                        border: '2px solid var(--neon-cyan)',
                        boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
                        background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {displayUrl ? (
                            <img src={displayUrl} alt="Profile"
                                referrerPolicy="no-referrer"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '32px', fontWeight: 700, color: 'var(--bg-void)' }}>
                                {initials}
                            </span>
                        )}
                    </div>
                    {uploading && (
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 10
                        }}>
                            <span className="cp-spinner" style={{ width: 24, height: 24 }} />
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
                        <div style={{ marginTop: 8 }}>
                            <Alert type="error" onClose={() => setError('')}>{error}</Alert>
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [activeSection, setActiveSection] = useState<Section>('personal');
    const [form, setForm] = useState<UpdateProfileRequest>({});

    const [countryid, setCountryid] = useState<number>(0);
    const [stateid, setstateid] = useState<number>(0);
    const [selectedCountry, setSelectedCountry] = useState<any>(null);
    const [selectedState, setSelectedState] = useState<any>(null);
    const [selectedCity, setSelectedCity] = useState<any>(null);

    const calculateExperience = (j: JobExperience) => {
        if (!j.startMonth || !j.startYear) return 0;
        const start = new Date(j.startYear, j.startMonth - 1);
        const end = (j.endYear && j.endMonth)
            ? new Date(j.endYear, j.endMonth - 1)
            : new Date();

        const diffYears = end.getFullYear() - start.getFullYear();
        const diffMonths = end.getMonth() - start.getMonth();
        const total = diffYears * 12 + diffMonths;
        return Math.max(0, total);
    };

    const loadProfile = useCallback(async () => {
        setLoading(prev => prev || true);
        const res = await profileApi.getMyProfile();
        if (res.data) {
            setProfile(res.data);
            setForm({
                firstName: res.data.firstName,
                lastName: res.data.lastName,
                phone: res.data.phone ?? '',
                bio: res.data.bio ?? '',
                city: res.data.city ?? '',
                state: res.data.state ?? '',
                country: res.data.country ?? '',
                dateOfBirth: res.data.dateOfBirth ?? '',
                studentId: res.data.studentId ?? '',
                admissionYear: res.data.admissionYear ?? undefined,
                graduationYear: res.data.graduationYear ?? undefined,
                discipline: res.data.discipline ?? '',
                program: res.data.program ?? '',
                linkedinUrl: res.data.linkedinUrl ?? '',
                githubUrl: res.data.githubUrl ?? '',
                portfolioUrl: res.data.portfolioUrl ?? '',
                skills: res.data.skills ?? [],
                jobs: res.data.jobs ?? [],
                profilePublic: res.data.profilePublic,
                openToMentor: res.data.openToMentor,
                openToHire: res.data.openToHire,
            });

            // Try to find IDs for initial country/state/city selection
            if (res.data.country) {
                const countries = await GetCountries();
                const matchedCountry = countries.find((c: any) => c.name === res.data?.country);
                if (matchedCountry) {
                    setCountryid(matchedCountry.id);
                    setSelectedCountry(matchedCountry);
                    if (res.data.state) {
                        const states = await GetState(matchedCountry.id);
                        const matchedState = states.find((s: any) => s.name === res.data?.state);
                        if (matchedState) {
                            setstateid(matchedState.id);
                            setSelectedState(matchedState);
                        }
                    }
                }
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const setStr = (field: keyof UpdateProfileRequest) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.value }));

    const setNum = (field: keyof UpdateProfileRequest) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.value ? Number(e.target.value) : undefined }));

    const updateJob = (index: number, updates: Partial<JobExperience>) => {
        setForm(prev => {
            const jobs = [...(prev.jobs || [])];
            jobs[index] = { ...jobs[index], ...updates };
            // Auto-calculate months
            jobs[index].experienceMonths = calculateExperience(jobs[index]);
            return { ...prev, jobs };
        });
    };

    const addJob = () => {
        setForm(prev => ({
            ...prev,
            jobs: [
                ...(prev.jobs || []),
                { jobTitle: '', company: '', industry: '', startMonth: 1, startYear: new Date().getFullYear(), experienceMonths: 0 }
            ]
        }));
    };

    const removeJob = (index: number) => {
        setForm(prev => ({
            ...prev,
            jobs: (prev.jobs || []).filter((_, i) => i !== index)
        }));
    };


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        const clean: UpdateProfileRequest = Object.fromEntries(
            Object.entries(form).map(([k, v]) => {
                if (Array.isArray(v)) return [k, v];
                return [k, v === '' ? null : v];
            })
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
                {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

                {/* HORIZONTAL NAVIGATION */}
                <div
                    className="cp-panel"
                    style={{
                        marginTop: 20,
                        padding: '4px',
                        display: 'flex',
                        gap: 4,
                        overflowX: 'auto',
                        background: 'var(--bg-dark)',
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
                        background: 'var(--bg-panel)'
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontFamily: 'Orbitron, monospace',
                            fontSize: '16px',
                            color: 'var(--text-primary)',
                            fontWeight: 'bold',
                            letterSpacing: '0.15em',
                            marginBottom: 32,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                        }}>
                            <span style={{ color: 'var(--neon-cyan)', textShadow: '0 0 5px var(--neon-cyan)' }}>◈</span> {activeSection.toUpperCase()}_DATA
                        </div>

                        {activeSection === 'personal' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                                    <Input label="Last Name" value={form.lastName ?? ''} onChange={setStr('lastName')} />
                                </div>
                                <Input label="Phone" value={form.phone ?? ''} onChange={setStr('phone')} />
                                <Textarea label="Bio" value={form.bio ?? ''} onChange={setStr('bio')} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                                    <div className="cp-input-wrap">
                                        <label className="cp-label">Country</label>
                                        <CountrySelect
                                            onChange={(e: any) => {
                                                setCountryid(e.id);
                                                setSelectedCountry(e);
                                                setSelectedState(null);
                                                setSelectedCity(null);
                                                setForm(prev => ({ ...prev, country: e.name, state: '', city: '' }));
                                            }}
                                            placeHolder="Select Country"
                                            containerClassName="cp-country-state-city-container"
                                            defaultValue={selectedCountry}
                                        />
                                    </div>
                                    <div className="cp-input-wrap">
                                        <label className="cp-label">State</label>
                                        <StateSelect
                                            countryid={countryid}
                                            onChange={(e: any) => {
                                                setstateid(e.id);
                                                setSelectedState(e);
                                                setSelectedCity(null);
                                                setForm(prev => ({ ...prev, state: e.name, city: '' }));
                                            }}
                                            placeHolder="Select State"
                                            containerClassName="cp-country-state-city-container"
                                            defaultValue={selectedState}
                                        />
                                    </div>
                                    <div className="cp-input-wrap">
                                        <label className="cp-label">City</label>
                                        <CitySelect
                                            countryid={countryid}
                                            stateid={stateid}
                                            onChange={(e: any) => {
                                                setSelectedCity(e);
                                                setForm(prev => ({ ...prev, city: e.name }));
                                            }}
                                            placeHolder="Select City"
                                            containerClassName="cp-country-state-city-container"
                                            defaultValue={selectedCity}
                                        />
                                    </div>
                                </div>
                                <Input label="Date of Birth" type="date" value={form.dateOfBirth ?? ''} onChange={setStr('dateOfBirth')} />
                            </div>
                        )}

                        {activeSection === 'academic' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                                    <Input label="Student / Employee ID" value={form.studentId ?? ''} onChange={setStr('studentId')} />
                                    <Select label="Admission Year" value={form.admissionYear ?? ''} onChange={setNum('admissionYear')} options={YEAR_OPTIONS} placeholder="Select Year" />
                                    <Select label="Graduation Year" value={form.graduationYear ?? ''} onChange={setNum('graduationYear')} options={YEAR_OPTIONS} placeholder="Select Year" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <Select label="Discipline" value={form.discipline ?? ''} onChange={setStr('discipline')} options={DISCIPLINE_OPTIONS} placeholder="Select Discipline" />
                                    <Select label="Program" value={form.program ?? ''} onChange={setStr('program')} options={PROGRAM_OPTIONS} placeholder="Select Program" />
                                </div>
                            </div>
                        )}

                        {activeSection === 'professional' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                {(form.jobs || []).map((job, idx) => (
                                    <div key={idx} className="cp-panel" style={{ padding: '24px', position: 'relative', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '12px', color: 'var(--neon-cyan)' }}>
                                                JOB_EXPERIENCE #{idx + 1}
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => removeJob(idx)} style={{ color: 'var(--neon-pink)' }}>REMOVE</Button>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                                <Input label="Job Title" value={job.jobTitle} onChange={e => updateJob(idx, { jobTitle: e.target.value })} placeholder="e.g. Senior Software Engineer" />
                                                <Input label="Company" value={job.company} onChange={e => updateJob(idx, { company: e.target.value })} placeholder="e.g. Google" />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                                <Select label="Industry" value={job.industry ?? ''} onChange={e => updateJob(idx, { industry: e.target.value })} options={INDUSTRY_OPTIONS} placeholder="Select Industry" />
                                                <div className="cp-input-wrap">
                                                    <label className="cp-label">Experience</label>
                                                    <div className="cp-input" style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                                        <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold', fontSize: '16px' }}>
                                                            {job.experienceMonths || 0}
                                                        </span>
                                                        <span style={{ marginLeft: 8, fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Rajdhani' }}>MONTHS TOTAL</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    <label className="cp-label">START DATE</label>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                                                        <Select value={job.startMonth} onChange={e => updateJob(idx, { startMonth: Number(e.target.value) })} options={MONTH_OPTIONS} />
                                                        <Select value={job.startYear} onChange={e => updateJob(idx, { startYear: Number(e.target.value) })} options={YEAR_OPTIONS} />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    <label className="cp-label">END DATE (Leave empty if Current)</label>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                                                        <Select value={job.endMonth ?? ''} onChange={e => updateJob(idx, { endMonth: e.target.value ? Number(e.target.value) : null })} options={MONTH_OPTIONS} placeholder="Till Date" />
                                                        <Select value={job.endYear ?? ''} onChange={e => updateJob(idx, { endYear: e.target.value ? Number(e.target.value) : null })} options={YEAR_OPTIONS} placeholder="Till Date" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <Button variant="outline" onClick={addJob} style={{ borderStyle: 'dashed', height: '60px' }}>
                                    + ADD NEW JOB EXPERIENCE
                                </Button>

                                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '10px 0' }} />
                                
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

                /* Location Dropdown Refinement */
                .cp-country-state-city-container {
                    background: var(--bg-dark) !important;
                    border: 1px solid var(--border-subtle) !important;
                    border-radius: var(--radius-sm) !important;
                    color: var(--text-primary) !important;
                    font-family: var(--font-body) !important;
                    height: 52px !important;
                    display: flex !important;
                    align-items: center !important;
                    transition: all var(--transition-base) !important;
                }

                .cp-country-state-city-container:focus-within {
                    border-color: var(--neon-cyan) !important;
                    box-shadow: 0 0 0 3px rgba(0, 245, 255, 0.1), 0 0 20px rgba(0, 245, 255, 0.1) !important;
                }

                .theme-light .cp-country-state-city-container:focus-within {
                    box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.1), 0 4px 10px rgba(211, 47, 47, 0.1) !important;
                }

                /* Library Class Overrides */
                .stdropdown-container {
                    background: transparent !important;
                    border: none !important;
                    width: 100% !important;
                    font-family: inherit !important;
                }

                .stdropdown-input {
                    padding: 0 18px !important;
                    height: 100% !important;
                    color: var(--text-primary) !important;
                }

                .stdropdown-input input {
                    background: transparent !important;
                    color: var(--text-primary) !important;
                    font-family: var(--font-body) !important;
                    font-size: var(--font-size-base) !important;
                    border: none !important;
                    outline: none !important;
                    width: 100% !important;
                }

                .stdropdown-input svg {
                    fill: var(--neon-cyan) !important;
                }

                .stdropdown-menu {
                    background: var(--bg-panel) !important;
                    border: 1px solid var(--border-subtle) !important;
                    border-radius: var(--radius-md) !important;
                    box-shadow: var(--shadow-panel) !important;
                    margin-top: 8px !important;
                    padding: 8px !important;
                    z-index: 1000 !important;
                }

                .stdropdown-item {
                    padding: 10px 14px !important;
                    border-radius: var(--radius-sm) !important;
                    color: var(--text-secondary) !important;
                    font-family: var(--font-body) !important;
                    font-size: var(--font-size-sm) !important;
                    transition: all var(--transition-fast) !important;
                }

                .stdropdown-item:hover {
                    background: var(--bg-hover) !important;
                    color: var(--neon-cyan) !important;
                }

                .stdropdown-item.selected {
                    background: rgba(0, 245, 255, 0.1) !important;
                    color: var(--neon-cyan) !important;
                    font-weight: 600 !important;
                }

                .theme-light .stdropdown-item.selected {
                    background: rgba(211, 47, 47, 0.1) !important;
                }

                .stsearch-box {
                    padding: 0 0 8px 0 !important;
                    border-bottom: 1px solid var(--border-subtle) !important;
                    margin-bottom: 8px !important;
                }

                .stsearch-box input {
                    background: var(--bg-dark) !important;
                    border: 1px solid var(--border-subtle) !important;
                    color: var(--text-primary) !important;
                    border-radius: var(--radius-sm) !important;
                    padding: 8px 12px !important;
                    font-family: var(--font-body) !important;
                }
            `}</style>
        </div>
    );
};