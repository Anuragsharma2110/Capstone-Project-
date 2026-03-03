import React, { useState } from 'react';
import { Card, Input, Button } from '../components/ui';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Settings: React.FC = () => {
    const { user } = useAuth();
    const { theme } = useTheme();

    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (formData.new_password !== formData.confirm_password) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        setLoading(true);

        try {
            await api.put('/auth/change-password/', {
                old_password: formData.old_password,
                new_password: formData.new_password,
            });
            setMessage({ type: 'success', text: 'Password successfully updated.' });
            setFormData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.old_password?.[0] || err.response?.data?.detail || 'Failed to update password.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '2rem', color: 'var(--text-main)' }}>
            <div style={{ width: '100%', maxWidth: '600px' }}>
                <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Account Settings</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your account security and preferences.</p>
                </header>

                <Card style={{ margin: '0 auto' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Change Password
                    </h2>

                    {message && (
                        <div style={{
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            borderRadius: '8px',
                            backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? 'var(--success-green)' : 'var(--error-red)',
                            border: `1px solid ${message.type === 'success' ? 'var(--success-green)' : 'var(--error-red)'}`
                        }}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                        <Input
                            label="Current Password"
                            type="password"
                            name="old_password"
                            value={formData.old_password}
                            onChange={handleChange}
                            required
                        />

                        <div style={{ height: '1rem' }} />

                        <Input
                            label="New Password"
                            type="password"
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            required
                        />

                        <div style={{ marginTop: '1.5rem' }}>
                            <Button type="submit" disabled={loading} style={{ width: '100%' }}>
                                {loading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
