/**
 * Anomalies list component
 */

import React from 'react';
import { Anomaly } from '../../types/metrics';

interface AnomaliesListProps {
  anomalies: Anomaly[];
}

const AnomaliesList: React.FC<AnomaliesListProps> = ({ anomalies }) => {
  return (
    <div style={{
      background: '#1e293b',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #334155'
    }}>
      <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 'bold', color: '#ef4444' }}>
        ⚠️ Anomalies ({anomalies.length})
      </h2>
      <div style={{ display: 'grid', gap: '12px' }}>
        {anomalies.map(anomaly => (
          <div key={anomaly.transferId} style={{
            background: '#0f172a',
            padding: '12px',
            borderRadius: '4px',
            borderLeft: '4px solid #ef4444'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#ef4444' }}>
                {anomaly.type.replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {anomaly.transferId}
              </span>
            </div>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>
              {anomaly.description}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Burned at: {new Date(anomaly.burnAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnomaliesList;

