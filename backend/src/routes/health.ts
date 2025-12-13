/**
 * Health check routes - Simplified
 */

import { Router, Request, Response } from 'express';
import { testConnection } from '../config/database';

const router: Router = Router();

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

export default router;

