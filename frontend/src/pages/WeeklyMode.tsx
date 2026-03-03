import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, Button, Input } from '../components/ui';

interface WeeklyProgress {
    id: number;
    week_number: number;
    update_text: string;
    blockers: string;
    submitted_at: string;
}

import { useAuth } from '../context/AuthContext';

const WeeklyMode: React.FC = () => {
    const { user } = useAuth();
    const [progressLogs, setProgressLogs] = useState<WeeklyProgress[]>([]);
    const [newLog, setNewLog] = useState<{ week_number: number; update_text: string; blockers: string }>({ week_number: 1, update_text: '', blockers: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const response = await api.get('/weekly-progress/');
                setProgressLogs(response.data);
            } catch (error) {
                console.error("Failed to fetch progress", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.team_id) {
            alert("No team assigned. Please contact your administrator.");
            return;
        }
        try {
            const response = await api.post('/weekly-progress/', { ...newLog, team: user.team_id });
            setProgressLogs([response.data, ...progressLogs]);
            setNewLog({ week_number: newLog.week_number + 1, update_text: '', blockers: '' });
            alert("Weekly report submitted!");
        } catch (error) {
            console.error("Failed to submit report", error);
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading progress...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Weekly Mode</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Track your team's weekly accomplishments and flag blockers.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem' }}>
                <aside>
                    <Card>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Submit Weekly Report</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Week Number</label>
                                <Input
                                    type="number"
                                    value={newLog.week_number}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLog({ ...newLog, week_number: parseInt(e.target.value) })}
                                    placeholder="e.g. 1"
                                />
                            </div>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>What did you achieve this week?</label>
                                <textarea
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        color: 'white',
                                        minHeight: '120px',
                                        outline: 'none',
                                        width: '100%'
                                    }}
                                    value={newLog.update_text}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewLog({ ...newLog, update_text: e.target.value })}
                                    placeholder="Summary of work completed..."
                                />
                            </div>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Any blockers?</label>
                                <Input
                                    value={newLog.blockers}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLog({ ...newLog, blockers: e.target.value })}
                                    placeholder="e.g. Waiting on API credentials"
                                />
                            </div>
                            <Button type="submit">Submit Report</Button>
                        </form>
                    </Card>
                </aside>

                <main>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Progress History</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {progressLogs.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No reports submitted yet.</p>
                        ) : (
                            progressLogs.map(log => (
                                <Card key={log.id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <span style={{ fontWeight: '600', color: 'var(--primary-blue)' }}>Week {log.week_number}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.submitted_at).toLocaleDateString()}</span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{log.update_text}</p>
                                    {log.blockers && (
                                        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid #ef4444', borderRadius: '4px' }}>
                                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold', marginBottom: '0.25rem' }}>BLOCKERS</span>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.blockers}</p>
                                        </div>
                                    )}
                                </Card>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default WeeklyMode;
