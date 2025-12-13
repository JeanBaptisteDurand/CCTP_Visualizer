/**
 * Iris API types
 */

export interface IrisMessageResponse {
  status: 'pending' | 'complete' | 'failed';
  attestation?: string; // Hex string
  message?: string; // Raw message hex string
  decodedMessage?: {
    messageBody: string;
    nonce: string;
    sourceDomain: number;
    destinationDomain: number;
    sender: string;
    recipient: string;
  };
  finalityThresholdExecuted?: number;
  error?: string;
}

export interface IrisMessagesQueryParams {
  domain?: number;
  nonce?: string;
  transactionHash?: string;
}

export interface IrisFastBurnAllowance {
  allowance: string; // Amount in base units
  consumed: string;
  available: string;
}

export interface IrisBurnFee {
  sourceDomain: number;
  destinationDomain: number;
  standardFee: string;
  fastFee: string;
}

export interface IrisReattestRequest {
  sourceDomain: number;
  nonce: string;
}

export interface IrisReattestResponse {
  status: 'queued' | 'complete' | 'error';
  message?: string;
}

