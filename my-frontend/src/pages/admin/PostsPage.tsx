import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
import { postsApi } from '../../lib/api';
import type { PostDto } from '../../types';
import { Button, Alert, Input, Spinner, Confirm, Modal, Carousel } from '../../components/ui';
import { PermissionGuard } from '../../components/auth/PermissionGuard';

const BASE_URL = '';

// ── Minimal Markdown Renderer ─────────────────────────────────────────────────
const renderMarkdown = (md: string): string => {
    let html = md
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

// ── Media Upload Zone (Images Only for Posts) ─────────────────────────────────
const ImageUploadZone: React.FC<{
    current?: string[];
    onFiles: (files: File[]) => void;
    pendingFiles: File[];
    onRemoveCurrent: (idx: number) => void;
    onRemovePending: (idx: number) => void;
}> = ({ current, onFiles, pendingFiles, onRemoveCurrent, onRemovePending }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [drag, setDrag] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDrag(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) onFiles([...pendingFiles, ...files]);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="cp-label">Post Images</label>
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${drag ? 'var(--neon-cyan)' : 'var(--border-subtle)'}`,
                    borderRadius: 6, cursor: 'pointer',
                    background: drag ? 'rgba(0,245,255,0.04)' : 'var(--bg-dark)',
                    minHeight: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: drag ? '0 0 20px rgba(0,245,255,0.2)' : 'none',
                    transition: 'all 0.2s',
                    padding: 20
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>◈</div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                        Drop images here · click to browse
                    </div>
                </div>
            </div>
            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => onFiles([...pendingFiles, ...Array.from(e.target.files || [])])}
            />

            {/* Previews */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10 }}>
                {current?.map((url, idx) => (
                    <div key={`curr-${idx}`} style={{ position: 'relative', aspectRatio: '1', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                        <img src={`${BASE_URL}${url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => onRemoveCurrent(idx)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,45,120,0.8)', border: 'none', color: '#fff', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 12 }}>×</button>
                    </div>
                ))}
                {pendingFiles.map((f, idx) => (
                    <div key={`pending-${idx}`} style={{ position: 'relative', aspectRatio: '1', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--neon-cyan)' }}>
                        <img src={URL.createObjectURL(f)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => onRemovePending(idx)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,45,120,0.8)', border: 'none', color: '#fff', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 12 }}>×</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Post Card ─────────────────────────────────────────────────────────────────
const PostCard: React.FC<{
    post: PostDto;
    onEdit: () => void;
    onDelete: () => void;
    onView: () => void;
}> = ({ post, onEdit, onDelete, onView }) => {
    const preview = post.description.replace(/[#*`>\-\[\]]/g, '').slice(0, 180);
    return (
        <div className="cp-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {post.imageUrls && post.imageUrls.length > 0 && (
                <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                    <img
                        src={`${BASE_URL}${post.imageUrls[0]}`}
                        alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, var(--bg-card))' }} />
                    {post.imageUrls.length > 1 && (
                        <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: 'var(--neon-cyan)', fontFamily: 'Share Tech Mono' }}>
                            +{post.imageUrls.length - 1} IMAGES
                        </div>
                    )}
                </div>
            )}
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--neon-cyan)', letterSpacing: '0.05em' }}>
                        {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })}
                    </span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-disabled)' }} />
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        {post.authorFirstName} {post.authorLastName}
                    </span>
                </div>
                <h3 style={{ fontFamily: 'Orbitron, monospace', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em', lineHeight: 1.4 }}>
                    {post.title}
                </h3>
                <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {preview}{preview.length >= 180 ? '...' : ''}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Button variant="ghost" size="sm" onClick={onView} style={{ flex: 1 }}>Read</Button>
                    <PermissionGuard permission="EDIT_POST">
                        <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
                    </PermissionGuard>
                    <PermissionGuard permission="DELETE_POST">
                        <Button variant="danger" size="sm" onClick={onDelete}>✕</Button>
                    </PermissionGuard>
                </div>
            </div>
        </div>
    );
};

