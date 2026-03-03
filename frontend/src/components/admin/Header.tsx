import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './AdminComponents.css';

interface HeaderProps {
    title: string;
    breadcrumb?: string[];
}

const Header: React.FC<HeaderProps> = ({ title, breadcrumb }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="admin-header">
            <div className="header-left">
                {breadcrumb && (
                    <div className="breadcrumb">
                        {breadcrumb.map((item, index) => (
                            <React.Fragment key={index}>
                                <span className={index === breadcrumb.length - 1 ? 'breadcrumb-current' : 'breadcrumb-prev'}>{item}</span>
                                {index < breadcrumb.length - 1 && <span className="breadcrumb-separator">›</span>}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>

            <div className="header-right">
                <div className="search-bar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input type="text" placeholder="Search cohorts..." className="search-input" />
                </div>

                <div className="header-actions">
                    <button
                        className="icon-button theme-toggle"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                    >
                        {theme === 'light' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        )}
                    </button>
                    <button className="icon-button notification-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span className="notification-badge"></span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
