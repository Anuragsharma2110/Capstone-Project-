import React, { useState } from 'react';
import './AdminDashboardUI.css';

const AdminDashboardUI: React.FC = () => {
    const [filterStatus, setFilterStatus] = useState<string>('All');

    const teamData = [
        { id: 'NT', name: 'Nexus Tech', desc: 'AI Recommendation Engine', advisor: 'Dr. Alan Turing', status: 'Approved', active: 3, color: '#1e3a8a' },
        { id: 'EG', name: 'Eco Grid', desc: 'Smart Energy Monitor', advisor: 'Dr. Maria Garcia', status: 'In Review', active: 3, color: '#92400e' },
        { id: 'QZ', name: 'Quantum Zero', desc: 'Cryptography Library', advisor: 'Unassigned', status: 'Drafting', active: 1, color: '#334155' },
        { id: 'VB', name: 'Vocal Bridge', desc: 'ASL Interpreter App', advisor: 'Dr. Sarah Chen', status: 'Approved', active: 4, color: '#1e40af' },
    ];

    const statuses = ['All', 'Approved', 'In Review', 'Drafting'];

    const handleFilterClick = () => {
        const currentIndex = statuses.indexOf(filterStatus);
        setFilterStatus(statuses[(currentIndex + 1) % statuses.length]);
    };

    const filteredTeams = filterStatus === 'All'
        ? teamData
        : teamData.filter(team => team.status === filterStatus);

    return (
        <div className="admin-dashboard-ui" style={{ marginTop: '-1rem' }}>
            {/* Team Performance Monitor */}
            <div className="performance-monitor-section">
                <div className="performance-header">
                    <h2 className="section-title">Team Performance Monitor</h2>
                    <div className="performance-actions">
                        <button className="filter-sort-btn" onClick={handleFilterClick}>Status: {filterStatus}</button>
                        <button className="filter-sort-btn" onClick={handleFilterClick}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="21" x2="4" y2="14" />
                                <line x1="4" y1="10" x2="4" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12" y2="3" />
                                <line x1="20" y1="21" x2="20" y2="16" />
                                <line x1="20" y1="12" x2="20" y2="3" />
                                <line x1="2" y1="14" x2="6" y2="14" />
                                <line x1="10" y1="12" x2="14" y2="12" />
                                <line x1="18" y1="16" x2="22" y2="16" />
                            </svg>
                        </button>
                    </div>
                </div>

                <table className="performance-table">
                    <thead>
                        <tr>
                            <th style={{ width: '30%' }}>Team Name</th>
                            <th style={{ width: '30%' }}>Faculty Advisor</th>
                            <th style={{ width: '20%' }}>Status</th>
                            <th style={{ width: '20%' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeams.map((team, i) => (
                            <tr key={i}>
                                <td>
                                    <div className="team-info-cell">
                                        <div className="team-initials" style={{ background: team.color }}>{team.id}</div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{team.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{team.desc}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="advisor-cell">
                                        {team.advisor !== 'Unassigned' && <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${team.advisor}`} className="advisor-avatar" alt="Advisor" />}
                                        <span style={{ color: team.advisor === 'Unassigned' ? 'var(--text-muted)' : 'var(--text-main)', fontStyle: team.advisor === 'Unassigned' ? 'italic' : 'normal' }}>{team.advisor}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${team.status === 'Approved' ? 'status-approved' : team.status === 'In Review' ? 'status-review' : 'status-drafting'}`}>
                                        {team.status}
                                    </span>
                                </td>
                                <td>
                                    <button className="action-icon-btn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboardUI;
