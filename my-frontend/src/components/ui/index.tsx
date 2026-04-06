import React, { useState } from 'react';
import { useToastStore } from '../../store/toastStore';
import { useConfirmStore } from '../../store/confirmStore';
import type { ToastType } from '../../store/toastStore';
import DatePicker from 'react-datepicker';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectFade, Autoplay } from 'swiper/modules';

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
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
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
                fontFamily: 'Orbitron, sans-serif',
                fontSize: 'var(--font-size-lg)',
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
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: 'var(--font-size-sm)',
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
                    <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--modal-title-color)', letterSpacing: '0.08em', transition: 'color 0.25s' }}>
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
        <div className="cp-confirm-content">
            <p className="cp-confirm-message">{message}</p>
            <div className="cp-confirm-actions">
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>Confirm</Button>
            </div>
        </div>
    </Modal>
);

export const GlobalConfirmContainer: React.FC = () => {
    const { isOpen, title, message, danger, close } = useConfirmStore();
    if (!isOpen) return null;
    return (
        <Confirm
            open={isOpen}
            title={title}
            message={message}
            danger={danger}
            onConfirm={() => close(true)}
            onCancel={() => close(false)}
        />
    );
};

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
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
        {label}
      </span>
        )}
    </label>
);

// ── Toast Notifications ───────────────────────────────────────────────────────
export const Toast: React.FC<{ id: string; message: string; type: ToastType; onClose: (id: string) => void }> = ({ id, message, type, onClose }) => {
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    
    return (
        <div className={`cp-toast cp-toast-${type}`} onClick={() => onClose(id)}>
            <div className="cp-toast-icon">{icons[type]}</div>
            <div className="cp-toast-message">{message}</div>
            <button className="cp-toast-close" onClick={(e) => { e.stopPropagation(); onClose(id); }}>×</button>
            <div className="cp-toast-progress" />
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToastStore();
    
    return (
        <div className="cp-toast-container">
            {toasts.map(t => (
                <Toast key={t.id} {...t} onClose={removeToast} />
            ))}
        </div>
    );
};

// ── Progress Bar ──────────────────────────────────────────────────────────────
export const ProgressBar: React.FC<{ value: number; label?: string }> = ({ value, label }) => (
    <div>
        {label && (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: 'var(--font-size-xs)',
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

// ── Checkbox ──────────────────────────────────────────────────────────────────
interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
}
export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, disabled }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', userSelect: 'none' }}>
        <div
            onClick={() => !disabled && onChange(!checked)}
            style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: `1px solid ${checked ? 'var(--neon-cyan)' : 'var(--border-subtle)'}`,
                background: checked ? 'var(--neon-cyan)' : 'var(--bg-input)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: checked ? '0 0 8px rgba(0,245,255,0.3)' : 'none',
                opacity: disabled ? 0.5 : 1,
            }}
        >
            {checked && (
                <span style={{ color: 'var(--bg-void)', fontSize: 12, fontWeight: 900 }}>✓</span>
            )}
        </div>
        {label && (
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--font-size-sm)', color: checked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {label}
            </span>
        )}
    </label>
);

// ── DateTimePicker ────────────────────────────────────────────────────────────
interface DateTimePickerProps {
    selected?: Date | null;
    onChange: (date: Date | null) => void;
    label?: string;
    placeholder?: string;
    showTime?: boolean;
    error?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
    selected, onChange, label, placeholder, showTime = true, error
}) => (
    <div className="cp-input-wrap">
        {label && <label className="cp-label">{label}</label>}
        <DatePicker
            selected={selected}
            onChange={onChange}
            showTimeSelect={showTime}
            dateFormat={showTime ? "Pp" : "P"}
            placeholderText={placeholder}
            className={`cp-input cp-datepicker-input ${error ? 'error' : ''}`}
            autoComplete="off"
        />
        {error && <span className="cp-error">⚠ {error}</span>}
    </div>
);

// ── Carousel ──────────────────────────────────────────────────────────────────
interface CarouselProps {
    items: {
        url: string;
        type?: 'IMAGE' | 'VIDEO';
        alt?: string;
    }[];
    aspectRatio?: string;
}

export const Carousel: React.FC<CarouselProps> = ({ items, aspectRatio = '16 / 9' }) => {
    if (!items || items.length === 0) return null;

    if (items.length === 1) {
        const item = items[0];
        return (
            <div style={{ width: '100%', aspectRatio, overflow: 'hidden', background: '#000', position: 'relative' }}>
                {item.type === 'VIDEO' ? (
                    <video src={item.url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <img src={item.url} alt={item.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
            </div>
        );
    }

    return (
        <div className="cp-carousel" style={{ aspectRatio }}>
            <Swiper
                modules={[Navigation, Pagination, EffectFade, Autoplay]}
                navigation
                pagination={{ clickable: true }}
                effect="fade"
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                loop={true}
                className="mySwiper"
            >
                {items.map((item, idx) => (
                    <SwiperSlide key={idx}>
                        <div style={{ width: '100%', height: '100%', background: '#000' }}>
                            {item.type === 'VIDEO' ? (
                                <video src={item.url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <img src={item.url} alt={item.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            )}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};