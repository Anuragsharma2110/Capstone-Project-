import React, { useState, useEffect } from 'react';
import './AdminDashboardUI.css';
import axiosInstance from '../../api/axios';
import type { Milestone, TeamMilestoneStatus } from '../../core/milestoneUtils';
import { computeTeamMilestoneStatus } from '../../core/milestoneUtils';
import TeamProgressDrawer from './TeamProgressDrawer';

interface CohortOption {
    id: number;
    name: string;
}

interface TeamMember {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface TeamPerf {
    id: number;
    name: string;
    is_final_submitted: boolean;
    members: TeamMember[];
}

interface PerfData {
    cohort_id: number;
    cohort_name: string;
    professor: { first_name: string; last_name: string; email: string } | null;
    milestones: Milestone[];
    teams: TeamPerf[];
}

const AdminDashboardUI: React.FC = () => {
    const [cohorts, setCohorts] = useState<CohortOption[]>([]);
    const [selectedCohortId, setSelectedCohortId] = useState<number | null>(null);
    const [perfData, setPerfData] = useState<PerfData | null>(null);
    const [loading, setLoading] = useState(true);
    const [perfLoading, setPerfLoading] = useState(false);

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerTeam, setDrawerTeam] = useState<TeamPerf | null>(null);

    // Fetch cohort list on mount
    useEffect(() => {
        const fetchCohorts = async () => {
            try {
                const res = await axiosInstance.get('/cohorts/');
                const list: CohortOption[] = res.data.map((c: any) => ({ id: c.id, name: c.name }));
                setCohorts(list);
                if (list.length > 0) {
                    setSelectedCohortId(list[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch cohorts:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCohorts();
    }, []);

    // Fetch team performances when cohort changes
    useEffect(() => {
        if (!selectedCohortId) {
            setPerfData(null);
            return;
        }
        const fetchPerf = async () => {
            setPerfLoading(true);
            try {
                const res = await axiosInstance.get(`/cohorts/${selectedCohortId}/team_performances/`);
                setPerfData(res.data);
            } catch (err) {
                console.error('Failed to fetch team performances:', err);
                setPerfData(null);
            } finally {
                setPerfLoading(false);
            }
        };
        fetchPerf();
    }, [selectedCohortId]);

    const handleCohortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCohortId(Number(e.target.value));
    };

    const handleViewTeam = (team: TeamPerf) => {
        setDrawerTeam(team);
        setDrawerOpen(true);
    };

    const getStatusBadge = (status: TeamMilestoneStatus) => {
        return (
            <span className={`status-badge status-${status.type}`}>
                {status.label}
            </span>
        );
    };

    const getTeamInitials = (name: string) => {
        return name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const initialsColors = ['#1e3a8a', '#7c3aed', '#0f766e', '#b91c1c', '#92400e', '#334155', '#1e40af', '#6d28d9'];
    const getColor = (index: number) => initialsColors[index % initialsColors.length];

    const professorName = perfData?.professor
        ? `${perfData.professor.first_name} ${perfData.professor.last_name}`.trim()
        : null;

    return (
        <div className="admin-dashboard-ui" style={{ marginTop: '-1rem' }}>
            {/* Team Performance Monitor */}
            <div className="performance-monitor-section">
                <div className="performance-header">
                    <h2 className="section-title">Team Performance Monitor</h2>
                </div>

                {/* Cohort Selector Row */}
                {loading ? (
                    <div className="performance-loading">Loading cohorts...</div>
                ) : cohorts.length === 0 ? (
                    <div className="performance-empty-state">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <div className="performance-empty-title">No Cohorts Available</div>
                        <div className="performance-empty-text">Create a cohort first to monitor team performance.</div>
                    </div>
                ) : (
                    <>
                        <div className="cohort-selector-row" style={{ marginBottom: '1.5rem' }}>
                            <select
                                className="cohort-select"
                                value={selectedCohortId || ''}
                                onChange={handleCohortChange}
                            >
                                {cohorts.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>

                            {professorName && (
                                <div className="cohort-professor-badge">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Faculty: <strong>{professorName}</strong>
                                </div>
                            )}
                        </div>

                        {/* Milestone warning */}
                        {perfData && perfData.milestones.length === 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)',
                                borderRadius: '8px', padding: '0.6rem 1rem', marginBottom: '1rem',
                                fontSize: '0.82rem', color: '#f59e0b'
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                No milestones configured for this cohort. Status tracking is unavailable until milestones are added in the Cohort Milestone Planner.
                            </div>
                        )}

                        {/* Table / Content */}
                        {perfLoading ? (
                            <div className="performance-loading">Loading team data...</div>
                        ) : perfData && perfData.teams.length === 0 ? (
                            <div className="performance-empty-state">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" y1="8" x2="19" y2="14" />
                                    <line x1="22" y1="11" x2="16" y2="11" />
                                </svg>
                                <div className="performance-empty-title">No Teams in This Cohort</div>
                                <div className="performance-empty-text">Teams will appear here once they are created for this cohort.</div>
                            </div>
                        ) : perfData ? (
                            <table className="performance-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40%' }}>Team Name</th>
                                        <th style={{ width: '35%' }}>Current Milestone / Status</th>
                                        <th style={{ width: '25%' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {perfData.teams.map((team, i) => {
                                        const status = computeTeamMilestoneStatus(perfData.milestones, team.is_final_submitted);
                                        return (
                                            <tr key={team.id}>
                                                <td>
                                                    <div className="team-info-cell">
                                                        <div className="team-initials" style={{ background: getColor(i) }}>
                                                            {getTeamInitials(team.name)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                                                {team.name}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {getStatusBadge(status)}
                                                </td>
                                                <td>
                                                    <button
                                                        className="action-icon-btn"
                                                        onClick={() => handleViewTeam(team)}
                                                        title="View team progress"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : null}
                    </>
                )}
            </div>

            {/* Team Progress Drawer */}
            <TeamProgressDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                team={drawerTeam}
                milestones={perfData?.milestones || []}
                professorName={professorName || undefined}
            />
        </div>
    );
};

export default AdminDashboardUI;
