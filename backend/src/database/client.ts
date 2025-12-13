/**
 * Database client with helper functions
 */

import { pool } from '../config/database';
import { Transfer, TransferStatus, TransferMode, TokenType } from '../types/transfer';
import { TransferMetricsBucket, ChainMinuteMetrics } from '../types/metrics';
import { createLogger } from '../utils/logger';

const logger = createLogger('DatabaseClient');

/**
 * Insert or update a transfer record
 */
export async function upsertTransfer(transfer: Transfer): Promise<void> {
  const query = `
    INSERT INTO cctp_transfers (
      transfer_id, source_domain, destination_domain, mode, token_type, amount,
      burn_tx_hash, mint_tx_hash, burn_at, iris_attested_at, mint_at,
      status, error_reason, nonce, message_body, sender, recipient,
      min_finality_threshold, max_fee, finality_threshold_executed
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    ON CONFLICT (transfer_id) DO UPDATE SET
      mint_tx_hash = EXCLUDED.mint_tx_hash,
      iris_attested_at = EXCLUDED.iris_attested_at,
      mint_at = EXCLUDED.mint_at,
      status = EXCLUDED.status,
      error_reason = EXCLUDED.error_reason,
      message_body = EXCLUDED.message_body,
      finality_threshold_executed = EXCLUDED.finality_threshold_executed,
      updated_at = NOW()
  `;

  const values = [
    transfer.transferId,
    transfer.sourceDomain,
    transfer.destinationDomain,
    transfer.mode,
    transfer.tokenType,
    transfer.amount,
    transfer.burnTxHash,
    transfer.mintTxHash,
    transfer.burnAt,
    transfer.irisAttestedAt,
    transfer.mintAt,
    transfer.status,
    transfer.errorReason,
    transfer.nonce,
    transfer.messageBody,
    transfer.sender,
    transfer.recipient,
    transfer.minFinalityThreshold,
    transfer.maxFee,
    transfer.finalityThresholdExecuted
  ];

  try {
    await pool.query(query, values);
    logger.debug('Transfer upserted', { transferId: transfer.transferId, status: transfer.status });
  } catch (error) {
    logger.error('Failed to upsert transfer', { transferId: transfer.transferId, error });
    throw error;
  }
}

/**
 * Get a transfer by ID
 */
export async function getTransferById(transferId: string): Promise<Transfer | null> {
  const query = 'SELECT * FROM cctp_transfers WHERE transfer_id = $1';

  try {
    const result = await pool.query(query, [transferId]);
    if (result.rows.length === 0) return null;

    return mapRowToTransfer(result.rows[0]);
  } catch (error) {
    logger.error('Failed to get transfer', { transferId, error });
    throw error;
  }
}

/**
 * Get transfers by status
 */
export async function getTransfersByStatus(status: TransferStatus, limit: number = 100): Promise<Transfer[]> {
  const query = 'SELECT * FROM cctp_transfers WHERE status = $1 ORDER BY burn_at DESC LIMIT $2';

  try {
    const result = await pool.query(query, [status, limit]);
    return result.rows.map(mapRowToTransfer);
  } catch (error) {
    logger.error('Failed to get transfers by status', { status, error });
    throw error;
  }
}

/**
 * Get pending transfers (for Iris polling)
 */
export async function getPendingTransfers(): Promise<Transfer[]> {
  const query = `
    SELECT * FROM cctp_transfers 
    WHERE status IN ($1, $2, $3) 
    ORDER BY burn_at ASC
  `;

  try {
    const result = await pool.query(query, [
      TransferStatus.MESSAGE_SENT,
      TransferStatus.ATTESTATION_PENDING,
      TransferStatus.ATTESTATION_COMPLETE
    ]);
    return result.rows.map(mapRowToTransfer);
  } catch (error) {
    logger.error('Failed to get pending transfers', error);
    throw error;
  }
}

/**
 * Upsert transfer metrics using the database function
 */
export async function upsertTransferMetrics(
  bucketStart: Date,
  fromChain: number,
  toChain: number,
  mode: TransferMode,
  tokenType: TokenType,
  volume: string,
  burnToMintMs: number,
  burnToIrisMs: number,
  irisToMintMs: number,
  isError: boolean,
  isIncomplete: boolean
): Promise<void> {
  const query = `
    SELECT upsert_transfer_metrics($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `;

  const values = [
    bucketStart,
    fromChain,
    toChain,
    mode,
    tokenType,
    volume,
    burnToMintMs,
    burnToIrisMs,
    irisToMintMs,
    isError,
    isIncomplete
  ];

  try {
    await pool.query(query, values);
    logger.debug('Metrics upserted', { bucketStart, fromChain, toChain, mode, tokenType });
  } catch (error) {
    logger.error('Failed to upsert metrics', error);
    throw error;
  }
}

