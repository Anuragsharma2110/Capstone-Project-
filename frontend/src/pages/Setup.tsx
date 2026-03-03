import React from 'react';
import AdminUserProvisioningForm from '../components/admin/AdminUserProvisioningForm';
import AdminLayout from '../layouts/AdminLayout';

const Setup: React.FC = () => {
    return (
        <AdminLayout title="User Management" breadcrumb={['Dashboard', 'User Management']}>
            <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                padding: '2rem 0'
            }}>
                <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>User Management</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        Securely create and manage accounts for Faculty and Administrators.
                    </p>
                </header>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '100%' }}>
                        <AdminUserProvisioningForm />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Setup;
