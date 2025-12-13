/**
 * EVM Indexer Service - Simplified
 * 
 * Uses TokenMessengerV2 contract only (same address on all chains)
 * Listens for:
 * - DepositForBurn event (OUT/BURN)
 * - MintAndWithdraw event (IN/MINT)
 */

import { createPublicClient, http, PublicClient, Address, decodeEventLog } from 'viem';
import { ChainMetadata, VMType } from '../types/chain';
import { pool } from '../config/database';
import { createLogger } from '../utils/logger';

const logger = createLogger('EVMIndexer');

// TokenMessengerV2 - same address on all EVM chains
const TOKEN_MESSENGER_V2 = '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d' as Address;

// Event signatures (topic0)
const DEPOSIT_FOR_BURN_TOPIC = '0x0c8c1cbdc5190613ebd485511d4e2812cfa45eecb79d845893331fedad5130a5';
const MINT_AND_WITHDRAW_TOPIC = '0x50c55e915134d457debfa58eb6f4342956f8b0616d51a89a3659360178e1ab63';

// QuickNode free tier limits
const MAX_BLOCKS_PER_LOG_QUERY = 5n;
const DELAY_BETWEEN_RPC_CALLS_MS = 50;

// ABIs for decoding
const DEPOSIT_FOR_BURN_ABI = {
  type: 'event',
  name: 'DepositForBurn',
  inputs: [
    { name: 'burnToken', type: 'address', indexed: true },
    { name: 'amount', type: 'uint256', indexed: false },
    { name: 'depositor', type: 'address', indexed: true },
    { name: 'mintRecipient', type: 'bytes32', indexed: false },
    { name: 'destinationDomain', type: 'uint32', indexed: false },
    { name: 'destinationTokenMessenger', type: 'bytes32', indexed: false },
    { name: 'destinationCaller', type: 'bytes32', indexed: false },
    { name: 'maxFee', type: 'uint256', indexed: false },
    { name: 'minFinalityThreshold', type: 'uint32', indexed: true },
    { name: 'hookData', type: 'bytes', indexed: false },
  ],
} as const;

const MINT_AND_WITHDRAW_ABI = {
  type: 'event',
  name: 'MintAndWithdraw',
  inputs: [
    { name: 'mintRecipient', type: 'address', indexed: true },
    { name: 'amount', type: 'uint256', indexed: false },
    { name: 'mintToken', type: 'address', indexed: true },
    { name: 'feeCollected', type: 'uint256', indexed: false },
  ],
} as const;

interface BurnRecord {
  chainDomain: number;
  destinationDomain: number;
  amount: string;
  token: string;
  blockTime: Date;
  txHash: string;
  blockNumber: bigint;
  logIndex: number;
}

interface MintRecord {
  chainDomain: number;
  sourceDomain: number;
  amount: string;
  token: string;
  mintRecipient: string;
  blockTime: Date;
  txHash: string;
  blockNumber: bigint;
  logIndex: number;
}

export class EVMIndexer {
  private client: PublicClient;
  private metadata: ChainMetadata;
  private domainId: number;

