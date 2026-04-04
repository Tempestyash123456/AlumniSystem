import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
import { eventsApi, getImageUrl } from '../../lib/api';
import type { EventDto } from '../../types';
import { Button, Alert, Input, Spinner, Confirm, Modal } from '../../components/ui';
import { PermissionGuard } from '../../components/auth/PermissionGuard';

const BASE_URL = '';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const fmtDateTime = (iso: string) => `${fmtDate(iso)} · ${fmtTime(iso)}`;

type EventStatus = 'UPCOMING' | 'ONGOING' | 'PAST';

const getEventStatus = (startTime: string, endTime?: string | null): EventStatus => {
    const now = new Date();
    const start = new Date(startTime);
    if (start > now) return 'UPCOMING';
    if (endTime) {
        const end = new Date(endTime);
        if (now >= start && now <= end) return 'ONGOING';
    }
    return 'PAST';
};

const STATUS_STYLES: Record<EventStatus, { bg: string; text: string; border: string }> = {
    UPCOMING: { bg: 'rgba(57,255,20,0.15)', text: 'var(--neon-green)', border: 'rgba(57,255,20,0.3)' },
    ONGOING: { bg: 'rgba(0,245,255,0.15)', text: 'var(--neon-cyan)', border: 'rgba(0,245,255,0.3)' },
    PAST: { bg: 'rgba(255,184,0,0.12)', text: 'var(--neon-amber)', border: 'rgba(255,184,0,0.3)' }
};

const docIcon = (name: string | undefined) => {
    if (!name) return '📎';
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (ext === 'pptx' || ext === 'ppt') return '📊';
    if (ext === 'docx' || ext === 'doc') return '📝';
    return '📎';
};

// ── Markdown Renderer ─────────────────────────────────────────────────────────
const renderMarkdown = (md: string): string => {
    const html = md
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em style="color:var(--neon-amber)">$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background:rgba(0,245,255,0.08);border:1px solid rgba(0,245,255,0.2);padding:2px 6px;border-radius:3px;font-family:Outfit,sans-serif;font-size:var(--font-size-sm);color:var(--neon-cyan)">$1</code>')
        .replace(/\n\n/g, '</p><p style="margin:8px 0;color:var(--text-secondary);line-height:1.7;font-family:Outfit,sans-serif;font-size:var(--font-size-base)">')
        .replace(/\n/g, '<br>');
    return `<p style="margin:8px 0;color:var(--text-secondary);line-height:1.7;font-family:Outfit,sans-serif;font-size:var(--font-size-base)">${html}</p>`;
};

