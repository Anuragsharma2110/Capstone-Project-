import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CardComponents.css';

interface CohortCardProps {
    id: number;
    name: string;
    institution_name: string;
    start_date: string;
    status: 'ACTIVE' | 'PENDING' | 'ARCHIVED';
    professor_details?: { first_name: string; last_name: string } | null;
    team_count: number;
    student_count: number;
    onStatusUpdate?: (id: number, newStatus: string) => void;
}

const CohortCard: React.FC<CohortCardProps> = ({
    id, name, institution_name, start_date, status, professor_details, team_count, student_count, onStatusUpdate
}) => {
    const navigate = useNavigate();
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    // Format date to Month Year
    const dateObj = new Date(start_date);
    const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Assign a gradient based on status or random
    const gradient = status === 'ACTIVE' ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 60%, #2563eb 100%)'
        : status === 'PENDING' ? 'linear-gradient(135deg, #fb923c 0%, #f97316 60%, #ea580c 100%)'
            : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 60%, #7c3aed 100%)';
    const badgeClass = status === 'ARCHIVED' ? 'cohort-badge badge-archived'
        : status === 'PENDING' ? 'cohort-badge badge-pending'
            : 'cohort-badge';

    const toggleSettings = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsSettingsOpen(!isSettingsOpen);
    };

    const handleArchive = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onStatusUpdate) {
            onStatusUpdate(id, 'ARCHIVED');
        }
        setIsSettingsOpen(false);
    };

    // Close dropdown on click outside
    React.useEffect(() => {
        if (isSettingsOpen) {
            const closeSettings = () => setIsSettingsOpen(false);
            window.addEventListener('click', closeSettings);
            return () => window.removeEventListener('click', closeSettings);
        }
    }, [isSettingsOpen]);

    return (
        <div className="cohort-card">
            <div className="cohort-header" style={{ background: gradient }}>
                <span className={badgeClass}>{status}</span>
                <div className="cohort-settings-wrapper">
                    <button className="cohort-settings-btn" onClick={toggleSettings}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </button>
                    {isSettingsOpen && (
                        <div className="settings-dropdown">
                            <button className="dropdown-item archive" onClick={handleArchive}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 8v13H3V8" />
                                    <path d="M1 3h22v5H1z" />
                                    <path d="M10 12h4" />
                                </svg>
                                Archive Cohort
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div
                className="cohort-body"
                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                onClick={() => navigate(`/admin/cohorts/${id}`)}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <div className="cohort-title">{name}</div>
                <div className="cohort-dept">{institution_name} | {monthYear}</div>

                {professor_details && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginTop: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Professor:</span> {professor_details.first_name} {professor_details.last_name}
                    </div>
                )}

                <div className="cohort-stats">
                    <div className="student-count" style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <div className="student-count-text">
                                <span className="student-count-num">{student_count}</span>
                                <span className="student-count-label">Students</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                            </svg>
                            <div className="student-count-text">
                                <span className="student-count-num">{team_count}</span>
                                <span className="student-count-label">Teams</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CreateCohortCard: React.FC = () => (
    <div className="create-cohort-card">
        <div className="plus-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
        </div>
        <div>
            <div className="create-cohort-title">Create New Cohort</div>
            <div className="create-cohort-subtitle">Start a new project term</div>
        </div>
    </div>
);

export default CohortCard;
