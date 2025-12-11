/**
 * Solana chain watcher
 * Note: This is a skeleton implementation. Full Solana integration requires
 * parsing program logs and subscribing to account changes.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { IChainWatcher } from './IChainWatcher';
import { BurnEvent, MessageSentEvent, ReceiveMessageEvent, MintEvent, TokenType } from '../types/transfer';
import { ChainMetadata, SolanaPrograms } from '../types/chain';
import { MAINNET_CHAINS } from '../config/chains';
import { createLogger } from '../utils/logger';

const logger = createLogger('SolanaWatcher');

export class SolanaWatcher implements IChainWatcher {
  private connection: Connection;
  private metadata: ChainMetadata;
  private programs: SolanaPrograms;
  private running: boolean = false;

  private burnCallbacks: Array<(event: BurnEvent) => void> = [];
  private messageSentCallbacks: Array<(event: MessageSentEvent) => void> = [];
  private receiveMessageCallbacks: Array<(event: ReceiveMessageEvent) => void> = [];
  private mintCallbacks: Array<(event: MintEvent) => void> = [];

  constructor() {
    this.metadata = MAINNET_CHAINS[5]; // Domain 5 = Solana
    this.programs = this.metadata.contracts as SolanaPrograms;
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

