/**
 * API client for backend REST endpoints - Simplified
 */

import axios, { AxiosInstance } from 'axios';
import { ChainMinuteMetrics } from '../types/metrics';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 10000
    });
  }

  // Get per-chain metrics for last minute
  async getChainMinuteMetrics(): Promise<ChainMinuteMetrics[]> {
    const response = await this.client.get('/metrics/chains/minute');
    return response.data;
  }

  // Health endpoint
  async getHealth(): Promise<any> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();

