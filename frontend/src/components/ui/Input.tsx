import React, { useState } from 'react';
import './UIComponents.css';

export const Input: React.FC<{
    label: string;
    type?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    placeholder?: string;
    error?: string;
    className?: string;
    style?: React.CSSProperties;
}> = ({ label, type = 'text', name, value, onChange, required, placeholder, error, className = '', style }) => {
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
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    style={{ paddingRight: isPassword ? '3rem' : '1rem' }}
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
