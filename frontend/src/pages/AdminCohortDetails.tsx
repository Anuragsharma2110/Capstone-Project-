import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { Card } from '../components/ui';
import axiosInstance from '../api/axios';
import CohortMilestonePlanner from '../components/admin/CohortMilestonePlanner';
import CreateCohortModal from '../components/admin/CreateCohortModal';
import StatsCard from '../components/admin/StatsCard';
import CredentialsModal from '../components/admin/CredentialsModal';
import LearnerRoster from '../components/admin/LearnerRoster';

interface CohortDetail {
    id: number;
    name: string;
    description: string;
    student_count: number;
    team_count: number;
    status: string;
    start_date: string;
    end_date: string | null;
    institution_name: string;
    handbook_url: string | null;
    handbook_name: string | null;
    program_details?: {
        name: string;
    };
    professor_details?: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

const AdminCohortDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [cohort, setCohort] = useState<CohortDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // CSV Upload State
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{
        assigned_count: number;
        overwritten_count: number;
        failed_count: number;
        created_count: number;
        failed_emails: string[];
        credentials: Array<{ email: string; username: string; password: string }>;
        detail: string;
    } | null>(null);
    const [showCredentials, setShowCredentials] = useState(false);
    const [rosterKey, setRosterKey] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handbook State
    const [handbookFile, setHandbookFile] = useState<File | null>(null);
    const [handbookUploading, setHandbookUploading] = useState(false);
    const [handbookDeleting, setHandbookDeleting] = useState(false);
    const [handbookError, setHandbookError] = useState<string | null>(null);
    const [handbookSuccess, setHandbookSuccess] = useState<string | null>(null);
    const handbookInputRef = useRef<HTMLInputElement>(null);

    // Cleanup State
    const [clearing, setClearing] = useState(false);

