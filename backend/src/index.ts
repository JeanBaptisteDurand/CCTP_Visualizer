/**
 * CCTP Visualizer Backend - Simplified
 * Main entry point
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { testConnection, closePool } from './config/database';
import metricsRoutes from './routes/metrics';
import healthRoutes from './routes/health';
import { createLogger } from './utils/logger';

const logger = createLogger('Main');

const PORT = parseInt(process.env.PORT || '3001');

async function main() {
  logger.info('Starting CCTP Visualizer Backend (Simplified)...');

  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Initialize Express app
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/metrics', metricsRoutes);
  app.use('/api/health', healthRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'CCTP Visualizer API',
      version: '2.0.0',
      status: 'running'
    });
  });

  // Start HTTP server
  app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });

  logger.info('CCTP Visualizer Backend initialized');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    await closePool();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(error => {
  logger.error('Fatal error during startup', error);
  process.exit(1);
});

