import React, { useState } from 'react';
import './LearnerDashboardUI.css';

interface Task {
    id: number;
    title: string;
    priority: 'Low' | 'Medium' | 'High';
    completed: boolean;
}

const LearnerDashboardUI: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([
        { id: 1, title: 'Integrate Auth0 backend', priority: 'High', completed: false },
        { id: 2, title: 'Update project docs', priority: 'Medium', completed: false },
        { id: 3, title: 'QA testing sprint #4', priority: 'Low', completed: false },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

    const handleToggleTask = (id: number) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: Date.now(),
            title: newTaskTitle,
            priority: newTaskPriority,
            completed: false
        };

        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
        setNewTaskPriority('Medium');
        setIsModalOpen(false);
    };

    return (
        <div className="learner-dashboard-container">
            {/* Header Section */}
            <div className="learner-header-section">
                <h1 className="learner-dashboard-title">Learner Dashboard</h1>
                <p className="learner-dashboard-subtitle">Manage your capstone project and team collaborations.</p>
            </div>

            <div className="learner-main-grid">
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Team Members Section */}
                    <section className="learner-section-card">
                        <div className="learner-section-header">
                            <h2 className="learner-section-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                Team Members
                            </h2>
                        </div>
                        <div className="team-members-grid">
                            <div className="team-member-card">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" className="member-avatar" alt="Sarah Chen" />
                                <div className="member-info">
                                    <span className="member-name">Sarah Chen</span>
                                    <span className="member-role">Project Lead</span>
                                </div>
                            </div>
                            <div className="team-member-card">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" className="member-avatar" alt="Marcus Thorne" />
                                <div className="member-info">
                                    <span className="member-name">Marcus Thorne</span>
                                    <span className="member-role">Dev Ops</span>
                                </div>
                            </div>
                            <div className="team-member-card">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elena" className="member-avatar" alt="Elena Rodriguez" />
                                <div className="member-info">
                                    <span className="member-name">Elena Rodriguez</span>
                                    <span className="member-role">UI/UX Design</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Submission Timeline Section */}
                    <section className="learner-section-card">
                        <div className="learner-section-header">
                            <h2 className="learner-section-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                                Submission Timeline
                            </h2>
                        </div>
                        <div className="timeline-container">
                            <div className="timeline-item">
                                <div className="timeline-icon completed">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <div className="timeline-content">
                                    <div className="timeline-details">
                                        <span className="timeline-title">Final Proposal Submitted</span>
                                        <span className="timeline-date">Completed on Oct 12, 2023</span>
                                    </div>
                                    <span className="badge badge-approved">Approved</span>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <div className="timeline-icon completed">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <div className="timeline-content">
                                    <div className="timeline-details">
                                        <span className="timeline-title">Mid-term Progress Report</span>
                                        <span className="timeline-date">Completed on Dec 04, 2023</span>
                                    </div>
                                    <span className="badge badge-approved">Approved</span>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <div className="timeline-icon pending">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                                    </svg>
                                </div>
                                <div className="timeline-content">
                                    <div className="timeline-details">
                                        <span className="timeline-title">Final Prototype Upload</span>
                                        <span className="timeline-date">Deadline: Jan 20, 2024</span>
                                    </div>
                                    <span className="badge badge-progress">In Progress</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Pending Tasks Section */}
                    <section className="learner-section-card">
                        <div className="learner-section-header">
                            <h2 className="learner-section-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                Pending Tasks
                            </h2>
                        </div>
                        <div className="tasks-list">
                            {tasks.map(task => (
                                <div
                                    key={task.id}
                                    className={`task-item ${task.completed ? 'completed' : ''}`}
                                    onClick={() => handleToggleTask(task.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={`task-checkbox ${task.completed ? 'completed' : ''}`}>
                                        {task.completed && (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="task-info">
                                        <span className={`task-title ${task.completed ? 'completed' : ''}`}>{task.title}</span>
                                        <span className="task-priority">Priority: {task.priority}</span>
                                    </div>
                                </div>
                            ))}
                            <button
                                className="add-task-link"
                                onClick={() => setIsModalOpen(true)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add Task
                            </button>
                        </div>
                    </section>
                </div>
            </div>

            {/* Add Task Modal */}
            {isModalOpen && (
                <div className="task-modal-overlay">
                    <div className="task-modal-content">
                        <div className="task-modal-header">
                            <h3>Add New Task</h3>
                            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddTask} className="task-modal-form">
                            <div className="form-group">
                                <label>Task Activity</label>
                                <input
                                    type="text"
                                    placeholder="What needs to be done?"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Priority Level</label>
                                <select
                                    value={newTaskPriority}
                                    onChange={(e) => setNewTaskPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div className="task-modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="submit-btn" disabled={!newTaskTitle.trim()}>Add Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearnerDashboardUI;
