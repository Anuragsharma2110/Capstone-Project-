import React from 'react';
import './UIComponents.css';

export const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = '', style }) => (
    <div className={`card ${className}`} style={style}>{children}</div>
);
