import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '../components/ui';

const Home: React.FC = () => {
    return (
        <AuthLayout>
            <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', background: 'linear-gradient(to right, #60a5fa, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1.2' }}>
                    Streamlining Your Capstone Journey
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                    The management platform for learners, faculty, and administrators to collaborate on projects.
                </p>

                <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                    <Link to="/register/learner">
                        <Button style={{ padding: '0.875rem 2rem', fontSize: '1.125rem' }}>Register as Learner</Button>
                    </Link>
                    <Link to="/login">
                        <Button variant="outline" style={{ padding: '0.875rem 2rem', fontSize: '1.125rem' }}>Sign In to Portal</Button>
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
};

export default Home;
