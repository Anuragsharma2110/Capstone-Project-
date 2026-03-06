import React, { useState } from 'react';
import { Button } from '../ui';
import './CreateCohortModal.css'; // Reuse styles

interface AutoGenerateTeamsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (teamSize: number, reset: boolean) => void;
    loading?: boolean;
    hasExistingTeams?: boolean;
}

const AutoGenerateTeamsModal: React.FC<AutoGenerateTeamsModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    loading = false,
    hasExistingTeams = false
}) => {
    const [teamSize, setTeamSize] = useState<number>(5);
    const [reset, setReset] = useState<boolean>(false);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>Auto-Generate Teams</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                <div className="modal-form">
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                        This will automatically place <strong>unassigned learners</strong> in the selected cohort into random teams. Learners already in a team will not be affected unless you choose to reset.
                    </p>

                    <div className="form-group">
                        <label>Team Size *</label>
                        <input
                            type="number"
                            value={teamSize}
                            onChange={(e) => setTeamSize(parseInt(e.target.value))}
                            min="2"
                            max="50"
                            required
                        />
                    </div>

                    {hasExistingTeams && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={reset}
                                    onChange={(e) => setReset(e.target.checked)}
                                    style={{ marginTop: '0.25rem' }}
                                />
                                <div>
                                    <span style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.9rem', display: 'block' }}>Reset Existing Teams</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Warning: Checking this will permanently delete all existing teams and re-assign everyone.</span>
                                </div>
                            </label>
                        </div>
                    )}

                    <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                        <Button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>Cancel</Button>
                        <Button
                            type="button"
                            onClick={() => onConfirm(teamSize, reset)}
                            disabled={loading || (hasExistingTeams && !reset)}
                            style={hasExistingTeams && reset ? { background: '#ef4444' } : undefined}
                        >
                            {loading ? 'Generating...' : (hasExistingTeams && reset ? 'Delete & Regenerate' : 'Generate Teams')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutoGenerateTeamsModal;
