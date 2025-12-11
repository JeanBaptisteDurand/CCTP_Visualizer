/**
 * Per-chain statistics component
 */

import React from 'react';
import { ChainMetrics } from '../../types/metrics';

interface ChainStatsProps {
  chains: ChainMetrics[];
}

const ChainStats: React.FC<ChainStatsProps> = ({ chains }) => {
  return (
    <div style={{
      background: '#1e293b',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #334155'
    }}>
      <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 'bold' }}>Chain Statistics</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontWeight: 'normal' }}>Chain</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontWeight: 'normal' }}>Inbound</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontWeight: 'normal' }}>Outbound</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontWeight: 'normal' }}>Volume In</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontWeight: 'normal' }}>Volume Out</th>
            </tr>
          </thead>
          <tbody>
            {chains.map(chain => (
              <tr key={chain.domain} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px' }}>{chain.name}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{chain.inboundCount}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{chain.outboundCount}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>
                  ${(parseFloat(chain.inboundVolume) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#3b82f6' }}>
                  ${(parseFloat(chain.outboundVolume) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChainStats;

