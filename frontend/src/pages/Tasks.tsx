import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Button, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../layouts/AdminLayout';

interface Task {
    id: number;
    title: string;
    description: string;
    deadline: string;
}

interface Submission {
    task: number;
    file_url: string;
}

const Tasks: React.FC = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [selectedTask, setSelectedTask] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tasksRes, subsRes] = await Promise.all([
                    api.get('/tasks/'),
                    api.get('/submissions/'),
                ]);
                setTasks(tasksRes.data);
                setSubmissions(subsRes.data);
            } catch (error) {
                console.error('Failed to fetch tasks', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const isSubmitted = (taskId: number) => submissions.some(s => s.task === taskId);

    const handleSubmission = async (taskId: number) => {
        if (!(user as { team_id?: number })?.team_id) {
            alert('No team assigned. Please contact your administrator.');
            return;
        }
        try {
            await api.post('/submissions/', {
                task: taskId,
                team: (user as { team_id?: number }).team_id,
                file_url: submissionUrl
            });
            setSubmissions(prev => [...prev, { task: taskId, file_url: submissionUrl }]);
            setSelectedTask(null);
            setSubmissionUrl('');
        } catch (error) {
            console.error('Submission failed', error);
        }
    };

    if (loading) return (
        <AdminLayout title="My Tasks" breadcrumb={['Dashboard', 'My Tasks']}>
            <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading tasks...</div>
        </AdminLayout>
    );

    return (
        <AdminLayout title="My Tasks" breadcrumb={['Dashboard', 'My Tasks']}>
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                <header style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        Project Milestones
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Track your team's capstone deliverables and submit work below.
                    </p>
                </header>

                {tasks.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '4rem 2rem',
                        background: 'var(--bg-card)', borderRadius: '16px',
                        border: '1px solid var(--border-color)', color: 'var(--text-muted)'
                    }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', display: 'block' }}>
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        </svg>
                        <p>No tasks assigned to your cohort yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {tasks.map((task, idx) => {
                            const done = isSubmitted(task.id);
                            const isPast = new Date(task.deadline) < new Date();
                            const status = done ? 'done' : isPast ? 'pending' : 'upcoming';
                            const isLast = idx === tasks.length - 1;

                            // Split description from deliverables
                            const parts = task.description.split('\n\n**Deliverables:**\n');
                            const mainDesc = parts[0];
                            const deliverables = parts[1];

                            return (
                                <div key={task.id} style={{ display: 'flex', gap: '1.25rem', position: 'relative' }}>
                                    {/* Timeline */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px', flexShrink: 0 }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: status === 'done' ? 'var(--primary, #3b82f6)' : 'var(--bg-card)',
                                            border: status === 'done' ? 'none' : '2px solid var(--border-color)',
                                            zIndex: 1, flexShrink: 0,
                                        }}>
                                            {status === 'done' ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '14px', letterSpacing: '-1px' }}>···</span>
                                            )}
                                        </div>
                                        {!isLast && (
                                            <div style={{ width: '2px', flex: '1', minHeight: '40px', background: 'var(--border-color)', margin: '4px 0' }} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, paddingBottom: isLast ? '0' : '2rem' }}>
                                        <div style={{
                                            background: 'var(--bg-card)',
                                            border: `1px solid ${status === 'done' ? 'rgba(59,130,246,0.25)' : 'var(--border-color)'}`,
                                            borderRadius: '14px',
                                            padding: '1.5rem',
                                            transition: 'box-shadow 0.2s',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                                                        {task.title}
                                                    </h3>
                                                    <p style={{ fontSize: '0.8rem', color: status === 'done' ? '#10b981' : 'var(--text-muted)' }}>
                                                        {status === 'done'
                                                            ? `✓ Submitted`
                                                            : `Deadline: ${new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`}
                                                    </p>
                                                </div>
                                                <span style={{
                                                    padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                                    background: status === 'done' ? 'rgba(16,185,129,0.12)' : isPast ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                                                    color: status === 'done' ? '#10b981' : isPast ? '#ef4444' : 'var(--primary, #3b82f6)',
                                                }}>
                                                    {status === 'done' ? 'Completed' : isPast ? 'Overdue' : 'Pending'}
                                                </span>
                                            </div>

                                            {mainDesc && (
                                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                                                    {mainDesc}
                                                </p>
                                            )}

                                            {deliverables && (
                                                <div style={{ background: 'var(--bg-main)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                                                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Deliverables</p>
                                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                                                        {deliverables}
                                                    </p>
                                                </div>
                                            )}

                                            {!done && (
                                                <Button onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}>
                                                    {selectedTask === task.id ? 'Cancel' : 'Submit Work'}
                                                </Button>
                                            )}

                                            {selectedTask === task.id && (
                                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                                                        Resource Link (GitHub, Google Drive, etc.)
                                                    </label>
                                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                        <Input
                                                            value={submissionUrl}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubmissionUrl(e.target.value)}
                                                            placeholder="https://github.com/..."
                                                        />
                                                        <Button onClick={() => handleSubmission(task.id)}>Submit</Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Tasks;
