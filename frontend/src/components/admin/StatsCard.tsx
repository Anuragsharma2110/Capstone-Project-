import React from 'react';
import './CardComponents.css';

interface StatsCardProps {
    label: string;
    value: string;
    trend?: string;
    trendType?: 'up' | 'down' | 'warning' | 'muted';
    icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, trend, trendType = 'muted', icon }) => {
    return (
        <div className="stats-card">
            <div className="stats-header">
                <span className="stats-label">{label}</span>
                <div className="stats-icon-wrapper">{icon}</div>
            </div>
            <div className="stats-value">{value}</div>
            {trend && (
                <div className={`stats-trend trend-${trendType}`}>
                    {trendType === 'up' && <span>↑</span>}
                    {trendType === 'down' && <span>↓</span>}
                    <span>{trend}</span>
                </div>
            )}
        </div>
    );
};

export default StatsCard;
