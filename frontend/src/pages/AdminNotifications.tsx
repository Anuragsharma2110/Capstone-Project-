import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import axiosInstance from '../api/axios';

interface Notification {
    id: number;
    title: string;
    message: string;
    audience: 'ALL' | 'PROFESSORS' | 'LEARNERS';
    category: 'MESSAGE' | 'SESSION' | 'ERROR' | 'SYSTEM';
    created_at: string;
    created_by_details?: { first_name: string; last_name: string; username: string };
}

const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
    switch (category) {
        case 'MESSAGE':
            return (
                <div style={{ padding: '8px', background: '#f0fdf4', color: '#16a34a', borderRadius: '8px', display: 'flex' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </div>
            );
        case 'SESSION':
            return (
                <div style={{ padding: '8px', background: '#eff6ff', color: '#2563eb', borderRadius: '8px', display: 'flex' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                </div>
            );
        case 'ERROR':
            return (
                <div style={{ padding: '8px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', display: 'flex' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
            );
        default:
            return (
                <div style={{ padding: '8px', background: '#f5f3ff', color: '#7c3aed', borderRadius: '8px', display: 'flex' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                </div>
            );
    }
};

const AdminNotifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [cohorts, setCohorts] = useState<{id: number, name: string}[]>([]);
    const [teams, setTeams] = useState<{id: number, name: string, cohort: number}[]>([]);
    const [, setLoading] = useState(true);
    const [form, setForm] = useState({ title: '', message: '', audience: 'ALL', category: 'SYSTEM', cohort: '', team: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [, setDeletingId] = useState<number | null>(null);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/notifications/');
            setNotifications(res.data);
            const cohortsRes = await axiosInstance.get('/cohorts/');
            setCohorts(cohortsRes.data);
            const teamsRes = await axiosInstance.get('/teams/');
            setTeams(teamsRes.data);
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, []);

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
            const payload: any = { ...form };
            if (payload.audience !== 'COHORT' && payload.audience !== 'TEAM') {
                payload.cohort = null;
                payload.team = null;
            }
            if (payload.audience === 'TEAM' && !payload.team) throw new Error("Team selection is required.");
            if (payload.audience === 'COHORT' && !payload.cohort) throw new Error("Cohort selection is required.");
            if (payload.cohort === '') payload.cohort = null;
            if (payload.team === '') payload.team = null;

            await axiosInstance.post('/notifications/', payload);
            setSuccess('Notification published successfully!');
            setForm({ title: '', message: '', audience: 'ALL', category: 'SYSTEM', cohort: '', team: '' });
            fetchNotifications();
        } catch (e: any) {
            const detail = e.response?.data?.detail || e.message || 'Failed to publish notification.';
            setError(detail);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this notification for all users?')) return;
        setDeletingId(id);
        try {
            await axiosInstance.delete(`/notifications/${id}/`);
            setNotifications(prev => prev.filter(a => a.id !== id));
        } catch {
            alert('Failed to delete notification.');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <AdminLayout title="Notification Management" breadcrumb={['Admin', 'Notifications']}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 400px) 1.5fr', gap: '2rem', alignItems: 'start' }}>

                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '1.75rem',
                    position: 'sticky',
                    top: '1.5rem'
                }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ background: 'rgba(37,99,235,0.1)', padding: '8px', borderRadius: '8px', color: '#2563eb', display: 'flex' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                        </span>
                        New Notification
                    </h2>

                    {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
                    {success && <div style={{ color: '#10b981', marginBottom: '1rem', fontSize: '0.85rem' }}>{success}</div>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Title</label>
                            <input
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                placeholder="Notification title..."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Audience</label>
                                <select
                                    value={form.audience}
                                    onChange={e => setForm({ ...form, audience: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                >
                                    <option value="ALL">All Users</option>
                                    <option value="PROFESSORS">Professors</option>
                                    <option value="LEARNERS">Learners</option>
                                    <option value="COHORT">Specific Cohort</option>
                                    <option value="TEAM">Specific Team</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                >
                                    <option value="SYSTEM">System</option>
                                    <option value="MESSAGE">Message</option>
                                    <option value="SESSION">Session</option>
                                    <option value="ERROR">Error</option>
                                </select>
                            </div>
                        </div>

                        {form.audience === 'COHORT' && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Select Cohort</label>
                                <select
                                    value={form.cohort}
                                    onChange={e => setForm({ ...form, cohort: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                >
                                    <option value="">-- Choose Cohort --</option>
                                    {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}

                        {form.audience === 'TEAM' && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Select Team</label>
                                <select
                                    value={form.team}
                                    onChange={e => setForm({ ...form, team: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                >
                                    <option value="">-- Choose Team --</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Message</label>
                            <textarea
                                value={form.message}
                                onChange={e => setForm({ ...form, message: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem', minHeight: '120px' }}
                                placeholder="Details..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{ padding: '0.85rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            {isSubmitting ? 'Publishing...' : 'Publish Notification'}
                        </button>
                    </form>
                </div>

                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                        Published Notifications <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({notifications.length})</span>
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {notifications.map(n => (
                            <div key={n.id} style={{
                                padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', gap: '1rem', alignItems: 'flex-start'
                            }}>
                                <CategoryIcon category={n.category} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{n.title}</h3>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(n.created_at)}</span>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.8rem', lineHeight: '1.5' }}>{n.message}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', background: 'rgba(37,99,235,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                                            {n.audience}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(n.id)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminNotifications;
