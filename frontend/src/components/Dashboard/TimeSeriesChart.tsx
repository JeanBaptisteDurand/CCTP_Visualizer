/**
 * Time series chart component using Recharts
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeSeriesPoint } from '../../types/metrics';

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data }) => {
  const chartData = data.map(point => ({
    timestamp: new Date(point.timestamp).toLocaleTimeString(),
    count: point.transferCount,
    volume: parseFloat(point.volume) / 1e6
  }));

  return (
    <div style={{
      background: '#1e293b',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #334155'
    }}>
      <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 'bold' }}>Transfer Activity</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="timestamp" stroke="#94a3b8" />
          <YAxis yAxisId="left" stroke="#3b82f6" />
          <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '4px' }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" name="Transfer Count" strokeWidth={2} />
          <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#10b981" name="Volume (M)" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeSeriesChart;

