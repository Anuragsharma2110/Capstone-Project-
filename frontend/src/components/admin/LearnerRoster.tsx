import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axios';
import { Card } from '../ui';

interface MembershipData {
    id: number;
    user: number;
    cohort: number;
    status: string;
    access_until: string | null;
    user_details: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        email: string;
    };
}

interface Props {
    cohortId: number;
}

const LearnerRoster: React.FC<Props> = ({ cohortId }) => {
    const [memberships, setMemberships] = useState<MembershipData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkDate, setBulkDate] = useState('');
    const [bulkStatus, setBulkStatus] = useState('');
    const [clearExpiry, setClearExpiry] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMemberships = useCallback(async () => {
        try {
            const res = await axiosInstance.get(`/cohort-memberships/?cohort=${cohortId}`);
            setMemberships(res.data);
        } catch (err) {
            console.error('Failed to fetch memberships', err);
        } finally {
            setLoading(false);
        }
    }, [cohortId]);

    useEffect(() => {
        fetchMemberships();
    }, [fetchMemberships]);

    const toggleSelect = (userId: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === memberships.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(memberships.map(m => m.user)));
        }
    };

    const hasAction = bulkDate || bulkStatus || clearExpiry;

    const handleBulkUpdate = async () => {
        if (selectedIds.size === 0) return;
        setUpdating(true);
        setSuccessMsg(null);
        try {
            const payload: any = { user_ids: Array.from(selectedIds) };
            if (clearExpiry) {
                payload.access_until = '';  // Backend treats empty string as None
            } else if (bulkDate) {
                payload.access_until = bulkDate;
            }
            if (bulkStatus) payload.status = bulkStatus;

            const res = await axiosInstance.post(`/cohorts/${cohortId}/bulk_update_access/`, payload);
            setSuccessMsg(res.data.detail);
            setSelectedIds(new Set());
            setBulkDate('');
            setBulkStatus('');
            setClearExpiry(false);
            fetchMemberships();
        } catch (err: any) {
            console.error('Bulk update failed:', err);
            alert(err.response?.data?.detail || 'Bulk update failed.');
        } finally {
            setUpdating(false);
        }
    };

    const displayName = (m: MembershipData) =>
        [m.user_details.first_name, m.user_details.last_name].filter(Boolean).join(' ') || m.user_details.username;

    const statusBadge = (status: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            ACTIVE: { bg: 'rgba(16,185,129,0.1)', text: '#059669' },
            GRADUATED: { bg: 'rgba(107,114,128,0.1)', text: '#4b5563' },
            DROPPED: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
            SUSPENDED: { bg: 'rgba(245,158,11,0.1)', text: '#d97706' },
        };
        const c = colors[status] || colors.ACTIVE;
        return (
            <span style={{
                padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem',
                fontWeight: 700, background: c.bg, color: c.text,
            }}>{status}</span>
        );
    };

    const formatDate = (d: string | null) => {
        if (!d) return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>;
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return <div style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>Loading roster...</div>;
    }

    if (memberships.length === 0) {
        return (
            <Card style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>No learners enrolled in this cohort yet. Use the CSV upload to add students.</p>
            </Card>
        );
    }

    return (
        <Card style={{ padding: 0, border: '1px solid var(--border-color)', overflow: 'hidden', maxWidth: 'none', width: '100%' }}>
            {/* Header */}
            <div style={{
                padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'rgba(139,92,246,0.1)', color: '#8b5cf6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                            Learner Roster
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {memberships.length} learner{memberships.length !== 1 ? 's' : ''} enrolled
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search learners..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: '0.45rem 0.75rem 0.45rem 1.875rem', borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'transparent', color: 'var(--text-main)',
                                fontSize: '0.8125rem', width: '220px',
                                outline: 'none', transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>
                    {selectedIds.size > 0 && (
                        <span style={{
                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem',
                            fontWeight: 700, background: 'rgba(37,99,235,0.1)', color: '#2563eb',
                        }}>
                            {selectedIds.size} selected
                        </span>
                    )}
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div style={{
                    padding: '0.875rem 1.5rem',
                    background: 'rgba(37,99,235,0.04)',
                    borderBottom: '1px solid rgba(37,99,235,0.12)',
                    display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            Access Until:
                        </label>
                        <input
                            type="date"
                            value={bulkDate}
                            onChange={e => { setBulkDate(e.target.value); setClearExpiry(false); }}
                            disabled={clearExpiry}
                            style={{
                                padding: '0.4rem 0.6rem', borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)', color: 'var(--text-main)',
                                fontSize: '0.82rem',
                                opacity: clearExpiry ? 0.5 : 1,
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <input
                            type="checkbox"
                            id="clear-expiry"
                            checked={clearExpiry}
                            onChange={e => { setClearExpiry(e.target.checked); if (e.target.checked) setBulkDate(''); }}
                            style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: '#10b981' }}
                        />
                        <label htmlFor="clear-expiry" style={{
                            fontSize: '0.78rem', fontWeight: 600, color: '#10b981',
                            cursor: 'pointer', whiteSpace: 'nowrap',
                        }}>
                            Clear Expiry
                        </label>
                    </div>
                    <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            Status:
                        </label>
                        <select
                            value={bulkStatus}
                            onChange={e => setBulkStatus(e.target.value)}
                            style={{
                                padding: '0.4rem 0.6rem', borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)', color: 'var(--text-main)',
                                fontSize: '0.82rem',
                            }}
                        >
                            <option value="">No Change</option>
                            <option value="ACTIVE">Active</option>
                            <option value="GRADUATED">Graduated</option>
                            <option value="DROPPED">Dropped</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>
                    </div>
                    <button
                        onClick={handleBulkUpdate}
                        disabled={updating || !hasAction}
                        style={{
                            padding: '0.45rem 1rem', borderRadius: '8px', border: 'none',
                            background: !hasAction ? 'var(--bg-main)' : 'var(--primary)',
                            color: !hasAction ? 'var(--text-muted)' : 'white',
                            fontWeight: 600, fontSize: '0.82rem',
                            cursor: !hasAction ? 'not-allowed' : 'pointer',
                            marginLeft: 'auto',
                        }}
                    >
                        {updating ? 'Updating...' : 'Apply to Selected'}
                    </button>
                </div>
            )}

            {/* Success Message */}
            {successMsg && (
                <div style={{
                    margin: '0.75rem 1.5rem 0', padding: '0.6rem 1rem',
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '8px', fontSize: '0.82rem', color: '#059669', fontWeight: 500,
                }}>
                    ✓ {successMsg}
                </div>
            )}

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                            <th style={{ padding: '0.7rem 1rem', textAlign: 'left', width: '110px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === memberships.length && memberships.length > 0}
                                        onChange={toggleSelectAll}
                                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                                    />
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select All</span>
                                </div>
                            </th>
                            <th style={{ textAlign: 'left', padding: '0.7rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Learner</th>
                            <th style={{ textAlign: 'left', padding: '0.7rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                            <th style={{ textAlign: 'left', padding: '0.7rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '0.7rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Until</th>
                        </tr>
                    </thead>
                    <tbody>
                        {memberships.filter(m => {
                            const query = searchQuery.toLowerCase();
                            return (
                                m.user_details.first_name?.toLowerCase().includes(query) ||
                                m.user_details.last_name?.toLowerCase().includes(query) ||
                                m.user_details.email?.toLowerCase().includes(query) ||
                                m.user_details.username?.toLowerCase().includes(query)
                            );
                        }).map(m => {
                            const isSelected = selectedIds.has(m.user);
                            const isExpired = m.access_until && new Date(m.access_until) < new Date();
                            return (
                                <tr
                                    key={m.id}
                                    style={{
                                        borderBottom: '1px solid var(--border-color)',
                                        background: isSelected ? 'rgba(37,99,235,0.04)' : 'transparent',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-main)'; }}
                                    onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <td style={{ padding: '0.65rem 1rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(m.user)}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.65rem 0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <div style={{
                                                width: '30px', height: '30px', borderRadius: '50%',
                                                background: 'rgba(139,92,246,0.1)', color: '#8b5cf6',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: '0.72rem', flexShrink: 0,
                                            }}>
                                                {((m.user_details.first_name?.[0] || '') + (m.user_details.last_name?.[0] || '')).toUpperCase() || m.user_details.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                                    {displayName(m)}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    @{m.user_details.username}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                                        {m.user_details.email}
                                    </td>
                                    <td style={{ padding: '0.65rem 0.75rem' }}>
                                        {statusBadge(m.status)}
                                    </td>
                                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.84rem' }}>
                                        <span style={{ color: isExpired ? '#ef4444' : 'var(--text-secondary)', fontWeight: isExpired ? 600 : 400 }}>
                                            {formatDate(m.access_until)}
                                        </span>
                                        {isExpired && (
                                            <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600, marginLeft: '0.4rem' }}>
                                                EXPIRED
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default LearnerRoster;
