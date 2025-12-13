/**
 * Metrics types - Simplified for per-chain minute metrics
 */

export interface ChainMinuteMetrics {
  domain: number;
  name: string;
  incomingUSDC: string;  // Amount in smallest unit (6 decimals)
  outgoingUSDC: string;
}

