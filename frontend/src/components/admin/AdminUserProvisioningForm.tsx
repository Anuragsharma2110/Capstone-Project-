import React, { useState } from 'react';
import { Card, Input, Button } from '../ui';
import api from '../../api/axios';

const AdminUserProvisioningForm: React.FC = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: 'PROFESSOR',
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Mapping UI role to the correct backend endpoint
            const endpoint = formData.role === 'ADMIN' ? '/auth/register/admin/' : '/auth/register/professor/';

            // Generate a username from email for MVP
            const username = formData.email.split('@')[0] + Math.floor(Math.random() * 1000);

            // Submit with MVP placeholder password. User will be forced to change it.
            const payload = {
                ...formData,
                username,
                password: 'TempPassword123!', // MVP placeholder
            };

            await api.post(endpoint, payload);

            setMessage({ type: 'success', text: `Successfully provisioned ${formData.role} account for ${formData.email}. Placeholder password: TempPassword123!` });

            // Reset form
            setFormData({ first_name: '', last_name: '', email: '', role: 'PROFESSOR' });
        } catch (err: any) {
            console.error('Provisioning error:', err);
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to provision user. Email or username might already exist.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Provision New User
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                Securely create accounts for Faculty and Administrators.
            </p>

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

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <Input
                        label="First Name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="e.g. Jane"
                        required
                    />
                    <Input
                        label="Last Name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="e.g. Doe"
                        required
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <Input
                        label="Email Address"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="user@university.edu"
                        required
                    />
                </div>

                <div className="input-container" style={{ marginBottom: '1.5rem' }}>
                    <label className="label">Account Role</label>
                    <select
                        className="input"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        style={{ cursor: 'pointer' }}
                    >
                        <option value="PROFESSOR">Professor (Faculty)</option>
                        <option value="ADMIN">Administrator</option>
                    </select>
                </div>

                <Button type="submit" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
            </form>
        </Card>
    );
};

export default AdminUserProvisioningForm;
