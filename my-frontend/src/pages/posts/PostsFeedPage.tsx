import React, { useEffect, useState } from 'react';
// @ts-ignore
import { postsApi } from '../../lib/api.ts';
import type { PostDto } from '../../types';
import { Input, Spinner, Carousel } from '../../components/ui';

const BASE_URL = '';

// ── Markdown renderer ─────────────────────────────────────────────────────────
const renderMarkdown = (md: string): string => {
    const html = md
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/^### (.+)$/gm, '<h3 style="font-family:Orbitron,monospace;font-size:14px;color:var(--neon-purple);letter-spacing:.08em;margin:18px 0 8px">$1</h3>')
        .replace(/^## (.+)$/gm,  '<h2 style="font-family:Orbitron,monospace;font-size:16px;color:var(--neon-cyan);letter-spacing:.08em;margin:20px 0 10px">$1</h2>')
        .replace(/^# (.+)$/gm,   '<h1 style="font-family:Orbitron,monospace;font-size:20px;color:var(--neon-cyan);letter-spacing:.08em;margin:24px 0 12px">$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
        .replace(/\*(.+?)\*/g,     '<em style="color:var(--neon-amber)">$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background:rgba(0,245,255,0.08);border:1px solid rgba(0,245,255,0.2);padding:2px 6px;border-radius:3px;font-family:Share Tech Mono,monospace;font-size:12px;color:var(--neon-cyan)">$1</code>')
        .replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid var(--neon-pink);margin:12px 0;padding:8px 16px;background:rgba(255,45,120,0.05);color:var(--text-secondary);font-style:italic">$1</blockquote>')
        .replace(/^[*-] (.+)$/gm, '<li style="margin:4px 0;padding-left:8px;color:var(--text-secondary)">$1</li>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" style="color:var(--neon-cyan);text-decoration:underline">$1</a>')
        .replace(/^---$/gm, '<hr style="border:none;height:1px;background:linear-gradient(90deg,transparent,var(--neon-cyan),transparent);margin:20px 0">')
        .replace(/\n\n/g, '</p><p style="margin:10px 0;color:var(--text-secondary);line-height:1.8;font-family:Rajdhani,sans-serif;font-size:15px">')
        .replace(/\n/g, '<br>');
    return `<p style="margin:10px 0;color:var(--text-secondary);line-height:1.8;font-family:Rajdhani,sans-serif;font-size:15px">${html}</p>`;
};

// ── Full Post View (expanded inline) ─────────────────────────────────────────
const PostExpanded: React.FC<{ post: PostDto; onClose: () => void }> = ({ post, onClose }) => {
    const carouselItems = post.imageUrls?.map(url => ({
        url: `${BASE_URL}${url}`,
        type: 'IMAGE' as const
    })) || [];

    return (
        <div className="animate-fade-in" style={{ maxWidth: 760, margin: '0 auto' }}>
            <button onClick={onClose} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Share Tech Mono, monospace', fontSize: '12px',
                color: 'var(--neon-cyan)', marginBottom: 20, padding: 0,
                display: 'flex', alignItems: 'center', gap: 6,
            }}>
                ← Back to Feed
            </button>
            <article className="cp-panel cp-corners" style={{ overflow: 'hidden' }}>
                {carouselItems.length > 0 && (
                    <div style={{ height: 320, overflow: 'hidden', position: 'relative', background: '#000' }}>
                        <Carousel items={carouselItems} />
                    </div>
                )}
                <div style={{ padding: '32px' }}>
                    <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em', lineHeight: 1.3, marginBottom: 20 }}>
                        {post.title}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.15)', borderRadius: 4 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, monospace', fontSize: '9px', color: 'var(--bg-void)', fontWeight: 700 }}>
                                {post.authorFirstName[0]}{post.authorLastName[0]}
                            </div>
                            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {post.authorFirstName} {post.authorLastName}
                            </span>
                        </div>
                        <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })}
                        </span>
                        {post.updatedAt !== post.createdAt && (
                            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: 'var(--text-disabled)' }}>
                                · edited {new Date(post.updatedAt).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}
                            </span>
                        )}
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.description) }} />
                </div>
            </article>
        </div>
    );
};

