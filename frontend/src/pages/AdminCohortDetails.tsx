import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { Card } from '../components/ui';
import axiosInstance from '../api/axios';

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
    const navigate = useNavigate();
    const [cohort, setCohort] = useState<CohortDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // CSV Upload State
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{
        assigned_count: number;
        overwritten_count: number;
        failed_count: number;
        failed_emails: string[];
        detail: string;
    } | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            if (!selectedFile.name.endsWith('.csv')) {
                setUploadError("Please select a valid .csv file.");
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
            // Refresh cohort details to update student_count
            fetchCohort();
        } catch (err: any) {
            console.error('Upload failed:', err);
            setUploadError(err.response?.data?.detail || "An unexpected error occurred during upload.");
        } finally {
            setUploading(false);
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

    const { assigned_count, overwritten_count, failed_count, failed_emails } = uploadResult || {};

    return (
        <AdminLayout title={cohort.name} breadcrumb={['Admin', 'Cohorts', cohort.name]}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
                {/* Main Content Area */}
                <div>
                    <Card style={{ padding: '2rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{cohort.name}</h1>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                    {cohort.program_details?.name || 'No Program'} · {cohort.institution_name}
                                </p>
                            </div>
                            <span style={{
                                padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
                                background: cohort.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : cohort.status === 'ARCHIVED' ? 'rgba(107,114,128,0.1)' : 'rgba(245,158,11,0.1)',
                                color: cohort.status === 'ACTIVE' ? '#059669' : cohort.status === 'ARCHIVED' ? '#4b5563' : '#d97706'
                            }}>
                                {cohort.status}
                            </span>
                        </div>

                        {cohort.description && (
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                                {cohort.description}
                            </p>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '12px' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Total Students</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{cohort.student_count}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Total Teams</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{cohort.team_count}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Start Date</div>
                                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>{new Date(cohort.start_date).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Professor</div>
                                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                                    {cohort.professor_details ? `${cohort.professor_details.first_name} ${cohort.professor_details.last_name}` : 'Unassigned'}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar / Upload Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card style={{ padding: '1.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Upload Learners</h2>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                            Upload a CSV file containing an <strong>email</strong> column to assign existing learners to this cohort. Duplicates in the file are ignored.
                        </p>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                id="csv-upload"
                            />
                            <label htmlFor="csv-upload" style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                padding: '2rem 1rem', border: '2px dashed var(--border-color)', borderRadius: '10px',
                                cursor: 'pointer', background: file ? 'rgba(37,99,235,0.03)' : 'var(--bg-main)',
                                transition: 'all 0.2s', textAlign: 'center'
                            }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem' }}>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                                </svg>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                    {file ? file.name : 'Select CSV File'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Max size: 5MB'}
                                </span>
                            </label>
                        </div>

                        {uploadError && (
                            <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                                ▲ {uploadError}
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none',
                                background: !file || uploading ? 'var(--text-muted)' : '#2563eb',
                                color: 'white', fontWeight: 600, fontSize: '0.9rem',
                                cursor: !file || uploading ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            {uploading ? (
                                <>
                                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    Uploading...
                                </>
                            ) : 'Upload Learners'}
                        </button>
                    </Card>

                    {/* Upload Results Summary */}
                    {uploadResult && (
                        <Card style={{ padding: '1.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Upload Results</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Successfully Assigned</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>{assigned_count}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Overwritten Cohorts</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>{overwritten_count}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Failed Assignments</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>{failed_count}</span>
                                </div>
                            </div>

                            {failed_count !== undefined && failed_count > 0 && failed_emails && (
                                <div style={{ marginTop: '1.25rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ef4444', marginBottom: '0.5rem' }}>Failed Emails (Not found / Not Learners):</div>
                                    <div style={{
                                        background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
                                        borderRadius: '6px', padding: '0.5rem 0.75rem', maxHeight: '120px', overflowY: 'auto',
                                        fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace'
                                    }}>
                                        {failed_emails.map((email, idx) => (
                                            <div key={idx} style={{ padding: '2px 0' }}>{email}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminCohortDetails;
