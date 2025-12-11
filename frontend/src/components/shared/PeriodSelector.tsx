/**
 * Period selector component
 */

import React from 'react';
import { MetricsPeriod } from '../../types/metrics';

interface PeriodSelectorProps {
  value: MetricsPeriod;
  onChange: (period: MetricsPeriod) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => {
  const periods = [
    { value: MetricsPeriod.LAST_24H, label: 'Last 24 Hours' },
    { value: MetricsPeriod.LAST_7D, label: 'Last 7 Days' },
    { value: MetricsPeriod.CURRENT_MONTH, label: 'Current Month' }
  ];

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {periods.map(period => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #334155',
            background: value === period.value ? '#3b82f6' : '#1e293b',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

export default PeriodSelector;

