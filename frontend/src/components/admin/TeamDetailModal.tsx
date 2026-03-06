import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import './CreateCohortModal.css';

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

interface TeamData {
    id: number;
    name: string;
    members: TeamMemberData[];
    cohort_details: { id: number; name: string; preferred_team_size?: number };
}

interface TeamDetailModalProps {
    isOpen: boolean;
    team: TeamData | null;
    allTeams: TeamData[];
    unassignedLearners: Learner[];
    defaultPanel?: ActivePanel;
    onClose: () => void;
    onRename: (teamId: number, newName: string) => Promise<void>;
    onRemoveLearner: (teamId: number, userId: number) => Promise<void>;
    onMoveLearner: (sourceTeamId: number, userId: number, targetTeamId: number) => Promise<void>;
    onAssignLearner: (teamId: number, userId: number) => Promise<void>;
}

type ActivePanel = 'roster' | 'assign' | 'move';

const TeamDetailModal: React.FC<TeamDetailModalProps> = ({
    isOpen, team, allTeams, unassignedLearners, defaultPanel, onClose,
    onRename, onRemoveLearner, onMoveLearner, onAssignLearner,
}) => {
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState('');
    const [savingName, setSavingName] = useState(false);

    const [panel, setPanel] = useState<ActivePanel>('roster');
    const [movingMemberId, setMovingMemberId] = useState<number | null>(null);
    const [targetTeamId, setTargetTeamId] = useState<string>('');
    const [selectedAssignId, setSelectedAssignId] = useState<string>('');
    const [actionLoading, setActionLoading] = useState(false);

    // Reset all state whenever the selected team changes
    useEffect(() => {
        setEditingName(false);
        setNameValue('');
        setMovingMemberId(null);
        setTargetTeamId('');
        setSelectedAssignId('');
        setActionLoading(false);
        setPanel(defaultPanel ?? 'roster');
    }, [team?.id, defaultPanel]);

    if (!isOpen || !team) return null;

    const otherTeams = allTeams.filter(t => t.id !== team.id);

    const startRename = () => {
        setNameValue(team.name);
        setEditingName(true);
    };

    const saveRename = async () => {
        if (!nameValue.trim()) return;
        setSavingName(true);
        await onRename(team.id, nameValue.trim());
        setSavingName(false);
        setEditingName(false);
    };

    const handleRemove = async (userId: number) => {
        setActionLoading(true);
        await onRemoveLearner(team.id, userId);
        setActionLoading(false);
    };

    const handleMove = async () => {
        if (!movingMemberId || !targetTeamId) return;
        setActionLoading(true);
        await onMoveLearner(team.id, movingMemberId, parseInt(targetTeamId));
        setMovingMemberId(null);
        setTargetTeamId('');
        setActionLoading(false);
    };

    const handleAssign = async () => {
        if (!selectedAssignId) return;
        setActionLoading(true);
        await onAssignLearner(team.id, parseInt(selectedAssignId));
        setSelectedAssignId('');
        setActionLoading(false);
    };

    const displayName = (l: Learner) =>
        [l.first_name, l.last_name].filter(Boolean).join(' ') || l.username;

    const avatarInitials = (l: Learner) =>
        ((l.first_name?.[0] || '') + (l.last_name?.[0] || '')).toUpperCase() || l.username[0].toUpperCase();

    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: '0.5rem 1rem',
        border: 'none',
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'white' : 'var(--text-secondary)',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'all 0.15s',
    });

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '580px' }}>
                {/* Header */}
                <div className="modal-header">
                    {editingName ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
                            <input
                                type="text"
                                value={nameValue}
                                onChange={e => setNameValue(e.target.value)}
                                style={{ flex: 1, padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--primary)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600 }}
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingName(false); }}
                            />
                            <button
                                onClick={saveRename}
                                disabled={savingName}
                                style={{ padding: '0.4rem 0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                            >
                                {savingName ? '...' : 'Save'}
                            </button>
                            <button
                                onClick={() => setEditingName(false)}
                                style={{ padding: '0.4rem 0.5rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                            <h2 style={{ margin: 0 }}>{team.name}</h2>
                            <button
                                onClick={startRename}
                                title="Rename team"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </button>
                        </div>
                    )}
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                {/* Sub-header: team meta */}
                <div style={{ padding: '0.5rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {team.cohort_details.name} · {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1.5rem 0', background: 'var(--bg-card)' }}>
                    <button style={tabStyle(panel === 'roster')} onClick={() => setPanel('roster')}>Roster</button>
                    <button style={tabStyle(panel === 'assign')} onClick={() => setPanel('assign')}>
                        Add Learner {unassignedLearners.length > 0 && (
                            <span style={{ marginLeft: '0.3rem', background: 'rgba(255,255,255,0.25)', borderRadius: '10px', padding: '0 5px', fontSize: '0.75rem' }}>
                                {unassignedLearners.length}
                            </span>
                        )}
                    </button>
                    {team.members.length > 0 && otherTeams.length > 0 && (
                        <button style={tabStyle(panel === 'move')} onClick={() => setPanel('move')}>Move Member</button>
                    )}
                </div>

                {/* Panel content */}
                <div className="modal-form" style={{ paddingTop: '1rem' }}>

                    {/* ROSTER PANEL */}
                    {panel === 'roster' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {team.members.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>No members in this team.</p>
                            ) : (
                                team.members.map(m => (
                                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '8px', background: 'var(--bg-page)' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(37,99,235,0.12)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                                            {avatarInitials(m.user_details)}
                                        </div>
                                        <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                            {displayName(m.user_details)}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{m.user_details.username}</span>
                                        <button
                                            onClick={() => handleRemove(m.user)}
                                            disabled={actionLoading}
                                            title="Remove from team"
                                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '6px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ASSIGN PANEL */}
                    {panel === 'assign' && (
                        <div>
                            {unassignedLearners.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>No unassigned learners available.</p>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Select Unassigned Learner</label>
                                        <select value={selectedAssignId} onChange={e => setSelectedAssignId(e.target.value)}>
                                            <option value="">-- Choose a learner --</option>
                                            {unassignedLearners.map(l => (
                                                <option key={l.id} value={l.id}>{displayName(l)} (@{l.username})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="modal-actions" style={{ marginTop: '1rem' }}>
                                        <Button type="button" onClick={handleAssign} disabled={!selectedAssignId || actionLoading}>
                                            {actionLoading ? 'Assigning...' : 'Assign to Team'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* MOVE PANEL */}
                    {panel === 'move' && (
                        <div>
                            {team.members.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>No members to move.</p>
                            ) : otherTeams.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>No other teams in this cohort.</p>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Select Member to Move</label>
                                        <select value={movingMemberId ?? ''} onChange={e => setMovingMemberId(parseInt(e.target.value))}>
                                            <option value="">-- Choose a member --</option>
                                            {team.members.map(m => (
                                                <option key={m.id} value={m.user}>{displayName(m.user_details)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Move To Team</label>
                                        <select value={targetTeamId} onChange={e => setTargetTeamId(e.target.value)}>
                                            <option value="">-- Choose target team --</option>
                                            {otherTeams.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} ({t.members.length} members)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="modal-actions" style={{ marginTop: '1rem' }}>
                                        <Button type="button" onClick={handleMove} disabled={!movingMemberId || !targetTeamId || actionLoading}>
                                            {actionLoading ? 'Moving...' : 'Move Member'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default TeamDetailModal;
