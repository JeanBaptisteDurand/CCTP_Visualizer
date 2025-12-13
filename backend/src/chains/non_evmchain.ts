/**
 * Non-EVM Chain Watchers
 * Creates watchers for Solana and Starknet
 */

import { Connection } from '@solana/web3.js';
import { Provider } from 'starknet';
import { IChainWatcher } from './IChainWatcher';
import { BurnEvent, MessageSentEvent, ReceiveMessageEvent, MintEvent } from '../types/transfer';
import { ChainMetadata, VMType } from '../types/chain';
import { MAINNET_CHAINS } from '../config/chains';
import { createLogger } from '../utils/logger';

const logger = createLogger('NonEVMWatcher');

/**
 * Solana Chain Watcher
 */
class SolanaWatcher implements IChainWatcher {
  private connection: Connection;
  private metadata: ChainMetadata;
  private running: boolean = false;

  private burnCallbacks: Array<(event: BurnEvent) => void> = [];
  private messageSentCallbacks: Array<(event: MessageSentEvent) => void> = [];
  private receiveMessageCallbacks: Array<(event: ReceiveMessageEvent) => void> = [];
  private mintCallbacks: Array<(event: MintEvent) => void> = [];

  constructor() {
    this.metadata = MAINNET_CHAINS[5]; // Domain 5 = Solana
    this.connection = new Connection(this.metadata.rpcUrl, 'confirmed');
  }

  async start(): Promise<void> {
    if (this.running) {
      logger.warn('Solana watcher already running');
      return;
    }

    logger.info('Starting Solana chain watcher');
    this.running = true;

    // TODO: Implement Solana program log subscription
    // This requires:
    // 1. Subscribe to logs for TokenMessengerMinter program
    // 2. Subscribe to logs for MessageTransmitter program
    // 3. Parse instruction data to extract burn/mint/message events
    // 4. Monitor USDC mint account changes

    logger.warn('Solana watcher started (skeleton implementation)');
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    logger.info('Stopping Solana chain watcher');
    this.running = false;
  }

  subscribeBurnEvents(callback: (event: BurnEvent) => void): void {
    this.burnCallbacks.push(callback);
  }

  subscribeMessageSentEvents(callback: (event: MessageSentEvent) => void): void {
    this.messageSentCallbacks.push(callback);
  }

  subscribeReceiveMessageEvents(callback: (event: ReceiveMessageEvent) => void): void {
    this.receiveMessageCallbacks.push(callback);
  }

  subscribeMintEvents(callback: (event: MintEvent) => void): void {
    this.mintCallbacks.push(callback);
  }

  getDomainId(): number {
    return this.metadata.domainId;
  }

  isRunning(): boolean {
    return this.running;
  }
}

/**
 * Starknet Chain Watcher
 */
class StarknetWatcher implements IChainWatcher {
  private provider: Provider;
  private metadata: ChainMetadata;
  private running: boolean = false;

  private burnCallbacks: Array<(event: BurnEvent) => void> = [];
  private messageSentCallbacks: Array<(event: MessageSentEvent) => void> = [];
  private receiveMessageCallbacks: Array<(event: ReceiveMessageEvent) => void> = [];
  private mintCallbacks: Array<(event: MintEvent) => void> = [];

  constructor() {
    this.metadata = MAINNET_CHAINS[25]; // Domain 25 = Starknet
    this.provider = new Provider({ nodeUrl: this.metadata.rpcUrl });
  }

  async start(): Promise<void> {
    if (this.running) {
      logger.warn('Starknet watcher already running');
      return;
    }

    logger.info('Starting Starknet chain watcher');
    this.running = true;

    // TODO: Implement Starknet event subscription
    // This requires:
    // 1. Poll for new blocks
    // 2. Query events from TokenMessengerMinter contract
    // 3. Query events from MessageTransmitter contract
    // 4. Parse event data to extract burn/mint/message information

    logger.warn('Starknet watcher started (skeleton implementation)');
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    logger.info('Stopping Starknet chain watcher');
    this.running = false;
  }

  subscribeBurnEvents(callback: (event: BurnEvent) => void): void {
    this.burnCallbacks.push(callback);
  }

  subscribeMessageSentEvents(callback: (event: MessageSentEvent) => void): void {
    this.messageSentCallbacks.push(callback);
  }

  subscribeReceiveMessageEvents(callback: (event: ReceiveMessageEvent) => void): void {
    this.receiveMessageCallbacks.push(callback);
  }

  subscribeMintEvents(callback: (event: MintEvent) => void): void {
    this.mintCallbacks.push(callback);
  }

  getDomainId(): number {
    return this.metadata.domainId;
  }

  isRunning(): boolean {
    return this.running;
  }
}

/**
 * Create non-EVM chain watchers (Solana and Starknet)
 */
export function createNonEVMWatchers(): IChainWatcher[] {
  const watchers: IChainWatcher[] = [];

  for (const chain of Object.values(MAINNET_CHAINS)) {
    if (chain.vmType === VMType.SOLANA) {
      watchers.push(new SolanaWatcher());
    } else if (chain.vmType === VMType.STARKNET) {
      watchers.push(new StarknetWatcher());
    }
  }

  return watchers;
}

