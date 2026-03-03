import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import '../components/professor/ProfessorDashboardUI.css';
import axiosInstance from '../api/axios';

interface CohortSummary {
    id: number;
    name: string;
    team_count: number;
    student_count: number;
    status: string;
}

const MyCohorts: React.FC = () => {
    const navigate = useNavigate();
    const [cohorts, setCohorts] = useState<CohortSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCohorts = async () => {
            try {
                // Backend CohortViewSet filters by professor automatically for role="PROFESSOR"
                const response = await axiosInstance.get('/cohorts/');
                setCohorts(response.data);
            } catch (error) {
                console.error("Failed to fetch assigned cohorts", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCohorts();
    }, []);

    return (
        <AdminLayout title="My Cohorts" breadcrumb={['Dashboard', 'My Cohorts']}>
            <div className="prof-section-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className="prof-section-header">
                    <h2 className="prof-section-title">Assigned Cohorts</h2>
                </div>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading assigned cohorts...</div>
                ) : cohorts.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No cohorts assigned to you yet.</div>
                ) : (
                    <div className="assigned-cohorts-grid">
                        {cohorts.map((cohort) => (
                            <div className="cohort-preview-card" key={cohort.id}>
                                <img
                                    src={`https://picsum.photos/seed/${cohort.id}/400/150`}
                                    alt={cohort.name}
                                    className="cohort-preview-image"
                                />
                                <div className="cohort-preview-body">
                                    <div className="cohort-preview-name">{cohort.name}</div>
                                    <div className="cohort-preview-sub">{cohort.team_count || 0} Teams under supervision</div>
                                    <div className="cohort-preview-footer">
                                        <span className="cohort-active-badge" style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                            background: cohort.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                            color: cohort.status === 'ACTIVE' ? '#10b981' : '#64748b'
                                        }}>
                                            {cohort.status || 'ACTIVE'}
                                        </span>
                                        <button
                                            className="cohort-details-btn"
                                            onClick={() => navigate(`/professor/cohorts/${cohort.id}`)}
                                        >
                                            View Cohort Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default MyCohorts;
