/**
 * Route heatmap component
 */

import React from 'react';
import { RouteMetrics } from '../../types/metrics';

interface RouteHeatmapProps {
  routes: RouteMetrics[];
}

const CHAIN_NAMES: Record<number, string> = {
  0: 'Ethereum',
  1: 'Avalanche',
  2: 'OP Mainnet',
  3: 'Arbitrum',
  5: 'Solana',
  6: 'Base',
  7: 'Polygon'
};

const RouteHeatmap: React.FC<RouteHeatmapProps> = ({ routes }) => {
  return (
    <div style={{
      background: '#1e293b',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #334155'
    }}>
      <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 'bold' }}>Top Routes</h2>
      <div style={{ display: 'grid', gap: '12px' }}>
        {routes.slice(0, 10).map((route, index) => {
          const maxVolume = Math.max(...routes.map(r => parseFloat(r.volumeTotal)));
          const volumePercent = (parseFloat(route.volumeTotal) / maxVolume) * 100;

          return (
            <div key={`${route.fromChain}-${route.toChain}`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ minWidth: '30px', color: '#64748b' }}>#{index + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>
                    {CHAIN_NAMES[route.fromChain] || `Domain ${route.fromChain}`} → {CHAIN_NAMES[route.toChain] || `Domain ${route.toChain}`}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {route.transferCount} transfers
                  </span>
                </div>
                <div style={{
                  background: '#0f172a',
                  height: '8px',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                    height: '100%',
                    width: `${volumePercent}%`,
                    transition: 'width 0.3s'
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  ${(parseFloat(route.volumeTotal) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })} | 
                  Avg latency: {(route.avgLatencyMs / 1000).toFixed(1)}s
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RouteHeatmap;

