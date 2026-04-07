import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supportApi, profileApi, getImageUrl } from '../../lib/api';
import { useToastStore } from '../../store/toastStore';
import {
    Input,
    Textarea,
    Button,
    Badge,
    Spinner,
    Modal
} from '../../components/ui';

interface DevMember {
    name: string;
    email: string;
    role: string;
    linkedin: string;
    github: string;
    bugReportPhotoUrl?: string | null;
}

export const BugReportPage: React.FC = () => {
    const { user } = useAuthStore();
    const { addToast } = useToastStore();

    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [devs, setDevs] = useState<DevMember[]>([
        {
            name: "Aditi Pandey",
            email: "pandeyaditi0307@gmail.com",
            role: "UI/UX & Frontend",
            linkedin: "https://www.linkedin.com/in/aditipandey568/",
            github: "https://github.com/AditiPandey568"
        },
        {
            name: "Yash Dwivedi",
            email: "yashdubey262@gmail.com",
            role: "Backend & Security",
            linkedin: "https://www.linkedin.com/in/yash-dwivedi-793983249/",
            github: "https://github.com/Tempestyash123456"
        }
    ]);

    const [form, setForm] = useState({
        title: '',
        information: '',
        recipients: ['Aditi Pandey', 'Yash Dwivedi']
    });

    const [uploadingFor, setUploadingFor] = useState<string | null>(null);

    // Check if current user is authorized to edit
    const isAuthorizedToEdit = user && (user.email === "pandeyaditi0307@gmail.com" || user.email === "yashdubey262@gmail.com");

    const fetchDevDetails = async () => {
        setLoading(true);
        try {
            const res = await supportApi.getDevelopers();
            if (res.success && res.data) {
                // Map API response to our local state
                const mappedDevs = res.data.map(d => ({
                    name: d.name,
                    email: d.email,
                    role: d.role,
                    linkedin: d.linkedinUrl || (d.email === "pandeyaditi0307@gmail.com"
                        ? "https://www.linkedin.com/in/aditipandey568/"
                        : "https://www.linkedin.com/in/yash-dwivedi-793983249/"),
                    github: d.githubUrl || (d.email === "pandeyaditi0307@gmail.com"
                        ? "https://github.com/AditiPandey568"
                        : "https://github.com/Tempestyash123456"),
                    bugReportPhotoUrl: d.bugReportPhotoUrl
                }));
                setDevs(mappedDevs);
            }
        } catch (error) {
            console.error("Failed to fetch dev details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevDetails();
    }, []);

    const handleSubmitBug = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.information || form.recipients.length === 0) {
            addToast("Please fill all fields and select at least one recipient", "error");
            return;
        }

        setSending(true);
        try {
            const res = await supportApi.reportBug(form);
            if (res.success) {
                addToast("Bug report sent successfully!", "success");
                setForm({ title: '', information: '', recipients: ['Aditi Pandey', 'Yash Dwivedi'] });
            } else {
                addToast(res.error?.message || "Failed to send report", "error");
            }
        } catch (error) {
            addToast("Network error occurred", "error");
        } finally {
            setSending(false);
        }
    };

    const handlePhotoUpload = async (file: File) => {
        if (!isAuthorizedToEdit) return;

        setLoading(true);
        try {
            const res = await profileApi.uploadBugReportPhoto(file);
            if (res.success && res.data) {
                addToast("Photo updated for Bug Report page!", "success");
                setDevs(prev => prev.map(d =>
                    d.email === user?.email ? { ...d, bugReportPhotoUrl: res.data?.bugReportPhotoUrl } : d
                ));
            } else {
                addToast(res.error?.message || "Upload failed", "error");
            }
        } catch (error) {
            addToast("Upload failed", "error");
        } finally {
            setLoading(false);
            setUploadingFor(null);
        }
    };

    if (loading && devs.every(d => !d.bugReportPhotoUrl)) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spinner size={40} />
            </div>
        );
    }

    return (
        <div style={{ animation: 'fade-in 0.5s ease-out' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '32px',
                    color: 'var(--text-primary)',
                    letterSpacing: '0.1em',
                    marginBottom: '8px'
                }}>
                    BUG REPORT <span style={{ color: 'var(--neon-pink)' }}>🐞</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
                    Encountered an issue? Report it to the dev team directly.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginBottom: '50px' }}>
                {devs.map((dev) => (
                    <div key={dev.email} className="cp-panel cp-corners" style={{
                        padding: '30px',
                        background: 'rgba(10, 15, 25, 0.4)',
                        border: dev.email === user?.email && isAuthorizedToEdit ? '1px solid var(--neon-cyan)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '15px',
                            overflow: 'hidden',
                            marginBottom: '20px',
                            border: '2px solid var(--border-subtle)',
                            background: 'var(--bg-void)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {dev.bugReportPhotoUrl ? (
                                <img
                                    src={getImageUrl(dev.bugReportPhotoUrl)}
                                    alt={dev.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <span style={{ fontSize: '40px', color: 'var(--text-disabled)' }}>👤</span>
                            )}
                        </div>

                        <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '5px' }}>
                            {dev.name}
                        </h3>
                        <Badge variant={dev.role.includes('Frontend') ? 'cyan' : 'purple'}>
                            {dev.role}
                        </Badge>

                        <div style={{ margin: '20px 0', display: 'flex', gap: '15px' }}>
                            <a href={dev.linkedin} target="_blank" rel="noreferrer" className="cp-nav-item" style={{ padding: '8px' }}>🔗 LinkedIn</a>
                            <a href={dev.github} target="_blank" rel="noreferrer" className="cp-nav-item" style={{ padding: '8px' }}>🐙 GitHub</a>
                        </div>

                        <p style={{ fontFamily: 'Share Tech Mono, monospace', color: 'var(--neon-cyan)', fontSize: '14px' }}>
                            {dev.email}
                        </p>

                        {isAuthorizedToEdit && user?.email === dev.email && (
                            <button
                                onClick={() => setUploadingFor(dev.email)}
                                style={{
                                    marginTop: '15px',
                                    background: 'transparent',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-muted)',
                                    padding: '5px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--neon-cyan)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                            >
                                Edit Photo
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="cp-panel" style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '40px',
                border: '1px solid var(--border-subtle)'
            }}>
                <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '20px', marginBottom: '30px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '15px' }}>
                    REPORT A BUG
                </h2>

                <form onSubmit={handleSubmitBug} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Input
                        label="Title for the bug"
                        placeholder="Brief summary of the issue..."
                        value={form.title}
                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                    />

                    <Textarea
                        label="Information about the bug"
                        placeholder="Please provide steps to reproduce, expected vs actual behavior..."
                        value={form.information}
                        onChange={e => setForm(prev => ({ ...prev, information: e.target.value }))}
                        required
                    />

                    <div style={{ marginTop: '10px' }}>
                        <Button
                            type="submit"
                            loading={sending}
                            style={{ width: '100%', height: '50px', fontSize: '16px', letterSpacing: '0.1em' }}
                        >
                            SEND BUG REPORT ✉
                        </Button>
                    </div>
                </form>
            </div>

            <Modal
                open={!!uploadingFor}
                onClose={() => setUploadingFor(null)}
                title="Update Dedicated Dev Photo"
            >
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                        Choose a photo to be displayed on this Bug Report page.
                    </p>
                    <input
                        type="file"
                        accept="image/*"
                        id="bug-photo-upload"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(file);
                        }}
                    />
                    <Button onClick={() => document.getElementById('bug-photo-upload')?.click()}>
                        Choose File
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
