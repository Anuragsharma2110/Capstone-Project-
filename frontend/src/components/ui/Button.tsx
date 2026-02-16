import React from 'react';
import './UIComponents.css';

export const Button: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'outline';
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
}> = ({ children, onClick, type = 'button', variant = 'primary', disabled, className = '', style }) => (
    <button
        className={`btn btn-${variant} ${className}`}
        onClick={onClick}
        type={type}
        disabled={disabled}
        style={style}
    >
        {children}
    </button>
);
