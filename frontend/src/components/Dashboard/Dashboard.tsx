/**
 * Metrics dashboard component
 */

import React, { useState } from 'react';
import { useMetrics } from '../../hooks/useMetrics';
import { MetricsPeriod } from '../../types/metrics';
import StatsCard from './StatsCard';
import TimeSeriesChart from './TimeSeriesChart';
import RouteHeatmap from './RouteHeatmap';
import ChainStats from './ChainStats';
import AnomaliesList from './AnomaliesList';
import PeriodSelector from '../shared/PeriodSelector';

const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState<MetricsPeriod>(MetricsPeriod.LAST_24H);
  const { metrics, timeSeries, anomalies, loading, error } = useMetrics(period);

  if (loading) {
    return <div style={{ padding: '20px', color: '#94a3b8' }}>Loading metrics...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: '#ef4444' }}>Error loading metrics: {error}</div>;
  }

  if (!metrics) {
    return <div style={{ padding: '20px', color: '#94a3b8' }}>No metrics available</div>;
  }

  return (
    <div style={{ padding: '20px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>CCTP Metrics Dashboard</h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <StatsCard
          title="Total Transfers"
          value={metrics.totalTransfers.toLocaleString()}
          subtitle={`${metrics.fastTransfers} Fast / ${metrics.standardTransfers} Standard`}
        />
        <StatsCard
          title="Total Volume"
          value={`$${(parseFloat(metrics.totalVolume) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtitle="USDC/USYC equivalent"
        />
        <StatsCard
          title="Fast Transfer %"
          value={`${metrics.fastPercentage.toFixed(1)}%`}
          subtitle={`${metrics.fastTransfers} transfers`}
        />
        <StatsCard
          title="Avg Latency"
          value={`${(metrics.avgBurnToMintMs / 1000).toFixed(1)}s`}
          subtitle={`Burn to Iris: ${(metrics.avgBurnToIrisMs / 1000).toFixed(1)}s`}
        />
      </div>

      {/* Time Series Chart */}
      <div style={{ marginBottom: '20px' }}>
        <TimeSeriesChart data={timeSeries} />
      </div>

      {/* Route Heatmap */}
      <div style={{ marginBottom: '20px' }}>
        <RouteHeatmap routes={metrics.topRoutes} />
      </div>

      {/* Chain Stats */}
      <div style={{ marginBottom: '20px' }}>
        <ChainStats chains={metrics.chainMetrics} />
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div>
          <AnomaliesList anomalies={anomalies} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;

