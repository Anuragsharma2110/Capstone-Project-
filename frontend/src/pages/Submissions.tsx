import React, { useState, useRef, useEffect } from 'react';
import { Card, Button } from '../components/ui';
import AdminLayout from '../layouts/AdminLayout';
import axiosInstance from '../api/axios';

interface ExistingSubmission {
    id: number;
    file_url?: string | null;
    document?: string | null;
    submitted_at: string;
    has_evaluations: boolean;
    task_details?: {
        title: string;
        deadline?: string;
    };
}

const Submissions: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [repoLink, setRepoLink] = useState('');
    const [urlError, setUrlError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [justSubmitted, setJustSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [teamId, setTeamId] = useState<number | null>(null);
    const [existingSubmission, setExistingSubmission] = useState<ExistingSubmission | null>(null);
    const [submissionHistory, setSubmissionHistory] = useState<ExistingSubmission[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deadline, setDeadline] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch user's team + existing submission on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const teamsRes = await axiosInstance.get('/teams/');
                if (teamsRes.data && teamsRes.data.length > 0) {
                    const team = teamsRes.data[0];
                    setTeamId(team.id);

                    // Fetch milestones for deadline
                    try {
                        const milestonesRes = await axiosInstance.get(`/cohort-milestones/?cohort=${team.cohort}`);
                        const milestones = milestonesRes.data?.results || milestonesRes.data || [];
                        const finalMilestone = milestones.find?.((m: any) => m.is_final_submission);
                        if (finalMilestone) {
                            setDeadline(finalMilestone.due_date);
                        } else if (milestones.length > 0) {
                            const sorted = [...milestones].sort((a: any, b: any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
                            setDeadline(sorted[0].due_date);
                        }
                    } catch { /* milestones endpoint might not exist, ignore */ }

                    // Fetch existing submissions for this team
                    if (team.is_final_submitted) {
                        try {
                            const subsRes = await axiosInstance.get('/submissions/');
                            const teamSubs = subsRes.data.filter((s: any) => s.team === team.id);
                            if (teamSubs.length > 0) {
                                const sortedSubs = teamSubs.sort((a: any, b: any) =>
                                    new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
                                );
                                setSubmissionHistory(sortedSubs);
                                setExistingSubmission(sortedSubs[0]);
                                if (sortedSubs[0].file_url) setRepoLink(sortedSubs[0].file_url);
                            }
                        } catch { /* ignore */ }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch team:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]);
    };

    const handleRepoLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setRepoLink(value);
        if (value && !/^https?:\/\/.*/.test(value)) {
            setUrlError('Please enter a valid URL starting with http:// or https://');
        } else {
            setUrlError('');
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile && !repoLink) return;
        if (!teamId) {
            setSubmitError('You are not assigned to a team. Please contact your administrator.');
            return;
        }
        setIsSubmitting(true);
        setSubmitError('');
        try {
            const formData = new FormData();
            if (repoLink) formData.append('repoLink', repoLink);
            if (selectedFile) formData.append('document', selectedFile);

            await axiosInstance.post(`/teams/${teamId}/submit_final/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setIsSubmitting(false);
            setJustSubmitted(true);
            setIsEditing(false);

            // Refresh submission data
            const subsRes = await axiosInstance.get('/submissions/');
            const teamSubs = subsRes.data.filter((s: any) => s.team === teamId);
            if (teamSubs.length > 0) {
                const sortedSubs = teamSubs.sort((a: any, b: any) =>
                    new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
                );
                setSubmissionHistory(sortedSubs);
                setExistingSubmission(sortedSubs[0]);
            }
        } catch (err: any) {
            setIsSubmitting(false);
            setSubmitError(err.response?.data?.detail || 'Submission failed. Please try again.');
        }
    };

    const handleEditSubmission = () => {
        setIsEditing(true);
        setJustSubmitted(false);
        setSelectedFile(null);
        if (existingSubmission?.file_url) setRepoLink(existingSubmission.file_url);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setSelectedFile(null);
        setSubmitError('');
        if (existingSubmission?.file_url) {
            setRepoLink(existingSubmission.file_url);
        } else {
            setRepoLink('');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getDocumentName = (url: string) => {
        const parts = url.split('/');
        return decodeURIComponent(parts[parts.length - 1]);
    };

    const hasExistingSubmission = !!existingSubmission && !isEditing;
    const isFormMode = !existingSubmission || isEditing;

    if (loading) {
        return (
            <AdminLayout title="Project Submissions" breadcrumb={['Dashboard', 'Submissions']}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
                    Loading...
                </div>
            </AdminLayout>
        );
    }

    // ── Just-submitted flash screen ──
    if (justSubmitted && !isEditing) {
        return (
            <AdminLayout title="Project Submissions" breadcrumb={['Dashboard', 'Submissions']}>
                <div style={{ width: '100%', padding: '40px 48px', boxSizing: 'border-box' }}>
                    <Card style={{ textAlign: 'center', padding: '5rem 2.5rem', maxWidth: '680px', margin: '0 auto' }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '50%',
                            background: 'rgba(16,185,129,0.1)', color: '#10b981',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem', fontWeight: 800, color: 'var(--text-main)' }}>Submission successful!</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '480px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
                            Your project documentation and files have been securely uploaded.
                        </p>
                        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem 2rem', borderRadius: '12px', marginBottom: '2rem', display: 'inline-block', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.06em' }}>SUBMISSION TIMESTAMP</div>
                            <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>{new Date().toLocaleString()}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Button variant="outline" onClick={() => setJustSubmitted(false)} style={{ padding: '10px 32px' }}>
                                Back to Dashboard
                            </Button>
                        </div>
                    </Card>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Project Submissions" breadcrumb={['Dashboard', 'Submissions']}>
            <div style={{ width: '100%', padding: '40px 48px', boxSizing: 'border-box' }}>

                {/* ── Already submitted: show summary card ── */}
                {hasExistingSubmission && (
                    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}>
                        <Card style={{ padding: '0', overflow: 'hidden', width: '100%' }}>
                            {/* Header */}
                            <div style={{
                                padding: '24px 28px', borderBottom: '1px solid var(--border-color)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '12px',
                                        background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>Project Submitted</h2>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            Submitted on {new Date(existingSubmission.submitted_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(existingSubmission.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <span style={{
                                    padding: '5px 14px', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 700,
                                    background: 'rgba(16,185,129,0.1)', color: '#10b981', letterSpacing: '0.03em'
                                }}>
                                    SUBMITTED
                                </span>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Uploaded file */}
                                <div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '10px', textTransform: 'uppercase' }}>
                                        Uploaded Document
                                    </div>
                                    {existingSubmission.document ? (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            background: 'var(--bg-secondary)', padding: '14px 16px', borderRadius: '10px',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            <div style={{
                                                width: '40px', height: '40px', flexShrink: 0,
                                                background: 'rgba(37,99,235,0.12)', borderRadius: '8px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                                    <polyline points="13 2 13 9 20 9"></polyline>
                                                </svg>
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {getDocumentName(existingSubmission.document)}
                                                </div>
                                            </div>
                                            <a
                                                href={existingSubmission.document}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    padding: '5px 12px', borderRadius: '6px', fontSize: '0.8rem',
                                                    fontWeight: 600, textDecoration: 'none',
                                                    background: 'rgba(37,99,235,0.08)', color: '#60a5fa',
                                                    border: '1px solid rgba(37,99,235,0.2)', whiteSpace: 'nowrap'
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                Download
                                            </a>
                                        </div>
                                    ) : (
                                        <div style={{
                                            background: 'var(--bg-secondary)', padding: '14px 16px', borderRadius: '10px',
                                            border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.875rem'
                                        }}>
                                            No document uploaded
                                        </div>
                                    )}
                                </div>

                                {/* Repository link — editable inline */}
                                <div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '10px', textTransform: 'uppercase' }}>
                                        Repository / Live Link
                                    </div>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        background: 'var(--bg-secondary)', padding: '10px 16px', borderRadius: '10px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{
                                            width: '40px', height: '40px', flexShrink: 0,
                                            background: 'rgba(139,92,246,0.12)', borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                            </svg>
                                        </div>
                                        <input
                                            value={repoLink}
                                            onChange={handleRepoLinkChange}
                                            placeholder="https://github.com/your-repo..."
                                            style={{
                                                flex: 1, fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 500,
                                                background: 'transparent', border: 'none', outline: 'none',
                                                fontFamily: 'inherit', padding: '6px 0'
                                            }}
                                        />
                                        {/* Show save button if link changed */}
                                        {repoLink !== (existingSubmission.file_url || '') && !urlError && (
                                            <button
                                                onClick={async () => {
                                                    if (!teamId) return;
                                                    setIsSubmitting(true);
                                                    try {
                                                        const formData = new FormData();
                                                        formData.append('repoLink', repoLink);
                                                        await axiosInstance.post(`/teams/${teamId}/submit_final/`, formData, {
                                                            headers: { 'Content-Type': 'multipart/form-data' },
                                                        });
                                                        // Refresh
                                                        const subsRes = await axiosInstance.get('/submissions/');
                                                        const teamSubs = subsRes.data.filter((s: any) => s.team === teamId);
                                                        if (teamSubs.length > 0) {
                                                            const latest = teamSubs.sort((a: any, b: any) =>
                                                                new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
                                                            )[0];
                                                            setExistingSubmission(latest);
                                                        }
                                                    } catch { /* ignore */ }
                                                    setIsSubmitting(false);
                                                }}
                                                disabled={isSubmitting}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    padding: '5px 14px', borderRadius: '6px', fontSize: '0.8rem',
                                                    fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                                    border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer',
                                                    whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.18)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                {isSubmitting ? 'Saving...' : 'Save'}
                                            </button>
                                        )}
                                    </div>
                                    {urlError && (
                                        <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 500, marginTop: '6px', display: 'block' }}>{urlError}</span>
                                    )}
                                </div>
                            </div>

                            {/* Footer with Edit button */}
                            <div style={{
                                padding: '18px 28px', borderTop: '1px solid var(--border-color)',
                                display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '0.85rem', color: existingSubmission.has_evaluations ? '#ef4444' : 'var(--text-muted)', fontWeight: existingSubmission.has_evaluations ? 600 : 400 }}>
                                    {existingSubmission.has_evaluations 
                                        ? "This submission has been reviewed and is now locked for changes." 
                                        : "You can submit a new version before the deadline."}
                                    {submissionHistory.length > 1 && <span style={{display: 'block', marginTop: '4px', color:'var(--text-secondary)'}}>Displaying latest of {submissionHistory.length} versions.</span>}
                                </span>
                                <button
                                    onClick={handleEditSubmission}
                                    disabled={existingSubmission.has_evaluations}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 22px', borderRadius: '8px',
                                        background: existingSubmission.has_evaluations ? 'var(--bg-sidebar)' : '#2563eb', 
                                        color: existingSubmission.has_evaluations ? 'var(--text-muted)' : '#ffffff',
                                        border: 'none', fontWeight: 600, fontSize: '0.9rem',
                                        cursor: existingSubmission.has_evaluations ? 'not-allowed' : 'pointer', 
                                        fontFamily: 'inherit',
                                        transition: 'background 0.2s',
                                        opacity: existingSubmission.has_evaluations ? 0.6 : 1
                                    }}
                                    onMouseOver={(e) => { if (!existingSubmission.has_evaluations) e.currentTarget.style.background = '#1d4ed8'; }}
                                    onMouseOut={(e) => { if (!existingSubmission.has_evaluations) e.currentTarget.style.background = '#2563eb'; }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 5v14M5 12h14"/>
                                    </svg>
                                    Submit New Version
                                </button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* ── Form mode (new submission or editing) ── */}
                {isFormMode && (
                    <div style={{
                        maxWidth: '860px', margin: '0 auto', display: 'flex',
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: '12px', overflow: 'hidden'
                    }}>
                        {/* ── Left column: form ── */}
                        <div style={{
                            flex: 1, minWidth: '300px', padding: '28px',
                            display: 'flex', flexDirection: 'column',
                            borderRight: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                    {isEditing ? 'Update Submission' : 'Project Submission'}
                                </h2>
                                {isEditing && (
                                    <span style={{
                                        padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem',
                                        fontWeight: 700, background: 'rgba(245,158,11,0.1)', color: '#f59e0b'
                                    }}>
                                        EDITING
                                    </span>
                                )}
                            </div>

                            {/* Deadline badge */}
                            {deadline && (
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                    borderRadius: '8px', padding: '6px 14px',
                                    marginBottom: '20px', alignSelf: 'flex-start', whiteSpace: 'nowrap'
                                }}>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.07em' }}>DEADLINE</span>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                        {new Date(deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            )}

                            {/* Submission rules */}
                            <div style={{
                                display: 'flex', gap: '10px', alignItems: 'flex-start',
                                background: isEditing ? 'rgba(245,158,11,0.06)' : 'rgba(37,99,235,0.06)',
                                border: `1px solid ${isEditing ? 'rgba(245,158,11,0.18)' : 'rgba(37,99,235,0.18)'}`,
                                borderRadius: '10px', padding: '12px 14px', marginBottom: '22px'
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isEditing ? '#f59e0b' : '#3b82f6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {isEditing ? (
                                        <>
                                            <strong style={{ color: '#fbbf24', fontWeight: 600 }}>Editing Mode:</strong>{' '}
                                            Upload a new file or update your link. The previous submission will be replaced.
                                        </>
                                    ) : (
                                        <>
                                            <strong style={{ color: '#60a5fa', fontWeight: 600 }}>Submission Rules:</strong>{' '}
                                            Only one member per team needs to submit. This will update the status for all members.
                                        </>
                                    )}
                                </span>
                            </div>

                            {/* Repo link */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    Repository / Live Link (Optional)
                                </label>
                                <input
                                    value={repoLink}
                                    onChange={handleRepoLinkChange}
                                    placeholder="https://github.com/..."
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        padding: '10px 14px', fontSize: '0.9rem',
                                        border: urlError ? '1px solid #ef4444' : '1px solid var(--border-color)',
                                        borderRadius: '8px', background: 'var(--bg-secondary)',
                                        color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit'
                                    }}
                                />
                                {urlError && (
                                    <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 500 }}>{urlError}</span>
                                )}
                            </div>

                            {/* Error display */}
                            {submitError && (
                                <div style={{
                                    padding: '0.6rem 1rem', borderRadius: '8px',
                                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                    color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.5rem'
                                }}>
                                    {submitError}
                                </div>
                            )}

                            {/* Buttons */}
                            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                                {isEditing && (
                                    <button
                                        onClick={handleCancelEdit}
                                        style={{
                                            flex: 1, height: '44px', fontSize: '0.9rem', fontWeight: 600,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            borderRadius: '8px', background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !!urlError || (!selectedFile && !repoLink)}
                                    style={{
                                        flex: isEditing ? 2 : 1, height: '44px', fontSize: '0.95rem', fontWeight: 600,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        borderRadius: '8px',
                                        background: (isSubmitting || !!urlError || (!selectedFile && !repoLink)) ? 'var(--bg-secondary)' : '#2563eb',
                                        border: 'none',
                                        color: (isSubmitting || !!urlError || (!selectedFile && !repoLink)) ? 'var(--text-muted)' : '#ffffff',
                                        cursor: (isSubmitting || !!urlError || (!selectedFile && !repoLink)) ? 'not-allowed' : 'pointer',
                                        opacity: (isSubmitting || !!urlError || (!selectedFile && !repoLink)) ? 0.6 : 1,
                                        transition: 'background 0.2s', fontFamily: 'inherit'
                                    }}
                                    onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#1d4ed8'; }}
                                    onMouseOut={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#2563eb'; }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line>
                                                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                                <line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line>
                                                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : isEditing ? 'Update Submission' : 'Submit Project'}
                                </button>
                            </div>
                        </div>

                        {/* ── Right column: upload ── */}
                        <div style={{ flex: 1, minWidth: '300px', padding: '28px', display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                Upload Deliverables
                            </h4>

                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept=".pdf,.zip,.doc,.docx" />

                            {/* Drop zone */}
                            <div
                                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                onClick={() => !selectedFile && fileInputRef.current?.click()}
                                style={{
                                    flex: 1, width: '100%', boxSizing: 'border-box',
                                    border: `1px dashed ${dragActive ? '#3b82f6' : 'var(--border-color)'}`,
                                    borderRadius: '10px',
                                    background: dragActive ? 'rgba(37,99,235,0.06)' : 'var(--bg-secondary)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', textAlign: 'center', padding: '24px',
                                    cursor: selectedFile ? 'default' : 'pointer',
                                    transition: 'border-color 0.2s, background 0.2s'
                                }}
                            >
                                {selectedFile ? (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                                        background: 'var(--bg-card)', padding: '14px', borderRadius: '10px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{
                                            width: '40px', height: '40px', flexShrink: 0,
                                            background: 'rgba(37,99,235,0.12)', borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                                <polyline points="13 2 13 9 20 9"></polyline>
                                            </svg>
                                        </div>
                                        <div style={{ textAlign: 'left', flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {selectedFile.name}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {formatFileSize(selectedFile.size)}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ color: '#3b82f6', marginBottom: '12px' }}>
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="17 8 12 3 7 8"></polyline>
                                                <line x1="12" y1="3" x2="12" y2="15"></line>
                                            </svg>
                                        </div>
                                        <p style={{ margin: '0 0 6px 0', fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
                                            Drag and drop files here
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#3b82f6' }}>
                                            or browse your computer
                                        </p>
                                        <p style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            Supported: PDF, ZIP, DOC (Max 50MB)
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Show previously uploaded file when editing */}
                            {isEditing && existingSubmission?.document && !selectedFile && (
                                <div style={{
                                    marginTop: '14px', padding: '10px 14px', borderRadius: '8px',
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Current file: <strong style={{ color: 'var(--text-secondary)' }}>{getDocumentName(existingSubmission.document)}</strong>
                                    </span>
                                </div>
                            )}
                        </div>

                        <style>{`
                            @keyframes spin {
                                from { transform: rotate(0deg); }
                                to   { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Submissions;
