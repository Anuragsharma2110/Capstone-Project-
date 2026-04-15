import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import axiosInstance from '../api/axios';

/* ── Shared card style — uses CSS variables ──────────────── */
const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '24px 28px',
    marginBottom: '16px',
};

/* ── Component ───────────────────────────────────────────── */
const Feedback: React.FC = () => {
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const res = await axiosInstance.get('/evaluations/');
                setEvaluations(res.data);
            } catch (err) {
                console.error("Failed to fetch evaluations", err);
                setError("Unable to load feedback at this time.");
            } finally {
                setLoading(false);
            }
        };
        fetchFeedback();
    }, []);

    if (loading) {
        return (
            <AdminLayout title="Project Feedback" breadcrumb={['Dashboard', 'Faculty Evaluations']}>
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading feedback...</div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout title="Project Feedback" breadcrumb={['Dashboard', 'Faculty Evaluations']}>
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>
            </AdminLayout>
        );
    }

    if (evaluations.length === 0) {
        return (
            <AdminLayout title="Project Feedback" breadcrumb={['Dashboard', 'Faculty Evaluations']}>
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Your team does not have any evaluations available yet.
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Project Feedback" breadcrumb={['Dashboard', 'Faculty Evaluations']}>
            <div style={{ width: '100%', padding: '32px 40px', boxSizing: 'border-box' }}>

                {/* Page header */}
                <header style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                        Project Feedback
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                        Review evaluations and comments from your project faculty.
                    </p>
                </header>

                <div style={{ maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {evaluations.map((evaluation, index) => {
                        const prof = evaluation.evaluator_details;
                        const sub = evaluation.submission_details;
                        
                        return (
                            <div key={evaluation.id} style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '2rem', borderBottom: index < evaluations.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                {/* ── Section 1: Score Breakdown ─────────────────────── */}
                                <div style={cardStyle}>
                                    {/* Professor header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '50%',
                                                background: 'rgba(37,99,235,0.15)', color: '#60a5fa',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
                                            }}>
                                                {prof && prof.first_name ? `${prof.first_name[0]}${prof.last_name[0]}` : '👤'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                                                    {prof ? `Prof. ${prof.first_name} ${prof.last_name}` : 'Unknown Faculty'}
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1px' }}>Project Faculty</div>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Evaluated: {new Date(evaluation.evaluated_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Team badge */}
                                    {sub && sub.team_details && (
                                        <div style={{ marginBottom: '20px' }}>
                                            <span style={{
                                                display: 'inline-block', fontSize: '0.78rem', fontWeight: 600,
                                                color: '#60a5fa', background: 'rgba(37,99,235,0.1)',
                                                border: '1px solid rgba(37,99,235,0.2)', borderRadius: '6px',
                                                padding: '3px 10px',
                                            }}>
                                                {sub.team_details.name} · {sub.team_details.cohort_details?.name || 'Cohort'}
                                            </span>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ fontSize: '0.865rem', color: 'var(--text-secondary)', flexShrink: 0, width: '100px' }}>
                                            Final Grade
                                        </span>
                                        <div style={{ flex: 1, height: '8px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${Math.min(Math.max((Number(evaluation.score) || 0), 0), 100)}%`,
                                                height: '100%', background: '#2563eb', borderRadius: '99px',
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', width: '60px', textAlign: 'right', flexShrink: 0 }}>
                                            {evaluation.score} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)'}}>/ 100</span>
                                        </span>
                                    </div>
                                </div>

                                {/* ── Section 2: Faculty Feedback ────────────────────── */}
                                <div style={cardStyle}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 20px 0' }}>
                                        Faculty Feedback
                                    </h3>

                                    <div style={{
                                        borderLeft: '3px solid var(--primary)', background: 'rgba(67, 56, 202, 0.05)',
                                        borderRadius: '0 8px 8px 0', padding: '20px',
                                        color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6',
                                        whiteSpace: 'pre-line' /* preserves formatting from Professor input */
                                    }}>
                                        {evaluation.feedback || 'No written feedback was provided.'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                </div>
            </div>
        </AdminLayout>
    );
};

export default Feedback;