/**
 * Get metrics for a time range
 */
export async function getMetricsInRange(
  startTime: Date,
  endTime: Date
): Promise<TransferMetricsBucket[]> {
  const query = `
    SELECT * FROM cctp_transfer_metrics_minute
    WHERE bucket_start >= $1 AND bucket_start < $2
    ORDER BY bucket_start DESC
  `;

  try {
    const result = await pool.query(query, [startTime, endTime]);
    return result.rows.map(row => ({
      bucketStart: row.bucket_start,
      fromChain: row.from_chain,
      toChain: row.to_chain,
      mode: row.mode,
      tokenType: row.token_type,
      transferCount: row.transfer_count,
      volumeTotal: row.volume_total,
      sumBurnToMintMs: row.sum_burn_to_mint_ms,
      sumBurnToIrisMs: row.sum_burn_to_iris_ms,
      sumIrisToMintMs: row.sum_iris_to_mint_ms,
      errorCount: row.error_count,
      incompleteCount: row.incomplete_count
    }));
  } catch (error) {
    logger.error('Failed to get metrics', error);
    throw error;
  }
}

/**
 * Get anomalies (transfers pending too long, errors, etc.)
 */
export async function getAnomalies(thresholdMinutes: number = 30): Promise<Transfer[]> {
  const query = `
    SELECT * FROM cctp_transfers
    WHERE (
      (status IN ($1, $2, $3) AND burn_at < NOW() - INTERVAL '${thresholdMinutes} minutes')
      OR status = $4
    )
    ORDER BY burn_at DESC
    LIMIT 100
  `;

  try {
    const result = await pool.query(query, [
      TransferStatus.MESSAGE_SENT,
      TransferStatus.ATTESTATION_PENDING,
      TransferStatus.ATTESTATION_COMPLETE,
      TransferStatus.ERROR
    ]);
    return result.rows.map(mapRowToTransfer);
  } catch (error) {
    logger.error('Failed to get anomalies', error);
    throw error;
  }
}

/**
 * Get per-chain metrics for a specific time period
 * Uses burns and mints tables from POC indexer
 */
export async function getChainMinuteMetrics(intervalMinutes: number = 1440): Promise<ChainMinuteMetrics[]> {
  const query = `
    WITH chain_out AS (
      SELECT 
        chain_domain,
        SUM(amount) as total_amount
      FROM burns
      WHERE block_time >= NOW() - INTERVAL '${intervalMinutes} minutes'
        AND token = 'USDC'
      GROUP BY chain_domain
    ),
    chain_in AS (
      SELECT 
        chain_domain,
        SUM(amount) as total_amount
      FROM mints
      WHERE block_time >= NOW() - INTERVAL '${intervalMinutes} minutes'
        AND token = 'USDC'
      GROUP BY chain_domain
    ),
    chain_stats AS (
      SELECT 
        COALESCE(out.chain_domain, in_stats.chain_domain) as domain,
        COALESCE(out.total_amount, 0) as out_usdc,
        COALESCE(in_stats.total_amount, 0) as in_usdc
      FROM chain_out out
      FULL OUTER JOIN chain_in in_stats ON out.chain_domain = in_stats.chain_domain
    )
    SELECT 
      cs.domain,
      cs.out_usdc::TEXT as outgoing_usdc,
      '0'::TEXT as outgoing_usyc,
      cs.in_usdc::TEXT as incoming_usdc,
      '0'::TEXT as incoming_usyc
    FROM chain_stats cs
    ORDER BY cs.domain
  `;

  try {
    const result = await pool.query(query);
    const chainMap = new Map<number, ChainMinuteMetrics>();

    // Initialize all supported chains with zeros (14 mainnet chains only)
    const allChains = [
      { domain: 0, name: 'Ethereum' },
      { domain: 1, name: 'Avalanche' },
      { domain: 2, name: 'OP Mainnet' },
      { domain: 3, name: 'Arbitrum' },
      { domain: 6, name: 'Base' },
      { domain: 7, name: 'Polygon' },
      { domain: 10, name: 'Unichain' },
      { domain: 11, name: 'Linea' },
      { domain: 13, name: 'Sonic' },
      { domain: 14, name: 'World Chain' },
      { domain: 15, name: 'Monad' },
      { domain: 19, name: 'HyperEVM' },
      { domain: 21, name: 'Ink' },
    ];

    allChains.forEach(chain => {
      chainMap.set(chain.domain, {
        domain: chain.domain,
        name: chain.name,
        incomingUSDC: '0',
        incomingUSYC: '0', // Always 0, USYC not supported
        outgoingUSDC: '0',
        outgoingUSYC: '0', // Always 0, USYC not supported
      });
    });

    // Update with actual data (USDC only)
    result.rows.forEach(row => {
      const existing = chainMap.get(row.domain);
      if (existing) {
        existing.incomingUSDC = row.incoming_usdc || '0';
        existing.incomingUSYC = '0'; // USYC not supported
        existing.outgoingUSDC = row.outgoing_usdc || '0';
        existing.outgoingUSYC = '0'; // USYC not supported
      }
    });

    return Array.from(chainMap.values());
  } catch (error) {
    logger.error('Failed to get chain minute metrics', error);
    throw error;
  }
}

