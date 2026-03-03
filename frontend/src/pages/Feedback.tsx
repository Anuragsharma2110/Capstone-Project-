import React from 'react';
import { Card } from '../components/ui';
import AdminLayout from '../layouts/AdminLayout';

interface FeedbackItem {
    id: string;
    author: string;
    text: string;
    time: string;
    color?: string;
}

const dummyFeedback: FeedbackItem[] = [
    {
        id: 'f1',
        author: 'Prof. Julian Vane',
        text: 'The system architecture diagram is solid. Make sure you address the scalability concerns we discussed in the lab session.',
        time: '2 hours ago',
        color: '#2563eb' // Blue
    },
    {
        id: 'f2',
        author: 'Dr. Sarah Miller',
        text: 'Excellent work on the UI mockups. The accessibility scores are looking much better this sprint.',
        time: 'Yesterday',
        color: '#f59e0b' // Amber/Orange
    }
];

const Feedback: React.FC = () => {
    return (
        <AdminLayout title="Faculty Feedback" breadcrumb={['Dashboard', 'Feedback']}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
                padding: '2rem 1rem',
                width: '100%'
            }}>
                <div style={{
                    maxWidth: '1100px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Project Feedback</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>Review evaluations and comments from your project faculty.</p>
                    </header>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
                        gap: '2rem'
                    }}>
                        {dummyFeedback.map((item) => (
                            <Card key={item.id} style={{
                                padding: '2.5rem',
                                borderLeft: `5px solid ${item.color || 'var(--primary)'}`,
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                cursor: 'default',
                                background: 'var(--bg-card)',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            background: `${item.color}15`,
                                            color: item.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            fontSize: '1.125rem',
                                            boxShadow: `inset 0 0 0 1px ${item.color}30`
                                        }}>
                                            {item.author.split(' ').pop()?.charAt(0)}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                                                {item.author}
                                            </div>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Project Faculty</div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: '20px' }}>{item.time}</span>
                                </div>
                                <div style={{
                                    position: 'relative',
                                    padding: '1.5rem 2rem',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-color)',
                                    flex: 1
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: '0.75rem',
                                        top: '0.5rem',
                                        fontSize: '3rem',
                                        opacity: 0.1,
                                        fontFamily: 'serif',
                                        color: item.color
                                    }}>"</span>
                                    <p style={{
                                        fontSize: '1.125rem',
                                        color: 'var(--text-main)',
                                        lineHeight: '1.75',
                                        fontStyle: 'italic',
                                        margin: 0,
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        {item.text}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {dummyFeedback.length === 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Card style={{ textAlign: 'center', padding: '5rem 2rem', border: '2px dashed var(--border-color)', background: 'transparent', maxWidth: '600px', width: '100%' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.5 }}>💬</div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No feedback yet</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Your project feedback will appear here as soon as faculty provides it.</p>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default Feedback;
