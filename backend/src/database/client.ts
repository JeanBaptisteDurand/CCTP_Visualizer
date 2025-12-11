/**
 * Database client with helper functions
 */

import { pool } from '../config/database';
import { Transfer, TransferStatus, TransferMode, TokenType } from '../types/transfer';
import { TransferMetricsBucket } from '../types/metrics';
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

