// my-frontend/src/pages/landing/LandingPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import './LandingPage.css';

// ── Particle canvas background ────────────────────────────────────────────────
const ParticleCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useThemeStore();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        let w = (canvas.width = window.innerWidth);
        let h = (canvas.height = window.innerHeight);

        // Particle definition
        interface Particle {
            x: number; y: number;
            vx: number; vy: number;
            radius: number;
            alpha: number;
            color: string;
            pulse: number;
            pulseSpeed: number;
        }

        const DARK_COLORS = ['#00f5ff', '#bf5af2', '#ff2d78', '#00f5ff', '#00f5ff'];
        const LIGHT_COLORS = ['#d32f2f', '#424242', '#7f0000', '#d32f2f', '#d32f2f'];
        const COLORS = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
        const COUNT = 90;

        const particles: Particle[] = Array.from({ length: COUNT }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 1.8 + 0.6,
            alpha: Math.random() * 0.6 + 0.2,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.01 + Math.random() * 0.015,
        }));

        const CONNECTION_DIST = 140;
        const connectionBaseColor = theme === 'dark' ? '0, 245, 255' : '211, 47, 47';

        const draw = () => {
            ctx.clearRect(0, 0, w, h);

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECTION_DIST) {
                        const opacity = (1 - dist / CONNECTION_DIST) * 0.15;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(${connectionBaseColor}, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            // Draw particles
            particles.forEach((p) => {
                p.pulse += p.pulseSpeed;
                const currentAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color + Math.round(currentAlpha * 255).toString(16).padStart(2, '0');
                ctx.fill();

                // Glow
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 5);
                grad.addColorStop(0, p.color + '40');
                grad.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 5, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();

                // Move
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < -10) p.x = w + 10;
                if (p.x > w + 10) p.x = -10;
                if (p.y < -10) p.y = h + 10;
                if (p.y > h + 10) p.y = -10;
            });

            animId = requestAnimationFrame(draw);
        };

        draw();

        const onResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="lp-canvas" />;
};

// ── Animated stat counter ─────────────────────────────────────────────────────
const AnimatedCounter: React.FC<{ target: number; suffix?: string; duration?: number }> = ({
    target, suffix = '', duration = 1800
}) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const startTime = performance.now();
                const tick = (now: number) => {
                    const progress = Math.min((now - startTime) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    setCount(Math.round(eased * target));
                    if (progress < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            }
        }, { threshold: 0.5 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, duration]);

    return <span ref={ref}>{count}{suffix}</span>;
};

// ── Feature card ──────────────────────────────────────────────────────────────
interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    color: string;
    delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, delay }) => {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setTimeout(() => setVisible(true), delay);
                observer.disconnect();
            }
        }, { threshold: 0.2 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <div ref={ref} className={`lp-feature-card ${visible ? 'lp-feature-visible' : ''}`} style={{ '--card-color': color } as React.CSSProperties}>
            <div className="lp-feature-icon" style={{ color }}>{icon}</div>
            <h3 className="lp-feature-title" style={{ color }}>{title}</h3>
            <p className="lp-feature-desc">{description}</p>
            <div className="lp-feature-glow" style={{ background: `${color}15` }} />
            <div className="lp-feature-border" style={{ borderColor: `${color}40` }} />
        </div>
    );
};

