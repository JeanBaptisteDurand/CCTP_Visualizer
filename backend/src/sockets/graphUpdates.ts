/**
 * Socket.IO handlers for graph updates
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { TransferService } from '../services/TransferService';
import { createLogger } from '../utils/logger';

const logger = createLogger('GraphUpdates');

export function setupGraphUpdates(io: SocketIOServer, transferService: TransferService): void {
  io.on('connection', (socket: Socket) => {
    logger.info('Client connected', { socketId: socket.id });

    // Send current active transfers on connection
    transferService.getActiveTransfers().then(transfers => {
      socket.emit('transfers:initial', transfers);
    });

    // Handle client requests for specific transfer details
    socket.on('transfer:request', async (transferId: string) => {
      // Could implement specific transfer lookup if needed
      logger.debug('Transfer request received', { transferId, socketId: socket.id });
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
    });
  });

  logger.info('Socket.IO graph updates configured');
}

