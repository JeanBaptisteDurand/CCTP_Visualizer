/**
 * Custom hook for managing transfer state
 */

import { useState, useEffect } from 'react';
import { Transfer, TransferUpdate, TransferStatus } from '../types/transfer';
import { socketService } from '../services/socket';
import { apiClient } from '../services/api';

export function useTransfers() {
  const [transfers, setTransfers] = useState<Map<string, Transfer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Connect to socket
    socketService.connect();

    // Load initial active transfers
    loadActiveTransfers();

    // Subscribe to transfer updates
    const handleInitialTransfers = (data: Transfer[]) => {
      const transferMap = new Map<string, Transfer>();
      data.forEach(transfer => {
        transferMap.set(transfer.transferId, transfer);
      });
      setTransfers(transferMap);
      setLoading(false);
    };

    const handleTransferUpdate = (update: TransferUpdate) => {
      setTransfers(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(update.transferId);

        const updated: Transfer = {
          ...existing,
          transferId: update.transferId,
          sourceDomain: update.sourceDomain,
          destinationDomain: update.destinationDomain,
          status: update.status,
          mode: update.mode,
          tokenType: update.tokenType,
          amount: update.amount,
          burnAt: update.burnAt,
          irisAttestedAt: update.irisAttestedAt,
          mintAt: update.mintAt,
          // Preserve existing fields
          burnTxHash: existing?.burnTxHash || '',
          mintTxHash: existing?.mintTxHash || null,
          errorReason: existing?.errorReason || null,
          nonce: existing?.nonce || '',
          sender: existing?.sender || '',
          recipient: existing?.recipient || ''
        };

        // Remove completed or errored transfers after a delay
        if (update.status === TransferStatus.MINT_COMPLETE || update.status === TransferStatus.ERROR) {
          setTimeout(() => {
            setTransfers(prev => {
              const newMap = new Map(prev);
              newMap.delete(update.transferId);
              return newMap;
            });
          }, 10000); // Keep for 10 seconds after completion
        }

        newMap.set(update.transferId, updated);
        return newMap;
      });
    };

    socketService.on('transfers:initial', handleInitialTransfers);
    socketService.on('transfer:update', handleTransferUpdate);

    return () => {
      socketService.off('transfers:initial', handleInitialTransfers);
      socketService.off('transfer:update', handleTransferUpdate);
      socketService.disconnect();
    };
  }, []);

  const loadActiveTransfers = async () => {
    try {
      const data = await apiClient.getActiveTransfers();
      const transferMap = new Map<string, Transfer>();
      data.forEach(transfer => {
        transferMap.set(transfer.transferId, transfer);
      });
      setTransfers(transferMap);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return {
    transfers: Array.from(transfers.values()),
    loading,
    error,
    isConnected: socketService.isConnected()
  };
}