/**
 * Get OUT volume for a specific route (source → destination) in last minute
 */
export async function getRouteOutVolume(
  sourceDomain: number,
  destinationDomain: number
): Promise<string> {
  const query = `
    SELECT COALESCE(SUM(amount), 0)::TEXT as volume
    FROM burns
    WHERE chain_domain = $1
      AND destination_domain = $2
      AND block_time >= NOW() - INTERVAL '1 minute'
  `;

  try {
    const result = await pool.query(query, [sourceDomain, destinationDomain]);
    return result.rows[0]?.volume || '0';
  } catch (error) {
    logger.error('Failed to get route OUT volume', error);
    throw error;
  }
}

/**
 * Get IN volume for a specific route (destination ← source) in last minute
 */
export async function getRouteInVolume(
  destinationDomain: number,
  sourceDomain: number
): Promise<string> {
  const query = `
    SELECT COALESCE(SUM(amount), 0)::TEXT as volume
    FROM mints
    WHERE chain_domain = $1
      AND source_domain = $2
      AND block_time >= NOW() - INTERVAL '1 minute'
  `;

  try {
    const result = await pool.query(query, [destinationDomain, sourceDomain]);
    return result.rows[0]?.volume || '0';
  } catch (error) {
    logger.error('Failed to get route IN volume', error);
    throw error;
  }
}

/**
 * Get total volume OUT across all chains for last minute (USDC only)
 */
export async function getTotalOutVolume(): Promise<{ usdc: string; usyc: string; total: string }> {
  const query = `
    SELECT 
      COALESCE(SUM(amount), 0)::TEXT as usdc
    FROM burns
    WHERE block_time >= NOW() - INTERVAL '1 minute'
      AND token = 'USDC'
  `;

  try {
    const result = await pool.query(query);
    const row = result.rows[0];
    const usdc = row.usdc || '0';
    return {
      usdc,
      usyc: '0', // USYC not supported
      total: usdc, // Total = USDC only
    };
  } catch (error) {
    logger.error('Failed to get total OUT volume', error);
    throw error;
  }
}

/**
 * Get total volume IN across all chains for last minute (USDC only)
 */
export async function getTotalInVolume(): Promise<{ usdc: string; usyc: string; total: string }> {
  const query = `
    SELECT 
      COALESCE(SUM(amount), 0)::TEXT as usdc
    FROM mints
    WHERE block_time >= NOW() - INTERVAL '1 minute'
      AND token = 'USDC'
  `;

  try {
    const result = await pool.query(query);
    const row = result.rows[0];
    const usdc = row.usdc || '0';
    return {
      usdc,
      usyc: '0', // USYC not supported
      total: usdc, // Total = USDC only
    };
  } catch (error) {
    logger.error('Failed to get total IN volume', error);
    throw error;
  }
}

/**
 * Get total volume (IN + OUT) for a specific time period
 */
export async function getTotalVolume(intervalMinutes: number): Promise<{ in: string; out: string; total: string }> {
  const query = `
    WITH total_out AS (
      SELECT COALESCE(SUM(amount), 0)::TEXT as out
      FROM burns
      WHERE block_time >= NOW() - INTERVAL '${intervalMinutes} minutes'
        AND token = 'USDC'
    ),
    total_in AS (
      SELECT COALESCE(SUM(amount), 0)::TEXT as in_amount
      FROM mints
      WHERE block_time >= NOW() - INTERVAL '${intervalMinutes} minutes'
        AND token = 'USDC'
    )
    SELECT 
      total_in.in_amount as in_volume,
      total_out.out as out_volume,
      (total_in.in_amount::NUMERIC + total_out.out::NUMERIC)::TEXT as total_volume
    FROM total_in, total_out
  `;

  try {
    const result = await pool.query(query);
    const row = result.rows[0];
    return {
      in: row.in_volume || '0',
      out: row.out_volume || '0',
      total: row.total_volume || '0',
    };
  } catch (error) {
    logger.error('Failed to get total volume', error);
    throw error;
  }
}

