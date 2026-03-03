import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card } from '../components/ui';

interface TeamMember {
    id: number;
    user_details: {
        username: string;
        first_name: string;
        last_name: string;
    };
}

interface Team {
    id: number;
    name: string;
    cohort_details: {
        name: string;
        program_details?: {
            name: string;
        };
    };
    members: TeamMember[];
}

const Teams: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await api.get('/teams/');
                setTeams(response.data);
            } catch (error) {
                console.error("Failed to fetch teams", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeams();
    }, []);

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading team data...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Team View</h1>
                <p style={{ color: 'var(--text-secondary)' }}>View your team members and cohort information.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                {teams.length === 0 ? (
                    <Card>
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>You are not currently assigned to any team.</p>
                    </Card>
                ) : (
                    teams.map(team => (
                        <Card key={team.id}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary-blue)' }}>{team.name}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                Cohort: {team.cohort_details.name}
                                {team.cohort_details.program_details && ` | ${team.cohort_details.program_details.name}`}
                            </p>

                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem' }}>Team Roster</h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {team.members?.map(member => (
                                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.2)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                            {member.user_details.first_name[0]}{member.user_details.last_name[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{member.user_details.first_name} {member.user_details.last_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{member.user_details.username}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default Teams;
