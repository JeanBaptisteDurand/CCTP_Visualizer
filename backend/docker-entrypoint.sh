#!/bin/sh
set -e

echo "🔄 Waiting for database to be ready..."
sleep 2

echo "🔄 Running database migrations..."
node src/database/runMigrations.js

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migration failed, but continuing..."
fi

echo "🚀 Starting CCTP Visualizer Backend..."
exec pnpm start