// ── Media Upload Zone ─────────────────────────────────────────────────────────
const MediaUploadZone: React.FC<{
    current?: string | null;
    currentType?: string | null;
    onFile: (f: File | null) => void;
    pendingFile?: File | null;
    onRemove?: () => void;
}> = ({ current, currentType, onFile, pendingFile, onRemove }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [drag, setDrag] = useState(false);

    const previewUrl = pendingFile
        ? URL.createObjectURL(pendingFile)
        : current ? `${BASE_URL}${current}` : null;

    const isVideo = pendingFile
        ? pendingFile.type.startsWith('video/')
        : currentType === 'VIDEO';

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDrag(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) onFile(file);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="cp-label">Media — Image or Video</label>
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${drag ? 'var(--neon-cyan)' : 'var(--border-subtle)'}`,
                    borderRadius: 6, cursor: 'pointer', overflow: 'hidden',
                    background: drag ? 'rgba(0,245,255,0.04)' : 'var(--bg-dark)',
                    minHeight: previewUrl ? 'auto' : 110,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: drag ? '0 0 20px rgba(0,245,255,0.2)' : 'none',
                    transition: 'all 0.2s',
                }}
            >
                {previewUrl ? (
                    <div style={{ position: 'relative', width: '100%' }}>
                        {isVideo ? (
                            <video
                                src={previewUrl}
                                controls
                                style={{ width: '100%', maxHeight: 220, display: 'block', background: '#000' }}
                            />
                        ) : (
                            <img
                                src={previewUrl}
                                alt="Preview"
                                style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
                            />
                        )}
                        <div
                            style={{
                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: 0, transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                        >
                            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--neon-cyan)', fontWeight: 700 }}>
                                CLICK TO REPLACE
                            </span>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>◈</div>
                        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                            Drop image or video · click to browse
                        </div>
                        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-disabled)', marginTop: 4 }}>
                            JPG / PNG / WEBP · MP4 / WEBM · max 100 MB
                        </div>
                    </div>
                )}
            </div>
            {previewUrl && (
                <button type="button" onClick={() => onRemove ? onRemove() : onFile(null)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--neon-pink)', fontFamily: 'Outfit, sans-serif',
                    fontSize: 'var(--font-size-sm)', textAlign: 'left', fontWeight: 600
                }}>
                    ✕ Remove media
                </button>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={e => onFile(e.target.files?.[0] || null)}
            />
        </div>
    );
};

// ── Document Upload Zone ──────────────────────────────────────────────────────
const DocUploadZone: React.FC<{
    currentName?: string | null;
    currentUrl?: string | null;
    onFile: (f: File | null) => void;
    pendingFile?: File | null;
    onRemove?: () => void;
}> = ({ currentName, currentUrl, onFile, pendingFile, onRemove }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [drag, setDrag] = useState(false);

    const displayName = pendingFile ? pendingFile.name : currentName;
    const displayUrl = !pendingFile && currentUrl ? `${BASE_URL}${currentUrl}` : null;

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDrag(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="cp-label">Document — PDF / DOCX / PPTX (optional)</label>
            <div
                onClick={() => !displayName && inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${drag ? 'var(--neon-purple)' : 'var(--border-subtle)'}`,
                    borderRadius: 6, cursor: displayName ? 'default' : 'pointer',
                    background: drag ? 'rgba(191,90,242,0.04)' : 'var(--bg-dark)',
                    padding: '16px 20px', transition: 'all 0.2s',
                    boxShadow: drag ? '0 0 20px rgba(191,90,242,0.2)' : 'none',
                }}
            >
                {displayName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 28 }}>{docIcon(displayName)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)',
                                color: 'var(--text-primary)', overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600
                            }}>
                                {displayName}
                            </div>
                            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--neon-purple)', marginTop: 2, fontWeight: 500 }}>
                                {pendingFile ? 'NEW FILE — not saved yet' : 'CURRENT ATTACHMENT'}
                            </div>
                        </div>
                        {displayUrl && !pendingFile && (
                            <a
                                href={displayUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="cp-btn cp-btn-ghost cp-btn-sm"
                                style={{ flexShrink: 0 }}
                            >
                                Open ↗
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onRemove ? onRemove() : onFile(null); }}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--neon-pink)', fontSize: 18, lineHeight: 1, flexShrink: 0,
                            }}
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.3 }}>📎</div>
                        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                            Drop document here or click to browse
                        </div>
                        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-disabled)', marginTop: 3 }}>
                            PDF · DOCX · PPTX · max 50 MB
                        </div>
                    </div>
                )}
            </div>
            {!displayName && (
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    style={{ display: 'none' }}
                    onChange={e => onFile(e.target.files?.[0] || null)}
                />
            )}
        </div>
    );
};

import { useAuthStore } from '../../store/authStore';

