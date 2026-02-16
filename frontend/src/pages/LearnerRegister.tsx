import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Card, Input, Button } from '../components/ui';

const LearnerRegister: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/register/learner/', formData);
            alert('Learner Registration successful! Please login.');
            navigate('/login');
        } catch (err: any) {
            setError('Registration failed. Username might be taken.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Card style={{ textAlign: 'center' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Join as a Learner</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
                    Create your student account to join cohorts.
                </p>

                {error && <div className="error-text" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="John" required />
                        <Input label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Doe" required />
                    </div>
                    <Input label="Username" name="username" value={formData.username} onChange={handleChange} placeholder="johndoe123" required />
                    <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john.doe@university.edu" required />
                    <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a strong password" required />

                    <Button type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? 'Creating Account...' : 'Register as Learner'}
                    </Button>
                </form>

                <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--card-border)' }}></div>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </Card>
        </AuthLayout>
    );
};

export default LearnerRegister;
