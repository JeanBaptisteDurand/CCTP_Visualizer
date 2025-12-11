/**
 * Transfer Service
 * Manages transfer state, coordinates between chain watchers and Iris,
 * and emits real-time updates via Socket.IO
 */

import { Server as SocketIOServer } from 'socket.io';
import { Transfer, TransferStatus, TransferMode, TokenType, BurnEvent, MessageSentEvent, ReceiveMessageEvent, MintEvent } from '../types/transfer';
import { IIrisClient } from '../iris/IIrisClient';
import { upsertTransfer, getTransferById, getPendingTransfers } from '../database/client';
import { isFastTransferSupported, getChainName } from '../config/chains';
import { createLogger } from '../utils/logger';
import { MetricsAggregator } from './MetricsAggregator';

const logger = createLogger('TransferService');

export class TransferService {
  private io: SocketIOServer | null = null;
  private irisClient: IIrisClient;
  private metricsAggregator: MetricsAggregator;
  private transferCache: Map<string, Transfer> = new Map();
  private irisPollingInterval: NodeJS.Timeout | null = null;

  constructor(irisClient: IIrisClient, metricsAggregator: MetricsAggregator) {
    this.irisClient = irisClient;
    this.metricsAggregator = metricsAggregator;
  }

  /**
   * Set Socket.IO server for real-time updates
   */
  setSocketIO(io: SocketIOServer): void {
    this.io = io;
  }

  /**
   * Start Iris polling for pending transfers
   */
  startIrisPolling(): void {
    const interval = parseInt(process.env.IRIS_POLL_INTERVAL || '5000');
    
    this.irisPollingInterval = setInterval(() => {
      this.pollIrisForPendingTransfers();
    }, interval);

    logger.info('Started Iris polling', { interval });
  }

  /**
   * Stop Iris polling
   */
  stopIrisPolling(): void {
    if (this.irisPollingInterval) {
      clearInterval(this.irisPollingInterval);
      this.irisPollingInterval = null;
      logger.info('Stopped Iris polling');
    }
  }

  /**
   * Handle burn event from chain watcher
   */
  async handleBurnEvent(event: BurnEvent): Promise<void> {
    const transferId = `${event.domain}-${event.nonce}`;
    
    try {
      // Determine if this is Fast or Standard transfer
      const mode = this.determineTransferMode(event);

      const transfer: Transfer = {
        transferId,
        sourceDomain: event.domain,
        destinationDomain: event.destinationDomain,
        mode,
        tokenType: event.tokenType,
        amount: event.amount,
        burnTxHash: event.txHash,
        mintTxHash: null,
        burnAt: event.timestamp,
        irisAttestedAt: null,
        mintAt: null,
        status: TransferStatus.BURN_INITIATED,
        errorReason: null,
        nonce: event.nonce,
        messageBody: null,
        sender: event.sender,
        recipient: event.recipient,
        minFinalityThreshold: event.minFinalityThreshold,
        maxFee: '0',
        finalityThresholdExecuted: null
      };

      await upsertTransfer(transfer);
      this.transferCache.set(transferId, transfer);

      logger.info('Burn event processed', {
        transferId,
        from: getChainName(event.domain),
        to: getChainName(event.destinationDomain),
        amount: event.amount,
        mode
      });

      this.emitTransferUpdate(transfer);
    } catch (error) {
      logger.error('Failed to handle burn event', { transferId, error });
    }
  }

  /**
   * Handle MessageSent event from chain watcher
   */
  async handleMessageSentEvent(event: MessageSentEvent): Promise<void> {
    const transferId = `${event.domain}-${event.nonce}`;
    
    try {
      let transfer = this.transferCache.get(transferId) || await getTransferById(transferId);
      
      if (!transfer) {
        logger.warn('MessageSent event received for unknown transfer', { transferId });
        return;
      }

      transfer.status = TransferStatus.MESSAGE_SENT;
      transfer.messageBody = event.messageBody;

      await upsertTransfer(transfer);
      this.transferCache.set(transferId, transfer);

      logger.info('MessageSent event processed', { transferId });
      this.emitTransferUpdate(transfer);

      // Immediately check Iris for attestation
      this.checkIrisAttestation(transfer);
    } catch (error) {
      logger.error('Failed to handle MessageSent event', { transferId, error });
    }
  }

  /**
   * Handle ReceiveMessage event from chain watcher
   */
  async handleReceiveMessageEvent(event: ReceiveMessageEvent): Promise<void> {
    const transferId = `${event.sourceDomain}-${event.nonce}`;
    
    try {
      let transfer = this.transferCache.get(transferId) || await getTransferById(transferId);
      
      if (!transfer) {
        logger.warn('ReceiveMessage event received for unknown transfer', { transferId });
        return;
      }

      transfer.status = TransferStatus.RECEIVE_MESSAGE_PENDING;

      await upsertTransfer(transfer);
      this.transferCache.set(transferId, transfer);

      logger.info('ReceiveMessage event processed', { transferId });
      this.emitTransferUpdate(transfer);
    } catch (error) {
      logger.error('Failed to handle ReceiveMessage event', { transferId, error });
    }
  }

