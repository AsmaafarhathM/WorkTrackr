import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  subtext?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  subtext,
  color = 'var(--primary)',
}) => {
  return (
    <div className="glass-card stat-card" id={`stat-card-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div>
        <span className="stat-label">{label}</span>
        <div className="stat-value">{value}</div>
        {(trend || subtext) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.78rem' }}>
            {trend && <span style={{ color: '#10b981', fontWeight: 600 }}>{trend}</span>}
            {subtext && <span style={{ color: 'var(--text-subtle)' }}>{subtext}</span>}
          </div>
        )}
      </div>

      <div className="stat-icon-wrapper" style={{ color }}>
        {icon}
      </div>
    </div>
  );
};
