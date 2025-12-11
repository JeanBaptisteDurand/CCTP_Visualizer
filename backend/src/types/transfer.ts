/**
 * Transfer types and enums for CCTP monitoring
 */

export enum TransferStatus {
  BURN_INITIATED = 'BURN_INITIATED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  ATTESTATION_PENDING = 'ATTESTATION_PENDING',
  ATTESTATION_COMPLETE = 'ATTESTATION_COMPLETE',
  RECEIVE_MESSAGE_PENDING = 'RECEIVE_MESSAGE_PENDING',
  MINT_COMPLETE = 'MINT_COMPLETE',
  ERROR = 'ERROR',
  EXPIRED = 'EXPIRED'
}

export enum TransferMode {
  FAST = 'FAST',
  STANDARD = 'STANDARD'
}

export enum TokenType {
  USDC = 'USDC',
  USYC = 'USYC'
}

export interface Transfer {
  transferId: string; // Composite: `${sourceDomain}-${nonce}`
  sourceDomain: number;
  destinationDomain: number;
  mode: TransferMode;
  tokenType: TokenType;
  amount: string; // In token base units (e.g., 1000000 = 1 USDC with 6 decimals)
  
  // Transaction hashes
  burnTxHash: string;
  mintTxHash: string | null;
  
  // Timestamps
  burnAt: Date;
  irisAttestedAt: Date | null;
  mintAt: Date | null;
  
  // Status
  status: TransferStatus;
  errorReason: string | null;
  
  // Additional metadata
  nonce: string;
  messageBody: string | null;
  sender: string;
  recipient: string;
  minFinalityThreshold: number;
  maxFee: string;
  finalityThresholdExecuted: number | null;
}

export interface TransferEvent {
  type: 'BURN' | 'MESSAGE_SENT' | 'ATTESTATION' | 'RECEIVE_MESSAGE' | 'MINT' | 'ERROR';
  transferId: string;
  timestamp: Date;
  data: any;
}

export interface BurnEvent {
  domain: number;
  nonce: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  sender: string;
  recipient: string;
  amount: string;
  destinationDomain: number;
  minFinalityThreshold: number;
  tokenType: TokenType;
  tokenAddress: string;
}

export interface MessageSentEvent {
  domain: number;
  nonce: string;
  txHash: string;
  timestamp: Date;
  messageBody: string;
  sender: string;
}

export interface ReceiveMessageEvent {
  domain: number;
  nonce: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  caller: string;
  sourceDomain: number;
}

export interface MintEvent {
  domain: number;
  nonce: string;
  txHash: string;
  timestamp: Date;
  recipient: string;
  amount: string;
  tokenType: TokenType;
}

