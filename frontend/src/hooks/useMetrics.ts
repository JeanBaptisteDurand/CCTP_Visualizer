/**
 * Custom hook for fetching metrics
 */

import { useState, useEffect } from 'react';
import { AggregatedMetrics, TimeSeriesPoint, Anomaly, MetricsPeriod } from '../types/metrics';
import { apiClient } from '../services/api';

export function useMetrics(period: MetricsPeriod = MetricsPeriod.LAST_24H) {
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [period]);

  const loadMetrics = async () => {
    try {
      const [metricsData, timeSeriesData, anomaliesData] = await Promise.all([
        apiClient.getMetrics(period),
        apiClient.getTimeSeries(period),
        apiClient.getAnomalies()
      ]);

      setMetrics(metricsData);
      setTimeSeries(timeSeriesData);
      setAnomalies(anomaliesData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return {
    metrics,
    timeSeries,
    anomalies,
    loading,
    error,
    refresh: loadMetrics
  };
}

