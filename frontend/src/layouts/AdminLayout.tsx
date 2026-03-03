import React from 'react';
import Sidebar from '../components/admin/Sidebar';
import Header from '../components/admin/Header';
import './AdminLayout.css';

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
    breadcrumb?: string[];
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, breadcrumb }) => {
    return (
        <div className="admin-layout">
            <Sidebar />
            <div className="admin-main-content">
                <Header title={title} breadcrumb={breadcrumb} />
                <main className="admin-page-container">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
