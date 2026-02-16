import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Card, Input, Button } from '../components/ui';

const AdminRegister: React.FC = () => {
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
            await api.post('/auth/register/admin/', formData);
            alert('Admin Registration successful! Please login.');
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
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Platform Administrator</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
                    Create an administrative account for full system access.
                </p>

                {error && <div className="error-text" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Admin" required />
                        <Input label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="User" required />
                    </div>
                    <Input label="Username" name="username" value={formData.username} onChange={handleChange} placeholder="admin_portal" required />
                    <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="it.admin@university.edu" required />
                    <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />

                    <Button type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? 'Creating Admin...' : 'Register as Admin'}
                    </Button>
                </form>

                <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--card-border)' }}></div>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Back to <Link to="/login">Sign In</Link>
                </p>
                <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    CAUTION: Admin accounts have destructive capabilities.
                </p>
            </Card>
        </AuthLayout>
    );
};

export default AdminRegister;
