/**
 * Frontend transfer types (shared with backend)
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
  transferId: string;
  sourceDomain: number;
  destinationDomain: number;
  mode: TransferMode;
  tokenType: TokenType;
  amount: string;
  burnTxHash: string;
  mintTxHash: string | null;
  burnAt: Date | string;
  irisAttestedAt: Date | string | null;
  mintAt: Date | string | null;
  status: TransferStatus;
  errorReason: string | null;
  nonce: string;
  sender: string;
  recipient: string;
}

export interface TransferUpdate {
  transferId: string;
  sourceDomain: number;
  destinationDomain: number;
  status: TransferStatus;
  mode: TransferMode;
  tokenType: TokenType;
  amount: string;
  burnAt: Date | string;
  irisAttestedAt: Date | string | null;
  mintAt: Date | string | null;
}

