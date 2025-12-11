/**
 * Database configuration
 */

import { Pool, PoolConfig } from 'pg';
import { createLogger } from '../utils/logger';

const logger = createLogger('Database');

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info('Database connection successful', { timestamp: result.rows[0].now });
    client.release();
    return true;
  } catch (error) {
    logger.error('Database connection failed', error);
    return false;
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}

