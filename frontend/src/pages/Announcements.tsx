import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui';
import AdminLayout from '../layouts/AdminLayout';
import axiosInstance from '../api/axios';

interface Announcement {
    id: number;
    title: string;
    message: string;
    audience: string;
    created_at: string;
    created_by_details?: { first_name: string; last_name: string; username: string };
}

const audienceBadgeColor: Record<string, string> = {
    ALL: '#2563eb',
    PROFESSORS: '#7c3aed',
    LEARNERS: '#059669',
};

const Announcements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axiosInstance.get('/announcements/');
                setAnnouncements(res.data);
            } catch (e) {
                console.error('Failed to fetch announcements', e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AdminLayout title="Announcements" breadcrumb={['Dashboard', 'Announcements']}>
            <div style={{ maxWidth: '760px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'rgba(37,99,235,0.1)', color: '#2563eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <g transform="rotate(-15 12 12)">
                                <path d="M4 11h1L17 6c1-.3 2 .4 2 1.5v9c0 1.1-1 1.8-2 1.5l-12-4H4c-1.1 0-2-.9-2-2v-1c0-1.1.9-2 2-2z" />
                                <path d="M8 15v3c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2v-4.5H8z" />
                            </g>
                        </svg>
                    </div>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                        Announcements
                        {announcements.length > 0 && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                ({announcements.length} total)
                            </span>
                        )}
                    </h1>
                </div>

                {loading ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Loading announcements...</div>
                ) : announcements.length === 0 ? (
                    <Card style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📢</div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>No Announcements Yet</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            You're all caught up! Check back later for updates from your administrators.
                        </p>
                    </Card>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {announcements.map(ann => (
                            <div key={ann.id} style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                padding: '1.25rem 1.5rem',
                                borderLeft: `4px solid ${audienceBadgeColor[ann.audience] || '#2563eb'}`,
                                transition: 'box-shadow 0.2s',
                            }}
                                onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                                onMouseOut={e => (e.currentTarget.style.boxShadow = 'none')}
                            >
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.6rem 0', color: 'var(--text-main)' }}>
                                    {ann.title}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                    {ann.message}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {formatDate(ann.created_at)}
                                        {ann.created_by_details && ` · From Admin`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Announcements;
