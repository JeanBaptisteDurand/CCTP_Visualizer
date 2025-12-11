# CCTP Network Explorer

A comprehensive monitoring and visualization tool for Circle's Cross-Chain Transfer Protocol (CCTP) V2.

## Features

### 🌐 Live Graph Visualization
- **Radial Layout**: Iris attestation service at center, all supported chains arranged in a circle
- **Real-time Particles**: Moving particles represent active transfers, with visual encoding for:
  - Token type (USDC vs USYC): Different colors
  - Transfer mode (Fast vs Standard): Visual distinction
  - Transfer size: Particle size proportional to amount
  - Transfer speed: Animation speed based on latency

### 📊 Metrics Dashboard
- **Aggregate Statistics**: 24h, 7d, and monthly metrics
  - Total transfers and volume
  - Fast vs Standard percentages
  - Average latencies (burn→mint, burn→Iris)
- **Route Analytics**: Heatmap showing most active transfer routes
- **Per-Chain Stats**: Inbound/outbound volumes and latencies per chain
- **Anomaly Detection**: Real-time alerts for:
  - Transfers pending > 30 minutes
  - Missing attestations
  - Receive errors
  - Incomplete transfers

### 🔗 Supported Chains
- **EVM Chains**: Ethereum, Avalanche, OP Mainnet, Arbitrum, Base, Polygon PoS, Linea, Unichain, Codex, Sonic, World Chain, Monad, Sei, XDC, HyperEVM, Ink, Plume, BNB Smart Chain
- **Non-EVM**: Solana, Starknet
- **Tokens**: USDC (all chains except BNB), USYC (Ethereum and BNB only)

## Architecture

### Backend (Node.js + TypeScript)
- **Express API**: REST endpoints for metrics and health checks
- **Socket.IO**: Real-time transfer updates
- **PostgreSQL + TimescaleDB**: Time-series optimized storage
- **Chain Watchers**: Modular blockchain adapters for EVM, Solana, and Starknet
- **Iris Integration**: Attestation polling and status tracking

### Frontend (React + TypeScript)
- **Vite**: Fast development and optimized builds
- **react-force-graph-2d**: Interactive graph visualization
- **Recharts**: Metrics charts and time series
- **Socket.IO Client**: Real-time data streaming

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- RPC endpoints for supported chains

### Development Setup

1. **Clone the repository**
```bash
cd /home/beorlor/CCTP_Visualizer
```

2. **Set up environment variables**

