import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import axiosInstance from '../api/axios';
import './AdminTaskCreation.css';

interface Cohort {
    id: number;
    name: string;
}

interface Task {
    id: number;
    title: string;
    description: string;
    cohort: number;
    cohort_name?: string;
    deadline: string;
    deliverables?: string;
}

const PRESET_TASKS = [
    {
        title: 'Final Proposal Submitted',
        description: 'Teams submit the final project proposal outlining the problem statement, solution approach, technology stack, and team responsibilities. This document forms the foundation for the capstone project.',
        deliverables: 'A PDF/Google Doc containing: Project title, Problem statement, Proposed solution, Methodology, Tech stack overview, Timeline, Team member roles.',
    },
    {
        title: 'Mid-term Progress Report',
        description: 'Teams present their progress midway through the program. This includes an overview of what has been built, challenges encountered, and updated plans for the remaining duration.',
        deliverables: 'A progress report (PDF/Slides) + live demo or video recording of the current prototype state.',
    },
    {
        title: 'Final Project Upload',
        description: 'Teams submit the final, fully functional capstone project. This is the culmination of all development work, complete with documentation, source code, and a final presentation.',
        deliverables: 'GitHub repository link, Deployed project link (if applicable), Final presentation slides, Project documentation (README), Demo video.',
    },
];

const AdminTaskCreation: React.FC = () => {
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedCohort, setSelectedCohort] = useState('');
    const [form, setForm] = useState({ title: '', description: '', deliverables: '', deadline: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cohortsRes, tasksRes] = await Promise.all([
                    axiosInstance.get('/cohorts/'),
                    axiosInstance.get('/tasks/'),
                ]);
                setCohorts(cohortsRes.data);
                setTasks(tasksRes.data);
            } catch (err) {
                console.error('Failed to fetch data', err);
            }
        };
        fetchData();
    }, []);

    const handlePreset = (preset: typeof PRESET_TASKS[0]) => {
        setForm({ ...form, title: preset.title, description: preset.description, deliverables: preset.deliverables });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCohort) { setError('Please select a cohort.'); return; }
        if (!form.title || !form.deadline) { setError('Title and deadline are required.'); return; }

        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                title: form.title,
                description: `${form.description}\n\n**Deliverables:**\n${form.deliverables}`,
                cohort: parseInt(selectedCohort),
                deadline: new Date(form.deadline).toISOString(),
            };
            const res = await axiosInstance.post('/tasks/', payload);
            setTasks(prev => [res.data, ...prev]);
            setSuccess(`✓ Task "${form.title}" created for cohort successfully! All learner teams can now see it.`);
            setForm({ title: '', description: '', deliverables: '', deadline: '' });
            setIsCreating(false);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: Record<string, unknown> } };
            const errData = axiosErr.response?.data;
            setError(errData ? Object.values(errData).join(' | ') : 'Failed to create task.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (taskId: number) => {
        if (!window.confirm('Delete this task? All team submissions for this task will also be removed.')) return;
        try {
            await axiosInstance.delete(`/tasks/${taskId}/`);
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (err) {
            console.error('Failed to delete task', err);
        }
    };

    return (
        <AdminLayout title="Task Creation" breadcrumb={['Admin', 'Task Creation']}>
            <div className="atc-container">
                {/* Header */}
                <div className="atc-header">
                    <div>
                        <h1 className="atc-title">Task Creation</h1>
                        <p className="atc-subtitle">Design and assign project deliverables to cohort teams. Tasks are automatically visible to all learner teams in the selected cohort.</p>
                    </div>
                    <button className="atc-create-btn" onClick={() => { setIsCreating(true); setError(''); setSuccess(''); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Create New Task
                    </button>
                </div>

                {success && <div className="atc-alert atc-alert-success">{success}</div>}
                {error && <div className="atc-alert atc-alert-error">{error}</div>}

                {/* Create Task Form */}
                {isCreating && (
                    <div className="atc-form-card">
                        <div className="atc-form-header">
                            <h2>Create New Task</h2>
                            <button className="atc-close-btn" onClick={() => setIsCreating(false)}>✕</button>
                        </div>

                        {/* Preset Quick-Fill */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p className="atc-form-label" style={{ marginBottom: '0.75rem' }}>Quick-fill with Preset Task:</p>
                            <div className="atc-preset-row">
                                {PRESET_TASKS.map(p => (
                                    <button
                                        key={p.title}
                                        className="atc-preset-btn"
                                        type="button"
                                        onClick={() => handlePreset(p)}
                                    >
                                        {p.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="atc-form">
                            <div className="atc-form-grid">
                                <div className="atc-field">
                                    <label className="atc-form-label">Task Title *</label>
                                    <input className="atc-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Final Proposal Submitted" required />
                                </div>
                                <div className="atc-field">
                                    <label className="atc-form-label">Assign to Cohort *</label>
                                    <select className="atc-input" value={selectedCohort} onChange={e => setSelectedCohort(e.target.value)} required>
                                        <option value="">-- Select Cohort --</option>
                                        {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="atc-field">
                                <label className="atc-form-label">Description</label>
                                <textarea className="atc-input atc-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe what this task requires from teams..." rows={4} />
                            </div>

                            <div className="atc-field">
                                <label className="atc-form-label">Deliverables</label>
                                <textarea className="atc-input atc-textarea" value={form.deliverables} onChange={e => setForm({ ...form, deliverables: e.target.value })} placeholder="List what teams need to submit (e.g. GitHub repo, PDF report, demo video)..." rows={3} />
                            </div>

                            <div className="atc-field" style={{ maxWidth: '280px' }}>
                                <label className="atc-form-label">Deadline *</label>
                                <input className="atc-input" type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
                            </div>

                            <div className="atc-form-actions">
                                <button type="submit" className="atc-submit-btn" disabled={loading}>
                                    {loading ? 'Creating...' : '✓ Create Task for All Teams'}
                                </button>
                                <button type="button" className="atc-cancel-btn" onClick={() => setIsCreating(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Timeline Preview */}
                <div className="atc-timeline-section">
                    <h2 className="atc-section-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        All Cohort Tasks ({tasks.length})
                    </h2>

                    {tasks.length === 0 ? (
                        <div className="atc-empty">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                            </svg>
                            <p>No tasks created yet. Click "Create New Task" to get started.</p>
                        </div>
                    ) : (
                        <div className="atc-tasks-list">
                            {tasks.map((task, idx) => {
                                const isPast = new Date(task.deadline) < new Date();
                                return (
                                    <div key={task.id} className="atc-task-item">
                                        <div className="atc-timeline-col">
                                            <div className={`atc-timeline-dot ${isPast ? 'atc-dot-done' : 'atc-dot-pending'}`}>
                                                {isPast ? (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>···</span>
                                                )}
                                            </div>
                                            {idx < tasks.length - 1 && <div className="atc-timeline-line" />}
                                        </div>
                                        <div className="atc-task-content">
                                            <div className="atc-task-header">
                                                <div>
                                                    <h3 className="atc-task-title">{task.title}</h3>
                                                    <p className="atc-task-deadline">
                                                        {isPast ? 'Completed on' : 'Deadline:'} {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <button className="atc-delete-btn" onClick={() => handleDelete(task.id)} title="Delete task">
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                            {task.description && (
                                                <p className="atc-task-desc">{task.description.split('\n\n**Deliverables:**')[0]}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminTaskCreation;
