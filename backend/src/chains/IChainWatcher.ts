/**
 * Chain watcher interface
 * Defines the contract that all blockchain adapters must implement
 */

import { BurnEvent, MessageSentEvent, ReceiveMessageEvent, MintEvent } from '../types/transfer';

export interface IChainWatcher {
  /**
   * Start watching the chain for events
   */
  start(): Promise<void>;

  /**
   * Stop watching the chain
   */
  stop(): Promise<void>;

  /**
   * Subscribe to burn events (depositForBurn calls)
   */
  subscribeBurnEvents(callback: (event: BurnEvent) => void): void;

  /**
   * Subscribe to MessageSent events
   */
  subscribeMessageSentEvents(callback: (event: MessageSentEvent) => void): void;

  /**
   * Subscribe to receiveMessage events
   */
  subscribeReceiveMessageEvents(callback: (event: ReceiveMessageEvent) => void): void;

  /**
   * Subscribe to mint events
   */
  subscribeMintEvents(callback: (event: MintEvent) => void): void;

  /**
   * Get the domain ID for this chain
   */
  getDomainId(): number;

  /**
   * Check if the watcher is running
   */
  isRunning(): boolean;
}

