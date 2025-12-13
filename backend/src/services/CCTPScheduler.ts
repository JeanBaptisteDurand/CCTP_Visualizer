/**
 * CCTP Scheduler Service
 * 
 * Polls chains frequently to keep block gaps small
 * Compatible with QuickNode free tier (15 RPS limit)
 * 
 * Strategy:
 * - Poll every 5 seconds instead of 60 seconds
 * - Process chains round-robin to distribute load
 * - Small block ranges (stays within eth_getLogs limits)
 * - Global rate limiting across all chains
 */

import { MAINNET_CHAINS } from '../config/chains';
import { VMType } from '../types/chain';
import { EVMIndexer } from './EVMIndexer';
import { createLogger } from '../utils/logger';

const logger = createLogger('CCTPScheduler');

// Safety buffer: don't index the last N blocks (to avoid reorgs)
const FINALITY_BUFFER = 3n;

// Max blocks to process per chain per cycle
// Higher limit for faster catch-up, parallel burns/mints helps speed
const MAX_BLOCKS_PER_CYCLE = 500n;

// Delay between chains (ms) - 300ms = ~3 chains/second, safe for 15 RPS limit
const DELAY_BETWEEN_CHAINS_MS = 300;

// Polling interval (ms) - frequent polling keeps block gaps small
const POLL_INTERVAL_MS = 5000; // 5 seconds

// Supported EVM chains (13 mainnet chains - Sei disabled due to RPC timeouts)
const SUPPORTED_DOMAINS = [0, 1, 2, 3, 6, 7, 10, 11, 13, 14, 15, 19, 21];

export class CCTPScheduler {
  private indexers: Map<number, EVMIndexer> = new Map();
  private interval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private isCycleRunning: boolean = false;
  private currentChainIndex: number = 0;

  constructor(intervalSeconds: number = 5) {
    // Initialize indexers for supported EVM chains
    for (const [domainId, chain] of Object.entries(MAINNET_CHAINS)) {
      const domain = parseInt(domainId);
      if (chain.vmType === VMType.EVM && SUPPORTED_DOMAINS.includes(domain)) {
        try {
          const rpcUrl = chain.rpcUrl;
          const maskedRpc = rpcUrl ? rpcUrl.substring(0, 50) + '...' : 'NOT SET';
          logger.info(`Initializing indexer for ${chain.name} (domain ${domain}) - RPC: ${maskedRpc}`);

          const indexer = new EVMIndexer(chain);
          this.indexers.set(domain, indexer);
          logger.info(`✅ Initialized ${chain.name} (domain ${domain})`);
        } catch (error) {
          logger.error(`❌ Failed to initialize ${chain.name} (domain ${domain})`, error);
        }
      }
    }

    logger.info(`✅ Initialized ${this.indexers.size} EVM chain indexers`);
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Scheduler already running');
      return;
    }

    logger.info(`Starting CCTP scheduler (polling every ${POLL_INTERVAL_MS / 1000}s)`);
    this.isRunning = true;

    // Run initial cycle
    this.runIndexingCycle();

    // Schedule periodic runs
    this.interval = setInterval(() => {
      this.runIndexingCycle();
    }, POLL_INTERVAL_MS);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) return;

    logger.info('Stopping CCTP scheduler');
    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Run one indexing cycle
   * Processes all chains sequentially
   */
  private async runIndexingCycle(): Promise<void> {
    // Skip if previous cycle still running
    if (this.isCycleRunning) {
      logger.warn('Previous cycle still running, skipping');
      return;
    }

    this.isCycleRunning = true;
    const startTime = Date.now();
    const indexerEntries = Array.from(this.indexers.entries());

    if (indexerEntries.length === 0) {
      this.isCycleRunning = false;
      return;
    }

    logger.info(`🔄 Starting cycle (${indexerEntries.length} chains)`);

    // Process all chains in sequence (with delays)
    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < indexerEntries.length; i++) {
        const [domainId, indexer] = indexerEntries[i];
        const chainName = indexer.getChainName();

        try {
          await this.indexChain(indexer, domainId, chainName);
          successCount++;
        } catch (error) {
          errorCount++;
          logger.error(`${chainName}: Failed to index`, error);
        }

        // Delay between chains
        if (i < indexerEntries.length - 1) {
          await this.delay(DELAY_BETWEEN_CHAINS_MS);
        }
      }
    } finally {
      const duration = Date.now() - startTime;
      logger.info(`✅ Cycle complete: ${successCount}/${indexerEntries.length} chains in ${duration}ms`);
      this.isCycleRunning = false;
    }
  }

  /**
   * Index a single chain (limited block range)
   */
  private async indexChain(indexer: EVMIndexer, domainId: number, chainName: string): Promise<void> {
    try {
      const lastBlock = await indexer.getLastProcessedBlock();
      const currentBlock = await indexer.getCurrentBlock();
      const safeBlock = currentBlock - FINALITY_BUFFER;

      // No new blocks
      if (safeBlock <= lastBlock) {
        return;
      }

      // Determine block range (limited to MAX_BLOCKS_PER_CYCLE)
      let fromBlock: bigint;
      if (lastBlock === 0n) {
        // First run: index last 5000 blocks to catch recent CCTP activity
        // Some chains have low CCTP activity, need more blocks to find events
        fromBlock = safeBlock - 5000n;
        if (fromBlock < 0n) fromBlock = 0n;
      } else {
        fromBlock = lastBlock + 1n;
      }

      // Limit the range
      let toBlock = safeBlock;
      if (toBlock - fromBlock > MAX_BLOCKS_PER_CYCLE) {
        toBlock = fromBlock + MAX_BLOCKS_PER_CYCLE;
      }

      const blocksToProcess = Number(toBlock - fromBlock + 1n);
      logger.debug(`${chainName}: Processing blocks ${fromBlock}-${toBlock} (${blocksToProcess} blocks)`);

      const result = await indexer.indexBlockRange(fromBlock, toBlock);

      // Log if we found events
      if (result.burns > 0 || result.mints > 0) {
        logger.info(`${chainName}: 🔥 ${result.burns} burns, 💵 ${result.mints} mints`);
      }

      // If we're behind, log it
      const blocksRemaining = Number(safeBlock - toBlock);
      if (blocksRemaining > 100) {
        logger.warn(`${chainName}: Still ${blocksRemaining} blocks behind`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get status of all indexers
   */
  async getStatus(): Promise<Map<number, { lastBlock: bigint; currentBlock: bigint; behind: number }>> {
    const status = new Map<number, { lastBlock: bigint; currentBlock: bigint; behind: number }>();

    for (const [domainId, indexer] of this.indexers.entries()) {
      try {
        const lastBlock = await indexer.getLastProcessedBlock();
        const currentBlock = await indexer.getCurrentBlock();
        const behind = Number(currentBlock - lastBlock);
        status.set(domainId, { lastBlock, currentBlock, behind });
      } catch (error) {
        logger.error(`Failed to get status for chain ${domainId}`, error);
      }
    }

    return status;
  }
}
