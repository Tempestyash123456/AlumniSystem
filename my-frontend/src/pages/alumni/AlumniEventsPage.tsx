import React, { useEffect, useState } from 'react';
import { eventsApi } from '../../lib/api';
import type { EventDto } from '../../types';
import { Button, Alert, Input, Spinner, Modal } from '../../components/ui';

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
        .replace(/`([^`]+)`/g, '<code style="background:rgba(0,245,255,0.08);border:1px solid rgba(0,245,255,0.2);padding:2px 6px;border-radius:3px;font-family:Share Tech Mono,monospace;font-size:12px;color:var(--neon-cyan)">$1</code>')
        .replace(/\n\n/g, '</p><p style="margin:8px 0;color:var(--text-secondary);line-height:1.7;font-family:Rajdhani,sans-serif;font-size:15px">')
        .replace(/\n/g, '<br>');
    return `<p style="margin:8px 0;color:var(--text-secondary);line-height:1.7;font-family:Rajdhani,sans-serif;font-size:15px">${html}</p>`;
};

// ── Event Card (Read-Only) ────────────────────────────────────────────────────
const EventCard: React.FC<{
    event: EventDto;
    onView: () => void;
    index: number;
}> = ({ event, onView, index }) => {
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
                <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.4 }}>
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
                            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: 'var(--neon-purple)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                {event.documentName}
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 8 }}>
                    <Button variant="outline" size="sm" onClick={onView} style={{ flex: 1 }}>View Details</Button>
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
                    padding: '4px 12px', borderRadius: 4,
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
                            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--neon-purple)' }}>
                                {event.documentName}
                            </div>
                            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: 'var(--text-disabled)', marginTop: 2 }}>
                                Click to open ↗
                            </div>
                        </div>
                    </a>
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <Button variant="primary" onClick={onClose}>Close</Button>
            </div>
        </Modal>
    );
};


// ── Main Page ─────────────────────────────────────────────────────────────────
export const AlumniEventsPage: React.FC = () => {
    const [events, setEvents] = useState<EventDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'ongoing' | 'upcoming' | 'past'>('all');
    const [viewEvent, setViewEvent] = useState<EventDto | null>(null);

    const load = async () => {
        setLoading(true);
        const res = await eventsApi.getAll();
        if (res.data) setEvents(res.data);
        else setError(res.error?.message || 'Failed to load events');
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

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

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 0 }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, flexShrink: 0 }}>
                <div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--neon-pink)', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>
                        NETWORK_BROADCAST › ALUMNI_EVENTS
                    </div>
                    <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-2xl)', fontWeight: 700, letterSpacing: '0.05em' }}>
                        Alumni Events
                    </h1>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 4 }}>
                        {events.length} event{events.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* ── Alerts ── */}
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
                                fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)',
                                letterSpacing: '0.1em', cursor: 'pointer',
                                transition: 'all 0.15s', textTransform: 'uppercase', fontWeight: 600,
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
                            {search || filterStatus !== 'all' ? 'No events match your filters.' : 'No events have been announced yet.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                        {filtered.map((ev, i) => (
                            <EventCard
                                key={ev.id}
                                event={ev}
                                index={i}
                                onView={() => setViewEvent(ev)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            <EventDetailModal
                event={viewEvent}
                onClose={() => setViewEvent(null)}
            />
        </div>
    );
};