Backend (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your RPC URLs
```

Frontend (`frontend/.env`):
```bash
echo "VITE_API_URL=http://localhost:3001" > frontend/.env
```

3. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

4. **Set up database**
```bash
# Start PostgreSQL (if using Docker)
docker run -d \
  --name cctp_postgres \
  -e POSTGRES_USER=cctp_user \
  -e POSTGRES_PASSWORD=cctp_password \
  -e POSTGRES_DB=cctp_visualizer \
  -p 5432:5432 \
  timescale/timescaledb:latest-pg15

# Run migrations
cd backend
npm run migrate
```

5. **Start development servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## Docker Deployment

### Using Docker Compose

1. **Create `.env` file in project root**
```bash
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
OP_MAINNET_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
STARKNET_RPC_URL=https://starknet-mainnet.g.alchemy.com/v2/YOUR_KEY
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Run database migrations**
```bash
docker-compose exec backend npm run migrate
```

4. **View logs**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## API Endpoints

### Metrics
- `GET /api/metrics?period=24h|7d|month` - Aggregated metrics
- `GET /api/metrics/timeseries?period=24h|7d|month` - Time series data
- `GET /api/metrics/routes?period=24h|7d|month` - Route metrics
- `GET /api/metrics/chains?period=24h|7d|month` - Per-chain metrics
- `GET /api/metrics/anomalies?threshold=30` - Anomaly detection
- `GET /api/metrics/active` - Active transfers

### Health
- `GET /api/health` - Basic health check
- `GET /api/health/status` - Detailed system status

### WebSocket Events
- `transfers:initial` - Initial active transfers on connection
- `transfer:update` - Real-time transfer state updates

## Configuration

### Chain Registry
Chain metadata is configured in `backend/src/config/chains.ts`:
- Domain IDs
- RPC endpoints
- Contract addresses
- Token support (USDC/USYC)
- Fast Transfer capability

### Database Schema
Two main tables:
- `cctp_transfers` - Individual transfer records
- `cctp_transfer_metrics_minute` - Time-bucketed aggregated metrics (TimescaleDB hypertable)

## Development Notes

### Adding New Chains
1. Add chain metadata to `backend/src/config/chains.ts`
2. Create chain watcher in `backend/src/chains/` (use `EVMChainWatcher` for EVM chains)
3. Register watcher in `backend/src/services/ChainRegistry.ts`
4. Add to frontend `GraphLayout.ts` for visualization

### Extending Metrics
1. Modify database schema in `backend/src/database/migrations/`
2. Update aggregation logic in `backend/src/services/MetricsAggregator.ts`
3. Add new API endpoints in `backend/src/routes/metrics.ts`
4. Create frontend components to display new metrics

## Monitoring & Operations

### Database Maintenance
```bash
# Connect to database
psql postgresql://cctp_user:cctp_password@localhost:5432/cctp_visualizer

# View active transfers
SELECT * FROM cctp_transfers WHERE status NOT IN ('MINT_COMPLETE', 'ERROR') ORDER BY burn_at DESC;

# View metrics for last hour
SELECT * FROM cctp_transfer_metrics_minute 
WHERE bucket_start >= NOW() - INTERVAL '1 hour' 
ORDER BY bucket_start DESC;
```

### Performance Tuning
- **Chain Watchers**: Adjust `CHAIN_POLL_INTERVAL` in `.env` (default: 12000ms)
- **Iris Polling**: Adjust `IRIS_POLL_INTERVAL` in `.env` (default: 5000ms)
- **Database**: TimescaleDB automatically manages data retention and compression

## Known Limitations

### Current Implementation
- **Solana & Starknet**: Skeleton implementations (event parsing not fully implemented)
- **Fast Transfer Detection**: Based on `minFinalityThreshold` heuristic (may need refinement)
- **Mint Correlation**: Simplified recipient matching (production would need robust correlation)

### Future Enhancements
- Complete Solana and Starknet event parsing
- Enhanced Fast Transfer detection using Iris API fees
- Transaction receipt parsing for exact `minFinalityThreshold` values
- Historical data backfill from chain archive nodes
- Alert notifications (email, Slack, etc.)
- Advanced analytics (volume trends, route optimization)

## Architecture Decisions

### Why TimescaleDB?
- Optimized for time-series metrics queries
- Automatic data partitioning and compression
- PostgreSQL compatibility (familiar SQL)

### Why Socket.IO?
- Real-time bidirectional communication
- Automatic reconnection handling
- Wide browser support

### Why React Force Graph?
- Performant canvas rendering
- Fixed node positions for radial layout
- Custom rendering for particles

### Why Modular Chain Adapters?
- Easy to add new chains
- Isolated chain-specific logic
- Testable components

## Troubleshooting

### Backend not connecting to database
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection manually
psql postgresql://cctp_user:cctp_password@localhost:5432/cctp_visualizer
```

### Frontend not receiving updates
- Check Socket.IO connection in browser console
- Verify backend is running: http://localhost:3001/api/health
- Check CORS settings if using different domains

### Chain watchers not starting
- Verify RPC URLs are correct in `.env`
- Check RPC endpoint rate limits
- View backend logs for specific errors

## Contributing

This is a monitoring tool for educational and operational purposes. Contributions welcome for:
- Additional chain integrations
- Enhanced metrics and analytics
- UI/UX improvements
- Performance optimizations

## License

MIT

## Acknowledgments

- Circle for CCTP protocol and Iris API
- Viem for Ethereum interactions
- React Force Graph for visualization library

