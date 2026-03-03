import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Card, Input, Button } from '../components/ui';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/login/', { username, password });
            const userResponse = await api.get('/auth/me/');
            login(userResponse.data);

            const role = userResponse.data.role;
            if (role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else if (role === 'PROFESSOR') {
                navigate('/professor/dashboard');
            } else {
                navigate('/learner/dashboard');
            }
        } catch (err: any) {
            setError('Invalid credentials. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <AuthLayout>
            <Card className="login-card" style={{ textAlign: 'center' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Welcome Back</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
                    Enter your credentials to manage your projects.
                </p>

                {error && <div className="error-text" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <Input
                        label="Username or Email"
                        name="username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g. student@ university.edu"
                        required
                    />

                    <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label className="label">Password</label>
                            <a href="#" style={{ fontSize: '0.75rem' }}>Forgot password?</a>
                        </div>
                        <Input
                            label=""
                            type="password"
                            name="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <Button type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>
            </Card>
        </AuthLayout>
    );
};

export default Login;
