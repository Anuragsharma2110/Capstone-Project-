import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { Button } from '../ui';
import './CreateCohortModal.css';

interface CreateCohortModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    cohortId?: number | null;
}

const CreateCohortModal: React.FC<CreateCohortModalProps> = ({ isOpen, onClose, onSuccess, cohortId }) => {
    const [programName, setProgramName] = useState('');
    const [institutionName, setInstitutionName] = useState('');
    const [startMonth, setStartMonth] = useState('01');
    const [startYear, setStartYear] = useState(new Date().getFullYear());
    const [status, setStatus] = useState('ACTIVE');
    const [description, setDescription] = useState('');
    const [professorId, setProfessorId] = useState('');
    const [professors, setProfessors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchProfessors();
            if (cohortId) {
                fetchCohortDetails(cohortId);
            }
        } else {
            // Reset form when closed
            setProgramName('');
            setInstitutionName('');
            setStartMonth('01');
            setStartYear(new Date().getFullYear());
            setStatus('ACTIVE');
            setDescription('');
            setProfessorId('');
            setError(null);
        }
    }, [isOpen, cohortId]);

    const fetchCohortDetails = async (id: number) => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/cohorts/${id}/`);
            const data = response.data;
            setProgramName(data.name);
            setInstitutionName(data.institution_name);
            setDescription(data.description || '');
            setStatus(data.status);
            setProfessorId(data.professor ? data.professor.toString() : '');
            
            // Parse date
            if (data.start_date) {
                const parts = data.start_date.split('-');
                if (parts.length >= 2) {
                    setStartYear(parseInt(parts[0]));
                    setStartMonth(parts[1]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch cohort details for editing', err);
            setError('Failed to load cohort details.');
        } finally {
            setLoading(false);
        }
    };

    const fetchProfessors = async () => {
        try {
            const response = await axiosInstance.get('/users/professors/');
            setProfessors(response.data);
        } catch (err) {
            console.error('Failed to fetch professors', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!programName || !institutionName || !startMonth || !startYear) {
            setError('Please fill out all required fields.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: programName,
                institution_name: institutionName,
                description,
                status,
                start_date: `${startYear}-${startMonth}-01`,
                professor: professorId || null
            };

            if (cohortId) {
                await axiosInstance.patch(`/cohorts/${cohortId}/`, payload);
            } else {
                await axiosInstance.post('/cohorts/', payload);
            }
            onSuccess();
        } catch (err: any) {
            console.error(cohortId ? 'Error updating cohort' : 'Error creating cohort', err);

            let errorMessage = cohortId ? 'Failed to update cohort.' : 'Failed to create cohort. Please try again.';
            if (err.response?.data) {
                if (err.response.data.detail) {
                    errorMessage = err.response.data.detail;
                } else if (typeof err.response.data === 'object') {
                    // Try to extract DRF validation errors
                    const validationErrors = Object.entries(err.response.data)
                        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(' ') : errors}`)
                        .join(' | ');
                    errorMessage = validationErrors || errorMessage;
                } else if (typeof err.response.data === 'string' && err.response.data.includes('OperationalError')) {
                    errorMessage = "Database Error: Missing migration. Did you run `python manage.py makemigrations` and `migrate`?";
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const months = [
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>{cohortId ? 'Edit Cohort' : 'Create New Cohort'}</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                {error && <div className="modal-error">{error}</div>}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Program Name *</label>
                        <input
                            type="text"
                            value={programName}
                            onChange={(e) => setProgramName(e.target.value)}
                            placeholder="e.g. Applied Machine Learning for Executives"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Institution Name *</label>
                        <input
                            type="text"
                            value={institutionName}
                            onChange={(e) => setInstitutionName(e.target.value)}
                            placeholder="e.g. IITK AI"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief overview of this cohort..."
                            rows={3}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Start Month *</label>
                            <select value={startMonth} onChange={(e) => setStartMonth(e.target.value)} required>
                                {months.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Start Year *</label>
                            <input
                                type="number"
                                value={startYear}
                                onChange={(e) => setStartYear(parseInt(e.target.value))}
                                min="2020"
                                max="2100"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="PENDING">PENDING</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Assign Professor (Optional)</label>
                        <select value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
                            <option value="">-- None --</option>
                            {professors.map(prof => (
                                <option key={prof.id} value={prof.id}>
                                    {prof.first_name} {prof.last_name} ({prof.username})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="modal-actions">
                        <Button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (cohortId ? 'Saving...' : 'Creating...') : (cohortId ? 'Save Changes' : 'Create Cohort')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCohortModal;
