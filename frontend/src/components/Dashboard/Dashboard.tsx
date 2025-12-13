/**
 * Metrics dashboard component - Shows per-chain in/out for last minute (USDC/USYC)
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api';
import { ChainMinuteMetrics } from '../../types/metrics';

const Dashboard: React.FC = () => {
  const [chainMetrics, setChainMetrics] = useState<ChainMinuteMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();

    // Refresh every 10 seconds
    const interval = setInterval(loadMetrics, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await apiClient.getChainMinuteMetrics();
      setChainMetrics(data);
      setLoading(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>
        Loading metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#ef4444', textAlign: 'center' }}>
        Error loading metrics: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>CCTP Metrics - Last Minute</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>
          Incoming and outgoing volumes per chain (USDC & USYC)
        </p>
      </div>

      {/* Chain Metrics Table */}
      <div style={{
        background: '#1e293b',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #334155',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontWeight: 'normal' }}>Chain</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontWeight: 'normal' }} colSpan={2}>Incoming</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontWeight: 'normal' }} colSpan={2}>Outgoing</th>
            </tr>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th></th>
              <th style={{ padding: '8px', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: 'normal' }}>USDC</th>
              <th style={{ padding: '8px', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: 'normal' }}>USYC</th>
              <th style={{ padding: '8px', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: 'normal' }}>USDC</th>
              <th style={{ padding: '8px', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: 'normal' }}>USYC</th>
            </tr>
          </thead>
          <tbody>
            {chainMetrics.map(chain => (
              <tr key={chain.domain} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>{chain.name}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>
                  ${(parseFloat(chain.incomingUSDC) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>
                  ${(parseFloat(chain.incomingUSYC) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#3b82f6' }}>
                  ${(parseFloat(chain.outgoingUSDC) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#3b82f6' }}>
                  ${(parseFloat(chain.outgoingUSYC) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {chainMetrics.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  No data available for the last minute
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;

