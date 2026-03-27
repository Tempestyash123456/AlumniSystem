import { type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export const PageContainer = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
    <section className={`space-y-6 cp-fade-in ${className}`.trim()}>{children}</section>
);

type DivProps = ComponentPropsWithoutRef<'div'>;
type InputProps = ComponentPropsWithoutRef<'input'>;
type TextareaProps = ComponentPropsWithoutRef<'textarea'>;
type ButtonProps = ComponentPropsWithoutRef<'button'>;

export const GlassCard = ({ children, className = '', ...rest }: DivProps) => (
    <div className={`cp-card cp-soft-glass ${className}`.trim()} {...rest}>
        {children}
    </div>
);

export const SectionHeading = ({
    overline,
    title,
    subtitle,
    accent = 'var(--cyan)',
}: {
    overline?: string;
    title: string;
    subtitle?: string;
    accent?: string;
}) => (
    <div>
        {overline && (
            <p className="font-mono-cp text-xs tracking-widest mb-1" style={{ color: 'rgba(191,219,254,0.78)' }}>
                {overline}
            </p>
        )}
        <h2 className="font-display text-2xl font-bold tracking-widest" style={{ color: accent }}>
            {title}
        </h2>
        {subtitle && (
            <p className="font-mono-cp text-xs mt-1" style={{ color: 'rgba(148,163,184,0.95)' }}>
                {subtitle}
            </p>
        )}
    </div>
);

export const UiInput = ({ className = '', ...rest }: InputProps) => (
    <input className={`cp-input ${className}`.trim()} {...rest} />
);

export const UiTextarea = ({ className = '', ...rest }: TextareaProps) => (
    <textarea className={`cp-textarea ${className}`.trim()} {...rest} />
);

export const UiButton = ({
    variant = 'primary',
    className = '',
    children,
    ...rest
}: ButtonProps & { variant?: 'primary' | 'secondary' | 'danger' | 'amber' | 'ghost' }) => {
    const variantClass = {
        primary: 'cp-btn-primary',
        secondary: 'cp-btn-secondary',
        danger: 'cp-btn-danger',
        amber: 'cp-btn-amber',
        ghost: 'cp-btn-ghost',
    }[variant];

    return (
        <button className={`${variantClass} ${className}`.trim()} {...rest}>
            {children}
        </button>
    );
};

export const UiLinkButton = ({
    to,
    variant = 'primary',
    className = '',
    children,
    ...rest
}: LinkProps & { variant?: 'primary' | 'secondary' | 'danger' | 'amber' | 'ghost' }) => {
    const variantClass = {
        primary: 'cp-btn-primary',
        secondary: 'cp-btn-secondary',
        danger: 'cp-btn-danger',
        amber: 'cp-btn-amber',
        ghost: 'cp-btn-ghost',
    }[variant];

    return (
        <Link to={to} className={`${variantClass} ${className}`.trim()} {...rest}>
            {children}
        </Link>
    );
};

export const UiBadge = ({
    variant = 'cyan',
    className = '',
    children,
    ...rest
}: DivProps & { variant?: 'cyan' | 'pink' | 'purple' | 'green' | 'amber' }) => (
    <span className={`cp-badge cp-badge-${variant} ${className}`.trim()} {...rest}>
        {children}
    </span>
);

export const UiAvatar = ({
    src,
    alt = '',
    initials,
    size = 'md',
    className = '',
}: {
    src?: string | null;
    alt?: string;
    initials: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) => {
    const sizeClass = {
        sm: 'w-7 h-7 text-xs',
        md: 'w-8 h-8 text-xs',
        lg: 'w-14 h-14 text-lg',
    }[size];

    return (
        <div
            className={`${sizeClass} flex items-center justify-center font-display font-bold transition-all overflow-hidden ${className}`.trim()}
            style={{
                background: 'rgba(30,41,59,0.72)',
                border: '1px solid rgba(148,163,184,0.42)',
                color: 'var(--cyan)',
                boxShadow: '0 10px 24px rgba(15,23,42,0.35)',
            }}
        >
            {src ? <img src={src} className="w-full h-full object-cover" alt={alt} /> : initials}
        </div>
    );
};

export const UiStatCard = ({
    label,
    value,
    accent = 'var(--cyan)',
    className = '',
}: {
    label: string;
    value: ReactNode;
    accent?: string;
    className?: string;
}) => (
    <GlassCard className={`p-4 space-y-1 ${className}`.trim()} style={{ borderLeft: `2px solid ${accent}` }}>
        <p className="font-mono-cp text-xs" style={{ color: 'rgba(191,219,254,0.75)' }}>{label}</p>
        <p className="font-display text-2xl font-bold" style={{ color: accent }}>{value}</p>
    </GlassCard>
);
