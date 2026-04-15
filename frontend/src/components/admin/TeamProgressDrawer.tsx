import React, { useEffect } from 'react';
import type { ProcessedMilestone, Milestone } from '../../core/milestoneUtils';
import { processMilestones } from '../../core/milestoneUtils';
import './TeamProgressDrawer.css';

interface TeamMember {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface TeamData {
    id: number;
    name: string;
    is_final_submitted: boolean;
    members: TeamMember[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    team: TeamData | null;
    milestones: Milestone[];
    professorName?: string;
}

const TeamProgressDrawer: React.FC<Props> = ({ isOpen, onClose, team, milestones, professorName }) => {
    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!team) return null;

    const processed: ProcessedMilestone[] = processMilestones(milestones, team.is_final_submitted);

    const getStateIcon = (state: string) => {
        switch (state) {
            case 'completed':
                return (
                    <div className="tpd-milestone-icon tpd-icon-completed">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                );
            case 'active':
                return (
                    <div className="tpd-milestone-icon tpd-icon-active">
                        <div className="tpd-icon-active-dot" />
                    </div>
                );
            case 'overdue':
                return (
                    <div className="tpd-milestone-icon tpd-icon-overdue">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                );
            default:
                return <div className="tpd-milestone-icon tpd-icon-upcoming" />;
        }
    };

    const getStateBadge = (state: string) => {
        const labels: Record<string, string> = {
            completed: 'Completed',
            active: 'In Progress',
            overdue: 'Overdue',
            upcoming: 'Upcoming',
        };
        return <span className={`tpd-badge tpd-badge-${state}`}>{labels[state] || state}</span>;
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`tpd-overlay ${isOpen ? 'tpd-overlay-visible' : ''}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`tpd-drawer ${isOpen ? 'tpd-drawer-open' : ''}`}>
                {/* Header */}
                <div className="tpd-header">
                    <div>
                        <h2 className="tpd-title">{team.name}</h2>
                        <span className="tpd-subtitle">Team Progress Overview</span>
                    </div>
                    <button className="tpd-close-btn" onClick={onClose} title="Close drawer">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="tpd-content">

                    {/* Final Submission Status */}
                    <div className={`tpd-final-status ${team.is_final_submitted ? 'tpd-final-done' : 'tpd-final-pending'}`}>
                        <div className="tpd-final-icon">
                            {team.is_final_submitted ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <div className="tpd-final-label">Final Submission</div>
                            <div className="tpd-final-text">
                                {team.is_final_submitted ? 'Submitted' : 'Not yet submitted'}
                            </div>
                        </div>
                    </div>

                    {/* Team Members */}
                    <div className="tpd-section">
                        <h3 className="tpd-section-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Team Members
                            <span className="tpd-member-count">{team.members.length}</span>
                        </h3>
                        <div className="tpd-members-list">
                            {team.members.map((m) => (
                                <div key={m.id} className="tpd-member-row">
                                    <div className="tpd-member-avatar">
                                        {(m.first_name?.[0] || m.username[0]).toUpperCase()}
                                    </div>
                                    <div className="tpd-member-info">
                                        <span className="tpd-member-name">
                                            {m.first_name && m.last_name
                                                ? `${m.first_name} ${m.last_name}`
                                                : m.username}
                                        </span>
                                        <span className="tpd-member-email">{m.email}</span>
                                    </div>
                                </div>
                            ))}
                            {team.members.length === 0 && (
                                <div className="tpd-empty-state">No members assigned yet</div>
                            )}
                        </div>
                    </div>

                    {/* Milestone Timeline */}
                    <div className="tpd-section">
                        <h3 className="tpd-section-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                <line x1="4" y1="22" x2="4" y2="15" />
                            </svg>
                            Milestone Timeline
                        </h3>

                        {processed.length === 0 ? (
                            <div className="tpd-empty-state">No milestones configured for this cohort.</div>
                        ) : (
                            <div className="tpd-timeline">
                                {processed.map((m, idx) => (
                                    <div key={m.id} className={`tpd-timeline-item tpd-timeline-${m.state}`}>
                                        <div className="tpd-timeline-track">
                                            {getStateIcon(m.state)}
                                            {idx < processed.length - 1 && (
                                                <div className={`tpd-timeline-line ${m.state === 'completed' ? 'tpd-line-completed' : ''}`} />
                                            )}
                                        </div>
                                        <div className="tpd-timeline-content">
                                            <div className="tpd-timeline-header">
                                                <span className="tpd-timeline-title">{m.title}</span>
                                                {m.is_final_submission && (
                                                    <span className="tpd-final-tag">Final</span>
                                                )}
                                            </div>
                                            <div className="tpd-timeline-meta">
                                                <span className="tpd-timeline-date">Due: {m.due_date}</span>
                                                {getStateBadge(m.state)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Faculty Advisor if available */}
                    {professorName && (
                        <div className="tpd-section tpd-section-small">
                            <div className="tpd-professor-row">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span className="tpd-professor-label">Faculty Advisor:</span>
                                <span className="tpd-professor-name">{professorName}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default TeamProgressDrawer;
