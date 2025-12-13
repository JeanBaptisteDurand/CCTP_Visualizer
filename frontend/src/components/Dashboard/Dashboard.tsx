/**
 * Metrics dashboard component - Enhanced with period selector, volume chart, and expandable chain details
 */

import React, { useEffect, useState } from 'react';
import { apiClient, Period } from '../../services/api';
import { ChainMinuteMetrics } from '../../types/metrics';
import PeriodSelector from '../shared/PeriodSelector';
import VolumeChart from './VolumeChart';
import ChainRow from './ChainRow';

const PERIOD_LABELS: Record<Period, string> = {
  '1min': 'Last Minute',
  '5min': 'Last 5 Minutes',
  '15min': 'Last 15 Minutes',
  '1h': 'Last Hour',
  '4h': 'Last 4 Hours',
  '24h': 'Last 24 Hours',
};

const Dashboard: React.FC = () => {
  const [chainMetrics, setChainMetrics] = useState<ChainMinuteMetrics[]>([]);
  const [totalVolume, setTotalVolume] = useState<{ in: string; out: string; total: string } | null>(null);
  const [chartData, setChartData] = useState<Array<{ time: string; in: string; out: string; total: string }>>([]);
  const [period, setPeriod] = useState<Period>('24h');
  const [expandedChain, setExpandedChain] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [period]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [metrics, volume, chart] = await Promise.all([
        apiClient.getChainMetrics(period),
        apiClient.getTotalVolume(period),
        apiClient.getVolumeChart(period, 20),
      ]);
      setChainMetrics(metrics);
      setTotalVolume(volume);
      setChartData(chart);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChainToggle = (domain: number) => {
    setExpandedChain(expandedChain === domain ? null : domain);
  };

  // Calculate total volume for percentage calculation
  const totalVol = chainMetrics.reduce((sum, chain) => {
    return sum + parseFloat(chain.incomingUSDC) + parseFloat(chain.outgoingUSDC);
  }, 0);

  if (loading && chainMetrics.length === 0) {
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
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>CCTP Network Explorer</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px', marginBottom: '16px' }}>
          Cross-Chain Transfer Protocol metrics across 13 EVM chains
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <PeriodSelector selected={period} onChange={setPeriod} />
          <span style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
            Showing data for: <strong style={{ color: '#94a3b8' }}>{PERIOD_LABELS[period]}</strong>
          </span>
        </div>
      </div>

      {/* Total Volume Stats */}
      {totalVolume && (
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #334155',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Total Volume</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
              ${(parseFloat(totalVolume.total) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}M
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Total Incoming</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              ${(parseFloat(totalVolume.in) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}M
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Total Outgoing</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              ${(parseFloat(totalVolume.out) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}M
            </div>
          </div>
        </div>
      )}

      {/* Volume Chart */}
      {chartData.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <VolumeChart data={chartData} />
        </div>
      )}

      {/* Chain Metrics Table */}
      <div style={{
        background: '#1e293b',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #334155',
        overflowX: 'auto'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 'bold' }}>
          Per-Chain Metrics
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontWeight: 'normal' }}>Chain</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 'normal' }}>Incoming (IN)</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#3b82f6', fontWeight: 'normal' }}>Outgoing (OUT)</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontWeight: 'normal' }}>Total</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontWeight: 'normal' }}>% of Total</th>
            </tr>
          </thead>
          <tbody>
            {chainMetrics
              .map(chain => {
                const inVol = parseFloat(chain.incomingUSDC);
                const outVol = parseFloat(chain.outgoingUSDC);
                const chainTotal = inVol + outVol;
                const percentage = totalVol > 0 ? (chainTotal / totalVol * 100) : 0;
                return { ...chain, chainTotal, percentage };
              })
              .sort((a, b) => b.chainTotal - a.chainTotal)
              .map(chain => (
                <ChainRow
                  key={chain.domain}
                  chain={chain}
                  period={period}
                  isExpanded={expandedChain === chain.domain}
                  onToggle={() => handleChainToggle(chain.domain)}
                />
              ))}
            {chainMetrics.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
          Click on a chain row to see detailed outgoing volume breakdown
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