  constructor(metadata: ChainMetadata) {
    if (metadata.vmType !== VMType.EVM) {
      throw new Error(`EVMIndexer can only be used with EVM chains, got ${metadata.vmType}`);
    }

    this.metadata = metadata;
    this.domainId = metadata.domainId;

    this.client = createPublicClient({
      transport: http(metadata.rpcUrl, {
        batch: false,
        retryCount: 5,
        retryDelay: 2000,
        timeout: 60000, // 60s timeout for slow chains
      }),
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Decode sourceDomain from transaction calldata
   * receiveMessage(bytes message, bytes attestation) calldata format:
   * - function selector (4 bytes)
   * - offset to message (32 bytes)
   * - offset to attestation (32 bytes)
   * - message length (32 bytes)
   * - message data (variable)
   * 
   * MessageV2 format: version(4) + sourceDomain(4) + destinationDomain(4) + nonce(8) + sender(32) + messageBody(variable)
   */
  private async decodeSourceDomainFromTx(txHash: string): Promise<number | null> {
    try {
      const tx = await this.client.getTransaction({ hash: txHash as `0x${string}` });
      if (!tx.input || tx.input === '0x' || tx.input.length < 10) {
        return null;
      }

      // Remove 0x prefix and function selector (4 bytes = 8 hex chars)
      const calldata = tx.input.slice(2);
      const body = calldata.slice(8); // Skip function selector
      
      if (body.length < 128) {
        return null; // Not enough data
      }
      
      // First 32 bytes (64 hex chars) = offset to message (relative to start of parameters)
      const msgOffset = parseInt(body.slice(0, 64), 16);
      
      // Calculate position in body (offset is in bytes, body is hex = 2 chars per byte)
      // Offset is relative to start of parameters (after function selector)
      const msgPos = msgOffset * 2;
      
      if (body.length < msgPos + 64) {
        return null; // Not enough data for message length
      }
      
      // Next 32 bytes = length of messageBody
      const msgLen = parseInt(body.slice(msgPos, msgPos + 64), 16);
      
      if (body.length < msgPos + 64 + msgLen * 2) {
        return null; // Not enough data for messageBody
      }
      
      // Extract messageBody hex
      const msgBodyHex = body.slice(msgPos + 64, msgPos + 64 + msgLen * 2);
      
      if (msgBodyHex.length < 16) {
        return null; // Not enough data for sourceDomain
      }
      
      // Parse MessageV2 header: version(4) + sourceDomain(4) + destinationDomain(4) + ...
      // sourceDomain is at bytes 4-8 (hex chars 8-16)
      const sourceDomainHex = msgBodyHex.slice(8, 16);
      const sourceDomain = parseInt(sourceDomainHex, 16);
      
      return sourceDomain;
    } catch (error) {
      logger.debug(`${this.metadata.name}: Failed to decode sourceDomain from tx ${txHash}: ${error}`);
      return null;
    }
  }

  async getLastProcessedBlock(): Promise<bigint> {
    const result = await pool.query(
      'SELECT get_checkpoint($1) as block',
      [this.domainId]
    );
    return BigInt(result.rows[0].block);
  }

  async updateCheckpoint(blockNumber: bigint): Promise<void> {
    await pool.query(
      'SELECT update_checkpoint($1, $2)',
      [this.domainId, blockNumber.toString()]
    );
  }

  /**
   * Fetch all TokenMessengerV2 logs and separate burns from mints
   */
  async indexBlockRange(fromBlock: bigint, toBlock: bigint): Promise<{ burns: number; mints: number }> {
    const burns: BurnRecord[] = [];
    const mints: MintRecord[] = [];
    const blockTimestamps = new Map<bigint, Date>();
    const txSourceDomainCache = new Map<string, number | null>(); // Cache for sourceDomain lookups

    try {
      // Chunk the request into small ranges
      let currentFrom = fromBlock;

      while (currentFrom <= toBlock) {
        const currentTo = currentFrom + MAX_BLOCKS_PER_LOG_QUERY - 1n > toBlock
          ? toBlock
          : currentFrom + MAX_BLOCKS_PER_LOG_QUERY - 1n;

        try {
          // Get ALL logs from TokenMessengerV2 (no topic filter)
          const logs = await this.client.getLogs({
            address: TOKEN_MESSENGER_V2,
            fromBlock: currentFrom,
            toBlock: currentTo,
          });

          // Process each log
          for (const log of logs) {
            if (!log.topics[0] || !log.transactionHash || log.blockNumber === null) continue;

            const topic0 = log.topics[0].toLowerCase();

            // Get block timestamp if not cached
            if (!blockTimestamps.has(log.blockNumber)) {
              try {
                const block = await this.client.getBlock({ blockNumber: log.blockNumber });
                blockTimestamps.set(log.blockNumber, new Date(Number(block.timestamp) * 1000));
              } catch {
                blockTimestamps.set(log.blockNumber, new Date());
              }
            }
            const blockTime = blockTimestamps.get(log.blockNumber) || new Date();

            if (topic0 === DEPOSIT_FOR_BURN_TOPIC.toLowerCase()) {
              // Parse DepositForBurn event
              try {
                const decoded = decodeEventLog({
                  abi: [DEPOSIT_FOR_BURN_ABI],
                  data: log.data,
                  topics: log.topics,
                });

                const args = decoded.args as any;
                burns.push({
                  chainDomain: this.domainId,
                  destinationDomain: Number(args.destinationDomain),
                  amount: args.amount.toString(),
                  token: 'USDC',
                  blockTime,
                  txHash: log.transactionHash,
                  blockNumber: log.blockNumber,
                  logIndex: log.logIndex ?? 0,
                });
              } catch (e) {
                logger.debug(`${this.metadata.name}: Failed to decode DepositForBurn: ${e}`);
              }
            } else if (topic0 === MINT_AND_WITHDRAW_TOPIC.toLowerCase()) {
              // Parse MintAndWithdraw event
              try {
                const decoded = decodeEventLog({
                  abi: [MINT_AND_WITHDRAW_ABI],
                  data: log.data,
                  topics: log.topics,
                });

                const args = decoded.args as any;
                const txHash = log.transactionHash;
                
                // Get sourceDomain from transaction calldata (with caching)
                let sourceDomain = txSourceDomainCache.get(txHash);
                if (sourceDomain === undefined) {
                  sourceDomain = await this.decodeSourceDomainFromTx(txHash);
                  txSourceDomainCache.set(txHash, sourceDomain);
                  // Small delay to respect rate limits
                  await this.delay(DELAY_BETWEEN_RPC_CALLS_MS);
                }
                
                mints.push({
                  chainDomain: this.domainId,
                  sourceDomain: sourceDomain ?? 0, // Use decoded sourceDomain or 0 if not found
                  amount: args.amount.toString(),
                  token: 'USDC',
                  mintRecipient: args.mintRecipient,
                  blockTime,
                  txHash,
                  blockNumber: log.blockNumber,
                  logIndex: log.logIndex ?? 0,
                });
              } catch (e) {
                logger.debug(`${this.metadata.name}: Failed to decode MintAndWithdraw: ${e}`);
              }
            }
          }
        } catch (error: any) {
          // Handle different error types gracefully
          if (error?.code === -32615 || error?.message?.includes('range')) {
            logger.warn(`${this.metadata.name}: Skipping chunk [${currentFrom}-${currentTo}] - range limit`);
          } else if (error?.message?.includes('fetch failed') || error?.message?.includes('timeout') || error?.message?.includes('HTTP')) {
            logger.warn(`${this.metadata.name}: Skipping chunk [${currentFrom}-${currentTo}] - network error: ${error.message}`);
            // Continue to next chunk instead of failing entire range
          } else {
            logger.error(`${this.metadata.name}: Error in chunk [${currentFrom}-${currentTo}]`, error);
            // Continue to next chunk for resilience
          }
        }

        currentFrom = currentTo + 1n;

        if (currentFrom <= toBlock) {
          await this.delay(DELAY_BETWEEN_RPC_CALLS_MS);
        }
      }

      // Insert records
      if (burns.length > 0) {
        await this.insertBurns(burns);
        logger.info(`${this.metadata.name}: 🔥 ${burns.length} burns`);
      }

      if (mints.length > 0) {
        await this.insertMints(mints);
        logger.info(`${this.metadata.name}: 💵 ${mints.length} mints`);
      }

      // Update checkpoint
      await this.updateCheckpoint(toBlock);

      return { burns: burns.length, mints: mints.length };
    } catch (error) {
      logger.error(`${this.metadata.name}: Error indexing blocks ${fromBlock}-${toBlock}`, error);
      throw error;
    }
  }

  private async insertBurns(burns: BurnRecord[]): Promise<void> {
    if (burns.length === 0) return;

    const values = burns.map(
      (b, i) => `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`
    ).join(', ');

    const query = `
      INSERT INTO burns (
        chain_domain, destination_domain, amount, token, block_time, tx_hash, block_number, log_index
      ) VALUES ${values}
      ON CONFLICT (chain_domain, tx_hash, log_index) DO NOTHING
    `;

    const params = burns.flatMap(b => [
      b.chainDomain,
      b.destinationDomain,
      b.amount,
      b.token,
      b.blockTime,
      b.txHash,
      b.blockNumber.toString(),
      b.logIndex,
    ]);

    await pool.query(query, params);
  }

  private async insertMints(mints: MintRecord[]): Promise<void> {
    if (mints.length === 0) return;

    const values = mints.map(
      (m, i) => `($${i * 9 + 1}, $${i * 9 + 2}, $${i * 9 + 3}, $${i * 9 + 4}, $${i * 9 + 5}, $${i * 9 + 6}, $${i * 9 + 7}, $${i * 9 + 8}, $${i * 9 + 9})`
    ).join(', ');

    const query = `
      INSERT INTO mints (
        chain_domain, source_domain, amount, token, mint_recipient, block_time, tx_hash, block_number, log_index
      ) VALUES ${values}
      ON CONFLICT (chain_domain, tx_hash, log_index) DO NOTHING
    `;

    const params = mints.flatMap(m => [
      m.chainDomain,
      m.sourceDomain,
      m.amount,
      m.token,
      m.mintRecipient,
      m.blockTime,
      m.txHash,
      m.blockNumber.toString(),
      m.logIndex,
    ]);

    await pool.query(query, params);
  }

  async getCurrentBlock(): Promise<bigint> {
    return await this.client.getBlockNumber();
  }

  getChainName(): string {
    return this.metadata.name;
  }
}
