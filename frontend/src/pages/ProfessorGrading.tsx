import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, Button, Input } from '../components/ui';

interface Submission {
    id: number;
    team_details: {
        name: string;
    };
    task_details: {
        title: string;
    };
    file_url: string;
    submitted_at: string;
}

const ProfessorGrading: React.FC = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [evaluation, setEvaluation] = useState({ score: 0, feedback: '' });
    const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const response = await api.get('/submissions/');
                setSubmissions(response.data);
            } catch (error) {
                console.error("Failed to fetch submissions", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, []);

    const handleSubmitEvaluation = async (submissionId: number) => {
        try {
            await api.post('/evaluations/', { submission: submissionId, ...evaluation });
            alert("Evaluation submitted successfully!");
            setSelectedSubmission(null);
            setEvaluation({ score: 0, feedback: '' });
        } catch (error) {
            console.error("Failed to submit evaluation", error);
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading submissions...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Professor Grading</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Review submissions and provide scores and feedback for capstone teams.</p>
            </header>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {submissions.length === 0 ? (
                    <Card>
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No submissions to grade.</p>
                    </Card>
                ) : (
                    submissions.map(submission => (
                        <Card key={submission.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{submission.task_details.title}</h3>
                                    <p style={{ color: 'var(--primary-blue)', fontWeight: '600', fontSize: '0.85rem' }}>Team: {submission.team_details.name}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submitted at:</div>
                                    <div style={{ fontSize: '0.85rem' }}>{new Date(submission.submitted_at).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                <a
                                    href={submission.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--primary-blue)', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    📄 View Submission
                                </a>
                                <Button onClick={() => setSelectedSubmission(submission.id)}>Grade Submission</Button>
                            </div>

                            {selectedSubmission === submission.id && (
                                <div style={{ marginTop: '2rem', padding: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                    <h4 style={{ marginBottom: '1.5rem' }}>New Evaluation</h4>
                                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Score (0-100)</label>
                                            <Input
                                                type="number"
                                                value={evaluation.score}
                                                onChange={e => setEvaluation({ ...evaluation, score: parseInt(e.target.value) })}
                                                max={100}
                                                min={0}
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Feedback</label>
                                            <textarea
                                                style={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    padding: '1rem',
                                                    color: 'white',
                                                    minHeight: '100px',
                                                    outline: 'none'
                                                }}
                                                value={evaluation.feedback}
                                                onChange={e => setEvaluation({ ...evaluation, feedback: e.target.value })}
                                                placeholder="Provide constructive feedback..."
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <Button onClick={() => handleSubmitEvaluation(submission.id)}>Save Grade</Button>
                                            <Button variant="outline" onClick={() => setSelectedSubmission(null)}>Cancel</Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProfessorGrading;
