import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

interface Profile {
    userId: string; firstName: string; lastName: string; email: string;
    phone: string | null; profilePhotoUrl: string | null;
    studentId: string | null; graduationYear: number | null; degree: string | null;
    department: string | null; specialization: string | null;
    currentJobTitle: string | null; currentCompany: string | null; industry: string | null;
    experienceYears: number | null; linkedinUrl: string | null; githubUrl: string | null;
    portfolioUrl: string | null; bio: string | null; city: string | null;
    state: string | null; country: string | null; skills: string[] | null;
    profileScore: number; profilePublic: boolean; openToMentor: boolean; openToHire: boolean;
}

const CpField = ({ label, name, value, type = 'text', onChange, placeholder = '', textarea = false, readOnly = false }: {
    label: string; name: string; value: string; type?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder?: string; textarea?: boolean; readOnly?: boolean;
}) => (
    <div className="space-y-1">
        <label className="cp-label">{label}</label>
        {textarea ? (
            <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3}
                className="cp-textarea w-full" readOnly={readOnly}
                style={readOnly ? { opacity: 0.5, cursor: 'not-allowed' } : {}} />
        ) : (
            <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
                className="cp-input" readOnly={readOnly}
                style={readOnly ? { opacity: 0.5, cursor: 'not-allowed' } : {}} />
        )}
    </div>
);

const CpSection = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div className="cp-card p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid rgba(0,245,255,0.1)' }}>
            <span style={{ color: 'var(--cyan)', fontSize: '14px' }}>{icon}</span>
            <span className="cp-section-title">{title}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
);

