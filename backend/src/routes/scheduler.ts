/**
 * Scheduler control API routes
 */

import { Router, Request, Response } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('SchedulerRoutes');
const router: Router = Router();

// Store scheduler instance (will be set by main.ts)
let schedulerInstance: { start: () => Promise<void>; stop: () => void; isRunning: boolean } | null = null;

export function setSchedulerInstance(scheduler: { start: () => Promise<void>; stop: () => void; isRunning: boolean }) {
  schedulerInstance = scheduler;
}

/**
 * Get scheduler status
 * GET /api/scheduler/status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    if (!schedulerInstance) {
      return res.status(503).json({ error: 'Scheduler not initialized' });
    }
    
    res.json({
      running: schedulerInstance.isRunning,
    });
  } catch (error) {
    logger.error('Error getting scheduler status', error);
    res.status(500).json({ error: 'Failed to get scheduler status' });
  }
});

/**
 * Start scheduler
 * POST /api/scheduler/start
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    if (!schedulerInstance) {
      return res.status(503).json({ error: 'Scheduler not initialized' });
    }
    
    if (schedulerInstance.isRunning) {
      return res.json({ message: 'Scheduler already running', running: true });
    }
    
    await schedulerInstance.start();
    logger.info('Scheduler started via API');
    res.json({ message: 'Scheduler started', running: true });
  } catch (error) {
    logger.error('Error starting scheduler', error);
    res.status(500).json({ error: 'Failed to start scheduler' });
  }
});

/**
 * Stop scheduler
 * POST /api/scheduler/stop
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    if (!schedulerInstance) {
      return res.status(503).json({ error: 'Scheduler not initialized' });
    }
    
    if (!schedulerInstance.isRunning) {
      return res.json({ message: 'Scheduler already stopped', running: false });
    }
    
    schedulerInstance.stop();
    logger.info('Scheduler stopped via API');
    res.json({ message: 'Scheduler stopped', running: false });
  } catch (error) {
    logger.error('Error stopping scheduler', error);
    res.status(500).json({ error: 'Failed to stop scheduler' });
  }
});

export default router;

