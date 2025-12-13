/**
 * Metrics API routes - Simplified
 */

import { Router, Request, Response } from 'express';
import { getChainMinuteMetrics } from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('MetricsRoutes');
const router = Router();

/**
 * Get per-chain metrics for last minute
 * GET /api/metrics/chains/minute
 */
router.get('/chains/minute', async (req: Request, res: Response) => {
  try {
    const metrics = await getChainMinuteMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching chain minute metrics', error);
    res.status(500).json({ error: 'Failed to fetch chain minute metrics' });
  }
});

export default router;

