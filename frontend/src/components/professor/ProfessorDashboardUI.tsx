import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import './ProfessorDashboardUI.css';

const ProfessorDashboardUI: React.FC = () => {
    const { user } = useAuth();
    const firstName = user?.first_name || user?.username || 'Professor';

    const [stats, setStats] = useState({ cohorts: 0, pendingEvals: 0, avgProgress: 0 });
    const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [cohortsRes, tasksRes, teamsRes, subsRes] = await Promise.all([
                    axiosInstance.get('/cohorts/'),
                    axiosInstance.get('/tasks/'),
                    axiosInstance.get('/teams/'),
                    axiosInstance.get('/submissions/')
                ]);
                const cohorts = cohortsRes.data;
                const tasks = tasksRes.data;
                const teams = teamsRes.data;
                const submissions = subsRes.data;

                const pendingCount = submissions.filter((s: any) => !s.has_evaluations).length;

                const expectedSubmissions = teams.length * tasks.length;
                let calculatedProgress = 0;
                if (expectedSubmissions > 0) {
                    calculatedProgress = Math.min(100, Math.round((submissions.length / expectedSubmissions) * 100));
                }

                setStats({
                    cohorts: cohorts.length,
                    pendingEvals: pendingCount,
                    avgProgress: calculatedProgress
                });

                const now = new Date();
                const upcoming = tasks
                    .filter((t: any) => new Date(t.deadline) > now)
                    .map((t: any) => {
                        const cohort = cohorts.find((c: any) => c.id === t.cohort);
                        return {
                            ...t,
                            cohortName: cohort ? cohort.name : 'Unknown Cohort'
                        };
                    })
                    .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                    .slice(0, 5); // Display next 5 upcoming deadlines
                
                setUpcomingTasks(upcoming);

            } catch (err) {
                console.error("Failed to fetch professor dashboard data", err);
            }
        };
        fetchDashboardData();
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
                            {stats.pendingEvals}
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
                        <div className="prof-stat-value">{stats.avgProgress}%</div>
                        <div className="prof-stat-progress">
                            <div className="prof-stat-progress-bar">
                                <div className="prof-stat-progress-fill" style={{ width: `${stats.avgProgress}%` }}></div>
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

                    {upcomingTasks.length > 0 ? upcomingTasks.map((t, i) => {
                        const d = new Date(t.deadline);
                        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                        const day = d.getDate().toString();
                        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const detail = `${time} • All Teams • ${t.cohortName}`;
                        
                        return (
                            <div className="deadline-item" key={i}>
                                <div className="deadline-date-block">
                                    <span className="deadline-month">{month}</span>
                                    <span className="deadline-day">{day}</span>
                                </div>
                                <div className="deadline-info">
                                    <span className="deadline-name">{t.title}</span>
                                    <span className="deadline-detail">{detail}</span>
                                </div>
                            </div>
                        );
                    }) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No upcoming deadlines for your assigned cohorts.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ProfessorDashboardUI;
