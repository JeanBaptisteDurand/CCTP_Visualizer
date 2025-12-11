/**
 * API client for backend REST endpoints
 */

import axios, { AxiosInstance } from 'axios';
import { AggregatedMetrics, TimeSeriesPoint, RouteMetrics, ChainMetrics, Anomaly, MetricsPeriod } from '../types/metrics';
import { Transfer } from '../types/transfer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 10000
    });
  }

  // Metrics endpoints

  async getMetrics(period: MetricsPeriod = MetricsPeriod.LAST_24H): Promise<AggregatedMetrics> {
    const response = await this.client.get('/metrics', {
      params: { period }
    });
    return response.data;
  }

  async getTimeSeries(period: MetricsPeriod = MetricsPeriod.LAST_24H): Promise<TimeSeriesPoint[]> {
    const response = await this.client.get('/metrics/timeseries', {
      params: { period }
    });
    return response.data;
  }

  async getRouteMetrics(period: MetricsPeriod = MetricsPeriod.LAST_24H): Promise<RouteMetrics[]> {
    const response = await this.client.get('/metrics/routes', {
      params: { period }
    });
    return response.data;
  }

  async getChainMetrics(period: MetricsPeriod = MetricsPeriod.LAST_24H): Promise<ChainMetrics[]> {
    const response = await this.client.get('/metrics/chains', {
      params: { period }
    });
    return response.data;
  }

  async getAnomalies(thresholdMinutes: number = 30): Promise<Anomaly[]> {
    const response = await this.client.get('/metrics/anomalies', {
      params: { threshold: thresholdMinutes }
    });
    return response.data;
  }

  async getActiveTransfers(): Promise<Transfer[]> {
    const response = await this.client.get('/metrics/active');
    return response.data;
  }

  // Health endpoint

  async getHealth(): Promise<any> {
    const response = await this.client.get('/health');
    return response.data;
  }

  async getDetailedStatus(): Promise<any> {
    const response = await this.client.get('/health/status');
    return response.data;
  }
}

export const apiClient = new ApiClient();

