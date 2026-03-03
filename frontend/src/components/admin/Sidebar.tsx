import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminComponents.css';

const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();
    const role = user?.role || 'LEARNER';
    const navigate = useNavigate();
    const [showPopup, setShowPopup] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Close popup on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setShowPopup(false);
            }
        };
        if (showPopup) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPopup]);

    const getDashboardPath = () => {
        if (role === 'ADMIN') return '/admin/dashboard';
        if (role === 'PROFESSOR') return '/professor/dashboard';
        return '/learner/dashboard';
    };

    const portalName = role === 'ADMIN' ? 'Admin Portal' : role === 'PROFESSOR' ? 'Professor Portal' : 'Student Portal';

    return (
        <aside className="admin-sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="logo-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3.333 2.667 6.667 2.667 10 0v-5" />
                    </svg>
                </div>
                <div className="logo-text">
                    Capstone
                    <span>{portalName}</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <NavLink to={getDashboardPath()} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Dashboard
                </NavLink>

                {role === 'ADMIN' && (
                    <>
                        <NavLink to="/admin/cohorts" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                            </svg>
                            Cohorts
                        </NavLink>
                        <NavLink to="/admin/teams" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Teams
                        </NavLink>
                        <NavLink to="/admin/tasks" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                <path d="M9 14l2 2 4-4" />
                            </svg>
                            Tasks
                        </NavLink>
                        <NavLink to="/setup" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                            User Management
                        </NavLink>
                        <button onClick={() => navigate('/admin/announcements')} className="new-update-btn" style={{ marginTop: '2rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v1z" />
                                <path d="M10 8v11a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5" />
                                <path d="M18 8h1a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4h-1" />
                                <path d="M17 8v8" />
                            </svg>
                            Announcements
                        </button>
                    </>
                )}

                {role === 'LEARNER' && (
                    <>
                        <NavLink to="/tasks" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M9 12l2 2 4-4" />
                            </svg>
                            Tasks
                        </NavLink>
                        <NavLink to="/submissions" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                <line x1="12" y1="11" x2="12" y2="17" />
                                <polyline points="9 14 12 17 15 14" />
                            </svg>
                            Submissions
                        </NavLink>
                        <NavLink to="/feedback" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            Feedback
                        </NavLink>

                        <div className="sidebar-section-header">Resources</div>

                        <NavLink to="/documents" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2h11A2.5 2.5 0 0 1 20 4.5v15M4 19.5A2.5 2.5 0 0 0 6.5 22h11A2.5 2.5 0 0 0 20 19.5M4 19.5h16" />
                            </svg>
                            Documents
                        </NavLink>

                        <button onClick={() => navigate('/announcements')} className="new-update-btn" style={{ marginTop: '2rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v1z" />
                                <path d="M10 8v11a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5" />
                                <path d="M18 8h1a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4h-1" />
                                <path d="M17 8v8" />
                            </svg>
                            Announcements
                        </button>
                    </>
                )}

                {role === 'PROFESSOR' && (
                    <>
                        <NavLink to="/professor/cohorts" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            My Cohorts
                        </NavLink>
                        <NavLink to="/professor/submissions" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                <line x1="12" y1="11" x2="12" y2="17" />
                                <polyline points="9 14 12 17 15 14" />
                            </svg>
                            Submissions & Evaluations
                        </NavLink>
                        <button onClick={() => navigate('/announcements')} className="new-update-btn" style={{ marginTop: '2rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v1z" />
                                <path d="M10 8v11a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5" />
                                <path d="M18 8h1a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4h-1" />
                                <path d="M17 8v8" />
                            </svg>
                            Announcements
                        </button>
                    </>
                )}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <NavLink to="/settings" className={({ isActive }) => `nav-item footer-nav-item${isActive ? ' active' : ''}`}>
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Settings
                </NavLink>

                <div className="user-profile-wrapper" ref={popupRef}>
                    {showPopup && (
                        <div className="user-popup-bubble">
                            <div className="user-popup-info">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'User'}`}
                                    alt={user?.first_name || 'User'}
                                    className="user-popup-avatar"
                                />
                                <div>
                                    <div className="user-popup-name">{user?.first_name || user?.username || 'User'}</div>
                                    <div className="user-popup-role">{role}</div>
                                </div>
                            </div>
                            <hr className="user-popup-divider" />
                            <button className="user-popup-logout-btn" onClick={handleLogout}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Log out
                            </button>
                        </div>
                    )}
                    <div
                        className="user-profile"
                        onClick={() => setShowPopup(prev => !prev)}
                        style={{ cursor: 'pointer' }}
                    >
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'User'}`}
                            alt={user?.first_name || 'User'}
                            className="user-avatar"
                        />
                        <div className="user-info">
                            <span className="user-name">{user?.first_name || user?.username || 'User'}</span>
                            <span className="user-role">{role}</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
