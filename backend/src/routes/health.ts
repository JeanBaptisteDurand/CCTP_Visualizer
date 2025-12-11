/**
 * Health check routes
 */

import { Router, Request, Response } from 'express';
import { testConnection } from '../config/database';
import { IIrisClient } from '../iris/IIrisClient';
import { ChainRegistry } from '../services/ChainRegistry';

const router = Router();

let irisClientInstance: IIrisClient;
let chainRegistryInstance: ChainRegistry;

export function setHealthDependencies(irisClient: IIrisClient, chainRegistry: ChainRegistry): void {
  irisClientInstance = irisClient;
  chainRegistryInstance = chainRegistry;
}

/**
 * Basic health check
 * GET /api/health
 */
router.get('/', async (req: Request, res: Response) => {
  const dbHealthy = await testConnection();

  res.json({
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected'
  });
});

/**
 * Detailed status check
 * GET /api/health/status
 */
router.get('/status', async (req: Request, res: Response) => {
  const dbHealthy = await testConnection();
  const irisHealthy = irisClientInstance ? await irisClientInstance.healthCheck() : false;
  const watcherStatus = chainRegistryInstance ? chainRegistryInstance.getStatus() : {};

  const activeWatchers = Object.values(watcherStatus).filter(Boolean).length;
  const totalWatchers = Object.keys(watcherStatus).length;

  res.json({
    status: dbHealthy && irisHealthy && activeWatchers > 0 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    components: {
      database: dbHealthy ? 'healthy' : 'unhealthy',
      iris: irisHealthy ? 'healthy' : 'unhealthy',
      chainWatchers: {
        status: activeWatchers > 0 ? 'healthy' : 'unhealthy',
        active: activeWatchers,
        total: totalWatchers,
        details: watcherStatus
      }
    }
  });
});

export default router;

