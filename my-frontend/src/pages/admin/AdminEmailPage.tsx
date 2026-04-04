import React, { useState } from 'react';
import { adminApi } from '../../lib/api';
import { Button, Alert, Input, Select, Textarea } from '../../components/ui';
import { PROGRAM_OPTIONS } from '../profile/ProfilePage';
import { PermissionGuard } from '../../components/auth/PermissionGuard';

export const AdminEmailPage: React.FC = () => {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [emailForm, setEmailForm] = useState({
        subject: '',
        body: 'Hello {{firstName}},\n\n',
        program: '',
        discipline: '',
        graduationYear: '',
        targetUserEmail: ''
    });
    const [sendingEmail, setSendingEmail] = useState(false);

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 4000);
    };

    const showError = (msg: string) => {
        setError(msg);
        setTimeout(() => setError(''), 4000);
    };

    const handleSendBulkEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailForm.subject.trim() || !emailForm.body.trim()) {
            showError('Subject and Body are required.');
            return;
        }

        setSendingEmail(true);
        const payload = {
            subject: emailForm.subject,
            body: emailForm.body,
            program: emailForm.program || undefined,
            discipline: emailForm.discipline || undefined,
            graduationYear: emailForm.graduationYear ? Number(emailForm.graduationYear) : undefined,
            targetUserEmail: emailForm.targetUserEmail.trim() || undefined
        };

        // @ts-ignore
        const res = await adminApi.sendTargetedEmail(payload);
        if (res.success) {
            showSuccess(res.data || 'Emails dispatched successfully.');
            setEmailForm({ ...emailForm, subject: '', body: 'Hello {{firstName}},\n\n', targetUserEmail: '' });
        } else {
            showError(res.error?.message || 'Failed to dispatch emails.');
        }
        setSendingEmail(false);
    };

    // Dispatch handled by PermissionGuard in render

    const DISCIPLINE_OPTIONS = [
        'B.Tech', 'B.E.', 'B.Sc', 'BCA', 'M.Tech', 'M.E.',
        'M.Sc', 'MCA', 'MBA', 'Ph.D', 'Other',
    ].map((v) => ({ value: v, label: v }));

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 0 }}>
            {/* ── Header ── */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--neon-pink)', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>
                    ADMIN_CONSOLE
                </div>
                <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-2xl)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Broadcast Email
                </h1>
            </div>

            {/* ── Alerts ── */}
            {success && <div style={{ flexShrink: 0 }}><Alert type="success" onClose={() => setSuccess('')}>{success}</Alert></div>}
            {error   && <div style={{ flexShrink: 0 }}><Alert type="error"   onClose={() => setError('')}>{error}</Alert></div>}

            {/* ── Content ── */}
            <div className="cp-panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{ color: 'var(--neon-cyan)', fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-lg)', marginBottom: '8px' }}>Targeted Communications Engine</h2>
                        <p style={{ color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-base)' }}>
                            Dispatch bulk emails to specific alumni cohorts based on their profile data. Leave filters blank to send to ALL enabled alumni users.
                        </p>
                    </div>

                    <form onSubmit={handleSendBulkEmail} style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 1.5fr', gap: '32px' }}>
                        
                        {/* ── Left Column: Target Filters ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ background: 'var(--bg-dark)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
                                <h3 style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', fontFamily: 'Orbitron, sans-serif', marginBottom: '20px', fontWeight: 600, letterSpacing: '0.05em' }}>
                                    TARGET_SELECTION
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <Input
                                        label="Direct Email (Override)"
                                        type="email"
                                        placeholder="E.g. user@example.com"
                                        value={emailForm.targetUserEmail}
                                        onChange={(e) => setEmailForm({...emailForm, targetUserEmail: e.target.value})}
                                    />
                                    <Input
                                        label="Graduation Year"
                                        type="number"
                                        placeholder="E.g. 2026"
                                        value={emailForm.graduationYear}
                                        onChange={(e) => setEmailForm({...emailForm, graduationYear: e.target.value})}
                                        disabled={!!emailForm.targetUserEmail}
                                    />
                                    <Select
                                        label="Program"
                                        options={PROGRAM_OPTIONS}
                                        placeholder="Any Program"
                                        value={emailForm.program}
                                        onChange={(e) => setEmailForm({...emailForm, program: e.target.value})}
                                        disabled={!!emailForm.targetUserEmail}
                                    />
                                    <Select
                                        label="Discipline"
                                        options={DISCIPLINE_OPTIONS}
                                        placeholder="Any Discipline"
                                        value={emailForm.discipline}
                                        onChange={(e) => setEmailForm({...emailForm, discipline: e.target.value})}
                                        disabled={!!emailForm.targetUserEmail}
                                    />
                                </div>
                            </div>

                            <div style={{ padding: '0 8px' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', fontFamily: 'Outfit, sans-serif', lineHeight: 1.5 }}>
                                    * Filters are additive. Email override takes precedence.
                                </p>
                            </div>
                        </div>

                        {/* ── Right Column: Message Content ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <Input
                                label="SUBJECT_LINE"
                                placeholder="E.g. Invitation to the Annual Department Meetup"
                                value={emailForm.subject}
                                onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                            />

                            <div className="cp-input-wrap" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label className="cp-label">MESSAGE_COMPOSE</label>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
                                        Use <code style={{ color: 'var(--neon-pink)', background: 'rgba(255, 0, 150, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>{`{{firstName}}`}</code> for personalization
                                    </span>
                                </div>
                                <Textarea
                                    style={{ minHeight: '350px', resize: 'none' }}
                                    placeholder={`Hello {{firstName}},\n\nWrite your message here...`}
                                    value={emailForm.body}
                                    onChange={(e) => setEmailForm({...emailForm, body: e.target.value})}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, marginTop: '10px' }}>
                                <PermissionGuard 
                                    permission="SEND_EMAIL"
                                    fallback={
                                        <>
                                            <Button size="lg" disabled style={{ minWidth: '240px' }}>UNAUTHORIZED</Button>
                                            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-pink)' }}>
                                                Requires SEND_EMAIL permission
                                            </span>
                                        </>
                                    }
                                >
                                    <Button 
                                        type="submit" 
                                        size="lg" 
                                        loading={sendingEmail} 
                                        style={{ minWidth: '240px' }}
                                    >
                                        DISPATCH_COMMUNICATION ››
                                    </Button>
                                </PermissionGuard>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};