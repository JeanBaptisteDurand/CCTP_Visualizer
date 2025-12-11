/**
 * Chain metadata and configuration types
 */

export enum VMType {
  EVM = 'EVM',
  SOLANA = 'SOLANA',
  STARKNET = 'STARKNET'
}

export interface ChainCapabilities {
  standardSource: boolean;  // Can be source for Standard Transfer
  fastSource: boolean;       // Can be source for Fast Transfer
  destination: boolean;      // Can be destination
}

export interface TokenSupport {
  supportsUSDC: boolean;
  supportsUSYC: boolean;
}

export interface EVMContracts {
  tokenMessenger: string;
  messageTransmitter: string;
  tokenMinter: string;
  messageHelper: string;
  usdcToken?: string;
  usycToken?: string;
}

export interface SolanaPrograms {
  tokenMessengerMinter: string;
  messageTransmitter: string;
  usdcMint: string;
}

export interface StarknetContracts {
  tokenMessengerMinter: string;
  messageTransmitter: string;
  usdcToken: string;
}

export type ChainContracts = EVMContracts | SolanaPrograms | StarknetContracts;

export interface ChainMetadata {
  domainId: number;
  name: string;
  vmType: VMType;
  chainId?: number | string; // EVM chain ID or Solana/Starknet identifier
  rpcUrl: string;
  
  // Token support
  tokenSupport: TokenSupport;
  
  // Capabilities
  capabilities: ChainCapabilities;
  
  // Contract/Program addresses
  contracts: ChainContracts;
  
  // Block time (for polling)
  blockTime: number; // milliseconds
}

export interface ChainConfig {
  mainnet: Record<number, ChainMetadata>; // domainId -> metadata
  testnet: Record<number, ChainMetadata>;
}

