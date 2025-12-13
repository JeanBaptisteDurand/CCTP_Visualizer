/**
 * Period selector component
 */

import React from 'react';
import { Period } from '../../services/api';

interface PeriodSelectorProps {
    selected: Period;
    onChange: (period: Period) => void;
}

const PERIODS: Array<{ value: Period; label: string }> = [
    { value: '1min', label: 'Last Minute' },
    { value: '5min', label: 'Last 5 Minutes' },
    { value: '15min', label: 'Last 15 Minutes' },
    { value: '1h', label: 'Last Hour' },
    { value: '4h', label: 'Last 4 Hours' },
    { value: '24h', label: 'Last 24 Hours' },
];

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ selected, onChange }) => {
    return (
        <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center'
        }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Period:</span>
            {PERIODS.map(period => (
                <button
                    key={period.value}
                    onClick={() => onChange(period.value)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: selected === period.value ? '#3b82f6' : '#334155',
                        background: selected === period.value ? '#1e3a8a' : '#1e293b',
                        color: selected === period.value ? '#fff' : '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: selected === period.value ? '500' : 'normal',
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

