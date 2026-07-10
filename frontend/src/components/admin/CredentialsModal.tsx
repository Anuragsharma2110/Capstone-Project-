import React, { useState } from 'react';
import axiosInstance from '../../api/axios';

// ── Learner credentials (from bulk upload) ─────────────────────────────────
interface LearnerCredential {
    email: string;
    username: string;
    password: string;
}

// ── Team credentials (from team creation / regeneration) ───────────────────
interface TeamCredential {
    team_id?: number;
    team_name?: string;
    username: string;
    password: string;
}

type Mode = 'learner' | 'team';

interface Props {
    /** Learner credentials mode */
    credentials?: LearnerCredential[];
    /** Team credentials mode */
    teamCredentials?: TeamCredential[];
    mode?: Mode;
    cohortId?: number;
    onClose: () => void;
}

const CredentialsModal: React.FC<Props> = ({
    credentials = [],
    teamCredentials = [],
    mode = credentials.length > 0 ? 'learner' : 'team',
    cohortId,
    onClose,
}) => {
    const [isSending, setIsSending] = useState(false);
    const isTeamMode = mode === 'team' || (teamCredentials.length > 0 && credentials.length === 0);
    const isEmpty = isTeamMode ? teamCredentials.length === 0 : credentials.length === 0;

    if (isEmpty) return null;

    const handleCopyAll = () => {
        let text: string;
        if (isTeamMode) {
            text = teamCredentials
                .map(c => `${c.team_name ?? ''}\t${c.username}\t${c.password}`)
                .join('\n');
            navigator.clipboard.writeText(`Team\tUsername\tPassword\n${text}`);
        } else {
            text = credentials
                .map(c => `${c.email}\t${c.username}\t${c.password}`)
                .join('\n');
            navigator.clipboard.writeText(`Email\tUsername\tPassword\n${text}`);
        }
        alert('Credentials copied to clipboard!');
    };

    const handleDownloadCSV = () => {
        let header: string;
        let rows: string[];
        let filename: string;

        if (isTeamMode) {
            header = 'Team,Username,Password';
            rows = teamCredentials.map(c => `${c.team_name ?? ''},${c.username},${c.password}`);
            filename = `team_credentials_${new Date().toISOString().slice(0, 10)}.csv`;
        } else {
            header = 'Email,Username,Password';
            rows = credentials.map(c => `${c.email},${c.username},${c.password}`);
            filename = `learner_credentials_${new Date().toISOString().slice(0, 10)}.csv`;
        }

        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSendEmails = async () => {
        if (!cohortId) {
            alert("Cohort ID is missing. Cannot send emails.");
            return;
        }
        
        setIsSending(true);
        try {
            const res = await axiosInstance.post(`/cohorts/${cohortId}/dispatch_credentials_emails/`, {
                credentials: teamCredentials
            });
            alert(res.data.detail || "Emails dispatched successfully.");
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.detail || "Failed to dispatch emails.");
        } finally {
            setIsSending(false);
        }
    };

    const count = isTeamMode ? teamCredentials.length : credentials.length;
    const subtitle = isTeamMode
        ? `${count} team account${count !== 1 ? 's' : ''} created`
        : `${count} new learner account${count !== 1 ? 's' : ''} created`;

    return (
        <>
            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 10000,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'modalFadeIn 0.2s ease-out',
                }}
                onClick={onClose}
            >
                <div
                    style={{
                        background: 'var(--bg-card)', borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        width: '95%', maxWidth: '680px', maxHeight: '85vh',
                        display: 'flex', flexDirection: 'column',
                        animation: 'modalSlideUp 0.25s ease-out',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={{
                        padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '38px', height: '38px', borderRadius: '10px',
                                background: isTeamMode ? 'rgba(37,99,235,0.1)' : 'rgba(16,185,129,0.1)',
                                color: isTeamMode ? '#2563eb' : '#10b981',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {isTeamMode ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                                    {isTeamMode ? 'Team Login Credentials' : 'Generated Credentials'}
                                </h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    {subtitle}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} style={{
                            background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                            borderRadius: '8px', width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--text-muted)',
                        }}>×</button>
                    </div>

                    {/* Warning */}
                    <div style={{
                        margin: '1rem 2rem 0', padding: '0.75rem 1rem',
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: '8px', fontSize: '0.8rem', color: '#d97706', lineHeight: 1.5,
                        display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                    }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>⚠</span>
                        <span>
                            {isTeamMode
                                ? 'These passwords are shown <strong>only once</strong>. Share them with your students and download a copy before closing.'
                                : 'These passwords are shown <strong>only once</strong>. Please copy or download them before closing this dialog.'}
                        </span>
                    </div>

                    {/* Table */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '1rem 2rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {isTeamMode ? 'Team' : 'Email'}
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</th>
                                    <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isTeamMode
                                    ? teamCredentials.map((c, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }} />
                                                    {c.team_name}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{c.username}</td>
                                            <td style={{ padding: '0.6rem 0.75rem' }}>
                                                <code style={{
                                                    background: 'var(--bg-main)', padding: '3px 8px',
                                                    borderRadius: '4px', fontSize: '0.82rem',
                                                    fontFamily: 'monospace', color: '#2563eb', fontWeight: 700,
                                                    border: '1px solid var(--border-color)',
                                                }}>{c.password}</code>
                                            </td>
                                        </tr>
                                    ))
                                    : credentials.map((c, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-main)', fontWeight: 500 }}>{c.email}</td>
                                            <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{c.username}</td>
                                            <td style={{ padding: '0.6rem 0.75rem' }}>
                                                <code style={{
                                                    background: 'var(--bg-main)', padding: '3px 8px',
                                                    borderRadius: '4px', fontSize: '0.82rem',
                                                    fontFamily: 'monospace', color: '#10b981', fontWeight: 600,
                                                    border: '1px solid var(--border-color)',
                                                }}>{c.password}</code>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '1.25rem 2rem', borderTop: '1px solid var(--border-color)',
                        display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
                    }}>
                        <button onClick={handleCopyAll} style={{
                            padding: '0.6rem 1.25rem', borderRadius: '8px',
                            border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                            color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copy All
                        </button>
                        {isTeamMode && cohortId && (
                            <button onClick={handleSendEmails} disabled={isSending} style={{
                                padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.5)',
                                background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                                fontWeight: 600, fontSize: '0.85rem', cursor: isSending ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: isSending ? 0.7 : 1,
                            }}>
                                {isSending ? (
                                    <span>Sending...</span>
                                ) : (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        Send Emails
                                    </>
                                )}
                            </button>
                        )}
                        <button onClick={handleDownloadCSV} style={{
                            padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none',
                            background: 'var(--primary)', color: 'white',
                            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download CSV
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CredentialsModal;
