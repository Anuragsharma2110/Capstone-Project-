import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card } from '../ui';
import AutoGenerateTeamsModal from './AutoGenerateTeamsModal';
import axiosInstance from '../../api/axios';
import './CardComponents.css';

interface TeamMember {
    id: number;
    user_details: {
        username: string;
        first_name: string;
        last_name: string;
    };
}

interface Team {
    id: number;
    name: string;
    cohort_details: {
        id: number;
        name: string;
        program_details?: {
            name: string;
        };
    };
    members: TeamMember[];
}

const TeamsManagement: React.FC = () => {
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [selectedCohortId, setSelectedCohortId] = useState<string>('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [unassignedCount, setUnassignedCount] = useState<number>(0);

    useEffect(() => {
        fetchCohorts();
    }, []);

    useEffect(() => {
        if (selectedCohortId) {
            fetchTeams(selectedCohortId);
            fetchUnassignedCount(selectedCohortId);
        } else {
            setTeams([]);
            setUnassignedCount(0);
        }
    }, [selectedCohortId]);

    const fetchCohorts = async () => {
        try {
            const response = await axiosInstance.get('/cohorts/');
            setCohorts(response.data);
            if (response.data.length > 0) {
                setSelectedCohortId(response.data[0].id.toString());
            }
        } catch (err) {
            console.error("Failed to fetch cohorts", err);
        }
    };

    const fetchUnassignedCount = async (cohortId: string) => {
        try {
            // First get all learners in this cohort
            const membershipsRes = await axiosInstance.get(`/cohort-memberships/?cohort=${cohortId}`);
            // Filter client-side if needed (mocked/simple filtering)
            const members = membershipsRes.data.filter((m: any) => m.cohort.toString() === cohortId || m.cohort?.id?.toString() === cohortId);

            // Get all teams for this cohort to see who is assigned
            const teamsRes = await axiosInstance.get(`/teams/?cohort=${cohortId}`);
            const cohortTeams = teamsRes.data.filter((t: any) => t.cohort_details.id.toString() === cohortId);

            let assignedCount = 0;
            cohortTeams.forEach((t: any) => {
                assignedCount += t.members.length;
            });

            setUnassignedCount(members.length - assignedCount);
        } catch (err) {
            console.error("Failed to fetch unstructured members", err);
            setUnassignedCount(0);
        }
    };

    const fetchTeams = async (cohortId: string) => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/teams/?cohort=${cohortId}`);
            // If the API doesn't support filtering by cohort, filter client-side:
            const filteredTeams = response.data.filter((t: any) => t.cohort_details.id.toString() === cohortId);
            setTeams(filteredTeams);
        } catch (err) {
            console.error("Failed to fetch teams", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoGenerate = async (teamSize: number, reset: boolean) => {
        if (!selectedCohortId) return;

        setError(null);
        setGenerating(true);
        try {
            const response = await axiosInstance.post(`/cohorts/${selectedCohortId}/auto_generate_teams/`, {
                team_size: teamSize,
                reset: reset
            });
            setIsModalOpen(false);
            fetchTeams(selectedCohortId); // Refresh teams
            alert(response.data.detail);
        } catch (err: any) {
            console.error("Failed to auto generate teams", err);
            setError(err.response?.data?.detail || "Failed to generate teams. Ensure there are unassigned learners.");
        } finally {
            setGenerating(false);
        }
    };

    const handleAutoAssign = async () => {
        if (!selectedCohortId) return;

        if (!window.confirm("This will automatically assign unassigned members to the smallest teams. Continue?")) return;

        setError(null);
        setAssigning(true);
        try {
            const response = await axiosInstance.post(`/cohorts/${selectedCohortId}/auto_assign_late_joiners/`);
            fetchTeams(selectedCohortId); // Refresh teams
            alert(response.data.detail);
        } catch (err: any) {
            console.error("Failed to auto assign late joiners", err);
            setError(err.response?.data?.detail || "Failed to assign. Ensure there are unassigned learners.");
            alert(err.response?.data?.detail || "Failed to assign.");
        } finally {
            setAssigning(false);
        }
    };

    return (
        <AdminLayout title="Teams Management" breadcrumb={['Admin', 'Teams Management']}>
            <section style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Manage Cohort Teams</h2>

                    <select
                        value={selectedCohortId}
                        onChange={(e) => setSelectedCohortId(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            background: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-color)',
                            minWidth: '250px'
                        }}
                    >
                        <option value="">-- Select a Cohort --</option>
                        {cohorts.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {!selectedCohortId ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Please select a cohort to view and manage its teams.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {error && (
                            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                {error}
                            </div>
                        )}
                        {teams.length === 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                                {/* Initial Auto Generate Action Card */}
                                <div onClick={() => setIsModalOpen(true)} style={{ cursor: 'pointer', height: '100%' }}>
                                    <div className="create-cohort-card" style={{ height: '100%' }}>
                                        <div className="plus-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="create-cohort-title">Auto-Generate Teams</div>
                                            <div className="create-cohort-subtitle">Randomly assign all learners to teams</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>Team Management Actions</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>There are currently {teams.length} teams in this cohort. <strong style={{ color: unassignedCount > 0 ? '#ef4444' : 'inherit' }}>{unassignedCount} Unassigned Learner(s).</strong></p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={handleAutoAssign}
                                        disabled={assigning || unassignedCount === 0}
                                        style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: unassignedCount === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: unassignedCount === 0 ? 0.5 : 1 }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="9" cy="7" r="4"></circle>
                                            <line x1="19" y1="8" x2="19" y2="14"></line>
                                            <line x1="22" y1="11" x2="16" y2="11"></line>
                                        </svg>
                                        {assigning ? 'Assigning...' : 'Auto-Assign Late Joiners'}
                                    </button>

                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18"></path>
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                        </svg>
                                        Reset & Regenerate
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>

                            {loading ? (
                                <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading teams...</div>
                            ) : (
                                teams.map(team => (
                                    <Card key={team.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--primary-blue)' }}>{team.name}</h2>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                                            {team.cohort_details.name}
                                        </p>

                                        <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--text-main)' }}>Team Roster ({team.members.length})</h3>
                                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                                            {team.members.length === 0 ? (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No members assigned.</span>
                                            ) : (
                                                team.members.map(member => (
                                                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                                            {member.user_details.first_name?.[0]}{member.user_details.last_name?.[0]}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{member.user_details.first_name} {member.user_details.last_name}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </section>

            <AutoGenerateTeamsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleAutoGenerate}
                loading={generating}
                hasExistingTeams={teams.length > 0}
            />
        </AdminLayout>
    );
};

export default TeamsManagement;
