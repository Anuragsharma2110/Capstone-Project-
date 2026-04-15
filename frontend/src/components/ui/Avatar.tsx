import React from 'react';

/**
 * Professional default avatars — inline SVG, no external URLs.
 *
 * Roles:
 *   LEARNER   → steel-blue bg + graduation cap icon
 *   PROFESSOR → deep-slate bg  + person/faculty silhouette
 *   ADMIN     → same as PROFESSOR
 *   (default) → neutral grey   + generic silhouette
 */

interface AvatarProps {
    role?: 'LEARNER' | 'PROFESSOR' | 'ADMIN' | string;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

interface RoleTheme {
    bg: string;
    icon: string;
    ring: string;
}

const THEMES: Record<string, RoleTheme> = {
    LEARNER:   { bg: '#1a3356', icon: '#74b3f0', ring: 'rgba(91,155,213,0.3)'   },
    PROFESSOR: { bg: '#1e2d3d', icon: '#8aa8c8', ring: 'rgba(138,168,200,0.25)' },
    ADMIN:     { bg: '#1e2d3d', icon: '#8aa8c8', ring: 'rgba(138,168,200,0.25)' },
};
const DEFAULT_THEME: RoleTheme = { bg: '#2a3244', icon: '#6b7e9e', ring: 'rgba(107,126,158,0.2)' };

/* ─── Graduation cap icon (paths drawn on a 44×44 viewBox) ─── */
const GraduationCapIcon: React.FC<{ color: string }> = ({ color }) => (
    <>
        {/* Mortarboard flat top (diamond / rhombus) */}
        <polygon
            points="22,9  38,17  22,25  6,17"
            fill={color}
            opacity="0.95"
        />
        {/* Cap body / brim hanging below — a flat trapezoid */}
        <path
            d="M12 20 L12 29 Q22 34 32 29 L32 20 L22 25 Z"
            fill={color}
            opacity="0.75"
        />
        {/* Tassel cord — vertical line on the right */}
        <line x1="38" y1="17" x2="38" y2="25" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        {/* Tassel bob at the bottom */}
        <circle cx="38" cy="27" r="2.2" fill={color} opacity="0.9" />
    </>
);

/* ─── Generic silhouette icon for Professor / Admin ─── */
const SilhouetteIcon: React.FC<{ color: string }> = ({ color }) => (
    <>
        <circle cx="22" cy="17" r="7.5" fill={color} opacity="0.92" />
        <path
            d="M5 40 C5 28.5 12.5 22 22 22 C31.5 22 39 28.5 39 40 Z"
            fill={color}
            opacity="0.6"
        />
    </>
);

const Avatar: React.FC<AvatarProps> = ({ role, size = 44, className, style }) => {
    const key = role ? role.toUpperCase() : '';
    const theme = THEMES[key] ?? DEFAULT_THEME;
    const isLearner = key === 'LEARNER';

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 44 44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{
                borderRadius: '50%',
                flexShrink: 0,
                display: 'block',
                boxShadow: `0 0 0 2px ${theme.ring}`,
                ...style,
            }}
            aria-hidden="true"
            role="img"
        >
            {/* Background circle */}
            <circle cx="22" cy="22" r="22" fill={theme.bg} />

            {/* Role-specific icon */}
            {isLearner
                ? <GraduationCapIcon color={theme.icon} />
                : <SilhouetteIcon color={theme.icon} />
            }
        </svg>
    );
};

export default Avatar;