// ── Post Card (feed) ──────────────────────────────────────────────────────────
const FeedCard: React.FC<{ post: PostDto; index: number; onClick: () => void }> = ({ post, index, onClick }) => {
    const preview = post.description.replace(/[#*`>\-[]()!]/g, '').replace(/\n/g, ' ').trim().slice(0, 200);
    const readTime = Math.max(1, Math.round(post.description.split(/\s+/).length / 200));

    return (
        <article
            className="cp-card"
            onClick={onClick}
            style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}
        >
            {post.imageUrls && post.imageUrls.length > 0 && (
                <div style={{ height: 200, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                    <img
                        src={`${BASE_URL}${post.imageUrls[0]}`}
                        alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                        onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.04)'; }}
                        onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
                        onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, var(--bg-card))' }} />
                    {post.imageUrls.length > 1 && (
                        <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: 'var(--neon-cyan)', fontFamily: 'Share Tech Mono' }}>
                            +{post.imageUrls.length - 1} IMAGES
                        </div>
                    )}
                </div>
            )}
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: 'var(--neon-cyan)' }}>
                            {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                        </span>
                        <span style={{ color: 'var(--text-disabled)', fontSize: '10px' }}>·</span>
                        <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '10px', color: 'var(--text-muted)' }}>
                            {post.authorFirstName} {post.authorLastName}
                        </span>
                    </div>
                    <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: 'var(--text-disabled)', letterSpacing: '0.05em' }}>
                        {readTime} min read
                    </span>
                </div>
                <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.4, transition: 'color 0.2s' }}>
                    {post.title}
                </h2>
                <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {preview}{preview.length >= 200 ? '...' : ''}
                </p>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: 'var(--neon-cyan)', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    READ MORE <span style={{ fontSize: '12px', transition: 'transform 0.2s' }}>→</span>
                </div>
            </div>
        </article>
    );
};

// ── Main Feed Page ────────────────────────────────────────────────────────────
export const PostsFeedPage: React.FC = () => {
    const [posts, setPosts]       = useState<PostDto[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [search, setSearch]     = useState('');
    const [selected, setSelected] = useState<PostDto | null>(null);

    useEffect(() => {
        postsApi.getAll().then(res => {
            if (res.data) setPosts(res.data);
            else setError(res.error?.message || 'Failed to load posts');
        }).finally(() => setLoading(false));
    }, []);

    const filtered = posts.filter(p =>
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        `${p.authorFirstName} ${p.authorLastName}`.toLowerCase().includes(search.toLowerCase())
    );

    // ── Single post expanded view — scrolls normally ──────────────────────────
    if (selected) {
        return (
            <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
                <PostExpanded post={selected} onClose={() => setSelected(null)} />
            </div>
        );
    }

    // ── Feed view ─────────────────────────────────────────────────────────────
    return (
        // height + minHeight: 0 fills the Layout flex column
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 0 }}>

            {/* ── Header ── */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '0.15em', marginBottom: 6 }}>
                    NETWORK_BROADCAST
                </div>
                <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Posts &amp; Announcements
                </h1>
                <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                    {loading ? '...' : `${posts.length} post${posts.length !== 1 ? 's' : ''} from the admin team`}
                </p>
            </div>

            {/* ── Search ── */}
            <div style={{ maxWidth: 400, flexShrink: 0 }}>
                <Input
                    placeholder="Search posts..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    icon={<span style={{ fontSize: 14 }}>⌕</span>}
                />
            </div>

            {/* ── Scrollable content area ── */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 2 }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                        <Spinner size={32} />
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--neon-pink)', fontFamily: 'Share Tech Mono, monospace' }}>
                        ⚠ {error}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <div style={{ fontSize: 52, opacity: 0.2, marginBottom: 16 }}>◇</div>
                        <p style={{ fontFamily: 'Share Tech Mono, monospace', color: 'var(--text-muted)' }}>
                            {search ? 'No posts match your search' : 'No posts published yet'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Featured post — first one, full width */}
                        {!search && filtered.length > 0 && (
                            <div
                                className="cp-card"
                                onClick={() => setSelected(filtered[0])}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: (filtered[0].imageUrls && filtered[0].imageUrls.length > 0) ? '1fr 1fr' : '1fr',
                                    overflow: 'hidden', cursor: 'pointer',
                                    animation: 'fadeIn 0.4s ease-out both',
                                    minHeight: 240,
                                }}
                            >
                                {filtered[0].imageUrls && filtered[0].imageUrls.length > 0 && (
                                    <div style={{ overflow: 'hidden', minHeight: 240 }}>
                                        <img
                                            src={`${BASE_URL}${filtered[0].imageUrls[0]}`}
                                            alt={filtered[0].title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                                        />
                                    </div>
                                )}
                                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
                                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '9px', color: 'var(--neon-pink)', letterSpacing: '0.2em', background: 'rgba(255,45,120,0.08)', border: '1px solid rgba(255,45,120,0.2)', borderRadius: 2, padding: '3px 10px', display: 'inline-block', width: 'fit-content' }}>
                                        LATEST
                                    </span>
                                    <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.4 }}>
                                        {filtered[0].title}
                                    </h2>
                                    <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                        {filtered[0].description.replace(/[#*`>\-[]()!]/g, '').replace(/\n/g, ' ').trim().slice(0, 280)}...
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                                        <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {filtered[0].authorFirstName} {filtered[0].authorLastName}
                                        </span>
                                        <span style={{ color: 'var(--text-disabled)' }}>·</span>
                                        <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {new Date(filtered[0].createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Remaining posts grid */}
                        {(search || filtered.length > 1) && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
                                {(search ? filtered : filtered.slice(1)).map((post, i) => (
                                    <FeedCard key={post.id} post={post} index={i} onClick={() => setSelected(post)} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};