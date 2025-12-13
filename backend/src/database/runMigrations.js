/**
 * Run database migrations (compiled JS version)
 */

const { readFileSync } = require('fs');
const { join } = require('path');
const { Pool } = require('pg');

const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args)
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigrations() {
  try {
    logger.info('Running database migrations...');
    
    const migrationPath = join(__dirname, 'migrations', '001_init.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    
    await pool.query(sql);
    
    logger.info('Migrations completed successfully');
    await pool.end();
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();

