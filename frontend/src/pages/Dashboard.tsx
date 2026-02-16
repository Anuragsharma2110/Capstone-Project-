import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/ui';

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', maxWidth: '1200px', margin: '0 auto 3rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem' }}>Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Welcome back, {user?.first_name || user?.username}</p>
                </div>
                <Button onClick={handleLogout} variant="outline" style={{ width: 'auto' }}>Sign Out</Button>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <Card>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            👤 Profile Information
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Username:</span>
                                <span>{user?.username}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                                <span>{user?.email}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Role:</span>
                                <span style={{
                                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                    color: 'var(--primary-blue)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontWeight: '600',
                                    fontSize: '0.75rem'
                                }}>{user?.role}</span>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 style={{ marginBottom: '1rem' }}>🚀 Current Activity</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Your capstone projects and submissions will appear here once the coordinator sets up the active cohort.
                        </p>
                        <Button variant="outline" style={{ marginTop: '1.5rem' }}>View Projects</Button>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