/**
 * Get outgoing details for a specific chain (where money goes)
 * Returns volume sent to each destination chain
 */
export async function getChainOutgoingDetails(chainDomain: number, intervalMinutes: number): Promise<Array<{ destinationDomain: number; volume: string }>> {
  const query = `
    SELECT 
      destination_domain as destination_domain,
      COALESCE(SUM(amount), 0)::TEXT as volume
    FROM burns
    WHERE chain_domain = $1
      AND block_time >= NOW() - INTERVAL '${intervalMinutes} minutes'
      AND token = 'USDC'
    GROUP BY destination_domain
    ORDER BY volume DESC
  `;

  try {
    const result = await pool.query(query, [chainDomain]);
    return result.rows.map(row => ({
      destinationDomain: row.destination_domain,
      volume: row.volume || '0',
    }));
  } catch (error) {
    logger.error('Failed to get chain outgoing details', error);
    throw error;
  }
}

/**
 * Get incoming details for a specific chain (where money comes from)
 * Returns volume received from each source chain
 * Includes unknown sources (-1) for display, filters out same-chain sources (impossible in CCTP)
 */
export async function getChainIncomingDetails(chainDomain: number, intervalMinutes: number): Promise<Array<{ sourceDomain: number; volume: string }>> {
  const query = `
    SELECT 
      source_domain as source_domain,
      COALESCE(SUM(amount), 0)::TEXT as volume
    FROM mints
    WHERE chain_domain = $1
      AND block_time >= NOW() - INTERVAL '${intervalMinutes} minutes'
      AND token = 'USDC'
      AND source_domain != $1
    GROUP BY source_domain
    ORDER BY volume DESC
  `;

  try {
    const result = await pool.query(query, [chainDomain]);
    return result.rows.map(row => ({
      sourceDomain: row.source_domain,
      volume: row.volume || '0',
    }));
  } catch (error) {
    logger.error('Failed to get chain incoming details', error);
    throw error;
  }
}

/**
 * Get chain volume chart data by time buckets (for outgoing or incoming)
 * Returns data grouped by destination/source chain
 * @param chainDomain - The chain domain ID
 * @param intervalMinutes - Time period to query
 * @param type - 'outgoing' or 'incoming'
 * @param buckets - Number of time buckets (default 20)
 */
export async function getChainVolumeChart(
  chainDomain: number,
  intervalMinutes: number,
  type: 'outgoing' | 'incoming',
  buckets: number = 20
): Promise<Array<{ time: string; total: string; [key: string]: string }>> {
  const bucketSize = intervalMinutes / buckets;

  let query: string;
  if (type === 'outgoing') {
    query = `
      WITH time_buckets AS (
        SELECT generate_series(
          NOW() - INTERVAL '${intervalMinutes} minutes',
          NOW(),
          INTERVAL '${bucketSize} minutes'
        ) as bucket_start
      ),
      burns_by_bucket AS (
        SELECT 
          DATE_TRUNC('minute', tb.bucket_start) as time,
          b.destination_domain,
          COALESCE(SUM(b.amount), 0) as volume
        FROM time_buckets tb
        LEFT JOIN burns b ON 
          b.block_time >= tb.bucket_start 
          AND b.block_time < tb.bucket_start + INTERVAL '${bucketSize} minutes'
          AND b.chain_domain = $1
          AND b.token = 'USDC'
        GROUP BY tb.bucket_start, b.destination_domain
      )
      SELECT 
        time,
        COALESCE(SUM(volume), 0)::TEXT as total,
        COALESCE(
          jsonb_object_agg(
            destination_domain::TEXT,
            volume::TEXT
          ) FILTER (WHERE destination_domain IS NOT NULL),
          '{}'::jsonb
        ) as chains
      FROM burns_by_bucket
      GROUP BY time
      ORDER BY time ASC
    `;
  } else {
    query = `
      WITH time_buckets AS (
        SELECT generate_series(
          NOW() - INTERVAL '${intervalMinutes} minutes',
          NOW(),
          INTERVAL '${bucketSize} minutes'
        ) as bucket_start
      ),
      mints_by_bucket AS (
        SELECT 
          DATE_TRUNC('minute', tb.bucket_start) as time,
          m.source_domain,
          COALESCE(SUM(m.amount), 0) as volume
        FROM time_buckets tb
        LEFT JOIN mints m ON 
          m.block_time >= tb.bucket_start 
          AND m.block_time < tb.bucket_start + INTERVAL '${bucketSize} minutes'
          AND m.chain_domain = $1
          AND m.token = 'USDC'
          AND m.source_domain != $1
        GROUP BY tb.bucket_start, m.source_domain
      )
      SELECT 
        time,
        COALESCE(SUM(volume), 0)::TEXT as total,
        COALESCE(
          jsonb_object_agg(
            source_domain::TEXT,
            volume::TEXT
          ) FILTER (WHERE source_domain IS NOT NULL),
          '{}'::jsonb
        ) as chains
      FROM mints_by_bucket
      GROUP BY time
      ORDER BY time ASC
    `;
  }

  try {
    const result = await pool.query(query, [chainDomain]);
    return result.rows.map(row => {
      const data: { time: string; total: string; [key: string]: string } = {
        time: row.time.toISOString(),
        total: row.total || '0',
      };
      
      // Add each chain as a separate field
      if (row.chains) {
        Object.keys(row.chains).forEach(domain => {
          data[`chain_${domain}`] = row.chains[domain] || '0';
        });
      }
      
      return data;
    });
  } catch (error) {
    logger.error(`Failed to get chain ${type} volume chart`, error);
    throw error;
  }
}

