import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import StatsCard from '../components/admin/StatsCard';
import CohortCard, { CreateCohortCard } from '../components/admin/CohortCard';
import CreateCohortModal from '../components/admin/CreateCohortModal';
import axiosInstance from '../api/axios';
import '../components/admin/CardComponents.css';

const CohortsManagement: React.FC = () => {
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchCohorts = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/cohorts/');
            setCohorts(response.data);
        } catch (error) {
            console.error("Failed to fetch cohorts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCohorts();
    }, []);
    const stats = [
        {
            label: 'Total Students',
            value: '1,284',
            trend: '12% from last term',
            trendType: 'up' as const,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
            ),
        },
        {
            label: 'Active Cohorts',
            value: '12',
            trend: '4 pending start',
            trendType: 'muted' as const,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    <circle cx="12" cy="12" r="3" />
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                </svg>
            ),
        },
        {
            label: 'Pending Submissions',
            value: '45',
            trend: 'Requires review',
            trendType: 'warning' as const,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    <path d="M12 11v4" />
                    <path d="M12 18h.01" />
                </svg>
            ),
        },
        {
            label: 'Pending Professor Evaluations',
            value: '3',
            trend: 'Action required',
            trendType: 'warning' as const,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
            ),
        },
    ];



    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            await axiosInstance.patch(`/cohorts/${id}/`, { status: newStatus });
            fetchCohorts(); // Refresh the list after update
        } catch (error) {
            console.error("Failed to update cohort status", error);
            alert("Failed to update cohort status. Please try again.");
        }
    };

    return (
        <AdminLayout title="Cohorts Management" breadcrumb={['Admin', 'Cohorts Management']}>
            {/* Summary Statistics */}
            <section style={{ marginBottom: '2rem' }}>
                <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Summary Statistics</h2>
                <div className="stats-grid">
                    {stats.map((stat, i) => (
                        <StatsCard key={i} {...stat} />
                    ))}
                </div>
            </section>

            {/* Available Cohorts */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 className="section-title">Available Cohorts</h2>
                    <div style={{ display: 'flex', gap: '0.625rem' }}>
                        <button className="filter-sort-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            Filter
                        </button>
                        <button className="filter-sort-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="21" y1="10" x2="3" y2="10" />
                                <line x1="21" y1="6" x2="3" y2="6" />
                                <line x1="21" y1="14" x2="3" y2="14" />
                                <line x1="21" y1="18" x2="3" y2="18" />
                            </svg>
                            Sort
                        </button>
                    </div>
                </div>

                <div className="cohort-grid">
                    <div onClick={() => setIsModalOpen(true)} style={{ cursor: 'pointer', height: '100%' }}>
                        <CreateCohortCard />
                    </div>
                    {loading ? (
                        <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading cohorts...</div>
                    ) : cohorts.length === 0 ? (
                        <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>No cohorts found. Create one to get started!</div>
                    ) : (
                        cohorts.map((cohort) => (
                            <CohortCard
                                key={cohort.id}
                                {...cohort}
                                onStatusUpdate={handleStatusUpdate}
                            />
                        ))
                    )}
                </div>
            </section>

            <CreateCohortModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchCohorts();
                }}
            />
        </AdminLayout>
    );
};

export default CohortsManagement;
