import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, Button } from '../components/ui';

interface Nomination {
    id: number;
    user_details: {
        username: string;
        first_name: string;
        last_name: string;
    };
    program_details: {
        name: string;
    };
    status: string;
    statement_of_purpose: string;
    nominated_at: string;
}

const NominationManagement: React.FC = () => {
    const [nominations, setNominations] = useState<Nomination[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNominations = async () => {
            try {
                const response = await api.get('/nominations/');
                setNominations(response.data);
            } catch (error) {
                console.error("Failed to fetch nominations", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNominations();
    }, []);

    const handleAction = async (nominationId: number, status: string) => {
        try {
            await api.patch(`/nominations/${nominationId}/`, { status });
            setNominations(nominations.map(n => n.id === nominationId ? { ...n, status } : n));
        } catch (error) {
            console.error("Failed to update nomination", error);
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading nominations...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Nomination Management</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Review and vet candidate nominations for capstone programs.</p>
            </header>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {nominations.length === 0 ? (
                    <Card>
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No pending nominations.</p>
                    </Card>
                ) : (
                    nominations.map(nomination => (
                        <Card key={nomination.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                        {nomination.user_details.first_name} {nomination.user_details.last_name} ({nomination.user_details.username})
                                    </h3>
                                    <p style={{ color: 'var(--primary-blue)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                        Program: {nomination.program_details.name}
                                    </p>
                                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                            "{nomination.statement_of_purpose}"
                                        </p>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Submitted on: {new Date(nomination.nominated_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        backgroundColor: nomination.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.1)' : nomination.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                        color: nomination.status === 'APPROVED' ? '#22c55e' : nomination.status === 'REJECTED' ? '#ef4444' : '#eab308',
                                        fontWeight: 'bold'
                                    }}>
                                        {nomination.status}
                                    </span>
                                    {nomination.status === 'PENDING' && (
                                        <>
                                            <Button onClick={() => handleAction(nomination.id, 'APPROVED')} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Approve</Button>
                                            <Button onClick={() => handleAction(nomination.id, 'REJECTED')} variant="outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Reject</Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default NominationManagement;