const EventCard: React.FC<{
    event: EventDto;
    onEdit: () => void;
    onDelete: () => void;
    onView: () => void;
    index: number;
}> = ({ event, onEdit, onDelete, onView, index }) => {
    const {} = useAuthStore();
    const status = getEventStatus(event.startTime, event.endTime);
    const styleConf = STATUS_STYLES[status];

    return (
        <div
            className="cp-card"
            style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: `fadeIn 0.3s ease-out ${index * 0.04}s both` }}
        >
            {/* Media thumbnail */}
            <div style={{ height: 160, overflow: 'hidden', position: 'relative', background: 'var(--bg-hover)', flexShrink: 0 }}>
                {event.mediaUrl ? (
                    event.mediaType === 'VIDEO' ? (
                        <video
                            src={`${BASE_URL}${event.mediaUrl}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            muted
                        />
                    ) : (
                        <img
                            src={`${BASE_URL}${event.mediaUrl}`}
                            alt={event.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    )
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 48, opacity: 0.15 }}>◈</span>
                    </div>
                )}
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, var(--bg-card))' }} />

                {/* Status badge */}
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <span style={{
                        fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', letterSpacing: '0.15em',
                        padding: '4px 10px', borderRadius: 4,
                        background: styleConf.bg,
                        color: styleConf.text,
                        border: `1px solid ${styleConf.border}`,
                        fontWeight: 700,
                    }}>
                        {status}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.4 }}>
                    {event.name}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Separate Start & End Times */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.15)', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--neon-cyan)', fontSize: 10, width: 12, textAlign: 'center' }}>▶</span>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>START</span>
                                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                    {fmtDateTime(event.startTime)}
                                </span>
                            </div>
                        </div>
                        {event.endTime && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: 'var(--neon-pink)', fontSize: 10, width: 12, textAlign: 'center' }}>■</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>END</span>
                                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                        {fmtDateTime(event.endTime)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Place */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--neon-pink)', fontSize: 12, paddingLeft: 2 }}>📍</span>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {event.place}
                        </span>
                    </div>

                    {/* Document chip */}
                    {event.documentName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, paddingLeft: 2 }}>{docIcon(event.documentName)}</span>
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--neon-purple)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140, fontWeight: 500 }}>
                                {event.documentName}
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 8 }}>
                    <Button variant="ghost" size="sm" onClick={onView} style={{ flex: 1 }}>View</Button>
                    <PermissionGuard permission="EDIT_EVENT">
                        <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
                    </PermissionGuard>
                    <PermissionGuard permission="DELETE_EVENT">
                        <Button variant="danger" size="sm" onClick={onDelete}>✕</Button>
                    </PermissionGuard>
                </div>
            </div>
        </div>
    );
};

// ── Event Detail Modal ────────────────────────────────────────────────────────
const EventDetailModal: React.FC<{ event: EventDto | null; onClose: () => void }> = ({ event, onClose }) => {
    if (!event) return null;
    const status = getEventStatus(event.startTime, event.endTime);
    const styleConf = STATUS_STYLES[status];

    return (
        <Modal open={!!event} title={event.name} onClose={onClose} width={720}>
            {/* Media */}
            {event.mediaUrl && (
                <div style={{ margin: '-24px -24px 24px', maxHeight: 280, overflow: 'hidden', background: '#000' }}>
                    {event.mediaType === 'VIDEO' ? (
                        <video
                            src={`${BASE_URL}${event.mediaUrl}`}
                            controls
                            style={{ width: '100%', maxHeight: 280, display: 'block' }}
                        />
                    ) : (
                        <img
                            src={`${BASE_URL}${event.mediaUrl}`}
                            alt={event.name}
                            style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }}
                        />
                    )}
                </div>
            )}

            {/* Meta strip */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                <span style={{
                    fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', letterSpacing: '0.15em',
                    padding: '4px 10px', borderRadius: 4,
                    background: styleConf.bg,
                    color: styleConf.text,
                    border: `1px solid ${styleConf.border}`,
                    fontWeight: 700,
                }}>
                    {status}
                </span>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 4, fontWeight: 600 }}>START TIME</div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--neon-cyan)' }}>
                        {fmtDateTime(event.startTime)}
                    </div>
                </div>
                {event.endTime && (
                    <div>
                        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 4, fontWeight: 600 }}>END TIME</div>
                        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                            {fmtDateTime(event.endTime)}
                        </div>
                    </div>
                )}
                <div style={{ gridColumn: event.endTime ? '1' : '1 / -1' }}>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 4, fontWeight: 600 }}>LOCATION</div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📍</span> {event.place}
                    </div>
                </div>
                <div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 4, fontWeight: 600 }}>POSTED BY</div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        {event.authorFirstName} {event.authorLastName}
                    </div>
                </div>
            </div>

            {/* Description */}
            {event.description && (
                <>
                    <hr className="cp-divider" style={{ marginBottom: 16 }} />
                    <div
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(event.description) }}
                        style={{ marginBottom: 20 }}
                    />
                </>
            )}

            {/* Document */}
            {event.documentUrl && event.documentName && (
                <>
                    <hr className="cp-divider" style={{ marginBottom: 16 }} />
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 10, fontWeight: 600 }}>
                        ATTACHMENT
                    </div>
                    <a
                        href={`${BASE_URL}${event.documentUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                            padding: '10px 16px',
                            background: 'rgba(191,90,242,0.06)',
                            border: '1px solid rgba(191,90,242,0.25)',
                            borderRadius: 4,
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--neon-purple)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(191,90,242,0.25)')}
                    >
                        <span style={{ fontSize: 20 }}>{docIcon(event.documentName)}</span>
                        <div>
                            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--neon-purple)', fontWeight: 600 }}>
                                {event.documentName}
                            </div>
                            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-disabled)', marginTop: 2 }}>
                                Click to open ↗
                            </div>
                        </div>
                    </a>
                </>
            )}
        </Modal>
    );
};

