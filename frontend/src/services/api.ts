/**
 * API client for backend REST endpoints - Simplified
 */

import axios, { AxiosInstance } from 'axios';
import { ChainMinuteMetrics } from '../types/metrics';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

export type Period = '1min' | '5min' | '15min' | '1h' | '4h' | '24h';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 10000
    });
  }

  // Get per-chain metrics for a specific period
  async getChainMetrics(period: Period = '24h'): Promise<ChainMinuteMetrics[]> {
    const response = await this.client.get(`/metrics/chains?period=${period}`);
    return response.data;
  }

  // Get per-chain metrics for last minute (backward compatibility)
  async getChainMinuteMetrics(): Promise<ChainMinuteMetrics[]> {
    const response = await this.client.get('/metrics/chains/minute');
    return response.data;
  }

  // Get total volume for a period
  async getTotalVolume(period: Period = '24h'): Promise<{ in: string; out: string; total: string }> {
    const response = await this.client.get(`/metrics/total?period=${period}`);
    return response.data;
  }

  // Get outgoing details for a chain
  async getChainOutgoing(domain: number, period: Period = '24h'): Promise<Array<{ destinationDomain: number; volume: string }>> {
    const response = await this.client.get(`/metrics/chain/${domain}/outgoing?period=${period}`);
    return response.data;
  }

  // Get volume chart data
  async getVolumeChart(period: Period = '24h', buckets: number = 20): Promise<Array<{ time: string; in: string; out: string; total: string }>> {
    const response = await this.client.get(`/metrics/volume-chart?period=${period}&buckets=${buckets}`);
    return response.data;
  }

  // Health endpoint
  async getHealth(): Promise<any> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();