// ── Main Landing Page ─────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [heroVisible, setHeroVisible] = useState(false);
    const { theme, toggleTheme } = useThemeStore();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        setTimeout(() => setHeroVisible(true), 100);

        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const features = [
        {
            icon: '◈',
            title: 'Alumni Network',
            description: 'Connect with thousands of graduates from across the world. Build meaningful professional relationships that last a lifetime.',
            color: theme === 'dark' ? '#00f5ff' : '#d32f2f',
            delay: 0,
        },
        {
            icon: '⬡',
            title: 'Career Hub',
            description: 'Discover job opportunities, post openings, and leverage the power of your alumni network to accelerate your career.',
            color: theme === 'dark' ? '#bf5af2' : '#424242',
            delay: 100,
        },
        {
            icon: '★',
            title: 'Events & Reunions',
            description: 'Stay up-to-date with campus events, webinars, and annual reunions. Never miss a milestone in the alumni community.',
            color: theme === 'dark' ? '#ffb800' : '#ed6c02',
            delay: 200,
        },
        {
            icon: '✦',
            title: 'Knowledge Feed',
            description: 'Share insights, articles, and achievements with your fellow alumni. A curated feed engineered for professionals.',
            color: theme === 'dark' ? '#39ff14' : '#2e7d32',
            delay: 300,
        },
        {
            icon: '◎',
            title: 'Profile Intelligence',
            description: 'Build a rich professional profile with skills, experience, and achievements — all in one intelligent system.',
            color: theme === 'dark' ? '#ff2d78' : '#9a0007',
            delay: 400,
        },
        {
            icon: '▶',
            title: 'Secure & Private',
            description: 'Enterprise-grade security with role-based access control. Your data, your rules — always protected.',
            color: theme === 'dark' ? '#00f5ff' : '#d32f2f',
            delay: 500,
        },
    ];

    const stats = [
        { value: 12400, suffix: '+', label: 'Demo Alumni Members' },
        { value: 98, suffix: '%', label: 'Demo satisfaction Rate' },
        { value: 340, suffix: '+', label: 'Demo companies Hiring' },
        { value: 28, suffix: '', label: 'Demo years of Legacy' },
    ];

    return (
        <div className={`lp-root ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
            {/* ── Animated Background ─────────────────────────────────────── */}
            <ParticleCanvas />
            <div className="lp-bg-grid" />
            <div className="lp-bg-gradient" />

            {/* Flow orbs */}
            <div className="lp-orb lp-orb-1" />
            <div className="lp-orb lp-orb-2" />
            <div className="lp-orb lp-orb-3" />

            {/* ── Navigation ─────────────────────────────────────────────── */}
            <nav className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`}>
                <div className="lp-nav-inner">
                    <Link to="/" className="lp-logo">
                        <img
                            src="/cu-logo.png"
                            alt=""
                            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
                        />
                        <span className="lp-logo-text">ALUMNI<span className="lp-logo-accent">_PORTAL</span></span>
                    </Link>
                    <div className="lp-nav-links">
                        <a href="#about" className="lp-nav-link">About</a>
                        <a href="#features" className="lp-nav-link">Features</a>
                        <a href="#stats" className="lp-nav-link">Stats</a>
                    </div>
                    <div className="lp-nav-actions">
                        <button
                            className="lp-theme-toggle"
                            onClick={toggleTheme}
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? '☀' : '☾'}
                        </button>
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="lp-btn lp-btn-primary" id="nav-dashboard-btn">Dashboard</Link>
                        ) : (
                            <>
                                <Link to="/login" className="lp-btn lp-btn-ghost" id="nav-login-btn">Log In</Link>
                                <Link to="/register" className="lp-btn lp-btn-primary" id="nav-register-btn">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Hero Section ───────────────────────────────────────────── */}
            <section className="lp-hero">
                <div className={`lp-hero-content ${heroVisible ? 'lp-hero-visible' : ''}`}>
                    <div className="lp-hero-tag">
                        <span className="lp-hero-tag-dot" />
                        University Alumni Portal
                    </div>

                    <h1 className="lp-hero-title">
                        <span className="lp-hero-title-line">Where Graduates</span>
                        <span className="lp-hero-title-line lp-hero-title-accent">Connect &amp; Thrive</span>
                    </h1>

                    <p className="lp-hero-sub">
                        The next-generation alumni platform — reconnect with your peers, discover
                        opportunities, and stay part of a legacy that never stops growing.
                    </p>

                    <div className="lp-hero-actions">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="lp-btn lp-btn-primary lp-btn-lg" id="hero-dashboard-btn">
                                <span>Enter Dashboard</span>
                                <span className="lp-btn-arrow">→</span>
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="lp-btn lp-btn-primary lp-btn-lg" id="hero-register-btn">
                                    <span>Join the Network</span>
                                    <span className="lp-btn-arrow">→</span>
                                </Link>
                                <Link to="/login" className="lp-btn lp-btn-outline lp-btn-lg" id="hero-login-btn">
                                    <span>Sign In</span>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="lp-hero-badges">
                        <span className="lp-badge lp-badge-cyan">✓ Free to Join</span>
                        <span className="lp-badge lp-badge-purple">✓ Verified Alumni</span>
                        <span className="lp-badge lp-badge-green">✓ Secure Platform</span>
                    </div>
                </div>

                {/* Floating terminal card */}
                <div className={`lp-hero-card ${heroVisible ? 'lp-hero-card-visible' : ''}`}>
                    <div className="lp-terminal">
                        <div className="lp-terminal-bar">
                            <span className="lp-terminal-dot" style={{ background: '#ff5f57' }} />
                            <span className="lp-terminal-dot" style={{ background: '#febc2e' }} />
                            <span className="lp-terminal-dot" style={{ background: '#28c840' }} />
                            <span className="lp-terminal-title">alumni_portal.sys</span>
                        </div>
                        <div className="lp-terminal-body">
                            <TerminalLines />
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="lp-scroll-indicator">
                    <div className="lp-scroll-mouse">
                        <div className="lp-scroll-wheel" />
                    </div>
                    <span>Scroll to explore</span>
                </div>
            </section>

            {/* ── About Section ──────────────────────────────────────────── */}
            <section id="about" className="lp-about">
                <div className="lp-section-inner">
                    <div className="lp-section-header">
                        <div className="lp-section-tag">◈ ABOUT_SYSTEM</div>
                        <h2 className="lp-section-title">Built for Those Who <span className="lp-text-cyan">Came Before</span></h2>
                        <p className="lp-section-sub">
                            Our alumni portal was engineered to bridge the gap between generations of graduates —
                            bringing the past, present, and future of our university community into a single, powerful ecosystem.
                        </p>
                    </div>

                    <div className="lp-about-grid">
                        <div className="lp-about-text">
                            <div className="lp-about-block">
                                <div className="lp-about-icon" style={{ color: '#00f5ff' }}>◎</div>
                                <div>
                                    <h3 className="lp-about-block-title">Our Mission</h3>
                                    <p className="lp-about-block-desc">
                                        To create a thriving digital community where alumni can reconnect, collaborate,
                                        and contribute to the continuous growth of our institution and each other.
                                    </p>
                                </div>
                            </div>
                            <div className="lp-about-block">
                                <div className="lp-about-icon" style={{ color: '#bf5af2' }}>⬡</div>
                                <div>
                                    <h3 className="lp-about-block-title">Our Vision</h3>
                                    <p className="lp-about-block-desc">
                                        A world where every graduate stays connected to the knowledge, opportunities,
                                        and people that shaped them — no matter where life takes them.
                                    </p>
                                </div>
                            </div>
                            <div className="lp-about-block">
                                <div className="lp-about-icon" style={{ color: '#39ff14' }}>★</div>
                                <div>
                                    <h3 className="lp-about-block-title">Join the Legacy</h3>
                                    <p className="lp-about-block-desc">
                                        Thousands of alumni have already made this their professional home.
                                        Your story is part of something bigger — come add your chapter.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="lp-about-visual">
                            <div className="lp-about-ring lp-ring-1" />
                            <div className="lp-about-ring lp-ring-2" />
                            <div className="lp-about-ring lp-ring-3" />
                            <div className="lp-about-core">
                                <div className="lp-about-core-inner">
                                    <span className="lp-about-core-icon">◈</span>
                                    <span className="lp-about-core-text">ALUMNI</span>
                                    <span className="lp-about-core-sub">NETWORK</span>
                                </div>
                            </div>
                            {/* Orbit dots */}
                            <div className="lp-orbit lp-orbit-1"><div className="lp-orbit-dot" style={{ background: '#00f5ff' }} /></div>
                            <div className="lp-orbit lp-orbit-2"><div className="lp-orbit-dot" style={{ background: '#bf5af2' }} /></div>
                            <div className="lp-orbit lp-orbit-3"><div className="lp-orbit-dot" style={{ background: '#ff2d78' }} /></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats Section ──────────────────────────────────────────── */}
            <section id="stats" className="lp-stats">
                <div className="lp-stats-inner">
                    {stats.map((s, i) => (
                        <div key={i} className="lp-stat-item">
                            <div className="lp-stat-value">
                                <AnimatedCounter target={s.value} suffix={s.suffix} />
                            </div>
                            <div className="lp-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features Section ───────────────────────────────────────── */}
            <section id="features" className="lp-features">
                <div className="lp-section-inner">
                    <div className="lp-section-header">
                        <div className="lp-section-tag">◈ SYSTEM_FEATURES</div>
                        <h2 className="lp-section-title">Everything You <span className="lp-text-pink">Need</span></h2>
                        <p className="lp-section-sub">
                            Purpose-built tools to help you network, grow, and stay connected
                            throughout your entire professional journey.
                        </p>
                    </div>

                    <div className="lp-features-grid">
                        {features.map((f, i) => (
                            <FeatureCard key={i} {...f} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section ────────────────────────────────────────────── */}
            <section className="lp-cta">
                <div className="lp-cta-glow lp-cta-glow-left" />
                <div className="lp-cta-glow lp-cta-glow-right" />
                <div className="lp-cta-inner">
                    <div className="lp-section-tag" style={{ justifyContent: 'center' }}>◈ INITIATE_CONNECTION</div>
                    <h2 className="lp-cta-title">Ready to Reconnect?</h2>
                    <p className="lp-cta-sub">
                        Join thousands of alumni who have already made their mark.
                        Your legacy continues here.
                    </p>
                    <div className="lp-cta-actions">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="lp-btn lp-btn-primary lp-btn-lg lp-btn-glow" id="cta-dashboard-btn">
                                <span>Go to My Dashboard</span>
                                <span className="lp-btn-arrow">→</span>
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="lp-btn lp-btn-primary lp-btn-lg lp-btn-glow" id="cta-register-btn">
                                    <span>Create Account</span>
                                    <span className="lp-btn-arrow">→</span>
                                </Link>
                                <Link to="/login" className="lp-btn lp-btn-outline lp-btn-lg" id="cta-login-btn">
                                    Already a Member? Log In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <footer className="lp-footer">
                <div className="lp-footer-inner">
                    <div className="lp-logo">
                        <span className="lp-logo-icon">◈</span>
                        <span className="lp-logo-text">ALUMNI<span className="lp-logo-accent">_PORTAL</span></span>
                    </div>
                    <div className="lp-footer-copy">
                        © {new Date().getFullYear()} University Alumni Network. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

// ── Animated terminal lines ───────────────────────────────────────────────────
const TERMINAL_LINES = [
    { text: '> Initializing Alumni Portal...', color: '#00f5ff', delay: 300 },
    { text: '> Loading alumni database...', color: '#8899bb', delay: 800 },
    { text: '✓ Members connected', color: '#39ff14', delay: 1400 },
    { text: '> Establishing security...', color: '#8899bb', delay: 1900 },
    { text: '✓ Encrption active', color: '#39ff14', delay: 2400 },
    { text: '> Fetching events ...', color: '#8899bb', delay: 2900 },
    { text: '✓ Loaded posts ...', color: '#39ff14', delay: 3500 },
    { text: '> System ready. Welcome back.', color: '#00f5ff', delay: 4200 },
    { text: '_ ', color: '#00f5ff', delay: 4800 },
];

const TerminalLines: React.FC = () => {
    const [visibleCount, setVisibleCount] = useState(0);

    useEffect(() => {
        const timers = TERMINAL_LINES.map((line, i) =>
            setTimeout(() => setVisibleCount(i + 1), line.delay)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <>
            {TERMINAL_LINES.slice(0, visibleCount).map((line, i) => (
                <div key={i} className="lp-terminal-line" style={{ color: line.color, animationDelay: `${i * 0}ms` }}>
                    {line.text}{i === visibleCount - 1 && <span className="lp-cursor">█</span>}
                </div>
            ))}
        </>
    );
};
