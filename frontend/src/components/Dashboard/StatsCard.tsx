/**
 * Stats card component
 */

import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle }) => {
  return (
    <div style={{
      background: '#1e293b',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #334155'
    }}>
      <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
        {title}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatsCard;

