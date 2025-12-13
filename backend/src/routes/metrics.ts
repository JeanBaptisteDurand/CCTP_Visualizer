/**
 * Metrics API routes - Simplified
 */

import { Router, Request, Response } from 'express';
import {
  getChainMinuteMetrics,
  getTotalOutVolume,
  getTotalInVolume,
  getTotalVolume,
  getChainOutgoingDetails,
  getChainIncomingDetails,
  getVolumeByPeriod,
  getChainVolumeChart
} from '../database/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('MetricsRoutes');
const router: Router = Router();

// Period mappings (minutes)
const PERIOD_MAP: Record<string, number> = {
  '1min': 1,
  '5min': 5,
  '15min': 15,
  '1h': 60,
  '4h': 240,
  '24h': 1440,
};

/**
 * Get per-chain metrics for a specific period
 * GET /api/metrics/chains?period=1min|5min|15min|1h|4h|24h
 */
router.get('/chains', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || '24h';
    const intervalMinutes = PERIOD_MAP[period] || 1440;
    const metrics = await getChainMinuteMetrics(intervalMinutes);
    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching chain metrics', error);
    res.status(500).json({ error: 'Failed to fetch chain metrics' });
  }
});

/**
 * Get per-chain metrics for last minute (backward compatibility)
 * GET /api/metrics/chains/minute
 */
router.get('/chains/minute', async (req: Request, res: Response) => {
  try {
    const metrics = await getChainMinuteMetrics(1);
    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching chain minute metrics', error);
    res.status(500).json({ error: 'Failed to fetch chain minute metrics' });
  }
});

/**
 * Get total volume OUT across all chains for last minute
 * GET /api/metrics/total/out
 */
router.get('/total/out', async (req: Request, res: Response) => {
  try {
    const volume = await getTotalOutVolume();
    res.json(volume);
  } catch (error) {
    logger.error('Error fetching total OUT volume', error);
    res.status(500).json({ error: 'Failed to fetch total OUT volume' });
  }
});

/**
 * Get total volume IN across all chains for last minute
 * GET /api/metrics/total/in
 */
router.get('/total/in', async (req: Request, res: Response) => {
  try {
    const volume = await getTotalInVolume();
    res.json(volume);
  } catch (error) {
    logger.error('Error fetching total IN volume', error);
    res.status(500).json({ error: 'Failed to fetch total IN volume' });
  }
});

/**
 * Get total volume (IN + OUT) for a specific period
 * GET /api/metrics/total?period=1min|5min|15min|1h|4h|24h
 */
router.get('/total', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || '24h';
    const intervalMinutes = PERIOD_MAP[period] || 1440;
    const volume = await getTotalVolume(intervalMinutes);
    res.json(volume);
  } catch (error) {
    logger.error('Error fetching total volume', error);
    res.status(500).json({ error: 'Failed to fetch total volume' });
  }
});

/**
 * Get outgoing details for a specific chain
 * GET /api/metrics/chain/:domain/outgoing?period=1min|5min|15min|1h|4h|24h
 */
router.get('/chain/:domain/outgoing', async (req: Request, res: Response) => {
  try {
    const domain = parseInt(req.params.domain);
    const period = req.query.period as string || '24h';
    const intervalMinutes = PERIOD_MAP[period] || 1440;
    const details = await getChainOutgoingDetails(domain, intervalMinutes);
    res.json(details);
  } catch (error) {
    logger.error('Error fetching chain outgoing details', error);
    res.status(500).json({ error: 'Failed to fetch chain outgoing details' });
  }
});

/**
 * Get incoming details for a specific chain
 * GET /api/metrics/chain/:domain/incoming?period=1min|5min|15min|1h|4h|24h
 */
router.get('/chain/:domain/incoming', async (req: Request, res: Response) => {
  try {
    const domain = parseInt(req.params.domain);
    const period = req.query.period as string || '24h';
    const intervalMinutes = PERIOD_MAP[period] || 1440;
    const details = await getChainIncomingDetails(domain, intervalMinutes);
    res.json(details);
  } catch (error) {
    logger.error('Error fetching chain incoming details', error);
    res.status(500).json({ error: 'Failed to fetch chain incoming details' });
  }
});

/**
 * Get volume by time buckets for chart
 * GET /api/metrics/volume-chart?period=1min|5min|15min|1h|4h|24h&buckets=20
 */
router.get('/volume-chart', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || '24h';
    const buckets = parseInt(req.query.buckets as string) || 20;
    const intervalMinutes = PERIOD_MAP[period] || 1440;
    const data = await getVolumeByPeriod(intervalMinutes, buckets);
    res.json(data);
  } catch (error) {
    logger.error('Error fetching volume chart data', error);
    res.status(500).json({ error: 'Failed to fetch volume chart data' });
  }
});

/**
 * Get chain volume chart data (outgoing or incoming)
 * GET /api/metrics/chain/:domain/chart?period=1min|5min|15min|1h|4h|24h&type=outgoing|incoming&buckets=20
 */
router.get('/chain/:domain/chart', async (req: Request, res: Response) => {
  try {
    const domain = parseInt(req.params.domain);
    const period = req.query.period as string || '24h';
    const type = (req.query.type as string || 'outgoing') as 'outgoing' | 'incoming';
    const buckets = parseInt(req.query.buckets as string) || 20;
    const intervalMinutes = PERIOD_MAP[period] || 1440;
    const data = await getChainVolumeChart(domain, intervalMinutes, type, buckets);
    res.json(data);
  } catch (error) {
    logger.error('Error fetching chain volume chart data', error);
    res.status(500).json({ error: 'Failed to fetch chain volume chart data' });
  }
});

export default router;

