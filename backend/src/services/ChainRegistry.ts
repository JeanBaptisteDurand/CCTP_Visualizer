/**
 * Chain Registry Service - Simplified
 * Manages and coordinates all chain watchers
 */

import { IChainWatcher } from '../chains/IChainWatcher';
import { createEVMWatchers } from '../chains/evmchain';
import { createNonEVMWatchers } from '../chains/non_evmchain';
import { TransferService } from './TransferService';
import { createLogger } from '../utils/logger';

const logger = createLogger('ChainRegistry');

export class ChainRegistry {
  private watchers: Map<number, IChainWatcher> = new Map();
  private transferService: TransferService;

  constructor(transferService: TransferService) {
    this.transferService = transferService;
    this.initializeWatchers();
  }

  /**
   * Initialize all chain watchers from config
   */
  private initializeWatchers(): void {
    const evmWatchers = createEVMWatchers();
    const nonEvmWatchers = createNonEVMWatchers();
    const allWatchers: IChainWatcher[] = [...evmWatchers, ...nonEvmWatchers];

    for (const watcher of allWatchers) {
      this.watchers.set(watcher.getDomainId(), watcher);
      this.subscribeToWatcherEvents(watcher);
    }

    logger.info(`Initialized ${this.watchers.size} chain watchers`);
  }

  /**
   * Subscribe to events from a chain watcher
   */
  private subscribeToWatcherEvents(watcher: IChainWatcher): void {
    watcher.subscribeBurnEvents((event) => {
      this.transferService.handleBurnEvent(event);
    });

    watcher.subscribeMessageSentEvents((event) => {
      this.transferService.handleMessageSentEvent(event);
    });

    watcher.subscribeReceiveMessageEvents((event) => {
      this.transferService.handleReceiveMessageEvent(event);
    });

    watcher.subscribeMintEvents((event) => {
      this.transferService.handleMintEvent(event);
    });
  }

  /**
   * Start all chain watchers
   */
  async startAll(): Promise<void> {
    logger.info('Starting all chain watchers...');

    const startPromises = Array.from(this.watchers.values()).map(watcher =>
      watcher.start().catch(error => {
        logger.error(`Failed to start watcher for domain ${watcher.getDomainId()}`, error);
      })
    );

    await Promise.all(startPromises);
    logger.info('All chain watchers started');
  }

  /**
   * Stop all chain watchers
   */
  async stopAll(): Promise<void> {
    logger.info('Stopping all chain watchers...');

    const stopPromises = Array.from(this.watchers.values()).map(watcher =>
      watcher.stop().catch(error => {
        logger.error(`Failed to stop watcher for domain ${watcher.getDomainId()}`, error);
      })
    );

    await Promise.all(stopPromises);
    logger.info('All chain watchers stopped');
  }

  /**
   * Get a specific chain watcher
   */
  getWatcher(domainId: number): IChainWatcher | undefined {
    return this.watchers.get(domainId);
  }

  /**
   * Get all chain watchers
   */
  getAllWatchers(): IChainWatcher[] {
    return Array.from(this.watchers.values());
  }

  /**
   * Get status of all watchers
   */
  getStatus(): Record<number, boolean> {
    const status: Record<number, boolean> = {};

    for (const [domainId, watcher] of this.watchers) {
      status[domainId] = watcher.isRunning();
    }

    return status;
  }
}