  /**
   * Handle mint event from chain watcher
   */
  async handleMintEvent(event: MintEvent): Promise<void> {
    // Note: Mint events don't contain nonce directly, so we need to correlate by recipient and timestamp
    // This is a simplified approach - in production, you'd want more robust correlation
    
    try {
      // Find pending transfer for this destination domain and recipient
      const pendingTransfers = await getPendingTransfers();
      const matchingTransfer = pendingTransfers.find(t => 
        t.destinationDomain === event.domain &&
        t.recipient === event.recipient &&
        t.status === TransferStatus.RECEIVE_MESSAGE_PENDING
      );

      if (!matchingTransfer) {
        logger.warn('Mint event received but no matching pending transfer found', {
          domain: event.domain,
          recipient: event.recipient
        });
        return;
      }

      matchingTransfer.status = TransferStatus.MINT_COMPLETE;
      matchingTransfer.mintAt = event.timestamp;
      matchingTransfer.mintTxHash = event.txHash;

      await upsertTransfer(matchingTransfer);
      this.transferCache.delete(matchingTransfer.transferId);

      logger.info('Mint event processed - transfer complete', {
        transferId: matchingTransfer.transferId
      });

      this.emitTransferUpdate(matchingTransfer);
      
      // Aggregate metrics
      await this.metricsAggregator.aggregateTransfer(matchingTransfer);
    } catch (error) {
      logger.error('Failed to handle mint event', error);
    }
  }

  /**
   * Poll Iris for pending transfers
   */
  private async pollIrisForPendingTransfers(): Promise<void> {
    try {
      const pendingTransfers = await getPendingTransfers();
      
      logger.debug(`Polling Iris for ${pendingTransfers.length} pending transfers`);

      for (const transfer of pendingTransfers) {
        await this.checkIrisAttestation(transfer);
      }
    } catch (error) {
      logger.error('Error polling Iris for pending transfers', error);
    }
  }

  /**
   * Check Iris for attestation status
   */
  private async checkIrisAttestation(transfer: Transfer): Promise<void> {
    try {
      const irisResponse = await this.irisClient.getMessage({
        domain: transfer.sourceDomain,
        nonce: transfer.nonce
      });

      if (!irisResponse) {
        // Message not yet available in Iris
        if (transfer.status === TransferStatus.MESSAGE_SENT) {
          transfer.status = TransferStatus.ATTESTATION_PENDING;
          await upsertTransfer(transfer);
          this.transferCache.set(transfer.transferId, transfer);
        }
        return;
      }

      if (irisResponse.status === 'complete' && irisResponse.attestation) {
        transfer.status = TransferStatus.ATTESTATION_COMPLETE;
        transfer.irisAttestedAt = new Date();
        transfer.finalityThresholdExecuted = irisResponse.finalityThresholdExecuted || null;

        await upsertTransfer(transfer);
        this.transferCache.set(transfer.transferId, transfer);

        logger.info('Attestation complete', {
          transferId: transfer.transferId,
          finalityThreshold: transfer.finalityThresholdExecuted
        });

        this.emitTransferUpdate(transfer);
      } else if (irisResponse.status === 'failed') {
        transfer.status = TransferStatus.ERROR;
        transfer.errorReason = irisResponse.error || 'Attestation failed';

        await upsertTransfer(transfer);
        this.transferCache.delete(transfer.transferId);

        logger.error('Attestation failed', {
          transferId: transfer.transferId,
          error: transfer.errorReason
        });

        this.emitTransferUpdate(transfer);
      }
    } catch (error) {
      logger.error('Error checking Iris attestation', {
        transferId: transfer.transferId,
        error
      });
    }
  }

  /**
   * Determine transfer mode (Fast vs Standard) based on burn event
   */
  private determineTransferMode(event: BurnEvent): TransferMode {
    // Check if Fast Transfer is supported for source domain
    if (!isFastTransferSupported(event.domain)) {
      return TransferMode.STANDARD;
    }

    // Fast transfers use minFinalityThreshold <= 1000
    // Standard transfers use minFinalityThreshold >= 2000
    if (event.minFinalityThreshold <= 1000) {
      return TransferMode.FAST;
    }

    return TransferMode.STANDARD;
  }

  /**
   * Emit transfer update via Socket.IO
   */
  private emitTransferUpdate(transfer: Transfer): void {
    if (this.io) {
      this.io.emit('transfer:update', {
        transferId: transfer.transferId,
        sourceDomain: transfer.sourceDomain,
        destinationDomain: transfer.destinationDomain,
        status: transfer.status,
        mode: transfer.mode,
        tokenType: transfer.tokenType,
        amount: transfer.amount,
        burnAt: transfer.burnAt,
        irisAttestedAt: transfer.irisAttestedAt,
        mintAt: transfer.mintAt
      });
    }
  }

  /**
   * Get active (in-flight) transfers
   */
  async getActiveTransfers(): Promise<Transfer[]> {
    return Array.from(this.transferCache.values());
  }
}

