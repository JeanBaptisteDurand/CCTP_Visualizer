/**
 * Metrics API routes
 */

import { Router, Request, Response } from 'express';
import { getMetricsInRange, getAnomalies } from '../database/client';
import { MetricsPeriod, AggregatedMetrics, RouteMetrics, ChainMetrics, TimeSeriesPoint } from '../types/metrics';
import { TransferMetricsBucket } from '../types/metrics';
import { getChainName } from '../config/chains';
import { TransferService } from '../services/TransferService';
import { createLogger } from '../utils/logger';

const logger = createLogger('MetricsRoutes');
const router = Router();

let transferServiceInstance: TransferService;

export function setTransferService(service: TransferService): void {
  transferServiceInstance = service;
}

/**
 * Get aggregated metrics for a period
 * GET /api/metrics?period=24h|7d|month
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as MetricsPeriod) || MetricsPeriod.LAST_24H;
    const { startTime, endTime } = getPeriodRange(period);

    const metrics = await getMetricsInRange(startTime, endTime);
    const aggregated = aggregateMetrics(metrics);

    res.json(aggregated);
  } catch (error) {
    logger.error('Error fetching metrics', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * Get time series data for charts
 * GET /api/metrics/timeseries?period=24h
 */
router.get('/timeseries', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as MetricsPeriod) || MetricsPeriod.LAST_24H;
    const { startTime, endTime } = getPeriodRange(period);

    const metrics = await getMetricsInRange(startTime, endTime);
    const timeSeries = buildTimeSeries(metrics);

    res.json(timeSeries);
  } catch (error) {
    logger.error('Error fetching time series', error);
    res.status(500).json({ error: 'Failed to fetch time series' });
  }
});

/**
 * Get route metrics (heatmap data)
 * GET /api/metrics/routes?period=24h
 */
router.get('/routes', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as MetricsPeriod) || MetricsPeriod.LAST_24H;
    const { startTime, endTime } = getPeriodRange(period);

    const metrics = await getMetricsInRange(startTime, endTime);
    const routes = buildRouteMetrics(metrics);

    res.json(routes);
  } catch (error) {
    logger.error('Error fetching route metrics', error);
    res.status(500).json({ error: 'Failed to fetch route metrics' });
  }
});

/**
 * Get per-chain metrics
 * GET /api/metrics/chains?period=24h
 */
router.get('/chains', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as MetricsPeriod) || MetricsPeriod.LAST_24H;
    const { startTime, endTime } = getPeriodRange(period);

    const metrics = await getMetricsInRange(startTime, endTime);
    const chainMetrics = buildChainMetrics(metrics);

    res.json(chainMetrics);
  } catch (error) {
    logger.error('Error fetching chain metrics', error);
    res.status(500).json({ error: 'Failed to fetch chain metrics' });
  }
});

/**
 * Get anomalies
 * GET /api/metrics/anomalies
 */
