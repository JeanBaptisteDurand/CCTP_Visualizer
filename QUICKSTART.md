# CCTP Visualizer - Quick Start Guide

## ⚡ Fastest Path to Running

### Option 1: Docker (Recommended)

1. **Clone and setup environment**
```bash
cd /home/beorlor/CCTP_Visualizer

# Create .env file with your RPC URLs
cat > .env << EOF
ETHEREUM_RPC_URL=https://eth.llamarpc.com
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
OP_MAINNET_RPC_URL=https://mainnet.optimism.io
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
BASE_RPC_URL=https://mainnet.base.org
POLYGON_RPC_URL=https://polygon-rpc.com
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
STARKNET_RPC_URL=https://starknet-mainnet.public.blastapi.io
EOF
```

2. **Start everything**
```bash
docker-compose up -d
```

3. **Run migrations**
```bash
docker-compose exec backend npm run migrate
```

4. **Open browser**
- Graph View: http://localhost:5173
- API Health: http://localhost:3001/api/health

### Option 2: Local Development

1. **Setup PostgreSQL**
```bash
# Using Docker
docker run -d \
  --name cctp_postgres \
  -e POSTGRES_USER=cctp_user \
  -e POSTGRES_PASSWORD=cctp_password \
  -e POSTGRES_DB=cctp_visualizer \
  -p 5432:5432 \
  timescale/timescaledb:latest-pg15
```

2. **Setup Backend**
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://cctp_user:cctp_password@localhost:5432/cctp_visualizer
IRIS_API_URL=https://iris-api.circle.com
ETHEREUM_RPC_URL=https://eth.llamarpc.com
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
OP_MAINNET_RPC_URL=https://mainnet.optimism.io
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
BASE_RPC_URL=https://mainnet.base.org
POLYGON_RPC_URL=https://polygon-rpc.com
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
LOG_LEVEL=info
EOF

# Run migrations
npm run migrate

# Start backend
npm run dev
```

3. **Setup Frontend** (in new terminal)
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3001" > .env

# Start frontend
npm run dev
```

4. **Open browser**
- Frontend: http://localhost:5173

## 🎯 What You'll See

### Graph View
- **Center**: Iris attestation service node
- **Circle**: All supported chains with their contract nodes
- **Particles**: Live transfers moving through the pipeline
  - Blue particles = USDC
  - Green particles = USYC
  - Glowing = Fast transfers
  - Size = transfer amount

### Metrics Dashboard
- Transfer counts and volumes
- Fast vs Standard percentages
- Latency statistics
- Top routes heatmap
- Per-chain statistics
- Anomalies list

## 🔧 Common Issues

### "Database connection failed"
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Or restart it
docker restart cctp_postgres
```

### "Chain watcher failed to start"
- Check your RPC URLs in `.env`
- Some free RPC endpoints have rate limits
- Consider using paid RPC providers (Alchemy, Infura, etc.)

### "No transfers showing"
- The system monitors real-time CCTP transfers
- If mainnet is quiet, you may need to wait
- Check backend logs: `docker-compose logs -f backend`
- Verify chain watchers are running: http://localhost:3001/api/health/status

## 📊 Testing With Mock Data

To test without waiting for real transfers, you can modify the backend to inject test transfers:

```typescript
// In backend/src/index.ts, add after initialization:
setTimeout(() => {
  transferService.handleBurnEvent({
    domain: 0,
    nonce: Date.now().toString(),
    txHash: '0xtest...',
    blockNumber: 12345,
    timestamp: new Date(),
    sender: '0x1234...',
    recipient: '0x5678...',
    amount: '1000000000', // 1000 USDC
    destinationDomain: 6,
    minFinalityThreshold: 1000,
    tokenType: TokenType.USDC,
    tokenAddress: '0x...'
  });
}, 5000);
```

## 🚀 Next Steps

1. **Configure Production RPC URLs**: Replace free endpoints with reliable paid services
2. **Enable All Chains**: Add RPC URLs for all supported chains
3. **Set Up Monitoring**: Configure alerts for anomalies
4. **Customize Metrics**: Add custom aggregations in `MetricsAggregator.ts`
5. **Extend Chains**: Add new chains following the guide in README.md

## 📚 More Information

- Full documentation: [README.md](README.md)
- Architecture details: See "Architecture" section in README
- API documentation: See "API Endpoints" section in README
- Troubleshooting: See "Troubleshooting" section in README

## 💡 Pro Tips

1. **Use Alchemy/Infura**: Free tier supports hobby projects
2. **Monitor Logs**: `docker-compose logs -f` shows what's happening
3. **Database Access**: `psql postgresql://cctp_user:cctp_password@localhost:5432/cctp_visualizer`
4. **API Exploration**: Use http://localhost:3001/api/metrics?period=24h
5. **Graph Interaction**: Zoom and pan in graph view for details

