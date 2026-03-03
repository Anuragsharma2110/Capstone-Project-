import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, Button } from '../components/ui';

interface Program {
    id: number;
    name: string;
    description: string;
    nomination_start_date: string;
    nomination_end_date: string;
}

const ProgramCatalog: React.FC = () => {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const response = await api.get('/programs/');
                setPrograms(response.data);
            } catch (error) {
                console.error("Failed to fetch programs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPrograms();
    }, []);

    const handleNominate = async (programId: number) => {
        try {
            await api.post('/nominations/', { program: programId, statement_of_purpose: "Interested in this program." });
            alert("Nomination submitted successfully!");
        } catch (error) {
            console.error("Nomination failed", error);
            alert("Failed to submit nomination.");
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading programs...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Program Catalog</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Discover available capstone programs and submit your nomination.</p>
            </header>

            {programs.length === 0 ? (
                <Card>
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                        No programs are currently open for nominations.
                    </p>
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                    {programs.map(program => (
                        <Card key={program.id} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary-blue)' }}>{program.name}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                    {program.description || "No description provided."}
                                </p>
                                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Starts:</span>
                                        <span style={{ fontWeight: '600' }}>{program.nomination_start_date}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Ends:</span>
                                        <span style={{ fontWeight: '600' }}>{program.nomination_end_date}</span>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={() => handleNominate(program.id)} style={{ width: '100%' }}>
                                Submit Nomination
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProgramCatalog;
