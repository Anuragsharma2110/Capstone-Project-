import React, { useState } from 'react';
import './UIComponents.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    type = 'text',
    error,
    className = '',
    style,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className={`input-container ${className}`} style={style}>
            {label && <label className="label">{label}</label>}
            <div style={{ position: 'relative' }}>
                <input
                    className="input"
                    type={inputType}
                    style={{ ...style, paddingRight: isPassword ? '3rem' : '1rem' }}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                            position: 'absolute',
                            right: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            padding: '0.25rem'
                        }}
                    >
                        {showPassword ? 'Hide' : 'Show'}
                    </button>
                )}
            </div>
            {error && <span className="error-text">{error}</span>}
        </div>
    );
};
