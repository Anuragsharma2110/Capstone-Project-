import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Card, Button } from '../components/ui';

const Home: React.FC = () => {
    return (
        <AuthLayout>
            <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', background: 'linear-gradient(to right, #60a5fa, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Streamlining Your Capstone Journey
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                    The management platform for learners, faculty, and administrators to collaborate on projects.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                    <Card style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎓</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>For Learners</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1 }}>
                            Join teams, submit your progress, and receive direct feedback from faculty.
                        </p>
                        <Link to="/register/learner" style={{ width: '100%' }}>
                            <Button>Register as Learner</Button>
                        </Link>
                    </Card>

                    <Card style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👨‍🏫</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>For Professors</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1 }}>
                            Manage cohorts, review submissions, and evaluate student performance at scale.
                        </p>
                        <Link to="/register/professor" style={{ width: '100%' }}>
                            <Button variant="outline">Faculty Registration</Button>
                        </Link>
                    </Card>

                    <Card style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚙️</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>For Admins</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1 }}>
                            Full platform control, user management, and system configuration.
                        </p>
                        <Link to="/register/admin" style={{ width: '100%' }}>
                            <Button variant="outline">Admin Access</Button>
                        </Link>
                    </Card>
                </div>

                <div style={{ padding: '2rem', borderTop: '1px solid var(--card-border)' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Already part of the program?</p>
                    <Link to="/login">
                        <Button variant="outline" style={{ maxWidth: '200px' }}>Sign In to Portal</Button>
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
};

export default Home;
