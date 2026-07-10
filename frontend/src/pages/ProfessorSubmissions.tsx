import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axios';

interface MemberInfo {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
}

interface TeamData {
    id: number;
    name: string;
    cohort_details?: {
        name: string;
    };
    members?: { user_details: MemberInfo }[];
}

interface SubmissionData {
    id: number;
    team: number;
    team_details: {
        name: string;
    };
    task_details: {
        title: string;
    };
    submitted_at: string;
    file_url?: string | null;
    has_evaluations: boolean;
}

interface DisplayRow {
    team: string;
    cohort: string;
    teamId: number;
    doc: string;
    time: string;
    fileUrl: string | null;
    status: 'Pending Review' | 'Reviewed' | 'Not Submitted';
    members: MemberInfo[];
}

const ProfessorSubmissions: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if we have state from a previous visit (e.g. returning from Review page)
    const initialState = location.state as { cohortFilter?: string; statusFilter?: string } | null;
    
    const [statusFilter, setStatusFilter] = useState(initialState?.statusFilter || 'All Statuses');
    const [cohortFilter, setCohortFilter] = useState(initialState?.cohortFilter || 'Select Cohort');
    const [availableCohorts, setAvailableCohorts] = useState<{id: number, name: string}[]>([]);
    const [rows, setRows] = useState<DisplayRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [membersModal, setMembersModal] = useState<{ teamName: string; members: MemberInfo[] } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [teamsRes, subsRes, cohortsRes] = await Promise.all([
                    axiosInstance.get('/teams/'),
                    axiosInstance.get('/submissions/'),
                    axiosInstance.get('/cohorts/')
                ]);

                const teams: TeamData[] = teamsRes.data;
                const submissions: SubmissionData[] = subsRes.data;
                
                setAvailableCohorts(cohortsRes.data);

                const displayRows: DisplayRow[] = teams.map(team => {
                    // Find the most recent submission for this team
                    const teamSubs = submissions
                        .filter(s => s.team === team.id || s.team_details?.name === team.name)
                        .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

                    const memberList: MemberInfo[] = (team.members || []).map(m => m.user_details).filter(Boolean);

                    if (teamSubs.length > 0) {
                        const latest = teamSubs[0];
                        const date = new Date(latest.submitted_at);
                        const timeString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        const versionSuffix = teamSubs.length > 1 ? ` (v${teamSubs.length})` : '';

                        return {
                            team: team.name,
                            cohort: team.cohort_details?.name || 'Unknown Cohort',
                            teamId: team.id,
                            doc: latest.task_details?.title || 'Unknown Document',
                            time: timeString + versionSuffix,
                            fileUrl: latest.file_url || null,
                            status: latest.has_evaluations ? 'Reviewed' : 'Pending Review',
                            members: memberList
                        };
                    } else {
                        return {
                            team: team.name,
                            cohort: team.cohort_details?.name || 'Unknown Cohort',
                            teamId: team.id,
                            doc: '—',
                            time: '—',
                            fileUrl: null,
                            status: 'Not Submitted',
                            members: memberList
                        };
                    }
                });

                setRows(displayRows);
            } catch (err) {
                console.error("Failed to fetch teams and submissions", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredRows = rows.filter(row => {
        const matchesStatus = statusFilter === 'All Statuses' || row.status === statusFilter;
        const matchesCohort = cohortFilter !== 'Select Cohort' && row.cohort === cohortFilter;
        return matchesStatus && matchesCohort;
    });

    return (
        <AdminLayout title="Team Submissions" breadcrumb={['Dashboard', 'Submissions']}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>

                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>All Submissions</h2>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {availableCohorts.length > 0 && (
                                <select
                                    value={cohortFilter}
                                    onChange={(e) => setCohortFilter(e.target.value)}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }}
                                >
                                    <option value="Select Cohort">Select Cohort</option>
                                    {availableCohorts.map(cohort => (
                                        <option key={cohort.id} value={cohort.name}>{cohort.name}</option>
                                    ))}
                                </select>
                            )}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }}
                            >
                                <option value="All Statuses">All Statuses</option>
                                <option value="Not Submitted">Not Submitted</option>
                                <option value="Pending Review">Pending Review</option>
                                <option value="Reviewed">Reviewed</option>
                            </select>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <colgroup>
                            <col style={{ width: '25%' }} />
                            <col style={{ width: '25%' }} />
                            <col style={{ width: '25%' }} />
                            <col style={{ width: '25%' }} />
                        </colgroup>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Team</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Team Members</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading submissions...</td>
                                </tr>
                            ) : cohortFilter === 'Select Cohort' ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: '1rem' }}>
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                        </div>
                                        <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>Please select a cohort</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Choose a cohort from the dropdown to view team submissions</div>
                                    </td>
                                </tr>
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No teams found matching this status.</td>
                                </tr>
                            ) : filteredRows.map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{row.team}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <button
                                            onClick={() => setMembersModal({ teamName: row.team, members: row.members })}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                                padding: '0.4rem 0.875rem',
                                                borderRadius: '8px',
                                                background: 'rgba(37,99,235,0.08)',
                                                color: '#60a5fa',
                                                border: '1px solid rgba(37,99,235,0.2)',
                                                fontWeight: 600,
                                                fontSize: '0.8125rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                whiteSpace: 'nowrap'
                                            }}
                                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; }}
                                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.08)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)'; }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                            View Members
                                        </button>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '99px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: row.status === 'Pending Review' ? 'rgba(245, 158, 11, 0.1)' 
                                                        : row.status === 'Not Submitted' ? 'rgba(148, 163, 184, 0.1)' 
                                                        : 'rgba(16, 185, 129, 0.1)',
                                            color: row.status === 'Pending Review' ? '#f59e0b' 
                                                   : row.status === 'Not Submitted' ? '#94a3b8' 
                                                   : '#10b981'
                                        }}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-start', alignItems: 'center' }}>
                                            {row.fileUrl && (
                                                <a
                                                    href={row.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '8px',
                                                        background: 'var(--bg-card)',
                                                        color: 'var(--text-main)',
                                                        border: '1px solid var(--border-color)',
                                                        fontWeight: 600,
                                                        textDecoration: 'none',
                                                        fontSize: '0.875rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'text-bottom', marginRight: '0.25rem' }}>
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="7 10 12 15 17 10" />
                                                        <line x1="12" y1="15" x2="12" y2="3" />
                                                    </svg>
                                                    Download
                                                </a>
                                            )}
                                            <button
                                                onClick={() => navigate(`/professor/submissions/${row.teamId}`, { state: { cohortFilter, statusFilter } })}
                                                disabled={row.status === 'Not Submitted'}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '8px',
                                                    background: row.status === 'Not Submitted' ? 'var(--bg-main)' : 'var(--primary)',
                                                    color: row.status === 'Not Submitted' ? 'var(--text-muted)' : 'white',
                                                    border: row.status === 'Not Submitted' ? '1px solid var(--border-color)' : 'none',
                                                    fontWeight: 600,
                                                    cursor: row.status === 'Not Submitted' ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                {row.status === 'Not Submitted' ? 'No Submissions' : row.status === 'Reviewed' ? 'View Feedback' : 'Review'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Team Members Modal ── */}
            {membersModal && (
                <div
                    onClick={() => setMembersModal(null)}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9999,
                        padding: '1.5rem'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '480px',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                            overflow: 'hidden',
                            animation: 'modalIn 0.2s ease-out'
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: 'rgba(37,99,235,0.1)', color: '#3b82f6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{membersModal.teamName}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {membersModal.members.length} member{membersModal.members.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setMembersModal(null)}
                                style={{
                                    background: 'transparent', border: 'none',
                                    color: 'var(--text-muted)', cursor: 'pointer',
                                    padding: '4px', borderRadius: '6px',
                                    display: 'flex', alignItems: 'center',
                                    transition: 'color 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.color = 'var(--text-main)'}
                                onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Member List */}
                        <div style={{ padding: '1rem 1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                            {membersModal.members.length === 0 ? (
                                <div style={{
                                    textAlign: 'center', padding: '2.5rem 1rem',
                                    color: 'var(--text-secondary)', fontSize: '0.9rem'
                                }}>
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.75rem' }}>
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                    </svg>
                                    No members assigned to this team yet.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                    {membersModal.members.map((member, idx) => {
                                        const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase() || member.username?.[0]?.toUpperCase() || '?';
                                        const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.username;
                                        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
                                        const color = colors[idx % colors.length];
                                        return (
                                            <div key={member.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '0.875rem',
                                                padding: '0.75rem 1rem',
                                                borderRadius: '10px',
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)',
                                                transition: 'border-color 0.2s'
                                            }}>
                                                {/* Avatar */}
                                                <div style={{
                                                    width: '38px', height: '38px', borderRadius: '50%',
                                                    background: `${color}22`,
                                                    color: color,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 700, fontSize: '0.875rem', flexShrink: 0
                                                }}>
                                                    {initials}
                                                </div>
                                                {/* Info */}
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {fullName}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                                                        {member.email}
                                                    </div>
                                                </div>
                                                {/* Member number badge */}
                                                <div style={{
                                                    fontSize: '0.7rem', fontWeight: 700,
                                                    color: 'var(--text-muted)',
                                                    background: 'var(--bg-main)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    padding: '2px 8px', flexShrink: 0
                                                }}>
                                                    #{idx + 1}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid var(--border-color)',
                            display: 'flex', justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setMembersModal(null)}
                                style={{
                                    padding: '0.5rem 1.25rem',
                                    borderRadius: '8px',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-secondary)',
                                    fontWeight: 600, fontSize: '0.875rem',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </AdminLayout>
    );
};

export default ProfessorSubmissions;
