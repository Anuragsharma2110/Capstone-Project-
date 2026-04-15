import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import axiosInstance from '../api/axios';
import './Notifications.css';

interface Notification {
    id: number;
    title: string;
    message: string;
    category: 'MESSAGE' | 'SESSION' | 'ERROR' | 'SYSTEM';
    audience: string;
    created_at: string;
    created_by_details?: { first_name: string; last_name: string; username: string };
    is_read: boolean;
}

const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
    switch (category) {
        case 'MESSAGE':
            return (
                <div className="category-icon message">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </div>
            );
        case 'SESSION':
            return (
                <div className="category-icon session">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                </div>
            );
        case 'ERROR':
            return (
                <div className="category-icon error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="category-icon system">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                </div>
            );
    }
};

const DeleteIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
);

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Unread'>('All');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const fetchNotifications = async () => {
        try {
            const res = await axiosInstance.get('/notifications/');
            setNotifications(res.data);
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleCardClick = async (notif: Notification) => {
        if (deleteConfirmId) return; // Prevent expansion if deleting
        
        // Toggle expansion
        setExpandedId(prev => prev === notif.id ? null : notif.id);
        
        // Mark as read if unread
        if (!notif.is_read) {
            try {
                await axiosInstance.post(`/notifications/${notif.id}/mark_as_read/`);
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            } catch (e) {
                console.error('Failed to mark as read', e);
            }
        }
    };

    const markAllAsRead = async () => {
        try {
            await axiosInstance.post('/notifications/mark_all_as_read/');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (e) {
            console.error('Failed to mark all as read', e);
        }
    };

    const initiateDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setDeleteConfirmId(id);
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmId(null);
    };

    const confirmDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            await axiosInstance.delete(`/notifications/${id}/`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            setDeleteConfirmId(null);
        } catch (e) {
            console.error('Failed to delete notification', e);
            alert('Could not delete notification. You may not have permission.');
            setDeleteConfirmId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const isRecent = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        return (now.getTime() - d.getTime()) < 24 * 60 * 60 * 1000;
    };

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'Unread') return !n.is_read;
        if (activeTab === 'New') return !n.is_read && isRecent(n.created_at);
        return true;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <AdminLayout title="Notifications" breadcrumb={['Dashboard', 'Notifications']}>
            <div className="notifications-container">
                <div className="notifications-header">
                    <div className="header-info">
                        <h1>Notifications</h1>
                        <p className="unread-count">You've {unreadCount} unread notifications</p>
                    </div>
                    {unreadCount > 0 && (
                        <button className="mark-all-read-btn" onClick={markAllAsRead}>
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="tabs-container">
                    {(['All', 'New', 'Unread'] as const).map(tab => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="notifications-list">
                    {loading ? (
                        <div className="empty-state">Loading ...</div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📢</div>
                            <p>No {activeTab.toLowerCase()} notifications found.</p>
                        </div>
                    ) : (
                        filteredNotifications.map(notif => (
                            <div
                                key={notif.id}
                                className={`notification-card ${!notif.is_read ? 'unread' : ''} ${expandedId === notif.id ? 'expanded' : ''}`}
                                onClick={() => handleCardClick(notif)}
                            >
                                <CategoryIcon category={notif.category} />
                                
                                <div className="notification-content">
                                    <h3 className="notification-title">
                                        {!notif.is_read && <span className="unread-dot" title="Unread"></span>}
                                        {notif.title}
                                    </h3>
                                    <p className={`notification-message ${expandedId === notif.id ? 'expanded' : ''}`}>
                                        {notif.message}
                                    </p>
                                </div>

                                <div className="notification-actions">
                                    <span className="notification-date">{formatDate(notif.created_at)}</span>
                                    
                                    {deleteConfirmId === notif.id ? (
                                        <div className="delete-confirmation-inline">
                                            <button className="confirm-btn" onClick={(e) => confirmDelete(e, notif.id)}>Yes</button>
                                            <button className="cancel-btn" onClick={cancelDelete}>No</button>
                                        </div>
                                    ) : (
                                        <button className="delete-btn" onClick={(e) => initiateDelete(e, notif.id)}>
                                            <DeleteIcon />
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default Notifications;
