import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card } from '../components/ui';
import AdminLayout from '../layouts/AdminLayout';

interface Document {
    id: number;
    title: string;
    description: string;
    file_url: string;
    updated_at: string;
}

const Documents: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await api.get('/documents/');
                if (response.data.length === 0) {
                    // Provide a default mock document if none exist yet
                    setDocuments([{
                        id: 1,
                        title: 'Capstone Guideline PDF',
                        description: 'Official guidelines and requirements for the final capstone project submission.',
                        file_url: '#',
                        updated_at: new Date().toISOString()
                    }]);
                } else {
                    setDocuments(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch documents", error);
                // Fallback dummy for demonstration
                setDocuments([{
                    id: 1,
                    title: 'Capstone Guideline PDF',
                    description: 'Official guidelines and requirements for the final capstone project submission.',
                    file_url: '#',
                    updated_at: new Date().toISOString()
                }]);
            } finally {
                setLoading(false);
            }
        };
        fetchDocuments();
    }, []);

    if (loading) return (
        <AdminLayout title="Documents" breadcrumb={['Dashboard', 'Documents']}>
            <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading documents...</div>
        </AdminLayout>
    );

    return (
        <AdminLayout title="Documents" breadcrumb={['Dashboard', 'Documents']}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>View Related Documents and Guidelines for your Capstone Project</p>
                </header>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {documents.length === 0 ? (
                        <Card>
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No Documents to Show yet</p>
                        </Card>
                    ) : (
                        documents.map(doc => (
                            <Card key={doc.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{doc.title}</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>{doc.description}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: 'var(--primary-blue)',
                                                textDecoration: 'none',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            Download
                                        </a>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default Documents;