// ── Markdown Editor ───────────────────────────────────────────────────────────
const MarkdownEditor: React.FC<{ value: string; onChange: (v: string) => void; label?: string }> = ({ value, onChange, label }) => {
    const [tab, setTab] = useState<'write' | 'preview'>('write');

    const insertAt = (before: string, after = '') => {
        const ta = document.getElementById('md-editor') as HTMLTextAreaElement;
        if (!ta) return;
        const start = ta.selectionStart;
        const end   = ta.selectionEnd;
        const selected = value.slice(start, end);
        const newVal = value.slice(0, start) + before + selected + after + value.slice(end);
        onChange(newVal);
        setTimeout(() => {
            ta.selectionStart = start + before.length;
            ta.selectionEnd   = start + before.length + selected.length;
            ta.focus();
        }, 0);
    };

    const toolbarBtns = [
        { label: 'H1', action: () => insertAt('# ') },
        { label: 'H2', action: () => insertAt('## ') },
        { label: 'H3', action: () => insertAt('### ') },
        { label: 'B',  action: () => insertAt('**', '**'), style: { fontWeight: 700 } },
        { label: 'I',  action: () => insertAt('*', '*'),   style: { fontStyle: 'italic' as const } },
        { label: '`',  action: () => insertAt('`', '`') },
        { label: '> ', action: () => insertAt('> ') },
        { label: '—',  action: () => insertAt('\n---\n') },
        { label: '• ', action: () => insertAt('- ') },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {label && <label className="cp-label">{label}</label>}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
                {(['write', 'preview'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        padding: '6px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
                        fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-xs)', letterSpacing: '0.1em',
                        color: tab === t ? 'var(--neon-cyan)' : 'var(--text-muted)',
                        borderBottom: tab === t ? '2px solid var(--neon-cyan)' : '2px solid transparent',
                        marginBottom: -1, transition: 'all 0.15s', fontWeight: 600,
                    }}>
                        {t.toUpperCase()}
                    </button>
                ))}
            </div>
            {tab === 'write' ? (
                <>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '6px', background: 'rgba(0,245,255,0.03)', borderRadius: 4 }}>
                        {toolbarBtns.map(btn => (
                            <button key={btn.label} type="button" onClick={btn.action} style={{
                                padding: '4px 10px', background: 'var(--bg-card)',
                                border: '1px solid var(--border-subtle)', borderRadius: 3,
                                color: 'var(--text-secondary)', cursor: 'pointer',
                                fontFamily: 'Share Tech Mono, monospace', fontSize: '12px',
                                transition: 'all 0.1s', ...(btn as any).style,
                            }}>
                                {btn.label}
                            </button>
                        ))}
                    </div>
                    <textarea
                        id="md-editor"
                        className="cp-input"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder="Write your post in **Markdown**..."
                        style={{ minHeight: 280, resize: 'vertical', fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-base)', lineHeight: 1.7 }}
                    />
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-xs)', color: 'var(--text-disabled)', textAlign: 'right', marginTop: 4 }}>
                        {value.length} characters · {value.split('\n').length} lines
                    </div>
                </>
            ) : (
                <div
                    style={{ minHeight: 280, padding: '16px 20px', background: 'var(--bg-dark)', border: '1px solid var(--border-subtle)', borderRadius: 4, overflowY: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: value ? renderMarkdown(value) : '<p style="color:var(--text-disabled);font-family:Share Tech Mono,monospace;font-size:12px">Nothing to preview yet...</p>' }}
                />
            )}
        </div>
    );
};