const ScoreBar = ({ score }: { score: number }) => {
    const color = score >= 75 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--pink)';
    const label = score >= 75 ? 'HIGH_CLEARANCE' : score >= 40 ? 'STANDARD' : 'INCOMPLETE';
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="font-mono-cp text-xs" style={{ color: 'rgba(0,245,255,0.5)' }}>
                    PROFILE_SCORE :: {label}
                </span>
                <span className="font-display text-sm font-bold" style={{ color }}>{score}%</span>
            </div>
            <div className="cp-bar-track">
                <div className="cp-bar-fill" style={{ width: `${score}%`, background: color, boxShadow: `0 0 8px ${color}88` }} />
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const [profile,    setProfile]    = useState<Profile | null>(null);
    const [loading,    setLoading]    = useState(true);
    const [saving,     setSaving]     = useState(false);
    const [success,    setSuccess]    = useState(false);
    const [error,      setError]      = useState<string | null>(null);
    const [skillInput, setSkillInput] = useState('');
    const [form,       setForm]       = useState<Record<string, string>>({});
    const [toggles,    setToggles]    = useState({ profilePublic: true, openToMentor: false, openToHire: false });

    useEffect(() => {
        api.get('/profile').then(res => {
            const p: Profile = res.data.data;
            setProfile(p);
            setForm({
                firstName: p.firstName || '', lastName: p.lastName || '', phone: p.phone || '',
                studentId: p.studentId || '', graduationYear: p.graduationYear?.toString() || '',
                degree: p.degree || '', department: p.department || '', specialization: p.specialization || '',
                currentJobTitle: p.currentJobTitle || '', currentCompany: p.currentCompany || '',
                industry: p.industry || '', experienceYears: p.experienceYears?.toString() || '',
                linkedinUrl: p.linkedinUrl || '', githubUrl: p.githubUrl || '', portfolioUrl: p.portfolioUrl || '',
                bio: p.bio || '', city: p.city || '', state: p.state || '', country: p.country || '',
            });
            setToggles({ profilePublic: p.profilePublic, openToMentor: p.openToMentor, openToHire: p.openToHire });
        }).catch(() => setError('PROFILE_FETCH_ERROR')).finally(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const addSkill = () => {
        const skill = skillInput.trim();
        if (!skill || !profile) return;
        setProfile(p => p ? { ...p, skills: [...(p.skills || []), skill] } : p);
        setSkillInput('');
    };

    const removeSkill = (idx: number) =>
        setProfile(p => p ? { ...p, skills: (p.skills || []).filter((_, i) => i !== idx) } : p);

    const handleSave = async () => {
        setSaving(true); setError(null); setSuccess(false);
        try {
            const res = await api.put('/profile', {
                ...form,
                graduationYear:  form.graduationYear  ? parseInt(form.graduationYear)  : null,
                experienceYears: form.experienceYears ? parseInt(form.experienceYears) : null,
                skills: profile?.skills || [],
                ...toggles,
            });
            setProfile(res.data.data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'SAVE_ERROR: Operation failed.');
        } finally { setSaving(false); }
    };

    const CpToggle = ({ field, label }: { field: keyof typeof toggles; label: string }) => (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`cp-toggle ${toggles[field] ? 'on' : ''}`}
                onClick={() => setToggles(t => ({ ...t, [field]: !t[field] }))}>
                <div className="cp-toggle-knob" />
            </div>
            <span className="font-mono-cp text-xs tracking-wide transition-colors"
                style={{ color: toggles[field] ? 'var(--cyan)' : 'rgba(0,245,255,0.4)' }}>
                {label}
            </span>
        </label>
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="cp-spinner" />
            <p className="font-mono-cp text-xs tracking-widest animate-pulse" style={{ color: 'var(--cyan)' }}>
                LOADING OPERATIVE DOSSIER...
            </p>
        </div>
    );
    if (!profile) return <div className="cp-alert-error font-mono-cp text-sm mt-8">{error}</div>;

    return (
        <div className="space-y-5 max-w-4xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <p className="font-mono-cp text-xs tracking-widest mb-1" style={{ color: 'rgba(0,245,255,0.4)' }}>// OPERATIVE_DOSSIER</p>
                    <h2 className="font-display text-2xl font-bold tracking-widest glow-cyan" style={{ color: 'var(--cyan)' }}>MY PROFILE</h2>
                </div>
                <button onClick={handleSave} disabled={saving} className="cp-btn-primary h-9 px-6">
                    {saving ? (
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                            SAVING...
                        </span>
                    ) : '[ SAVE_CHANGES ]'}
                </button>
            </div>

            {success && <div className="cp-alert-success font-mono-cp text-sm">✓ DOSSIER_UPDATED :: Changes saved successfully.</div>}
            {error   && <div className="cp-alert-error   font-mono-cp text-sm">⚠ {error}</div>}

            {/* Score */}
            <div className="cp-card p-4"><ScoreBar score={profile.profileScore} /></div>

            {/* Sections */}
            <CpSection title="BASIC_INFORMATION" icon="◉">
                <CpField label="// first_name"  name="firstName" value={form.firstName} onChange={handleChange} />
                <CpField label="// last_name"   name="lastName"  value={form.lastName}  onChange={handleChange} />
                <CpField label="// email [read_only]" name="email" value={profile.email} onChange={() => {}} readOnly />
                <CpField label="// phone"       name="phone"     value={form.phone}     onChange={handleChange} placeholder="+91 98765 43210" />
            </CpSection>

            <CpSection title="ACADEMIC_RECORD" icon="◈">
                <CpField label="// student_id"       name="studentId"      value={form.studentId}      onChange={handleChange} placeholder="22CS001" />
                <CpField label="// graduation_year"  name="graduationYear" value={form.graduationYear} onChange={handleChange} type="number" placeholder="2024" />
                <CpField label="// degree"           name="degree"         value={form.degree}         onChange={handleChange} placeholder="B.Tech" />
                <CpField label="// department"       name="department"     value={form.department}     onChange={handleChange} placeholder="Computer Science" />
                <div className="sm:col-span-2">
                    <CpField label="// specialization" name="specialization" value={form.specialization} onChange={handleChange} placeholder="Machine Learning" />
                </div>
            </CpSection>

            <CpSection title="PROFESSIONAL_STATUS" icon="⬡">
                <CpField label="// job_title"   name="currentJobTitle" value={form.currentJobTitle} onChange={handleChange} placeholder="Software Engineer" />
                <CpField label="// company"     name="currentCompany"  value={form.currentCompany}  onChange={handleChange} placeholder="Acme Corp" />
                <CpField label="// industry"    name="industry"        value={form.industry}        onChange={handleChange} placeholder="Technology" />
                <CpField label="// exp_years"   name="experienceYears" value={form.experienceYears} onChange={handleChange} type="number" placeholder="3" />
                <CpField label="// linkedin"    name="linkedinUrl"     value={form.linkedinUrl}     onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                <CpField label="// github"      name="githubUrl"       value={form.githubUrl}       onChange={handleChange} placeholder="https://github.com/..." />
                <div className="sm:col-span-2">
                    <CpField label="// portfolio" name="portfolioUrl" value={form.portfolioUrl} onChange={handleChange} placeholder="https://yoursite.com" />
                </div>
            </CpSection>

            <CpSection title="PERSONAL_LOCATION" icon="◎">
                <div className="sm:col-span-2">
                    <CpField label="// bio_statement" name="bio" value={form.bio} onChange={handleChange} placeholder="Describe your mission..." textarea />
                </div>
                <CpField label="// city"    name="city"    value={form.city}    onChange={handleChange} placeholder="Chandigarh" />
                <CpField label="// state"   name="state"   value={form.state}   onChange={handleChange} placeholder="Punjab" />
                <div className="sm:col-span-2">
                    <CpField label="// country" name="country" value={form.country} onChange={handleChange} placeholder="India" />
                </div>
            </CpSection>

            {/* Skills */}
            <div className="cp-card p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid rgba(0,245,255,0.1)' }}>
                    <span style={{ color: 'var(--cyan)', fontSize: '14px' }}>⬟</span>
                    <span className="cp-section-title">SKILL_MODULES</span>
                </div>
                <div className="flex gap-2">
                    <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        placeholder="input skill and press Enter..."
                        className="cp-input flex-1" />
                    <button onClick={addSkill} className="cp-btn-secondary px-4 text-xs">ADD</button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[2rem]">
                    {(profile.skills || []).map((skill, i) => (
                        <span key={i} className="cp-skill">
                            {skill}
                            <button onClick={() => removeSkill(i)}
                                className="ml-1 transition-colors hover:opacity-60"
                                style={{ color: 'var(--pink)', fontSize: '10px' }}>✕</button>
                        </span>
                    ))}
                    {!(profile.skills?.length) && (
                        <p className="font-mono-cp text-xs italic" style={{ color: 'rgba(0,245,255,0.2)' }}>// no_modules_loaded</p>
                    )}
                </div>
            </div>

            {/* Visibility toggles */}
            <div className="cp-card p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid rgba(0,245,255,0.1)' }}>
                    <span style={{ color: 'var(--cyan)', fontSize: '14px' }}>◈</span>
                    <span className="cp-section-title">VISIBILITY_PROTOCOLS</span>
                </div>
                <div className="space-y-4">
                    <CpToggle field="profilePublic" label="// PUBLIC_PROFILE :: visible in network directory" />
                    <CpToggle field="openToMentor"  label="// MENTOR_MODE    :: open to mentoring operatives" />
                    <CpToggle field="openToHire"    label="// HIRE_SIGNAL    :: open to new assignments" />
                </div>
            </div>

            {/* Save footer */}
            <div className="flex justify-end pb-4">
                <button onClick={handleSave} disabled={saving} className="cp-btn-primary h-9 px-8">
                    {saving ? 'SAVING...' : '[ COMMIT_CHANGES ]'}
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;