/**
 * Database configuration
 */

import { Pool, PoolConfig } from 'pg';
import { createLogger } from '../utils/logger';

const logger = createLogger('Database');

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL environment variable is not set');
  throw new Error('DATABASE_URL environment variable is required');
}

// Parse and validate DATABASE_URL format
const databaseUrl = process.env.DATABASE_URL;
try {
  const url = new URL(databaseUrl);
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    logger.error('Invalid DATABASE_URL protocol', { protocol: url.protocol });
    throw new Error('DATABASE_URL must use postgresql:// or postgres:// protocol');
  }
  logger.debug('Database URL parsed successfully', { 
    host: url.hostname, 
    port: url.port, 
    database: url.pathname.slice(1) // Remove leading slash
  });
} catch (error) {
  logger.error('Invalid DATABASE_URL format', { error, databaseUrl: databaseUrl.replace(/:[^:@]+@/, ':****@') });
  throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
}

const poolConfig: PoolConfig = {
  connectionString: databaseUrl,
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
    const result = await client.query('SELECT NOW(), current_database()');
    logger.info('Database connection successful', { 
      timestamp: result.rows[0].now,
      database: result.rows[0].current_database
    });
    client.release();
    return true;
  } catch (error: any) {
    logger.error('Database connection failed', { 
      error: error.message,
      code: error.code,
      // Don't log the full connection string for security
      hint: 'Check DATABASE_URL environment variable'
    });
    return false;
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}

