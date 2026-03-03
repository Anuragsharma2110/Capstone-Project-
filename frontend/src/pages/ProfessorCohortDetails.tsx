import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import axiosInstance from '../api/axios';
import { Button } from '../components/ui';

interface CohortDetail {
    id: number;
    name: string;
    description: string;
    institution_name: string;
    status: string;
    start_date: string;
    end_date: string;
    team_count: number;
    student_count: number;
    program_details?: {
        name: string;
        description: string;
    };
}

const ProfessorCohortDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [cohort, setCohort] = useState<CohortDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCohortDetails = async () => {
            try {
                const response = await axiosInstance.get(`/cohorts/${id}/`);
                setCohort(response.data);
            } catch (error) {
                console.error("Failed to fetch cohort details", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCohortDetails();
        }
    }, [id]);

    if (loading) {
        return (
            <AdminLayout title="Cohort Details" breadcrumb={['Dashboard', 'My Cohorts', 'Details']}>
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading cohort details...</div>
            </AdminLayout>
        );
    }

    if (!cohort) {
        return (
            <AdminLayout title="Cohort Details" breadcrumb={['Dashboard', 'My Cohorts', 'Details']}>
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cohort not found.</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={`Cohort: ${cohort.name}`} breadcrumb={['Dashboard', 'My Cohorts', 'Details']}>
            <div className="prof-section-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{cohort.name}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{cohort.institution_name}</p>
                    </div>
                    <span style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        background: cohort.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        color: cohort.status === 'ACTIVE' ? '#10b981' : '#64748b',
                        textTransform: 'uppercase'
                    }}>
                        {cohort.status}
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                    <div style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline</h3>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Start Date</p>
                                <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(cohort.start_date).toLocaleDateString()}</p>
                            </div>
                            {cohort.end_date && (
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>End Date</p>
                                    <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(cohort.end_date).toLocaleDateString()}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</h3>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Teams</p>
                                <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cohort.team_count}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Students</p>
                                <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cohort.student_count}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>Description</h2>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{cohort.description || "No description provided for this cohort."}</p>
                </div>

                {cohort.program_details && (
                    <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)', color: 'white', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.8, marginBottom: '0.5rem' }}>Associated Program</h3>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{cohort.program_details.name}</h2>
                        <p style={{ opacity: 0.9, lineHeight: 1.5, fontSize: '0.9rem' }}>{cohort.program_details.description}</p>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <Button onClick={() => navigate('/professor/cohorts')} style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                        Back to My Cohorts
                    </Button>
                    <Button onClick={() => navigate('/professor/dashboard')}>
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ProfessorCohortDetails;
