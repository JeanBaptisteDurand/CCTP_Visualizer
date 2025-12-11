/**
 * Starknet chain watcher
 * Note: This is a skeleton implementation. Full Starknet integration requires
 * proper event parsing and RPC subscription handling.
 */

import { Provider, Contract } from 'starknet';
import { IChainWatcher } from './IChainWatcher';
import { BurnEvent, MessageSentEvent, ReceiveMessageEvent, MintEvent } from '../types/transfer';
import { ChainMetadata, StarknetContracts } from '../types/chain';
import { MAINNET_CHAINS } from '../config/chains';
import { createLogger } from '../utils/logger';

const logger = createLogger('StarknetWatcher');

export class StarknetWatcher implements IChainWatcher {
  private provider: Provider;
  private metadata: ChainMetadata;
  private contracts: StarknetContracts;
  private running: boolean = false;

  private burnCallbacks: Array<(event: BurnEvent) => void> = [];
  private messageSentCallbacks: Array<(event: MessageSentEvent) => void> = [];
  private receiveMessageCallbacks: Array<(event: ReceiveMessageEvent) => void> = [];
  private mintCallbacks: Array<(event: MintEvent) => void> = [];

  constructor() {
    this.metadata = MAINNET_CHAINS[25]; // Domain 25 = Starknet
    this.contracts = this.metadata.contracts as StarknetContracts;
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

