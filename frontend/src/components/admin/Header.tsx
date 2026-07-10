import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import './AdminComponents.css';

interface HeaderProps {
    title: string;
    breadcrumb?: string[];
}

const Header: React.FC<HeaderProps> = ({ breadcrumb }) => {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState<number>(0);

    useEffect(() => {
        if (!user) return;

        const fetchUnreadCount = async () => {
            try {
                const res = await axiosInstance.get('/notifications/unread_count/');
                setUnreadCount(res.data.unread_count || 0);
            } catch (e) {
                console.error("Failed to fetch unread count", e);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, [user]);

    const handleNotificationClick = () => {
        if (user?.role === 'ADMIN') {
            navigate('/admin/notifications');
        } else {
            navigate('/notifications');
        }
    };

    const getBreadcrumbPath = (item: string) => {
        const role = user?.role;
        const lower = item.toLowerCase();
        
        if (lower === 'dashboard') {
            if (role === 'ADMIN') return '/admin/dashboard';
            if (role === 'PROFESSOR') return '/professor/dashboard';
            return '/learner/dashboard';
        }
        if (lower.includes('submissions')) {
            if (role === 'PROFESSOR') return '/professor/submissions';
            return '/submissions';
        }
        if (lower.includes('cohorts')) {
            if (role === 'ADMIN') return '/admin/cohorts';
            if (role === 'PROFESSOR') return '/professor/cohorts';
        }
        if (lower === 'teams') {
            if (role === 'ADMIN') return '/admin/teams';
        }
        return null; // non-clickable if path not defined
    };

    return (
        <header className="admin-header">
            <div className="header-left">
                {breadcrumb && (
                    <div className="breadcrumb">
                        {breadcrumb.map((item, index) => {
                            const isLast = index === breadcrumb.length - 1;
                            const path = !isLast ? getBreadcrumbPath(item) : null;
                            
                            return (
                                <React.Fragment key={index}>
                                    {isLast ? (
                                        <span className="breadcrumb-current">{item}</span>
                                    ) : (
                                        <span 
                                            className={`breadcrumb-prev ${path ? 'clickable' : ''}`}
                                            style={path ? { cursor: 'pointer' } : {}}
                                            onClick={() => path && navigate(path)}
                                        >
                                            {item}
                                        </span>
                                    )}
                                    {!isLast && <span className="breadcrumb-separator">›</span>}
                                </React.Fragment>
                            );
                        })}
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
                        className="icon-button notification-bell-btn"
                        onClick={handleNotificationClick}
                        title="View Notifications"
                        style={{ position: 'relative' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '0',
                                right: '0',
                                transform: 'translate(25%, -25%)',
                                background: '#ef4444',
                                color: 'white',
                                borderRadius: '50%',
                                padding: '2px 5px',
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                lineHeight: 1
                            }}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <button
                        className="icon-button theme-toggle-btn"
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
                </div>
            </div>
        </header>
    );
};

export default Header;