// ── Post View Modal ───────────────────────────────────────────────────────────
const PostViewModal: React.FC<{ post: PostDto | null; onClose: () => void }> = ({ post, onClose }) => {
    if (!post) return null;
    const carouselItems = post.imageUrls?.map(url => ({
        url: `${BASE_URL}${url}`,
        type: 'IMAGE' as const
    })) || [];

    return (
        <Modal open={!!post} title={post.title} onClose={onClose} width={700}>
            {carouselItems.length > 0 && (
                <div style={{ margin: '-24px -24px 24px', background: '#000' }}>
                    <Carousel items={carouselItems} />
                </div>
            )}
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 16, display: 'flex', gap: 12 }}>
                <span>By {post.authorFirstName} {post.authorLastName}</span>
                <span>{new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })}</span>
            </div>
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.description) }} />
        </Modal>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export const PostsPage: React.FC = () => {
    const [posts, setPosts]               = useState<PostDto[]>([]);
    const [loading, setLoading]           = useState(true);
    const [saving, setSaving]             = useState(false);
    const [error, setError]               = useState('');
    const [success, setSuccess]           = useState('');
    const [search, setSearch]             = useState('');
    const [editorOpen, setEditorOpen]     = useState(false);
    const [viewPost, setViewPost]         = useState<PostDto | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PostDto | null>(null);
    const [editTarget, setEditTarget]     = useState<PostDto | null>(null);

    const [title, setTitle]               = useState('');
    const [body, setBody]                 = useState('');
    const [imageFiles, setImageFiles]     = useState<File[]>([]);
    const [removeImages, setRemoveImages] = useState(false);

    const load = async () => {
        setLoading(true);
        const res = await postsApi.getAll();
        if (res.data) setPosts(res.data);
        else setError(res.error?.message || 'Failed to load posts');
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditTarget(null); setTitle(''); setBody(''); setImageFiles([]); setRemoveImages(false);
        setEditorOpen(true);
    };

    const openEdit = (post: PostDto) => {
        setEditTarget(post); setTitle(post.title); setBody(post.description); setImageFiles([]); setRemoveImages(false);
        setEditorOpen(true);
    };

    const handleSave = async () => {
        if (!title.trim() || !body.trim()) { setError('Title and description are required'); return; }
        setSaving(true); setError('');
        let res;
        if (editTarget) {
            res = await postsApi.update(editTarget.id, title, body, imageFiles, removeImages);
        } else {
            res = await postsApi.create(title, body, imageFiles);
        }
        if (res.data) {
            if (editTarget) {
                setPosts(prev => prev.map(p => p.id === editTarget.id ? res.data! : p));
            } else {
                setPosts(prev => [res.data!, ...prev]);
            }
            setEditorOpen(false);
            showSuccess(editTarget ? 'Post updated' : 'Post published');
        } else {
            setError(res.error?.message || 'Save failed');
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const res = await postsApi.delete(deleteTarget.id);
        if (res.success) {
            setPosts(prev => prev.filter(p => p.id !== deleteTarget.id));
            showSuccess('Post deleted');
        }
        setDeleteTarget(null);
    };

    const showSuccess = (msg: string) => {
        setSuccess(msg); setTimeout(() => setSuccess(''), 4000);
    };

    const filtered = posts.filter(p =>
        !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 0 }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, flexShrink: 0 }}>
                <div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--neon-pink)', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>
                        ADMIN_CONSOLE › CONTENT_MANAGEMENT
                    </div>
                    <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'var(--font-size-2xl)', fontWeight: 700, letterSpacing: '0.05em' }}>
                        Posts &amp; Announcements
                    </h1>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 4 }}>
                        {posts.length} post{posts.length !== 1 ? 's' : ''} published
                    </p>
                </div>
                <PermissionGuard permission="CREATE_POST">
                    <Button onClick={openCreate} variant="primary">+ NEW POST</Button>
                </PermissionGuard>
            </div>

            {/* ── Alerts ── */}
            {success && <div style={{ flexShrink: 0 }}><Alert type="success" onClose={() => setSuccess('')}>{success}</Alert></div>}
            {error   && <div style={{ flexShrink: 0 }}><Alert type="error"   onClose={() => setError('')}>{error}</Alert></div>}

            {/* ── Search ── */}
            <div style={{ maxWidth: 380, flexShrink: 0 }}>
                <Input
                    placeholder="Search posts..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    icon={<span>⌕</span>}
                />
            </div>

            {/* ── Scrollable grid area ── */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 2 }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                        <Spinner size={32} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.2 }}>◈</div>
                        <p style={{ fontFamily: 'Share Tech Mono, monospace', color: 'var(--text-muted)', marginBottom: 20 }}>
                            {search ? 'No posts match your search' : 'No posts yet — create the first one'}
                        </p>
                        {!search && (
                            <PermissionGuard permission="CREATE_POST">
                                <Button onClick={openCreate}>Create Post</Button>
                            </PermissionGuard>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                        {filtered.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onEdit={() => openEdit(post)}
                                onDelete={() => setDeleteTarget(post)}
                                onView={() => setViewPost(post)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Create / Edit Modal ── */}
            <Modal open={editorOpen} title={editTarget ? 'EDIT_POST' : 'NEW_POST'} onClose={() => setEditorOpen(false)} width={760}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
                    <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title..." />
                    <MarkdownEditor label="Content (Markdown)" value={body} onChange={setBody} />
                    
                    <ImageUploadZone
                        current={removeImages ? [] : editTarget?.imageUrls}
                        pendingFiles={imageFiles}
                        onFiles={setImageFiles}
                        onRemoveCurrent={() => setRemoveImages(true)}
                        onRemovePending={idx => setImageFiles(prev => prev.filter((_, i) => i !== idx))}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                        <Button variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
                        <Button loading={saving} onClick={handleSave}>
                            {saving ? 'SAVING...' : editTarget ? 'UPDATE POST' : 'PUBLISH POST'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── Post View Modal ── */}
            <PostViewModal post={viewPost} onClose={() => setViewPost(null)} />

            {/* ── Delete Confirm ── */}
            <Confirm
                open={!!deleteTarget}
                title="DELETE_POST"
                message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
                danger
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};