    const fetchCohort = async () => {
        try {
            const res = await axiosInstance.get(`/cohorts/${id}/`);
            setCohort(res.data);
        } catch (err) {
            console.error('Failed to fetch cohort details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchCohort();
    }, [id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            const allowedExtensions = ['.csv', '.xlsx', '.xls'];
            const isAllowed = allowedExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
            
            if (!isAllowed) {
                setUploadError("Please select a valid .csv or Excel (.xlsx, .xls) file.");
                setFile(null);
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) {
                setUploadError("File is too large. Maximum size is 5MB.");
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setUploadError(null);
            setUploadResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !id) return;
        setUploading(true);
        setUploadError(null);
        setUploadResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axiosInstance.post(`/cohorts/${id}/upload_learners/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadResult(res.data);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            // Show credentials modal if new users were created
            if (res.data.credentials && res.data.credentials.length > 0) {
                setShowCredentials(true);
            }
            // Refresh cohort details and roster
            fetchCohort();
            setRosterKey(k => k + 1);
        } catch (err: any) {
            console.error('Upload failed:', err);
            setUploadError(err.response?.data?.detail || "An unexpected error occurred during upload.");
        } finally {
            setUploading(false);
        }
    };

    const handleClearLearners = async () => {
        const deleteAccounts = window.confirm("Are you sure you want to remove all learners from this cohort?\n\nClick 'OK' to proceed. You will be asked next if you want to delete their accounts entirely.");
        if (!deleteAccounts) return;

        const fullyDelete = window.confirm("Do you also want to DELETE the learner accounts from the system (unregister them)?\n\nNote: Only accounts that are NOT member of other cohorts will be deleted.");
        
        setClearing(true);
        try {
            const res = await axiosInstance.post(`/cohorts/${id}/clear_learners/`, {
                delete_accounts: fullyDelete
            });
            alert(res.data.detail);
            setUploadResult(null);
            fetchCohort();
        } catch (err: any) {
            console.error('Clear failed:', err);
            alert(err.response?.data?.detail || "Failed to clear learners.");
        } finally {
            setClearing(false);
        }
    };

    const handleHandbookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const f = e.target.files[0];
            const allowed = ['.pdf', '.doc', '.docx'];
            const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
            if (!allowed.includes(ext)) {
                setHandbookError('Only PDF, DOC, or DOCX files are allowed.');
                setHandbookFile(null);
                return;
            }
            setHandbookFile(f);
            setHandbookError(null);
            setHandbookSuccess(null);
        }
    };

    const handleHandbookUpload = async () => {
        if (!handbookFile || !id) return;
        setHandbookUploading(true);
        setHandbookError(null);
        setHandbookSuccess(null);
        const formData = new FormData();
        formData.append('file', handbookFile);
        try {
            const res = await axiosInstance.post(`/cohorts/${id}/upload_handbook/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setHandbookSuccess(res.data.detail);
            setHandbookFile(null);
            if (handbookInputRef.current) handbookInputRef.current.value = '';
            fetchCohort();
        } catch (err: any) {
            setHandbookError(err.response?.data?.detail || 'Upload failed.');
        } finally {
            setHandbookUploading(false);
        }
    };

    const handleHandbookDelete = async () => {
        if (!id || !window.confirm('Remove the current handbook? Learners will no longer be able to download it.')) return;
        setHandbookDeleting(true);
        setHandbookError(null);
        setHandbookSuccess(null);
        try {
            await axiosInstance.delete(`/cohorts/${id}/delete_handbook/`);
            setHandbookSuccess('Handbook removed successfully.');
            fetchCohort();
        } catch (err: any) {
            setHandbookError(err.response?.data?.detail || 'Delete failed.');
        } finally {
            setHandbookDeleting(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Cohort Details" breadcrumb={['Admin', 'Cohorts', 'Loading...']}>
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading cohort details...</div>
            </AdminLayout>
        );
    }

    if (!cohort) {
        return (
            <AdminLayout title="Cohort Not Found" breadcrumb={['Admin', 'Cohorts', 'Error']}>
                <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>Cohort not found or access denied.</div>
            </AdminLayout>
        );
    }

    const metrics = [
        {
            label: 'Total Students',
            value: cohort.student_count.toString(),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
        },
        {
            label: 'Total Teams',
            value: cohort.team_count.toString(),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                </svg>
            ),
        },
        {
            label: 'Start Date',
            value: new Date(cohort.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
        },
        {
            label: 'Professor',
            value: cohort.professor_details ? `${cohort.professor_details.first_name} ${cohort.professor_details.last_name}` : 'Unassigned',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
            ),
        },
    ];

    const { assigned_count, overwritten_count, failed_count, failed_emails, created_count, credentials } = uploadResult || {};

    return (
        <AdminLayout title={cohort.name} breadcrumb={['Admin', 'Cohorts', cohort.name]}>
            {/* Top Metrics Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
                {metrics.map((m, i) => (
                    <StatsCard key={i} {...m} />
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 420px', gap: '2rem', alignItems: 'stretch' }}>
                    {/* Left Column: Primary Information & Enrollment */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <Card style={{ padding: '2.5rem', border: '1px solid var(--border-color)', width: '100%', maxWidth: 'none' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', marginBottom: '0.75rem' }}>
                                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', lineHeight: 1.2 }}>{cohort.name}</h1>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                                        <button 
                                            onClick={() => setIsEditModalOpen(true)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '8px 16px',
                                                borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                                                color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                                                transition: 'all 0.2s', whiteSpace: 'nowrap'
                                            }}
                                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                            Edit Details
                                        </button>
                                        <span style={{
                                            padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
                                            background: cohort.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : cohort.status === 'ARCHIVED' ? 'rgba(107,114,128,0.1)' : 'rgba(245,158,11,0.1)',
                                            color: cohort.status === 'ACTIVE' ? '#059669' : cohort.status === 'ARCHIVED' ? '#4b5563' : '#d97706',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {cohort.status}
                                        </span>
                                    </div>
                                </div>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 500 }}>
                                    {cohort.program_details?.name || 'No Program'} · {cohort.institution_name}
                                </p>
                            </div>

                            {cohort.description && (
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</h3>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>
                                        {cohort.description}
                                    </p>
                                </div>
                            )}
                        </Card>

                        {/* Learner Enrollment */}
                        <Card style={{ padding: '1.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-card)', maxWidth: 'none', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
                                    </svg>
                                </div>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Enroll Learners</h2>
                            </div>

                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                                Import Learners from a CSV or excel file
                            </p>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <input
                                    type="file"
                                    accept=".csv, .xlsx, .xls"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    id="csv-upload"
                                />
                                <label htmlFor="csv-upload" style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    padding: '1.75rem 1rem', border: '2px dashed var(--border-color)', borderRadius: '12px',
                                    cursor: 'pointer', background: file ? 'rgba(37,99,235,0.03)' : 'var(--bg-main)',
                                    transition: 'all 0.2s', textAlign: 'center'
                                }}
                                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                                >
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem' }}>
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {file ? file.name : 'Choose File'}
                                    </span>
                                </label>
                            </div>

                            {uploadError && (
                                <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.8125rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                                    {uploadError}
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none',
                                    background: !file || uploading ? 'var(--bg-hover)' : 'var(--primary)',
                                    color: !file || uploading ? 'var(--text-muted)' : 'white', fontWeight: 600, fontSize: '0.9rem',
                                    cursor: !file || uploading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                {uploading ? 'Processing...' : 'Start Import'}
                            </button>
                        </Card>

                        {/* Import Results */}
                        {uploadResult && (
                            <Card style={{ padding: '1.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-card)', animation: 'fadeIn 0.3s ease-out' }}>
                                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Import Summary</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Created</span>
                                        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--primary)' }}>{created_count}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Assigned</span>
                                        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#10b981' }}>{assigned_count}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Failed</span>
                                        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#ef4444' }}>{failed_count}</span>
                                    </div>
                                </div>
                                {failed_count !== undefined && failed_count > 0 && failed_emails && (
                                    <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                                        <div style={{
                                            background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                                            borderRadius: '8px', padding: '0.75rem', maxHeight: '140px', overflowY: 'auto',
                                            fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace'
                                        }}>
                                            {failed_emails.map((email, idx) => (
                                                <div key={idx} style={{ padding: '4px 0', borderBottom: idx === failed_emails.length - 1 ? 'none' : '1px solid var(--border-color)' }}>{email}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Resources area */}
                        <Card style={{ padding: '1.5rem', border: '1px solid var(--border-color)', maxWidth: 'none', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2h11A2.5 2.5 0 0 1 20 4.5v15M4 19.5A2.5 2.5 0 0 0 6.5 22h11A2.5 2.5 0 0 0 20 19.5M4 19.5h16" />
                                    </svg>
                                </div>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Resources</h2>
                            </div>

                            {cohort.handbook_name ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.875rem', borderRadius: '10px',
                                    background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)',
                                    marginBottom: '1rem'
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {cohort.handbook_name}
                                    </span>
                                    <button onClick={handleHandbookDelete} disabled={handbookDeleting} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-main)', border: '1px dashed var(--border-color)', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                    No handbook uploaded
                                </div>
                            )}

                            <input ref={handbookInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleHandbookFileChange} />
                            <button 
                                onClick={() => handbookInputRef.current?.click()}
                                style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                {handbookFile ? 'File Selected' : 'Upload Handbook'}
                            </button>
                            
                            {handbookFile && (
                                <button onClick={handleHandbookUpload} disabled={handbookUploading} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '0.8125rem', border: 'none', cursor: 'pointer' }}>
                                    {handbookUploading ? 'Uploading...' : 'Confirm Upload'}
                                </button>
                            )}
                        </Card>
                    </div>

                    {/* Right Column: Milestone Planner (Aligned with left column) */}
                    <div>
                        <CohortMilestonePlanner cohortId={parseInt(id!)} style={{ height: '100%' }} />
                    </div>
                </div>

                {/* Bottom Section: Learner Roster - Full Width */}
                <div style={{ width: '100%' }}>
                    <LearnerRoster key={rosterKey} cohortId={parseInt(id!)} />
                </div>
            </div>           
            <CreateCohortModal 
                isOpen={isEditModalOpen}
                cohortId={cohort.id}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => {
                    setIsEditModalOpen(false);
                    fetchCohort();
                }}
            />
            {/* Credentials Modal */}
            {showCredentials && credentials && credentials.length > 0 && (
                <CredentialsModal
                    credentials={credentials}
                    onClose={() => setShowCredentials(false)}
                />
            )}
        </AdminLayout>
    );
};

export default AdminCohortDetails;
