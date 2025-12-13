/**
 * Volume chart component
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VolumeChartProps {
  data: Array<{ time: string; in: string; out: string; total: string }>;
}

const VolumeChart: React.FC<VolumeChartProps> = ({ data }) => {
  const chartData = data.map(point => ({
    time: new Date(point.time).toLocaleTimeString(),
    in: parseFloat(point.in) / 1e6,
    out: parseFloat(point.out) / 1e6,
    total: parseFloat(point.total) / 1e6,
  }));

  return (
    <div style={{
      background: '#1e293b',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #334155',
      height: '300px'
    }}>
      <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 'bold' }}>
        Volume Over Time
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="time" 
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${value.toFixed(0)}M`}
          />
          <Tooltip 
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#fff'
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}M`, '']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="in" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Incoming"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="out" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Outgoing"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="#f59e0b" 
            strokeWidth={2}
            name="Total"
            dot={false}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VolumeChart;

