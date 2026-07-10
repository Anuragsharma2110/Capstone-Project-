import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { Button } from '../components/ui';
import axiosInstance from '../api/axios';

const ProfessorSubmissionReview: React.FC = () => {
    const { teamId } = useParams<{ teamId: string }>();
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState('');
    const [grade, setGrade] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [teamDetails, setTeamDetails] = useState<any>(null);
    const [submissionDetails, setSubmissionDetails] = useState<any>(null);
    const [submissionHistory, setSubmissionHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const teamRes = await axiosInstance.get(`/teams/${teamId}`);
                setTeamDetails(teamRes.data);
                
                const subRes = await axiosInstance.get(`/submissions/?team=${teamId}`);
                if (subRes.data && subRes.data.length > 0) {
                    const sortedSubs = subRes.data.sort((a: any, b: any) => 
                        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
                    );
                    setSubmissionHistory(sortedSubs);
                    setSubmissionDetails(sortedSubs[0]);

                    // Fetch existing evaluation for the latest submission
                    if (sortedSubs[0].has_evaluations) {
                        try {
                            const evalRes = await axiosInstance.get(`/evaluations/?submission=${sortedSubs[0].id}`);
                            if (evalRes.data && evalRes.data.length > 0) {
                                const existingEval = evalRes.data[0];
                                // Extract grade from feedback if it was embedded
                                const feedbackText = existingEval.feedback || '';
                                const gradeMatch = feedbackText.match(/^Grade:\s*(.+?)(?:\n\n|$)/);
                                if (gradeMatch) {
                                    setGrade(gradeMatch[1].trim());
                                    setFeedback(feedbackText.replace(/^Grade:\s*.+?\n\n/, '').trim());
                                } else {
                                    setGrade(String(existingEval.score));
                                    setFeedback(feedbackText);
                                }
                            }
                        } catch (evalErr) {
                            console.error("Error fetching evaluation", evalErr);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [teamId]);

    const handleSaveReview = async () => {
        if (!submissionDetails) {
            setSaveError('No submission to evaluate.');
            return;
        }
        if (!grade.trim()) {
            setSaveError('Please enter a grade or score.');
            return;
        }

        setSaving(true);
        setSaveError('');

        try {
            // Parse numeric score from grade input (extract first number found)
            const numericMatch = grade.match(/\d+/);
            const score = numericMatch ? parseInt(numericMatch[0], 10) : 0;

            // Include the original grade text in the feedback for full context
            const fullFeedback = score === 0 || grade !== String(score)
                ? `Grade: ${grade.trim()}\n\n${feedback}`.trim()
                : feedback;

            await axiosInstance.post('/evaluations/', {
                submission: submissionDetails.id,
                score: score || 1, // PositiveIntegerField requires >= 1
                feedback: fullFeedback,
            });

            navigate('/professor/submissions');
        } catch (err: any) {
            console.error('Error saving evaluation', err);
            setSaveError(err.response?.data?.detail || 'Failed to save evaluation. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AdminLayout title="Loading..." breadcrumb={[]}><div>Loading...</div></AdminLayout>;

    return (
        <AdminLayout title={`Review: ${teamDetails?.name || teamId}`} breadcrumb={['Dashboard', 'Submissions', teamDetails?.name || 'Review']}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', gap: '2rem' }}>

                {/* Left Side: Document Preview Placeholder */}
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Reviewing: {teamDetails?.name}</h2>
                            {submissionHistory.length > 0 && (
                                <p style={{margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500}}>
                                    Version {submissionHistory.length} (Latest)
                                </p>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Team Info Card */}
                        <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontWeight: 600 }}>Cohort: <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{teamDetails?.cohort_details?.name || '---'}</span></p>
                            <p style={{ margin: '0', color: 'var(--text-main)', fontWeight: 600 }}>Members: <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{teamDetails?.members?.length || 0} Learners</span></p>
                        </div>

                        {/* Submitted File Card */}
                        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                                Uploaded Document
                            </h3>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                            <polyline points="13 2 13 9 20 9"></polyline>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{submissionDetails?.file_name || 'Project_Final_Report.pdf'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Submitted {submissionDetails ? new Date(submissionDetails.submitted_at).toLocaleDateString() : 'N/A'}</div>
                                    </div>
                                </div>

                                <a href={submissionDetails?.file_url} target="_blank" rel="noopener noreferrer" style={{
                                    background: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    textDecoration: 'none',
                                    transition: 'background 0.2s'
                                }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    Download
                                </a>
                            </div>

                            {submissionDetails?.file_url && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <a href={submissionDetails.file_url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--primary-blue)', fontSize: '0.95rem', textDecoration: 'underline' }}>
                                            {submissionDetails.file_url}
                                        </a>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>GitHub Repository</div>
                                    </div>
                                </div>

                                <a href={submissionDetails.file_url} target="_blank" rel="noopener noreferrer" style={{
                                    background: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    textDecoration: 'none',
                                    transition: 'background 0.2s'
                                }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                    Open Link
                                </a>
                            </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Right Side: Review/Feedback Panel */}
                <div style={{ flex: 1 }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        position: 'sticky',
                        top: '2rem'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', marginTop: 0 }}>Evaluation</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
                            Provide feedback and grading.
                        </p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Grade / Score</label>
                            <input
                                type="text"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                placeholder="e.g. A, 95/100, Pass"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-main)',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Feedback Notes</label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Enter detailed feedback here..."
                                rows={8}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-main)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {saveError && (
                            <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                                {saveError}
                            </div>
                        )}

                        <Button
                            onClick={handleSaveReview}
                            disabled={saving}
                            style={{ width: '100%', padding: '1rem', opacity: saving ? 0.6 : 1 }}
                        >
                            {saving ? 'Saving...' : 'Save & Complete Review'}
                        </Button>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
};

export default ProfessorSubmissionReview;