router.get('/anomalies', async (req: Request, res: Response) => {
  try {
    const thresholdMinutes = parseInt(req.query.threshold as string) || 30;
    const transfers = await getAnomalies(thresholdMinutes);

    const anomalies = transfers.map(t => ({
      transferId: t.transferId,
      type: determineAnomalyType(t),
      sourceDomain: t.sourceDomain,
      destinationDomain: t.destinationDomain,
      burnAt: t.burnAt,
      description: buildAnomalyDescription(t)
    }));

    res.json(anomalies);
  } catch (error) {
    logger.error('Error fetching anomalies', error);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
});

/**
 * Get active transfers
 * GET /api/metrics/active
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    if (!transferServiceInstance) {
      return res.status(503).json({ error: 'Transfer service not initialized' });
    }

    const activeTransfers = await transferServiceInstance.getActiveTransfers();
    res.json(activeTransfers);
  } catch (error) {
    logger.error('Error fetching active transfers', error);
    res.status(500).json({ error: 'Failed to fetch active transfers' });
  }
});

// Helper functions

function getPeriodRange(period: MetricsPeriod): { startTime: Date; endTime: Date } {
  const endTime = new Date();
  let startTime = new Date();

  switch (period) {
    case MetricsPeriod.LAST_24H:
      startTime.setHours(startTime.getHours() - 24);
      break;
    case MetricsPeriod.LAST_7D:
      startTime.setDate(startTime.getDate() - 7);
      break;
    case MetricsPeriod.CURRENT_MONTH:
      startTime.setDate(1);
      startTime.setHours(0, 0, 0, 0);
      break;
  }

  return { startTime, endTime };
}

function aggregateMetrics(buckets: TransferMetricsBucket[]): AggregatedMetrics {
  let totalTransfers = 0;
  let totalVolume = BigInt(0);
  let fastTransfers = 0;
  let standardTransfers = 0;
  let totalBurnToMintMs = 0;
  let totalBurnToIrisMs = 0;
  let completedCount = 0;

  for (const bucket of buckets) {
    totalTransfers += bucket.transferCount;
    totalVolume += BigInt(bucket.volumeTotal);

    if (bucket.mode === 'FAST') {
      fastTransfers += bucket.transferCount;
    } else {
      standardTransfers += bucket.transferCount;
    }

    if (bucket.sumBurnToMintMs > 0) {
      totalBurnToMintMs += bucket.sumBurnToMintMs;
      totalBurnToIrisMs += bucket.sumBurnToIrisMs;
      completedCount += bucket.transferCount - bucket.incompleteCount;
    }
  }

  const avgBurnToMintMs = completedCount > 0 ? totalBurnToMintMs / completedCount : 0;
  const avgBurnToIrisMs = completedCount > 0 ? totalBurnToIrisMs / completedCount : 0;
  const fastPercentage = totalTransfers > 0 ? (fastTransfers / totalTransfers) * 100 : 0;

  return {
    totalTransfers,
    totalVolume: totalVolume.toString(),
    fastTransfers,
    standardTransfers,
    fastPercentage,
    avgBurnToMintMs,
    avgBurnToIrisMs,
    topRoutes: buildRouteMetrics(buckets).slice(0, 5),
    chainMetrics: buildChainMetrics(buckets)
  };
}

function buildTimeSeries(buckets: TransferMetricsBucket[]): TimeSeriesPoint[] {
  const timeMap = new Map<string, { count: number; volume: bigint }>();

  for (const bucket of buckets) {
    const key = bucket.bucketStart.toISOString();
    const existing = timeMap.get(key) || { count: 0, volume: BigInt(0) };
    
    timeMap.set(key, {
      count: existing.count + bucket.transferCount,
      volume: existing.volume + BigInt(bucket.volumeTotal)
    });
  }

  return Array.from(timeMap.entries())
    .map(([timestamp, data]) => ({
      timestamp: new Date(timestamp),
      transferCount: data.count,
      volume: data.volume.toString()
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function buildRouteMetrics(buckets: TransferMetricsBucket[]): RouteMetrics[] {
  const routeMap = new Map<string, RouteMetrics>();

  for (const bucket of buckets) {
    const key = `${bucket.fromChain}-${bucket.toChain}`;
    const existing = routeMap.get(key);

    if (existing) {
      existing.transferCount += bucket.transferCount;
      existing.volumeTotal = (BigInt(existing.volumeTotal) + BigInt(bucket.volumeTotal)).toString();
      
      const totalLatency = (existing.avgLatencyMs * (existing.transferCount - bucket.transferCount)) +
                          (bucket.sumBurnToMintMs / Math.max(bucket.transferCount - bucket.incompleteCount, 1));
      existing.avgLatencyMs = totalLatency / existing.transferCount;
    } else {
      routeMap.set(key, {
        fromChain: bucket.fromChain,
        toChain: bucket.toChain,
        transferCount: bucket.transferCount,
        volumeTotal: bucket.volumeTotal,
        avgLatencyMs: bucket.sumBurnToMintMs / Math.max(bucket.transferCount - bucket.incompleteCount, 1)
      });
    }
  }

  return Array.from(routeMap.values())
    .sort((a, b) => b.transferCount - a.transferCount);
}

function buildChainMetrics(buckets: TransferMetricsBucket[]): ChainMetrics[] {
  const chainMap = new Map<number, ChainMetrics>();

  for (const bucket of buckets) {
    // Outbound metrics (from this chain)
    let outbound = chainMap.get(bucket.fromChain);
    if (!outbound) {
      outbound = {
        domain: bucket.fromChain,
        name: getChainName(bucket.fromChain),
        inboundCount: 0,
        outboundCount: 0,
        inboundVolume: '0',
        outboundVolume: '0',
        avgInboundLatencyMs: 0,
        avgOutboundLatencyMs: 0
      };
      chainMap.set(bucket.fromChain, outbound);
    }
    outbound.outboundCount += bucket.transferCount;
    outbound.outboundVolume = (BigInt(outbound.outboundVolume) + BigInt(bucket.volumeTotal)).toString();

    // Inbound metrics (to this chain)
    let inbound = chainMap.get(bucket.toChain);
    if (!inbound) {
      inbound = {
        domain: bucket.toChain,
        name: getChainName(bucket.toChain),
        inboundCount: 0,
        outboundCount: 0,
        inboundVolume: '0',
        outboundVolume: '0',
        avgInboundLatencyMs: 0,
        avgOutboundLatencyMs: 0
      };
      chainMap.set(bucket.toChain, inbound);
    }
    inbound.inboundCount += bucket.transferCount;
    inbound.inboundVolume = (BigInt(inbound.inboundVolume) + BigInt(bucket.volumeTotal)).toString();
  }

  return Array.from(chainMap.values())
    .sort((a, b) => (b.inboundCount + b.outboundCount) - (a.inboundCount + a.outboundCount));
}

function determineAnomalyType(transfer: any): string {
  if (transfer.status === 'ERROR') return 'RECEIVE_ERROR';
  if (transfer.status === 'ATTESTATION_PENDING') return 'NO_ATTESTATION';
  if (transfer.status === 'ATTESTATION_COMPLETE') return 'NOT_MINTED';
  return 'PENDING_TOO_LONG';
}

function buildAnomalyDescription(transfer: any): string {
  const from = getChainName(transfer.sourceDomain);
  const to = getChainName(transfer.destinationDomain);
  const elapsed = Math.floor((Date.now() - transfer.burnAt.getTime()) / 60000);

  if (transfer.status === 'ERROR') {
    return `Transfer from ${from} to ${to} failed: ${transfer.errorReason || 'Unknown error'}`;
  }
  
  return `Transfer from ${from} to ${to} pending for ${elapsed} minutes (status: ${transfer.status})`;
}

export default router;

