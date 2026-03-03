import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import './ProfessorDashboardUI.css';

const ProfessorDashboardUI: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const firstName = user?.first_name || user?.username || 'Professor';

    const [stats, setStats] = useState({ cohorts: 0, pendingEvals: 14, avgProgress: 72 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const cohortsRes = await axiosInstance.get('/cohorts/');
                setStats(prev => ({ ...prev, cohorts: cohortsRes.data.length }));
            } catch (err) {
                console.error("Failed to fetch professor stats", err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="professor-dashboard-container">

            {/* Header */}
            <div className="professor-header-section">
                <h1 className="professor-dashboard-title">Hello, {firstName}</h1>
                <p className="professor-dashboard-subtitle">Welcome back to your capstone management dashboard.</p>
            </div>

            {/* Stats Strip */}
            <div className="professor-stats-strip">
                {/* Total Cohorts */}
                <div className="prof-stat-card">
                    <div className="prof-stat-info">
                        <span className="prof-stat-label">Total Cohorts Assigned</span>
                        <div className="prof-stat-value">
                            {stats.cohorts}
                        </div>
                    </div>
                    <div className="prof-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                </div>

                {/* Pending Evaluations */}
                <div className="prof-stat-card">
                    <div className="prof-stat-info">
                        <span className="prof-stat-label">Pending Evaluations</span>
                        <div className="prof-stat-value">
                            14
                            <span className="prof-stat-sub">+5% from last week</span>
                        </div>
                    </div>
                    <div className="prof-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <path d="M9 14l2 2 4-4" />
                        </svg>
                    </div>
                </div>

                {/* Average Team Progress */}
                <div className="prof-stat-card">
                    <div className="prof-stat-info">
                        <span className="prof-stat-label">Average Team Progress</span>
                        <div className="prof-stat-value">72%</div>
                        <div className="prof-stat-progress">
                            <div className="prof-stat-progress-bar">
                                <div className="prof-stat-progress-fill" style={{ width: '72%' }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="prof-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                            <polyline points="16 7 22 7 22 13" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '2rem' }}>

                {/* To-Do: Needs Review */}
                <div className="needs-review-card">
                    <div className="needs-review-header">
                        <h2 className="needs-review-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                <path d="M9 14l2 2 4-4" />
                            </svg>
                            To-Do: Needs Review
                        </h2>
                        <span className="review-count-badge">12</span>
                    </div>

                    <div className="needs-review-horizontal-container">
                        {[
                            { team: 'Team Alpha', doc: 'Final Project Proposal', time: '2H AGO', avatars: 3 },
                            { team: 'Team Quantum', doc: 'System Architecture Diagram', time: '5H AGO', avatars: 2 },
                            { team: 'Team Nova', doc: 'UI/UX Mockups Prototype', time: '8H AGO', avatars: 2 },
                        ].map((item, i, arr) => (
                            <div className="review-item horizontal" key={i} style={{ borderRight: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                <div className="review-item-header">
                                    <span className="review-team-name">{item.team}</span>
                                    <span className="review-time">{item.time}</span>
                                </div>
                                <div className="review-item-doc">{item.doc}</div>
                                <div className="review-item-footer">
                                    <div className="reviewer-avatars">
                                        {[...Array(Math.min(item.avatars, 2))].map((_, j) => (
                                            <img
                                                key={j}
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.team}${j}`}
                                                className="reviewer-avatar"
                                                alt="reviewer"
                                            />
                                        ))}
                                        {item.avatars > 2 && (
                                            <div className="extra-reviewers">+{item.avatars - 2}</div>
                                        )}
                                    </div>
                                    <button
                                        className="review-btn"
                                        onClick={() => navigate(`/professor/submissions/${encodeURIComponent(item.team)}`)}
                                    >
                                        Review
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => navigate('/professor/submissions')}
                        className="view-all-submissions-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                    >
                        View All Submissions
                    </button>
                </div>

                {/* Upcoming Deadlines */}
                <div className="deadlines-card">
                    <div className="deadlines-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <h2 className="deadlines-title">Upcoming Deadlines</h2>
                    </div>

                    {[
                        { month: 'OCT', day: '24', name: 'Mid-semester Report', detail: '11:59 PM • All Teams' },
                        { month: 'OCT', day: '27', name: 'Peer Review Cycle #2', detail: 'Starting 9:00 AM' },
                    ].map((d, i) => (
                        <div className="deadline-item" key={i}>
                            <div className="deadline-date-block">
                                <span className="deadline-month">{d.month}</span>
                                <span className="deadline-day">{d.day}</span>
                            </div>
                            <div className="deadline-info">
                                <span className="deadline-name">{d.name}</span>
                                <span className="deadline-detail">{d.detail}</span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default ProfessorDashboardUI;