// ── Event Editor Form ─────────────────────────────────────────────────────────
// Converts JS Date to "YYYY-MM-DDTHH:mm" for datetime-local input
const toLocalInput = (iso: string | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface EditorState {
    name: string;
    startTime: string;
    endTime: string;
    place: string;
    description: string;
}

const EventEditorModal: React.FC<{
    open: boolean;
    editTarget: EventDto | null;
    onClose: () => void;
    onSave: (state: EditorState, mediaFile: File | null, docFile: File | null, removeMedia: boolean, removeDoc: boolean) => Promise<void>;
    saving: boolean;
    error: string;
    onClearError: () => void;
}> = ({ open, editTarget, onClose, onSave, saving, error, onClearError }) => {
    const [form, setForm] = useState<EditorState>({
        name: '', startTime: '', endTime: '', place: '', description: '',
    });
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [docFile, setDocFile] = useState<File | null>(null);

    const [removeMedia, setRemoveMedia] = useState(false);
    const [removeDoc, setRemoveDoc] = useState(false);

    useEffect(() => {
        if (editTarget) {
            setForm({
                name: editTarget.name,
                startTime: toLocalInput(editTarget.startTime),
                endTime: toLocalInput(editTarget.endTime ?? ''),
                place: editTarget.place,
                description: editTarget.description ?? '',
            });
        } else {
            setForm({ name: '', startTime: '', endTime: '', place: '', description: '' });
        }
        setMediaFile(null);
        setDocFile(null);
        setRemoveMedia(false);
        setRemoveDoc(false);
    }, [editTarget, open]);

    const set = (field: keyof EditorState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <Modal
            open={open}
            title={editTarget ? 'EDIT_EVENT' : 'NEW_EVENT'}
            onClose={onClose}
            width={700}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {error && <Alert type="error" onClose={onClearError}>{error}</Alert>}

                {/* Name */}
                <Input
                    label="Event Name"
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Annual Alumni Meetup 2025"
                />

                {/* Timings */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Input
                        label="Start Date & Time"
                        type="datetime-local"
                        value={form.startTime}
                        onChange={set('startTime')}
                    />
                    <Input
                        label="End Date & Time (optional)"
                        type="datetime-local"
                        value={form.endTime}
                        onChange={set('endTime')}
                    />
                </div>

                {/* Place */}
                <Input
                    label="Location / Venue"
                    value={form.place}
                    onChange={set('place')}
                    placeholder="Main Auditorium, Block A"
                    icon={<span>📍</span>}
                />

                {/* Description */}
                <div className="cp-input-wrap">
                    <label className="cp-label">Description (optional · Markdown supported)</label>
                    <textarea
                        className="cp-input"
                        value={form.description}
                        onChange={set('description')}
                        placeholder="Tell attendees what to expect..."
                        style={{ minHeight: 100, resize: 'vertical', fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', lineHeight: 1.6 }}
                    />
                </div>

                {/* Media */}
                <MediaUploadZone
                    current={removeMedia ? null : editTarget?.mediaUrl}
                    currentType={editTarget?.mediaType}
                    pendingFile={mediaFile}
                    onFile={f => { setMediaFile(f); if (f) setRemoveMedia(false); }}
                    onRemove={() => { setMediaFile(null); setRemoveMedia(true); }}
                />

                {/* Document */}
                <DocUploadZone
                    currentName={removeDoc ? null : editTarget?.documentName}
                    currentUrl={removeDoc ? null : editTarget?.documentUrl}
                    pendingFile={docFile}
                    onFile={f => { setDocFile(f); if (f) setRemoveDoc(false); }}
                    onRemove={() => { setDocFile(null); setRemoveDoc(true); }}
                />

                {/* Actions */}
                <div style={{
                    display: 'flex', justifyContent: 'flex-end', gap: 10,
                    paddingTop: 8, borderTop: '1px solid var(--border-subtle)',
                }}>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        loading={saving}
                        onClick={() => onSave(form, mediaFile, docFile, removeMedia, removeDoc)}
                    >
                        {saving ? 'SAVING...' : editTarget ? 'UPDATE EVENT' : 'CREATE EVENT'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<EventDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'ongoing' | 'upcoming' | 'past'>('all');

    const [editorOpen, setEditorOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<EventDto | null>(null);
    const [viewEvent, setViewEvent] = useState<EventDto | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EventDto | null>(null);

    const load = async () => {
        setLoading(true);
        const res = await eventsApi.getAll();
        if (res.data) setEvents(res.data);
        else setError(res.error?.message || 'Failed to load events');
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditTarget(null); setEditorOpen(true); };
    const openEdit = (ev: EventDto) => { setEditTarget(ev); setEditorOpen(true); };

    const showSuccess = (msg: string) => {
        setSuccess(msg); setTimeout(() => setSuccess(''), 4000);
    };

    const handleSave = async (
        form: { name: string; startTime: string; endTime: string; place: string; description: string },
        mediaFile: File | null,
        docFile: File | null,
        removeMedia: boolean,
        removeDoc: boolean
    ) => {
        if (!form.name.trim()) { setError('Event name is required'); return; }
        if (!form.startTime) { setError('Start date & time is required'); return; }
        if (!form.place.trim()) { setError('Location is required'); return; }

        setSaving(true); setError('');

        const data = {
            name: form.name,
            startTime: new Date(form.startTime).toISOString(),
            endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
            place: form.place,
            description: form.description || null,
        };

        let res;
        if (editTarget) {
            const updateData = { ...data, removeMedia, removeDocument: removeDoc };
            res = await eventsApi.update(editTarget.id, updateData, mediaFile, docFile);
        } else {
            res = await eventsApi.create(data, mediaFile, docFile);
        }

        if (res.data) {
            if (editTarget) {
                setEvents(prev => prev.map(e => e.id === editTarget.id ? res.data! : e));
            } else {
                setEvents(prev => [res.data!, ...prev]);
            }
            setEditorOpen(false);
            showSuccess(editTarget ? 'Event updated' : 'Event created');
        } else {
            setError(res.error?.message || 'Save failed');
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const res = await eventsApi.delete(deleteTarget.id);
        if (res.success) {
            setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
            showSuccess('Event deleted');
        }
        setDeleteTarget(null);
    };

    // Filtering logic combining search text and status
    const filtered = events.filter(ev => {
        const q = search.toLowerCase();
        const matchSearch = !q ||
            ev.name.toLowerCase().includes(q) ||
            ev.place.toLowerCase().includes(q);
        const currentStatus = getEventStatus(ev.startTime, ev.endTime).toLowerCase();
        const matchStatus = filterStatus === 'all' || filterStatus === currentStatus;
        return matchSearch && matchStatus;
    });

    const upcomingCount = events.filter(e => getEventStatus(e.startTime, e.endTime) === 'UPCOMING').length;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 0 }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, flexShrink: 0 }}>
                <div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--neon-pink)', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>
                        ADMIN_CONSOLE › EVENT_MANAGEMENT
                    </div>
                    <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-2xl)', fontWeight: 700, letterSpacing: '0.05em' }}>
                        Events
                    </h1>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 4 }}>
                        {events.length} event{events.length !== 1 ? 's' : ''} · {upcomingCount} upcoming
                    </p>
                </div>
                <PermissionGuard permission="CREATE_EVENT">
                    <Button onClick={openCreate} variant="primary">+ NEW EVENT</Button>
                </PermissionGuard>
            </div>

            {/* ── Stat cards ── */}
            {/* <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, flexShrink: 0 }}>
                {[
                    { label: 'Total',    value: events.length, color: 'purple' },
                    { label: 'Ongoing',  value: ongoingCount,  color: 'cyan'   },
                    { label: 'Upcoming', value: upcomingCount, color: 'green'  },
                    { label: 'Past',     value: pastCount,     color: 'amber'  },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`cp-stat-card ${color}`}>
                        <div className={`cp-stat-value text-neon-${color}`} style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{value}</div>
                        <div className="cp-stat-label" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>{label}</div>
                    </div>
                ))}
            </div> */}

            {/* ── Alerts ── */}
            {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}
            {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

            {/* ── Search + Filter ── */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ flex: '1 1 220px', maxWidth: 360 }}>
                    <Input
                        placeholder="Search events..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        icon={<span>⌕</span>}
                    />
                </div>

                {/* Status filter tabs */}
                <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                    {(['all', 'ongoing', 'upcoming', 'past'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            style={{
                                padding: '8px 16px',
                                background: filterStatus === s ? 'rgba(0,245,255,0.1)' : 'transparent',
                                border: 'none',
                                color: filterStatus === s ? 'var(--neon-cyan)' : 'var(--text-muted)',
                                fontFamily: 'Orbitron, monospace', fontSize: '9px',
                                letterSpacing: '0.1em', cursor: 'pointer',
                                transition: 'all 0.15s', textTransform: 'uppercase',
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Grid ── */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 2 }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                        <Spinner size={32} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.15 }}>◈</div>
                        <p style={{ fontFamily: 'Share Tech Mono, monospace', color: 'var(--text-muted)', marginBottom: 20 }}>
                            {search || filterStatus !== 'all' ? 'No events match your filters' : 'No events yet — create the first one'}
                        </p>
                        {!search && filterStatus === 'all' && (
                            <PermissionGuard permission="CREATE_EVENT">
                                <Button onClick={openCreate}>Create Event</Button>
                            </PermissionGuard>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                        {filtered.map((ev, i) => (
                            <EventCard
                                key={ev.id}
                                event={ev}
                                index={i}
                                onEdit={() => openEdit(ev)}
                                onDelete={() => setDeleteTarget(ev)}
                                onView={() => setViewEvent(ev)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            <EventEditorModal
                open={editorOpen}
                editTarget={editTarget}
                onClose={() => setEditorOpen(false)}
                onSave={handleSave}
                saving={saving}
                error={error}
                onClearError={() => setError('')}
            />

            <EventDetailModal
                event={viewEvent}
                onClose={() => setViewEvent(null)}
            />

            <Confirm
                open={!!deleteTarget}
                title="DELETE_EVENT"
                message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
                danger
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};