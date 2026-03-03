import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboardUI from '../components/admin/AdminDashboardUI';
import LearnerDashboardUI from '../components/learner/LearnerDashboardUI';
import ProfessorDashboardUI from '../components/professor/ProfessorDashboardUI';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const actions = {
        LEARNER: [
            { label: '📢 Browse Programs', path: '/programs', description: 'Explore and nominate for upcoming capstone tracks.' },
            { label: '📅 Weekly Report', path: '/weekly-mode', description: 'Submit your team\'s weekly progress and blockers.' },
            { label: '👥 My Team', path: '/teams', description: 'View your team roster and cohort details.' },
        ],
        PROFESSOR: [
            { label: '📝 Grading', path: '/grading', description: 'Review and evaluate student submissions.' },
            { label: '📊 Cohorts', path: '/professor/dashboard', description: 'Monitor assigned cohorts and student progress.' },
        ],
        ADMIN: [
            { label: '⚙️ User Management', path: '/setup', description: 'Create & Manage Accounts for faculty and administrators' },
        ]
    };

    const userActions = actions[user?.role as keyof typeof actions] || [];

    return (
        <AdminLayout title="Dashboard" breadcrumb={['Dashboard']}>
            {user?.role === 'ADMIN' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Welcome back, {user?.first_name || user?.username}</p>
                </div>
            )}

            {user?.role === 'ADMIN' && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1.25rem',
                    marginBottom: '2rem',
                    width: '100%'
                }}>
                    {/* Compact Profile Card */}
                    <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: 'rgba(37, 99, 235, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary-blue)'
                            }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>Profile Information</h3>
                                <span style={{
                                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                    color: 'var(--primary-blue)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontWeight: '700',
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    marginTop: '4px',
                                    display: 'inline-block'
                                }}>{user?.role}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Username</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user?.username}</span>
                        </div>
                    </Card>

                    {/* Manage Teams Card */}
                    <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1rem'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.75rem 0', fontWeight: 700 }}>Manage Teams</h3>
                        <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Oversee team formations</p>
                        <Button onClick={() => navigate('/admin/teams')} style={{ padding: '8px 24px', fontSize: '0.875rem', width: 'auto' }}>Open</Button>
                    </Card>

                    {/* Task Creation Card */}
                    <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            color: '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1rem'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                            </svg>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.75rem 0', fontWeight: 700 }}>Task Creation</h3>
                        <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Design and assign project deliverables to teams</p>
                        <Button onClick={() => navigate('/admin/tasks')} style={{ padding: '8px 24px', fontSize: '0.875rem', width: 'auto' }}>Open</Button>
                    </Card>

                    {/* User Management Card */}
                    {userActions.map((action, index) => (
                        <Card key={index} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1rem',
                                fontSize: '1.5rem'
                            }}>
                                ⚙️
                            </div>
                            <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.75rem 0', fontWeight: 700 }}>{action.label.replace('⚙️ ', '')}</h3>
                            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{action.description}</p>
                            <Button
                                onClick={() => navigate(action.path)}
                                style={{ padding: '8px 24px', fontSize: '0.875rem', width: 'auto' }}
                            >
                                Open
                            </Button>
                        </Card>
                    ))}
                </div>
            )}

            {user?.role === 'ADMIN' && <AdminDashboardUI />}
            {user?.role === 'LEARNER' && <LearnerDashboardUI />}
            {user?.role === 'PROFESSOR' && <ProfessorDashboardUI />}

        </AdminLayout>
    );
};

export default Dashboard;
