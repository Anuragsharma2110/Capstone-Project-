import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import axiosInstance from '../api/axios';

const CapstoneGuidelines: React.FC = () => {
    const [cohortId, setCohortId] = useState<number | null>(null);
    const [handbookName, setHandbookName] = useState<string | null>(null);
    const [loadingCohort, setLoadingCohort] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchCohort = async () => {
            try {
                const res = await axiosInstance.get('/cohorts/');
                if (res.data && res.data.length > 0) {
                    const cohort = res.data[0];
                    setCohortId(cohort.id);
                    setHandbookName(cohort.handbook_name || null);
                }
            } catch (err) {
                console.error('Failed to fetch cohort info', err);
            } finally {
                setLoadingCohort(false);
            }
        };
        fetchCohort();
    }, []);

    const handleDownload = async () => {
        if (!cohortId) return;
        setDownloading(true);
        try {
            const res = await axiosInstance.get(`/cohorts/${cohortId}/download_handbook/`, {
                responseType: 'blob',
            });
            // Extract filename from Content-Disposition header if available
            const disposition = res.headers['content-disposition'];
            let filename = handbookName || 'Capstone_Handbook';
            if (disposition) {
                const match = disposition.match(/filename="?([^";\n]+)"?/);
                if (match) filename = match[1];
            }
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            const e = err as { response?: { status?: number } };
            const msg = e.response?.status === 404
                ? 'No handbook has been uploaded for your cohort yet.'
                : 'Download failed. Please try again.';
            alert(msg);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <AdminLayout title="Capstone Guidelines" breadcrumb={['Dashboard', 'Capstone Guidelines']}>
            <div style={{ maxWidth: '840px', margin: '0 auto', paddingTop: '1rem' }}>
                <header style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        Project Guidelines &amp; Handbooks
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        Access all the required details, formatting rules, and evaluation criteria regarding your capstone project.
                    </p>
                </header>

                <div
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '2.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2.5rem',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    className="guideline-card"
                >
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, bottom: 0,
                        width: '4px',
                        background: 'var(--primary)'
                    }} />

                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '16px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        flexShrink: 0
                    }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2h11A2.5 2.5 0 0 1 20 4.5v15M4 19.5A2.5 2.5 0 0 0 6.5 22h11A2.5 2.5 0 0 0 20 19.5M4 19.5h16" />
                        </svg>
                    </div>

                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                            Official Capstone Handbook
                        </h2>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.75rem' }}>
                            This comprehensive guide outlines the project expectations, timeline requirements,
                            coding standards, and final delivery presentation details. You are required to read
                            this document entirely before beginning your implementation.
                        </p>

                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                            {loadingCohort ? (
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading handbook info...</span>
                            ) : handbookName ? (
                                <>
                                    <button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                            padding: '0.75rem 1.5rem',
                                            background: downloading ? 'rgba(59,130,246,0.6)' : 'var(--primary)',
                                            color: 'white', borderRadius: '8px', fontSize: '0.9rem',
                                            fontWeight: 600, border: 'none',
                                            cursor: downloading ? 'not-allowed' : 'pointer',
                                            transition: 'filter 0.2s'
                                        }}
                                        onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        {downloading ? 'Downloading...' : 'Download Complete PDF'}
                                    </button>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{handbookName}</span>
                                </>
                            ) : (
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    background: 'rgba(107,114,128,0.08)',
                                    color: 'var(--text-muted)', borderRadius: '8px',
                                    fontSize: '0.9rem', fontWeight: 500,
                                    border: '1px dashed rgba(107,114,128,0.3)'
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    No handbook uploaded by your programme administrator yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default CapstoneGuidelines;
