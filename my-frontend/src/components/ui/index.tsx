import React, { useState } from 'react';

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, hint, className = '', ...props }, ref) => (
        <div className="cp-input-wrap">
            {label && <label className="cp-label">{label}</label>}
            <div style={{ position: 'relative' }}>
                {icon && (
                    <span
                        style={{
                            position: 'absolute',
                            left: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            pointerEvents: 'none',
                            display: 'flex',
                        }}
                    >
            {icon}
          </span>
                )}
                <input
                    ref={ref}
                    className={`cp-input ${error ? 'error' : ''} ${className}`}
                    style={icon ? { paddingLeft: '42px' } : undefined}
                    {...props}
                />
            </div>
            {hint && !error && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace' }}>
          {hint}
        </span>
            )}
            {error && <span className="cp-error">⚠ {error}</span>}
        </div>
    )
);
Input.displayName = 'Input';

// ── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className = '', ...props }, ref) => (
        <div className="cp-input-wrap">
            {label && <label className="cp-label">{label}</label>}
            <textarea
                ref={ref}
                className={`cp-input ${error ? 'error' : ''} ${className}`}
                style={{ resize: 'vertical', minHeight: '100px' }}
                {...props}
            />
            {error && <span className="cp-error">⚠ {error}</span>}
        </div>
    )
);
Textarea.displayName = 'Textarea';

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string | number; label: string }[];
    placeholder?: string;
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, placeholder, className = '', ...props }, ref) => (
        <div className="cp-input-wrap">
            {label && <label className="cp-label">{label}</label>}
            <select
                ref={ref}
                className={`cp-input cp-select ${error ? 'error' : ''} ${className}`}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            {error && <span className="cp-error">⚠ {error}</span>}
        </div>
    )
);
Select.displayName = 'Select';

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'danger' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}
export const Button: React.FC<ButtonProps> = ({
                                                  variant = 'primary',
                                                  size = 'md',
                                                  loading,
                                                  children,
                                                  disabled,
                                                  className = '',
                                                  ...props
                                              }) => (
    <button
        className={`cp-btn cp-btn-${variant} ${size !== 'md' ? `cp-btn-${size}` : ''} ${className}`}
        disabled={disabled || loading}
        {...props}
    >
        {loading && <span className="cp-spinner" style={{ width: 14, height: 14 }} />}
        {children}
    </button>
);

// ── Alert ─────────────────────────────────────────────────────────────────────
interface AlertProps {
    type?: 'error' | 'success' | 'info';
    children: React.ReactNode;
    onClose?: () => void;
}
export const Alert: React.FC<AlertProps> = ({ type = 'info', children, onClose }) => {
    const icons = { error: '✕', success: '✓', info: 'ℹ' };
    return (
        <div className={`cp-alert cp-alert-${type}`}>
            <span>{icons[type]}</span>
            <span style={{ flex: 1 }}>{children}</span>
            {onClose && (
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16 }}
                >
                    ×
                </button>
            )}
        </div>
    );
};

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps {
    variant?: 'cyan' | 'pink' | 'purple' | 'green' | 'amber';
    children: React.ReactNode;
}
export const Badge: React.FC<BadgeProps> = ({ variant = 'cyan', children }) => (
    <span className={`cp-badge cp-badge-${variant}`}>{children}</span>
);

// ── Spinner ───────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <span className="cp-spinner" style={{ width: size, height: size }} />
);

// ── Loading Screen ────────────────────────────────────────────────────────────
export const LoadingScreen: React.FC = () => (
    <div
        style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-void)',
            gap: 20,
        }}
    >
        <div
            style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '18px',
                color: 'var(--neon-cyan)',
                letterSpacing: '0.2em',
                animation: 'flicker 4s infinite',
            }}
        >
            ALUMNI_PORTAL
        </div>
        <Spinner size={32} />
        <span
            style={{
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: '12px',
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
            }}
        >
      INITIALIZING...
    </span>
    </div>
);

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    width?: number;
}
export const Modal: React.FC<ModalProps> = ({ open, title, onClose, children, width = 480 }) => {
    if (!open) return null;
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(3, 4, 9, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
                backdropFilter: 'blur(4px)',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="cp-panel cp-corners animate-fade-in"
                style={{ width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div
                    style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* Controlled by CSS variable now */}
                    <h3 style={{ fontSize: '16px', color: 'var(--modal-title-color)', letterSpacing: '0.08em', transition: 'color 0.25s' }}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            width: 28,
                            height: 28,
                            borderRadius: 4,
                            fontSize: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        ×
                    </button>
                </div>
                <div style={{ padding: '24px' }}>{children}</div>
            </div>
        </div>
    );
};

// ── Confirm Dialog ────────────────────────────────────────────────────────────
interface ConfirmProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}
export const Confirm: React.FC<ConfirmProps> = ({
                                                    open, title, message, onConfirm, onCancel, danger,
                                                }) => (
    <Modal open={open} title={title} onClose={onCancel} width={400}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontFamily: 'Rajdhani, sans-serif' }}>
            {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>Confirm</Button>
        </div>
    </Modal>
);

// ── Toggle Switch ─────────────────────────────────────────────────────────────
interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
}
export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => (
    <label
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
    >
        <div
            onClick={() => onChange(!checked)}
            style={{
                width: 44,
                height: 24,
                background: checked ? 'var(--neon-cyan)' : 'var(--bg-hover)',
                border: `1px solid ${checked ? 'var(--neon-cyan)' : 'var(--border-subtle)'}`,
                borderRadius: 12,
                position: 'relative',
                transition: 'all 0.2s',
                boxShadow: checked ? '0 0 10px rgba(0,245,255,0.4)' : 'none',
                cursor: 'pointer',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 3,
                    left: checked ? 22 : 3,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: checked ? 'var(--bg-void)' : 'var(--text-muted)',
                    transition: 'left 0.2s',
                }}
            />
        </div>
        {label && (
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', color: 'var(--text-secondary)' }}>
        {label}
      </span>
        )}
    </label>
);

// ── Progress Bar ──────────────────────────────────────────────────────────────
export const ProgressBar: React.FC<{ value: number; label?: string }> = ({ value, label }) => (
    <div>
        {label && (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.1em',
                }}
            >
                <span>{label}</span>
                <span style={{ color: 'var(--neon-cyan)' }}>{value}%</span>
            </div>
        )}
        <div className="cp-progress">
            <div className="cp-progress-fill" style={{ width: `${value}%` }} />
        </div>
    </div>
);

// ── Skill tag input ───────────────────────────────────────────────────────────
interface SkillsInputProps {
    skills: string[];
    onChange: (skills: string[]) => void;
}
export const SkillsInput: React.FC<SkillsInputProps> = ({ skills, onChange }) => {
    const [input, setInput] = useState('');

    const add = () => {
        const s = input.trim();
        if (s && !skills.includes(s)) {
            onChange([...skills, s]);
        }
        setInput('');
    };

    const remove = (skill: string) => onChange(skills.filter((s) => s !== skill));

    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                    className="cp-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder="Add skill and press Enter..."
                    style={{ flex: 1 }}
                />
                <Button variant="outline" size="sm" onClick={add} type="button">Add</Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {skills.map((s) => (
                    <span key={s} className="cp-skill-tag" style={{ cursor: 'default' }}>
            {s}
                        <button
                            type="button"
                            onClick={() => remove(s)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neon-pink)', fontSize: 14, lineHeight: 1 }}
                        >
              ×
            </button>
          </span>
                ))}
            </div>
        </div>
    );
};