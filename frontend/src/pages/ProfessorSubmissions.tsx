import React from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { useNavigate } from 'react-router-dom';

const ProfessorSubmissions: React.FC = () => {
    const navigate = useNavigate();

    const submissions = [
        { team: 'Team Alpha', doc: 'Final Project Proposal', time: '2H AGO', status: 'Pending Review' },
        { team: 'Team Quantum', doc: 'System Architecture Diagram', time: '5H AGO', status: 'Pending Review' },
        { team: 'Team Nova', doc: 'UI/UX Mockups Prototype', time: '8H AGO', status: 'Reviewed' },
        { team: 'Team Beta', doc: 'Midterm Report', time: '1D AGO', status: 'Reviewed' },
    ];

    return (
        <AdminLayout title="Team Submissions" breadcrumb={['Dashboard', 'Submissions']}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>

                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>All Submissions</h2>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <select style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }}>
                                <option>All Statuses</option>
                                <option>Pending Review</option>
                                <option>Reviewed</option>
                            </select>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Team</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Document</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Submitted</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((sub, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{sub.team}</td>
                                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{sub.doc}</td>
                                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{sub.time}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '99px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: sub.status === 'Pending Review' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            color: sub.status === 'Pending Review' ? '#f59e0b' : '#10b981'
                                        }}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => navigate(`/professor/submissions/${encodeURIComponent(sub.team)}`)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                                background: 'var(--primary)',
                                                color: 'white',
                                                border: 'none',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ProfessorSubmissions;
