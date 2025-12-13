/**
 * Chain volume chart component (outgoing or incoming) with breakdown by chain
 */

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getChainName } from '../../utils/chainNames';

interface ChainVolumeChartProps {
  data: Array<{ time: string; total: string; [key: string]: string }>;
  type: 'outgoing' | 'incoming';
  breakdown: Array<{ destinationDomain?: number; sourceDomain?: number; volume: string }>;
}

// Color palette for different chains
const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // violet
  '#22c55e', // emerald
];

const ChainVolumeChart: React.FC<ChainVolumeChartProps> = ({ data, type, breakdown }) => {
  // Extract chain domains from breakdown
  const chainDomains = useMemo(() => {
    return breakdown
      .map(item => type === 'outgoing' ? item.destinationDomain : item.sourceDomain)
      .filter((domain): domain is number => domain !== undefined)
      .sort((a, b) => {
        const volA = parseFloat(breakdown.find(item => 
          (type === 'outgoing' ? item.destinationDomain : item.sourceDomain) === a
        )?.volume || '0');
        const volB = parseFloat(breakdown.find(item => 
          (type === 'outgoing' ? item.destinationDomain : item.sourceDomain) === b
        )?.volume || '0');
        return volB - volA; // Sort by volume descending
      });
  }, [breakdown, type]);

  // Transform data for chart
  const chartData = useMemo(() => {
    return data.map(point => {
      const transformed: { time: string; total: number; [key: string]: number | string } = {
        time: new Date(point.time).toLocaleTimeString(),
        total: parseFloat(point.total) / 1e6,
      };

      // Add each chain's volume
      chainDomains.forEach(domain => {
        const key = `chain_${domain}`;
        transformed[key] = parseFloat(point[key] || '0') / 1e6;
      });

      return transformed;
    });
  }, [data, chainDomains]);

  const baseColor = type === 'outgoing' ? '#3b82f6' : '#10b981';
  const label = type === 'outgoing' ? 'Outgoing' : 'Incoming';

  return (
    <div style={{
      background: '#1e293b',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #334155',
      height: '250px',
      marginBottom: '16px'
    }}>
      <h4 style={{ 
        fontSize: '14px', 
        marginBottom: '12px', 
        fontWeight: '500',
        color: baseColor
      }}>
        {label} Volume Over Time
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="time" 
            stroke="#94a3b8"
            style={{ fontSize: '11px' }}
            tick={{ fill: '#64748b' }}
          />
          <YAxis 
            stroke="#94a3b8"
            style={{ fontSize: '11px' }}
            tick={{ fill: '#64748b' }}
            tickFormatter={(value) => `$${value.toFixed(0)}M`}
          />
          <Tooltip 
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'total') {
                return [`$${value.toFixed(2)}M`, 'Total'];
              }
              const domain = parseInt(name.replace('chain_', ''));
              const chainName = getChainName(domain);
              return [`$${value.toFixed(2)}M`, chainName];
            }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            formatter={(value: string) => {
              if (value === 'total') return 'Total';
              const domain = parseInt(value.replace('chain_', ''));
              return getChainName(domain);
            }}
          />
          {/* Total line */}
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke={baseColor} 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: baseColor }}
            strokeDasharray="5 5"
          />
          {/* Lines for each chain */}
          {chainDomains.map((domain, index) => (
            <Line
              key={domain}
              type="monotone"
              dataKey={`chain_${domain}`}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChainVolumeChart;
