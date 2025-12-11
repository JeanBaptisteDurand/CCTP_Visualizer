/**
 * Run database migrations
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../config/database';
import { createLogger } from '../utils/logger';

const logger = createLogger('Migrations');

async function runMigrations() {
  try {
    logger.info('Running database migrations...');
    
    const migrationPath = join(__dirname, 'migrations', '001_init.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    
    await pool.query(sql);
    
    logger.info('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', error);
    process.exit(1);
  }
}

runMigrations();

