/**
 * Metrics types
 */

import { TransferMode, TokenType } from './transfer';

export interface RouteMetrics {
  fromChain: number;
  toChain: number;
  transferCount: number;
  volumeTotal: string;
  avgLatencyMs: number;
}

export interface ChainMetrics {
  domain: number;
  name: string;
  inboundCount: number;
  outboundCount: number;
  inboundVolume: string;
  outboundVolume: string;
  avgInboundLatencyMs: number;
  avgOutboundLatencyMs: number;
}

export interface AggregatedMetrics {
  totalTransfers: number;
  totalVolume: string;
  fastTransfers: number;
  standardTransfers: number;
  fastPercentage: number;
  avgBurnToMintMs: number;
  avgBurnToIrisMs: number;
  topRoutes: RouteMetrics[];
  chainMetrics: ChainMetrics[];
}

export interface TimeSeriesPoint {
  timestamp: Date | string;
  transferCount: number;
  volume: string;
}

export interface Anomaly {
  transferId: string;
  type: 'PENDING_TOO_LONG' | 'NO_ATTESTATION' | 'RECEIVE_ERROR' | 'NOT_MINTED';
  sourceDomain: number;
  destinationDomain: number;
  burnAt: Date | string;
  description: string;
}

export enum MetricsPeriod {
  LAST_24H = '24h',
  LAST_7D = '7d',
  CURRENT_MONTH = 'month'
}

