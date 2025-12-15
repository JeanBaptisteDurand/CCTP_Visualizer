# CCTP Network Explorer

**CCTP Network Explorer** is a **POC / MVP** built to analyze and visualize **USDC flows across the Circle CCTP (Cross-Chain Transfer Protocol)** network.

The project was **developed quickly after MBC**, driven by my own excitement and momentum around Circle and CCTP. This led to a deliberately fast execution cycle, prioritizing shipping a **working, end-to-end prototype** over building a fully polished or exhaustive indexer.

The goal is not to be a full indexer yet, but to provide **clear, actionable visibility** into cross-chain USDC activity, volumes, and latency signals, while staying compatible with **simple infrastructure and limited RPC providers**.

🌍 **Live project**: https://cctp-visualizer.tech

---

## ⚠️ Project Status

- **Stage**: Proof of Concept / MVP  
- **Scope**: USDC only  
- **Chains indexed**: **13 active chains**  
- **Focus**: Observability, volumes, latency signals  
- **Tradeoff**: Not all data is always available due to RPC limits (see below)

---

## 🌐 Why only 13 chains out of 21?

CCTP officially supports **21 chains**, but practical constraints reduce the current operational scope.

### Breakdown

- 21 total CCTP chains
- -1 Arbitrum testnet → **20**
- -2 non-EVM (Solana, Starknet) → **18**
- -1 BNB (addressing & USYC constraints) → **17 EVM USDC chains**
- -3 not covered by QuickNode:
  - Codex
  - XDC
  - Plume
- -1 Sei (block time too fast for the current provider reliability)

### ✅ Result

➡️ **13 chains fully operational today**, indexed reliably within the current constraints.

Non-EVM chains, BNB, and USYC are intentionally postponed to avoid degrading data quality in this MVP.

---

## 🔗 Currently Supported Chains

- Ethereum
- Avalanche
- Optimism
- Arbitrum
- Base
- Polygon PoS
- Unichain
- Linea
- Sonic
- World Chain
- Monad
- HyperEVM
- Ink

---

## 🔌 RPC & Data Availability (Important)

For simplicity and speed of execution, this POC uses **QuickNode** as the RPC provider.

However, using **QuickNode’s free plan** introduces a hard limitation:
- The indexer can only fetch data for **~8 hours per day**
- As a result, **data is not always continuous or complete**
- Some time windows may have missing or partial data

This is an **intentional POC tradeoff**, not a technical limitation of the architecture.

The system can easily be upgraded by:
- Switching to a **paid provider**
- Using **multiple RPC providers**
- Implementing provider rotation and redundancy

No structural refactor is required to remove this limitation.

---

## 🎯 Project Vision (Business Overview)

**CCTP Network Explorer** provides **real-time and historical visibility** into cross-chain USDC flows powered by Circle’s CCTP.

### Who is this for?

- **Institutions**
  - Monitor cross-chain liquidity
  - Detect abnormal pending burns
  - Analyze latency and operational risks

- **DeFi teams**
  - Validate CCTP integrations
  - Debug cross-chain issues
  - Optimize routing strategies

- **Blockchain analysts**
  - Study flow patterns
  - Correlate volume with market events
  - Build datasets for research or trading

---

## 📊 Core Features (Current)

- Network-wide USDC volume (IN / OUT)
- Per-chain volume breakdown
- Incoming vs outgoing flows
- Time-window selection
- Pending burn detection (burn without mint yet)
- Aggregated metrics optimized for low RPC budgets

---

## 🏗️ High-Level Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL + TimescaleDB
- **Indexing**: EVM event polling (DepositForBurn / Mint)
- **Infrastructure**: Docker + Docker Compose
- **Reverse Proxy**: Caddy

### Data Flow

1. Poll CCTP smart contracts on each chain
2. Extract burn and mint-related events
3. Aggregate metrics by time window
4. Expose data through a REST API
5. Render dashboards in near real time

---

## 🧪 Known Limitations (By Design)

- No direct **burn ↔ mint transaction linking** yet
- Non-EVM chains excluded
- USYC not indexed
- Iris attestation not tracked in real time
- Data gaps due to free RPC rate limits

These constraints are intentional to keep the MVP simple, readable, and reliable.

---

## 🛠️ TODO — V1 (Stabilization)

- Verify and display **pending burns**
- Allow **custom time range selection**
- Optimize RPC fetch strategy
- Fix `unknown` values in incoming volume breakdown
- Clean unused / legacy Iris-related code
- Display data relative to *now - 3 minutes* (one full polling cycle)
- Normalize naming (CCTP vs CCPT)
- Improve documentation
- Add AI-assisted time-range selection
- Display number of transactions per window
- Ensure enough RPC endpoints to last a full day without throttling

---

## 🚀 TODO — V2 (Expansion & Intelligence)

### Protocol-Level Improvements

- Deterministic **burn ↔ mint** linking
- Cross-check multiple CCTP contracts to detect inconsistencies
- Track all relevant CCTP-related events
- Detect mismatches between expected and observed states

### Infrastructure & Performance

- Move to faster / premium providers
- True real-time indexing
- Track and expose **Iris attestation latency**
- Provider redundancy and failover

### Analytics & Insights

- Latency distribution per chain
- Volume divergence detection around:
  - Market opens
  - Major financial events
- Historical correlation analysis
- Liquidity flow anomaly detection

### Ecosystem Expansion

- Add BNB Chain
- Add Solana & Starknet
- Add USYC (Ethereum + BNB)
- Public API for third-party integrations

---

## 🧭 Long-Term Direction

This project can evolve into:
- A **CCTP observability layer**
- A **cross-chain risk & latency monitor**
- A **liquidity intelligence platform**
- A foundation for alerting and automated analysis systems

---

## 📌 Summary

- **13 chains operational**
- **POC-first architecture**
- **RPC-limited by design**
- **Easily scalable with better providers**
- **Live at https://cctp-visualizer.tech**

---

*CCTP Network Explorer*  
**Making cross-chain USDC flows transparent**
