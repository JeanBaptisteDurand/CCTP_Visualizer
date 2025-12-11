/**
 * CCTP Visualizer Backend
 * Main entry point
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { testConnection, closePool } from './config/database';
import { IrisClient } from './iris/irisClient';
import { TransferService } from './services/TransferService';
import { MetricsAggregator } from './services/MetricsAggregator';
import { ChainRegistry } from './services/ChainRegistry';
import metricsRoutes, { setTransferService } from './routes/metrics';
import healthRoutes, { setHealthDependencies } from './routes/health';
import { setupGraphUpdates } from './sockets/graphUpdates';
import { createLogger } from './utils/logger';

const logger = createLogger('Main');

const PORT = parseInt(process.env.PORT || '3001');

async function main() {
  logger.info('Starting CCTP Visualizer Backend...');

  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Initialize Express app
  const app = express();
  const httpServer = createServer(app);

  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Initialize services
  const irisClient = new IrisClient();
  const metricsAggregator = new MetricsAggregator();
  const transferService = new TransferService(irisClient, metricsAggregator);
  const chainRegistry = new ChainRegistry(transferService);

  // Set Socket.IO on transfer service
  transferService.setSocketIO(io);

  // Set up Socket.IO handlers
  setupGraphUpdates(io, transferService);

  // Set dependencies for routes
  setTransferService(transferService);
  setHealthDependencies(irisClient, chainRegistry);

  // Routes
  app.use('/api/metrics', metricsRoutes);
  app.use('/api/health', healthRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'CCTP Visualizer API',
      version: '1.0.0',
      status: 'running'
    });
  });

  // Start HTTP server
  httpServer.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });

  // Start chain watchers
  logger.info('Starting chain watchers...');
  await chainRegistry.startAll();

  // Start Iris polling
  logger.info('Starting Iris polling...');
  transferService.startIrisPolling();

  logger.info('CCTP Visualizer Backend fully initialized');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');

    transferService.stopIrisPolling();
    await chainRegistry.stopAll();
    await closePool();

    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(error => {
  logger.error('Fatal error during startup', error);
  process.exit(1);
});

