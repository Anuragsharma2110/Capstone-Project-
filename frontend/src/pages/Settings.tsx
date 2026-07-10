import React, { useState, useEffect } from 'react';
import { Card, Input, Button } from '../components/ui';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../layouts/AdminLayout';

const Settings: React.FC = () => {
    const { user, login } = useAuth();

    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

    // Profile State
    const [profileData, setProfileData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
    });
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Password State
    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Sync user data to profile state when user context is available
    useEffect(() => {
        if (user) {
            setProfileData({
                username: user.username || '',
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
            });
        }
    }, [user]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMessage(null);
        setProfileLoading(true);

        try {
            // Updating user profile via /auth/me/ endpoint
            // Only sending username as per backend restrictions
            const response = await api.put('/auth/me/', { username: profileData.username });
            setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });

            // Refresh local auth state if possible (assuming login can refresh the user object)
            if (response.data) {
                login(response.data);
            }
        } catch (err) {
            const e = err as { response?: { data?: { detail?: string; username?: string[] } } };
            const errorData = e.response?.data;
            let errorMessage = 'Failed to update profile. Please try again.';

            if (errorData?.username) {
                errorMessage = errorData.username[0];
            } else if (errorData?.detail) {
                errorMessage = errorData.detail;
            }

            setProfileMessage({
                type: 'error',
                text: errorMessage
            });
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (formData.new_password !== formData.confirm_password) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        setPasswordLoading(true);

        try {
            await api.put('/auth/change-password/', {
                old_password: formData.old_password,
                new_password: formData.new_password,
            });
            setPasswordMessage({ type: 'success', text: 'Password successfully updated.' });
            setFormData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            const e = err as { response?: { data?: { detail?: string; old_password?: string[] } } };
            setPasswordMessage({
                type: 'error',
                text: e.response?.data?.old_password?.[0] || e.response?.data?.detail || 'Failed to update password.'
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <AdminLayout title="Settings" breadcrumb={['Settings']}>
            <div style={{ padding: '1rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '600px', marginTop: '1rem' }}>
                    <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Account Settings</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Manage your account security and preferences.</p>
                    </header>

                    <div style={{
                        display: 'flex',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '99px',
                        padding: '0.5rem',
                        margin: '0 auto 2rem',
                        width: 'fit-content',
                        gap: '0.5rem'
                    }}>
                        <button
                            onClick={() => { setActiveTab('profile'); setProfileMessage(null); setPasswordMessage(null); }}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '99px',
                                border: 'none',
                                background: activeTab === 'profile' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'profile' ? '#fff' : 'var(--text-secondary)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Edit Profile
                        </button>
                        <button
                            onClick={() => { setActiveTab('password'); setProfileMessage(null); setPasswordMessage(null); }}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '99px',
                                border: 'none',
                                background: activeTab === 'password' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'password' ? '#fff' : 'var(--text-secondary)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Password
                        </button>
                    </div>

                    {activeTab === 'profile' && (
                        <Card style={{ margin: '0 auto' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}>
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                Edit Profile
                            </h2>

                            {profileMessage && (
                                <div style={{
                                    padding: '1rem',
                                    marginBottom: '1.5rem',
                                    borderRadius: '8px',
                                    backgroundColor: profileMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: profileMessage.type === 'success' ? 'var(--success-green)' : 'var(--error-red)',
                                    border: `1px solid ${profileMessage.type === 'success' ? 'var(--success-green)' : 'var(--error-red)'}`
                                }}>
                                    {profileMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleProfileSubmit} style={{ width: '100%' }}>
                                <Input
                                    label="Username (Display ID)"
                                    type="text"
                                    name="username"
                                    value={profileData.username}
                                    onChange={handleProfileChange}
                                    required
                                    placeholder="Enter your unique username"
                                />

                                <div style={{ height: '1rem' }} />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <Input
                                        label="First Name"
                                        type="text"
                                        name="first_name"
                                        value={profileData.first_name}
                                        readOnly
                                        style={{ opacity: 0.7, cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' }}
                                    />
                                    <Input
                                        label="Last Name"
                                        type="text"
                                        name="last_name"
                                        value={profileData.last_name}
                                        readOnly
                                        style={{ opacity: 0.7, cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' }}
                                    />
                                </div>

                                <div style={{ height: '1rem' }} />

                                <Input
                                    label="Email (Permanent)"
                                    type="email"
                                    name="email"
                                    value={profileData.email}
                                    readOnly
                                    style={{ opacity: 0.7, cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' }}
                                />

                                <div style={{ height: '1rem' }} />

                                <Input
                                    label="Role"
                                    type="text"
                                    name="role"
                                    value={user?.role || ''}
                                    readOnly
                                    style={{
                                        textTransform: 'capitalize'
                                    }}
                                />

                                <div style={{ marginTop: '1.5rem' }}>
                                    <Button type="submit" disabled={profileLoading} style={{ width: '100%' }}>
                                        {profileLoading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {activeTab === 'password' && (
                        <Card style={{ margin: '0 auto' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}>
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                Change Password
                            </h2>

                            {passwordMessage && (
                                <div style={{
                                    padding: '1rem',
                                    marginBottom: '1.5rem',
                                    borderRadius: '8px',
                                    backgroundColor: passwordMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: passwordMessage.type === 'success' ? 'var(--success-green)' : 'var(--error-red)',
                                    border: `1px solid ${passwordMessage.type === 'success' ? 'var(--success-green)' : 'var(--error-red)'}`
                                }}>
                                    {passwordMessage.text}
                                </div>
                            )}

                            <form onSubmit={handlePasswordSubmit} style={{ width: '100%' }}>
                                <Input
                                    label="Current Password"
                                    type="password"
                                    name="old_password"
                                    value={formData.old_password}
                                    onChange={handlePasswordChange}
                                    required
                                />

                                <div style={{ height: '1rem' }} />

                                <Input
                                    label="New Password"
                                    type="password"
                                    name="new_password"
                                    value={formData.new_password}
                                    onChange={handlePasswordChange}
                                    required
                                />
                                <Input
                                    label="Confirm New Password"
                                    type="password"
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handlePasswordChange}
                                    required
                                />

                                <div style={{ marginTop: '1.5rem' }}>
                                    <Button type="submit" disabled={passwordLoading} style={{ width: '100%' }}>
                                        {passwordLoading ? 'Updating...' : 'Update Password'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default Settings;
