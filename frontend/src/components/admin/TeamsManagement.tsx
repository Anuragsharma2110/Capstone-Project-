import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card } from '../ui';
import AutoGenerateTeamsModal from './AutoGenerateTeamsModal';
import CreateTeamModal from './CreateTeamModal';
import TeamDetailModal from './TeamDetailModal';
import Toast, { useToast } from './Toast';
import axiosInstance from '../../api/axios';
import './CardComponents.css';

interface Learner {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
}

interface TeamMemberData {
    id: number;
    user: number;
    user_details: Learner;
}

interface Team {
    id: number;
    name: string;
    cohort_details: {
        id: number;
        name: string;
        preferred_team_size?: number;
    };
    members: TeamMemberData[];
}

const TeamsManagement: React.FC = () => {
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [selectedCohortId, setSelectedCohortId] = useState<string>('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [unassignedLearners, setUnassignedLearners] = useState<Learner[]>([]);
    const [loading, setLoading] = useState(false);
    const [unassignedOpen, setUnassignedOpen] = useState(true);

    // Modals
    const [isAutoGenOpen, setIsAutoGenOpen] = useState(false);
    const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
    const [detailTeam, setDetailTeam] = useState<Team | null>(null);
    const [detailDefaultPanel, setDetailDefaultPanel] = useState<'roster' | 'assign' | 'move'>('roster');

    // Loading states
    const [generating, setGenerating] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [creatingTeam, setCreatingTeam] = useState(false);

    const { toasts, addToast, dismiss } = useToast();

    // ─── Fetch helpers ──────────────────────────────────────────────────────────

    const fetchCohorts = useCallback(async () => {
        try {
            const res = await axiosInstance.get('/cohorts/');
            setCohorts(res.data);
            if (res.data.length > 0 && !selectedCohortId) {
                setSelectedCohortId(res.data[0].id.toString());
            }
        } catch {
            addToast('Failed to load cohorts.', 'error');
        }
    }, [selectedCohortId]);

    const fetchTeams = useCallback(async (cohortId: string) => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/teams/?cohort=${cohortId}`);
            const filtered = res.data.filter((t: Team) => t.cohort_details.id.toString() === cohortId);
            setTeams(filtered);
            // Keep detailTeam in sync
            setDetailTeam(prev => prev ? (filtered.find((t: Team) => t.id === prev.id) ?? null) : null);
        } catch {
            addToast('Failed to load teams.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUnassigned = useCallback(async (cohortId: string) => {
        try {
            const res = await axiosInstance.get(`/cohorts/${cohortId}/unassigned_learners/`);
            setUnassignedLearners(res.data);
        } catch {
            setUnassignedLearners([]);
        }
    }, []);

    const refresh = useCallback((cohortId: string) => {
        fetchTeams(cohortId);
        fetchUnassigned(cohortId);
    }, [fetchTeams, fetchUnassigned]);

    useEffect(() => { fetchCohorts(); }, []);

    useEffect(() => {
        if (selectedCohortId) {
            refresh(selectedCohortId);
        } else {
            setTeams([]);
            setUnassignedLearners([]);
        }
    }, [selectedCohortId]);

    // ─── Action handlers ─────────────────────────────────────────────────────────

    const handleAutoGenerate = async (teamSize: number, reset: boolean) => {
        if (!selectedCohortId) return;
        setGenerating(true);
        try {
            const res = await axiosInstance.post(`/cohorts/${selectedCohortId}/auto_generate_teams/`, { team_size: teamSize, reset });
            setIsAutoGenOpen(false);
            addToast(res.data.detail, 'success');
            refresh(selectedCohortId);
        } catch (err: any) {
            addToast(err.response?.data?.detail || 'Failed to generate teams.', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleAutoAssign = async () => {
        if (!selectedCohortId) return;
        setAssigning(true);
        try {
            const res = await axiosInstance.post(`/cohorts/${selectedCohortId}/auto_assign_late_joiners/`);
            addToast(res.data.detail, 'success');
            refresh(selectedCohortId);
        } catch (err: any) {
            addToast(err.response?.data?.detail || 'Failed to assign late joiners.', 'error');
        } finally {
            setAssigning(false);
        }
    };

    const handleCreateTeam = async (name: string) => {
        if (!selectedCohortId) return;
        setCreatingTeam(true);
        try {
            const res = await axiosInstance.post(`/cohorts/${selectedCohortId}/create_team/`, { name });
            setIsCreateTeamOpen(false);
            addToast(`"${res.data.name}" created successfully.`, 'success');
            refresh(selectedCohortId);
        } catch (err: any) {
            addToast(err.response?.data?.detail || 'Failed to create team.', 'error');
        } finally {
            setCreatingTeam(false);
        }
    };

    const handleRename = async (teamId: number, newName: string) => {
        try {
            await axiosInstance.patch(`/teams/${teamId}/`, { name: newName });
            addToast('Team renamed successfully.', 'success');
            refresh(selectedCohortId);
        } catch (err: any) {
            addToast(err.response?.data?.detail || 'Failed to rename team.', 'error');
        }
    };

    const handleRemoveLearner = async (teamId: number, userId: number) => {
        try {
            await axiosInstance.post(`/teams/${teamId}/remove_learner/`, { user_id: userId });
            addToast('Learner removed from team.', 'success');
            refresh(selectedCohortId);
        } catch (err: any) {
            addToast(err.response?.data?.detail || 'Failed to remove learner.', 'error');
        }
    };

    const handleMoveLearner = async (sourceTeamId: number, userId: number, targetTeamId: number) => {
        try {
            const res = await axiosInstance.post(`/teams/${sourceTeamId}/move_learner/`, { user_id: userId, target_team_id: targetTeamId });
            addToast(res.data.detail, 'success');
            if (res.data.warning) addToast(res.data.warning, 'warning');
            refresh(selectedCohortId);
        } catch (err: any) {
            addToast(err.response?.data?.detail || 'Failed to move learner.', 'error');
        }
    };

    const handleAssignLearner = async (teamId: number, userId: number) => {
        try {
            const res = await axiosInstance.post(`/teams/${teamId}/assign_learner/`, { user_id: userId });
            addToast(res.data.detail, 'success');
            if (res.data.warning) addToast(res.data.warning, 'warning');
            refresh(selectedCohortId);
        } catch (err: any) {
            addToast(err.response?.data?.detail || 'Failed to assign learner.', 'error');
        }
    };

    const openTeamDetail = (team: Team, panel: 'roster' | 'assign' | 'move' = 'roster') => {
        setDetailDefaultPanel(panel);
        setDetailTeam(team);
    };

    // ─── Rendering helpers ────────────────────────────────────────────────────

    const displayName = (l: Learner) =>
        [l.first_name, l.last_name].filter(Boolean).join(' ') || l.username;

    const avatarInitials = (l: Learner) =>
        ((l.first_name?.[0] || '') + (l.last_name?.[0] || '')).toUpperCase() || l.username[0].toUpperCase();

    const hasTeams = teams.length > 0;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <AdminLayout title="Teams Management" breadcrumb={['Admin', 'Teams Management']}>
            <Toast toasts={toasts} onDismiss={dismiss} />

            {/* ── Cohort Selector ── */}
            <section style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Manage Cohort Teams</h2>
                    <select
                        value={selectedCohortId}
                        onChange={e => setSelectedCohortId(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', minWidth: '250px' }}
                    >
                        <option value="">-- Select a Cohort --</option>
                        {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {!selectedCohortId ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Please select a cohort to view and manage its teams.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* ── Top Action Bar ── */}
                        <div style={{ background: 'var(--bg-card)', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.2rem 0' }}>Team Actions</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                                    {hasTeams ? `${teams.length} team${teams.length !== 1 ? 's' : ''} · ` : ''}
                                    <strong style={{ color: unassignedLearners.length > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>
                                        {unassignedLearners.length} unassigned learner{unassignedLearners.length !== 1 ? 's' : ''}
                                    </strong>
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {/* Auto-Generate */}
                                <button
                                    onClick={() => setIsAutoGenOpen(true)}
                                    style={{
                                        background: hasTeams ? 'transparent' : 'linear-gradient(135deg, #10b981, #059669)',
                                        color: hasTeams ? '#ef4444' : 'white',
                                        border: hasTeams ? '1px solid rgba(239,68,68,0.35)' : 'none',
                                        padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem',
                                    }}
                                    title={hasTeams ? 'Teams exist — will require reset confirmation' : 'Auto-generate teams for unassigned learners'}
                                >
                                    {hasTeams && (
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                        </svg>
                                    )}
                                    {hasTeams ? 'Reset & Regenerate' : 'Auto-Generate Teams'}
                                </button>

                                {/* Create Team Manually */}
                                <button
                                    onClick={() => setIsCreateTeamOpen(true)}
                                    style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    Create Team
                                </button>

                                {/* Auto-Assign Late Joiners */}
                                <button
                                    onClick={handleAutoAssign}
                                    disabled={assigning || unassignedLearners.length === 0 || !hasTeams}
                                    title={!hasTeams ? 'Generate initial teams first' : unassignedLearners.length === 0 ? 'No unassigned learners' : 'Assign unassigned learners to smallest teams'}
                                    style={{
                                        background: 'transparent',
                                        color: 'var(--primary-blue)',
                                        border: '1px solid rgba(37,99,235,0.35)',
                                        padding: '0.5rem 1rem', borderRadius: '8px', cursor: (unassignedLearners.length === 0 || !hasTeams) ? 'not-allowed' : 'pointer',
                                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem',
                                        opacity: (unassignedLearners.length === 0 || !hasTeams) ? 0.5 : 1,
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                                    </svg>
                                    {assigning ? 'Assigning...' : 'Auto-Assign Late Joiners'}
                                </button>
                            </div>
                        </div>

                        {/* ── Unassigned Learners Panel ── */}
                        {unassignedLearners.length > 0 && (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', overflow: 'hidden' }}>
                                <button
                                    onClick={() => setUnassignedOpen(o => !o)}
                                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.25rem', background: 'rgba(245,158,11,0.06)', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f59e0b' }}>
                                            {unassignedLearners.length} Unassigned Learner{unassignedLearners.length !== 1 ? 's' : ''}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            — not yet in any team
                                        </span>
                                    </div>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                        style={{ transform: unassignedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>

                                {unassignedOpen && (
                                    <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {unassignedLearners.map(l => (
                                            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.6rem', borderRadius: '6px', background: 'var(--bg-page)' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>
                                                    {avatarInitials(l)}
                                                </div>
                                                <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{displayName(l)}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{l.username}</span>
                                                {hasTeams && (
                                                    <button
                                                        onClick={() => openTeamDetail(teams[0], 'assign')}
                                                        style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary-blue)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '6px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                                    >
                                                        Assign
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
                                            Use <strong>Auto-Assign Late Joiners</strong> to fill teams automatically, or click <strong>Edit</strong> on any team to assign manually.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Teams Grid ── */}
                        {loading ? (
                            <div style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>Loading teams...</div>
                        ) : teams.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: '1rem' }}>
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <p>No teams yet. Use <strong>Auto-Generate Teams</strong> or <strong>Create Team</strong> to get started.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                                {teams.map(team => (
                                    <Card key={team.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                        {/* Card Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <div>
                                                <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.15rem', color: 'var(--primary-blue)', fontWeight: 700 }}>{team.name}</h2>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                                                    {team.cohort_details.name}
                                                </p>
                                            </div>
                                            <span style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary-blue)', borderRadius: '20px', padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
                                                {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {/* Member List */}
                                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                                            {team.members.length === 0 ? (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No members assigned.</span>
                                            ) : (
                                                team.members.slice(0, 4).map(m => (
                                                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(37,99,235,0.1)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>
                                                            {avatarInitials(m.user_details)}
                                                        </div>
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-main)' }}>
                                                            {displayName(m.user_details)}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                            {team.members.length > 4 && (
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                    +{team.members.length - 4} more — click Edit to see all
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => openTeamDetail(team)}
                                                style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '7px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                                Edit Team
                                            </button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* ── Modals ── */}
            <AutoGenerateTeamsModal
                isOpen={isAutoGenOpen}
                onClose={() => setIsAutoGenOpen(false)}
                onConfirm={handleAutoGenerate}
                loading={generating}
                hasExistingTeams={hasTeams}
            />
            <CreateTeamModal
                isOpen={isCreateTeamOpen}
                onClose={() => setIsCreateTeamOpen(false)}
                onConfirm={handleCreateTeam}
                loading={creatingTeam}
            />
            <TeamDetailModal
                isOpen={!!detailTeam}
                team={detailTeam}
                allTeams={teams}
                unassignedLearners={unassignedLearners}
                defaultPanel={detailDefaultPanel}
                onClose={() => { setDetailTeam(null); setDetailDefaultPanel('roster'); }}
                onRename={handleRename}
                onRemoveLearner={handleRemoveLearner}
                onMoveLearner={handleMoveLearner}
                onAssignLearner={handleAssignLearner}
            />
        </AdminLayout>
    );
};

export default TeamsManagement;
