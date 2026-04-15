import React, { useState, useEffect, useRef } from 'react';
import './LearnerDashboardUI.css';
import axiosInstance from '../../api/axios';
import Avatar from '../ui/Avatar';
import type { Milestone, ProcessedMilestone } from '../../core/milestoneUtils';
import { processMilestones } from '../../core/milestoneUtils';

interface Task {
    id: number;
    title: string;
    completed: boolean;
}

interface TeamMember {
    name: string;
    email: string;
    seed: string;
}

const LearnerDashboardUI: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [milestones, setMilestones] = useState<ProcessedMilestone[]>([]);
    const [loadingMilestones, setLoadingMilestones] = useState(true);

    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [teamName, setTeamName] = useState<string>('');
    const [loadingMembers, setLoadingMembers] = useState(true);

    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
    const [activePopover, setActivePopover] = useState<string | null>(null); // email of active popover
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const popoverContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let isFinalSubmitted = false;

                // Fetch team members and final submission state
                const teamRes = await axiosInstance.get('/teams/');
                if (teamRes.data && teamRes.data.length > 0) {
                    const team = teamRes.data[0];
                    setTeamName(team.name);
                    isFinalSubmitted = team.is_final_submitted || false;
                    const membersList = team.members.map((m: any) => ({
                        name: `${m.user_details.first_name} ${m.user_details.last_name}`.trim() || m.user_details.username,
                        email: m.user_details.email,
                        seed: m.user_details.first_name || m.user_details.username
                    }));
                    setTeamMembers(membersList);
                }

                // Fetch milestones
                const cohortsRes = await axiosInstance.get('/cohorts/');
                if (cohortsRes.data && cohortsRes.data.length > 0) {
                    const cohortId = cohortsRes.data[0].id;
                    const res = await axiosInstance.get(`/cohort-milestones/?cohort=${cohortId}`);
                    const rawMilestones: Milestone[] = res.data;
                    const processed = processMilestones(rawMilestones, isFinalSubmitted);
                    setMilestones(processed);
                }
            } catch (err) {
                console.error('Failed to load data', err);
            } finally {
                setLoadingMilestones(false);
                setLoadingMembers(false);
            }
        };

        fetchData();
    }, []);

    // Close popover when clicking outside — deferred so the opening click doesn't immediately close it
    useEffect(() => {
        if (!activePopover) return;
        let listener: (e: MouseEvent) => void;
        const timer = setTimeout(() => {
            listener = (e: MouseEvent) => {
                if (
                    popoverContainerRef.current &&
                    !popoverContainerRef.current.contains(e.target as Node)
                ) {
                    setActivePopover(null);
                    setCopiedEmail(null);
                }
            };
            document.addEventListener('mousedown', listener);
        }, 0);
        return () => {
            clearTimeout(timer);
            if (listener) document.removeEventListener('mousedown', listener);
        };
    }, [activePopover]);

    const handleCopy = (email: string) => {
        navigator.clipboard.writeText(email).then(() => {
            setCopiedEmail(email);
            setTimeout(() => setCopiedEmail(null), 2000);
        });
    };

    const handleToggleTask = (id: number) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    const handleDeleteTask = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks(tasks.filter(task => task.id !== id));
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        setTasks([...tasks, { id: Date.now(), title: newTaskTitle, completed: false }]);
        setNewTaskTitle('');
        setIsModalOpen(false);
    };

    return (
        <div className="learner-dashboard-container">

            {/* Header */}
            <div className="learner-header-section">
                <h1 className="learner-dashboard-title">Learner Dashboard</h1>
                <p className="learner-dashboard-subtitle">Manage your capstone project and team collaborations.</p>
            </div>

            {/* ── Outer grid: left column (1fr) + Task Planner (272px) ── */}
            <div className="learner-main-grid">

                {/* Left column: Team Members (auto) + Project Submission (flex:1) */}
                <div className="learner-left-col">

                    {/* Team Members — natural height */}
                    <section className="learner-section-card">
                        <div className="learner-section-header">
                            <h2 className="learner-section-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                Team Members {teamName && <span style={{ color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '8px', fontSize: '0.9rem' }}>({teamName})</span>}
                            </h2>
                        </div>
                        
                        {loadingMembers ? (
                            <div style={{ color: 'var(--text-muted)', padding: '12px' }}>Loading team members...</div>
                        ) : teamMembers.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', padding: '12px', fontSize: '0.9rem' }}>You are not yet assigned to a team.</div>
                        ) : (
                            /* Dynamic N-column grid based on member count */
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${teamMembers.length}, 1fr)`, gap: '12px' }}>
                                {teamMembers.map(member => (
                                    <div
                                        className="team-member-card"
                                        key={member.email}
                                        style={{ position: 'relative' }}
                                    >
                                        <Avatar
                                            role="LEARNER"
                                            size={52}
                                            className="member-avatar"
                                        />
                                        <div className="member-info">
                                            <span className="member-name">
                                                {member.name}
                                            </span>
                                            <button
                                                className="member-contact-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActivePopover(activePopover === member.email ? null : member.email);
                                                    setCopiedEmail(null);
                                                }}
                                            >
                                                Contact
                                            </button>
                                        </div>

                                        {/* Popover */}
                                        {activePopover === member.email && (
                                            <div
                                                className="tm-popover"
                                                ref={popoverContainerRef}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="tm-popover-arrow" />
                                                <div className="tm-popover-name">{member.name}</div>
                                                <div className="tm-popover-email">{member.email}</div>
                                                <button
                                                    className={`tm-popover-copy${copiedEmail === member.email ? ' copied' : ''}`}
                                                    onClick={() => handleCopy(member.email)}
                                                >
                                                    {copiedEmail === member.email ? (
                                                        <>
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                            </svg>
                                                            Copy Email
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Project Submission — flex:1 fills remaining height */}
                    <section className="learner-section-card learner-submission-card">
                        <div className="learner-section-header">
                            <h2 className="learner-section-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                                Project Submission
                            </h2>
                        </div>
                        <div className="timeline-horizontal-container">
                            {loadingMilestones ? (
                                <div style={{ color: 'var(--text-muted)' }}>Loading timeline...</div>
                            ) : milestones.length === 0 ? (
                                <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', width: '100%', textAlign: 'center' }}>
                                    No milestones currently set for this cohort.
                                </div>
                            ) : (
                                milestones.map((m) => (
                                    <div key={m.id} className="timeline-horizontal-item" style={{ opacity: m.state === 'upcoming' ? 0.6 : 1 }}>
                                        <div className={`timeline-icon ${m.state === 'completed' ? 'completed' : m.state === 'overdue' ? 'completed' : 'pending'}`} style={{
                                            background: m.state === 'active' ? 'transparent' : m.state === 'overdue' ? '#ef4444' : undefined,
                                            borderColor: m.state === 'active' ? '#2563eb' : undefined,
                                            boxShadow: m.state === 'active' ? '0 0 0 4px rgba(37,99,235,0.1)' : undefined
                                        }}>
                                            {m.state === 'completed' ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : m.state === 'overdue' ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="8" x2="12" y2="12" />
                                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                                </svg>
                                            ) : m.state === 'active' ? (
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563eb' }} />
                                            ) : null}
                                        </div>
                                        <div className="timeline-horizontal-content">
                                            <div className="timeline-details">
                                                <span className="timeline-title" style={{ color: m.state === 'active' ? '#e2e8f0' : m.state === 'overdue' ? '#ef4444' : 'var(--text-main)' }}>{m.title}</span>
                                                <span className="timeline-date">Due: {m.due_date}</span>
                                            </div>
                                            <span className={`badge ${m.state === 'completed' ? 'badge-approved' : m.state === 'active' ? 'badge-progress' : ''}`} style={{ 
                                                alignSelf: 'flex-start',
                                                background: m.state === 'upcoming' ? 'rgba(255,255,255,0.05)' : m.state === 'overdue' ? 'rgba(239,68,68,0.1)' : undefined,
                                                color: m.state === 'upcoming' ? 'var(--text-muted)' : m.state === 'overdue' ? '#ef4444' : undefined 
                                            }}>
                                                {m.state === 'completed' ? 'Completed' : m.state === 'active' ? 'In Progress' : m.state === 'overdue' ? 'Overdue' : 'Upcoming'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                </div>

                {/* Right column: Task Planner — height: 100% matches left column */}
                <section className="learner-section-card learner-task-planner">
                    <div className="learner-section-header">
                        <h2 className="learner-section-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Task Planner
                        </h2>
                    </div>
                    {/* tasks-list fills remaining height; Add Task pinned to bottom */}
                    <div className="tasks-list">
                        {tasks.length > 0 ? (
                            tasks.map(task => (
                                <div
                                    key={task.id}
                                    className={`task-item ${task.completed ? 'completed' : ''}`}
                                    onClick={() => handleToggleTask(task.id)}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    <div className={`task-checkbox ${task.completed ? 'completed' : ''}`}>
                                        {task.completed && (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="task-info" style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                                        <span
                                            className={`task-title ${task.completed ? 'completed' : ''}`}
                                            style={{ whiteSpace: 'normal', wordBreak: 'break-word', display: 'block', lineHeight: '1.2' }}
                                        >
                                            {task.title}
                                        </span>
                                    </div>
                                    <div className="task-actions">
                                        <button
                                            className="task-delete-btn"
                                            onClick={(e) => handleDeleteTask(task.id, e)}
                                            title="Delete Task"
                                            aria-label="Delete Task"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8' }}>
                                <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                                    Your task planner is currently empty. Use this space to organize your key objectives and manage your project timeline.
                                </p>
                            </div>
                        )}
                        <button className="add-task-btn" onClick={() => setIsModalOpen(true)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Task
                        </button>
                    </div>
                </section>

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
