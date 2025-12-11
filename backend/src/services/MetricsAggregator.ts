/**
 * Metrics Aggregator Service
 * Aggregates transfer data into time-bucketed metrics for dashboard queries
 */

import { Transfer, TransferStatus } from '../types/transfer';
import { upsertTransferMetrics } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('MetricsAggregator');

export class MetricsAggregator {
  /**
   * Aggregate a completed transfer into metrics
   */
  async aggregateTransfer(transfer: Transfer): Promise<void> {
    if (transfer.status !== TransferStatus.MINT_COMPLETE && transfer.status !== TransferStatus.ERROR) {
      return; // Only aggregate completed or errored transfers
    }

    try {
      // Calculate durations
      const burnToMintMs = transfer.mintAt && transfer.burnAt
        ? transfer.mintAt.getTime() - transfer.burnAt.getTime()
        : 0;

      const burnToIrisMs = transfer.irisAttestedAt && transfer.burnAt
        ? transfer.irisAttestedAt.getTime() - transfer.burnAt.getTime()
        : 0;

      const irisToMintMs = transfer.mintAt && transfer.irisAttestedAt
        ? transfer.mintAt.getTime() - transfer.irisAttestedAt.getTime()
        : 0;

      // Bucket by minute
      const bucketStart = this.getBucketStart(transfer.burnAt);

      const isError = transfer.status === TransferStatus.ERROR;
      const isIncomplete = transfer.status !== TransferStatus.MINT_COMPLETE;

      await upsertTransferMetrics(
        bucketStart,
        transfer.sourceDomain,
        transfer.destinationDomain,
        transfer.mode,
        transfer.tokenType,
        transfer.amount,
        burnToMintMs,
        burnToIrisMs,
        irisToMintMs,
        isError,
        isIncomplete
      );

      logger.debug('Transfer metrics aggregated', {
        transferId: transfer.transferId,
        bucketStart
      });
    } catch (error) {
      logger.error('Failed to aggregate transfer metrics', {
        transferId: transfer.transferId,
        error
      });
    }
  }

  /**
   * Get bucket start time (truncate to minute)
   */
  private getBucketStart(timestamp: Date): Date {
    const bucket = new Date(timestamp);
    bucket.setSeconds(0, 0);
    return bucket;
  }
}

