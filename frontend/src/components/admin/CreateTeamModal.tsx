import React, { useState } from 'react';
import { Button } from '../ui';
import './CreateCohortModal.css';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string) => Promise<void>;
    loading?: boolean;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onConfirm, loading = false }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onConfirm(name.trim());
        setName('');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>Create New Team</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                        Create a new empty team. You can assign learners to it afterwards.
                    </p>
                    <div className="form-group">
                        <label>Team Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Team Alpha (leave blank for auto-name)"
                            maxLength={100}
                        />
                    </div>
                    <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                        <Button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Team'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTeamModal;
