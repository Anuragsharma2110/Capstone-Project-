import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import AdminUserProvisioningForm from '../components/admin/AdminUserProvisioningForm';
import api from '../api/axios';
import { Card } from '../components/ui';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users/');
      setUsers(response.data);
    } catch (err: any) {
      console.error('Failed to fetch admin users', err);
      setError(err.response?.data?.detail || 'Error loading admin users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <AdminLayout title="User Management" breadcrumb={['Dashboard', 'User Management']}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 0' }}>
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>User Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Provision new accounts and manage existing administrators.
          </p>
        </header>

        {/* Provisioning Form */}
        <AdminUserProvisioningForm />

        {/* Existing Admin Users List */}
        <Card style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Existing Admin Accounts
          </h2>

          {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading admin users...</p>}
          {error && <p style={{ color: 'var(--error-red)' }}>{error}</p>}
          {!loading && !error && users.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>No admin accounts found.</p>
          )}
          {!loading && !error && users.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color, #333)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>Username</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color, #222)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{user.username}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{user.email}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{user.first_name} {user.last_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
