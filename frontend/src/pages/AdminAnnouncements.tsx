import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import axiosInstance from '../api/axios';

interface Announcement {
    id: number;
    title: string;
    message: string;
    audience: 'ALL' | 'PROFESSORS' | 'LEARNERS';
    created_at: string;
    created_by_details?: { first_name: string; last_name: string; username: string };
    cohort?: number | null;
}

const audienceLabel: Record<string, string> = {
    ALL: 'All Users',
    PROFESSORS: 'Professors Only',
    LEARNERS: 'Learners Only',
};

const audienceBadgeColor: Record<string, string> = {
    ALL: '#2563eb',
    PROFESSORS: '#7c3aed',
    LEARNERS: '#059669',
};

const AdminAnnouncements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: '', message: '', audience: 'ALL' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/announcements/');
            setAnnouncements(res.data);
        } catch (e) {
            console.error('Failed to fetch announcements', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!form.title.trim() || !form.message.trim()) {
            setError('Title and message are required.');
            return;
        }
        setIsSubmitting(true);
        try {
            await axiosInstance.post('/announcements/', form);
            setSuccess('Announcement published successfully!');
            setForm({ title: '', message: '', audience: 'ALL' });
            fetchAnnouncements();
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Failed to publish announcement.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;
        setDeletingId(id);
        try {
            await axiosInstance.delete(`/announcements/${id}/`);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (e) {
            alert('Failed to delete announcement.');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AdminLayout title="Announcements" breadcrumb={['Admin', 'Announcements']}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>

                {/* Compose Panel */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '1.75rem',
                    position: 'sticky',
                    top: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '10px',
                            background: 'rgba(37,99,235,0.12)', color: '#2563eb',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                        </div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                            New Announcement
                        </h2>
                    </div>

                    {error && (
                        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                Title *
                            </label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. Submission Deadline Extended"
                                style={{
                                    width: '100%', boxSizing: 'border-box', padding: '0.625rem 0.75rem',
                                    border: '1.5px solid var(--border-color)', borderRadius: '8px',
                                    background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem',
                                    outline: 'none',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                Audience *
                            </label>
                            <select
                                value={form.audience}
                                onChange={e => setForm({ ...form, audience: e.target.value })}
                                style={{
                                    width: '100%', padding: '0.625rem 0.75rem',
                                    border: '1.5px solid var(--border-color)', borderRadius: '8px',
                                    background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem',
                                    outline: 'none', cursor: 'pointer'
                                }}
                            >
                                <option value="ALL">All Users (Professors + Learners)</option>
                                <option value="PROFESSORS">Professors Only</option>
                                <option value="LEARNERS">Learners Only</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                Message *
                            </label>
                            <textarea
                                value={form.message}
                                onChange={e => setForm({ ...form, message: e.target.value })}
                                placeholder="Write your announcement here..."
                                rows={5}
                                style={{
                                    width: '100%', boxSizing: 'border-box', padding: '0.625rem 0.75rem',
                                    border: '1.5px solid var(--border-color)', borderRadius: '8px',
                                    background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem',
                                    outline: 'none', resize: 'vertical', fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                padding: '0.75rem', borderRadius: '8px', border: 'none',
                                background: isSubmitting ? 'var(--text-muted)' : 'var(--primary, #2563eb)',
                                color: 'white', fontWeight: 600, fontSize: '0.9rem',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                transition: 'opacity 0.15s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                            {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
                        </button>
                    </form>
                </div>

                {/* Published Announcements */}
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: 'var(--text-main)' }}>
                        Published Announcements <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.95rem' }}>({announcements.length})</span>
                    </h2>

                    {loading ? (
                        <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Loading...</div>
                    ) : announcements.length === 0 ? (
                        <div style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px',
                            padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📢</div>
                            <p>No announcements yet. Create one to get started!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {announcements.map(ann => (
                                <div key={ann.id} style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                    borderRadius: '12px', padding: '1.25rem',
                                    borderLeft: `4px solid ${audienceBadgeColor[ann.audience] || '#2563eb'}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>
                                                {ann.title}
                                            </h3>
                                            <span style={{
                                                display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                                                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                                                background: `${audienceBadgeColor[ann.audience]}20`,
                                                color: audienceBadgeColor[ann.audience] || '#2563eb'
                                            }}>
                                                {audienceLabel[ann.audience] || ann.audience}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(ann.id)}
                                            disabled={deletingId === ann.id}
                                            style={{
                                                background: 'transparent', border: 'none', padding: '4px',
                                                color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '6px',
                                                transition: 'color 0.15s',
                                            }}
                                            onMouseOver={e => (e.currentTarget.style.color = '#ef4444')}
                                            onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                                            title="Delete announcement"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.75rem 0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                        {ann.message}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                        Posted {formatDate(ann.created_at)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminAnnouncements;
