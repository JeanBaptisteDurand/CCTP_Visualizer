/**
 * Metrics types - Simplified for per-chain minute metrics
 */

export interface ChainMinuteMetrics {
  domain: number;
  name: string;
  incomingUSDC: string;  // Amount in smallest unit (wei-like)
  incomingUSYC: string;
  outgoingUSDC: string;
  outgoingUSYC: string;
}