/**
 * Get volume by time buckets for chart (time series data)
 */
export async function getVolumeByPeriod(intervalMinutes: number, buckets: number = 20): Promise<Array<{ time: string; in: string; out: string; total: string }>> {
  const bucketSize = intervalMinutes / buckets;

  const query = `
    WITH time_buckets AS (
      SELECT generate_series(
        NOW() - INTERVAL '${intervalMinutes} minutes',
        NOW(),
        INTERVAL '${bucketSize} minutes'
      ) as bucket_start
    ),
    burns_by_bucket AS (
      SELECT 
        DATE_TRUNC('minute', bucket_start) as time,
        COALESCE(SUM(b.amount), 0)::TEXT as out_volume
      FROM time_buckets tb
      LEFT JOIN burns b ON 
        b.block_time >= tb.bucket_start 
        AND b.block_time < tb.bucket_start + INTERVAL '${bucketSize} minutes'
        AND b.token = 'USDC'
      GROUP BY tb.bucket_start
    ),
    mints_by_bucket AS (
      SELECT 
        DATE_TRUNC('minute', bucket_start) as time,
        COALESCE(SUM(m.amount), 0)::TEXT as in_volume
      FROM time_buckets tb
      LEFT JOIN mints m ON 
        m.block_time >= tb.bucket_start 
        AND m.block_time < tb.bucket_start + INTERVAL '${bucketSize} minutes'
        AND m.token = 'USDC'
      GROUP BY tb.bucket_start
    )
    SELECT 
      COALESCE(b.time, m.time) as time,
      COALESCE(m.in_volume, '0') as in_volume,
      COALESCE(b.out_volume, '0') as out_volume,
      (COALESCE(m.in_volume::NUMERIC, 0) + COALESCE(b.out_volume::NUMERIC, 0))::TEXT as total_volume
    FROM burns_by_bucket b
    FULL OUTER JOIN mints_by_bucket m ON b.time = m.time
    ORDER BY time ASC
  `;

  try {
    const result = await pool.query(query);
    return result.rows.map(row => ({
      time: row.time.toISOString(),
      in: row.in_volume || '0',
      out: row.out_volume || '0',
      total: row.total_volume || '0',
    }));
  } catch (error) {
    logger.error('Failed to get volume by period', error);
    throw error;
  }
}

/**
 * Helper to map database row to Transfer object
 */
function mapRowToTransfer(row: any): Transfer {
  return {
    transferId: row.transfer_id,
    sourceDomain: row.source_domain,
    destinationDomain: row.destination_domain,
    mode: row.mode as TransferMode,
    tokenType: row.token_type as TokenType,
    amount: row.amount,
    burnTxHash: row.burn_tx_hash,
    mintTxHash: row.mint_tx_hash,
    burnAt: row.burn_at,
    irisAttestedAt: row.iris_attested_at,
    mintAt: row.mint_at,
    status: row.status as TransferStatus,
    errorReason: row.error_reason,
    nonce: row.nonce,
    messageBody: row.message_body,
    sender: row.sender,
    recipient: row.recipient,
    minFinalityThreshold: row.min_finality_threshold,
    maxFee: row.max_fee,
    finalityThresholdExecuted: row.finality_threshold_executed
  };
}

