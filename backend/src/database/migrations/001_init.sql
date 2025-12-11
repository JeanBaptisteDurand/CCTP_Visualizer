-- Initial schema for CCTP Visualizer
-- PostgreSQL with TimescaleDB support

-- Enable TimescaleDB extension (if available)
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Table: cctp_transfers
-- Stores individual transfer records through the CCTP pipeline
CREATE TABLE IF NOT EXISTS cctp_transfers (
    transfer_id TEXT PRIMARY KEY,
    source_domain INTEGER NOT NULL,
    destination_domain INTEGER NOT NULL,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('FAST', 'STANDARD')),
    token_type VARCHAR(10) NOT NULL CHECK (token_type IN ('USDC', 'USYC')),
    amount TEXT NOT NULL,
    
    -- Transaction hashes
    burn_tx_hash TEXT NOT NULL,
    mint_tx_hash TEXT,
    
    -- Timestamps
    burn_at TIMESTAMPTZ NOT NULL,
    iris_attested_at TIMESTAMPTZ,
    mint_at TIMESTAMPTZ,
    
    -- Status and metadata
    status VARCHAR(30) NOT NULL,
    error_reason TEXT,
    nonce TEXT NOT NULL,
    message_body TEXT,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    min_finality_threshold INTEGER NOT NULL,
    max_fee TEXT NOT NULL,
    finality_threshold_executed INTEGER,
    
    -- Indexes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_transfers_burn_at ON cctp_transfers(burn_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON cctp_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_source_dest ON cctp_transfers(source_domain, destination_domain);
CREATE INDEX IF NOT EXISTS idx_transfers_mode ON cctp_transfers(mode);
CREATE INDEX IF NOT EXISTS idx_transfers_token_type ON cctp_transfers(token_type);
CREATE INDEX IF NOT EXISTS idx_transfers_nonce ON cctp_transfers(source_domain, nonce);

-- Table: cctp_transfer_metrics_minute
-- Pre-aggregated metrics per minute for fast dashboard queries
CREATE TABLE IF NOT EXISTS cctp_transfer_metrics_minute (
    bucket_start TIMESTAMPTZ NOT NULL,
    from_chain INTEGER NOT NULL,
    to_chain INTEGER NOT NULL,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('FAST', 'STANDARD')),
    token_type VARCHAR(10) NOT NULL CHECK (token_type IN ('USDC', 'USYC')),
    
    -- Aggregated metrics
    transfer_count INTEGER DEFAULT 0,
    volume_total TEXT DEFAULT '0',
    sum_burn_to_mint_ms BIGINT DEFAULT 0,
    sum_burn_to_iris_ms BIGINT DEFAULT 0,
    sum_iris_to_mint_ms BIGINT DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    incomplete_count INTEGER DEFAULT 0,
    
    -- Composite primary key
    PRIMARY KEY (bucket_start, from_chain, to_chain, mode, token_type)
);

-- Convert to TimescaleDB hypertable if extension is available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('cctp_transfer_metrics_minute', 'bucket_start', 
                                   if_not_exists => TRUE,
                                   chunk_time_interval => INTERVAL '1 day');
    END IF;
END $$;

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_metrics_bucket_start ON cctp_transfer_metrics_minute(bucket_start DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_route ON cctp_transfer_metrics_minute(from_chain, to_chain);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_cctp_transfers_updated_at
    BEFORE UPDATE ON cctp_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to upsert metrics (increment counters)
CREATE OR REPLACE FUNCTION upsert_transfer_metrics(
    p_bucket_start TIMESTAMPTZ,
    p_from_chain INTEGER,
    p_to_chain INTEGER,
    p_mode VARCHAR(20),
    p_token_type VARCHAR(10),
    p_volume TEXT,
    p_burn_to_mint_ms BIGINT,
    p_burn_to_iris_ms BIGINT,
    p_iris_to_mint_ms BIGINT,
    p_is_error BOOLEAN,
    p_is_incomplete BOOLEAN
) RETURNS VOID AS $$
BEGIN
    INSERT INTO cctp_transfer_metrics_minute (
        bucket_start, from_chain, to_chain, mode, token_type,
        transfer_count, volume_total, 
        sum_burn_to_mint_ms, sum_burn_to_iris_ms, sum_iris_to_mint_ms,
        error_count, incomplete_count
    ) VALUES (
        p_bucket_start, p_from_chain, p_to_chain, p_mode, p_token_type,
        1, p_volume,
        p_burn_to_mint_ms, p_burn_to_iris_ms, p_iris_to_mint_ms,
        CASE WHEN p_is_error THEN 1 ELSE 0 END,
        CASE WHEN p_is_incomplete THEN 1 ELSE 0 END
    )
    ON CONFLICT (bucket_start, from_chain, to_chain, mode, token_type)
    DO UPDATE SET
        transfer_count = cctp_transfer_metrics_minute.transfer_count + 1,
        volume_total = (cctp_transfer_metrics_minute.volume_total::NUMERIC + p_volume::NUMERIC)::TEXT,
        sum_burn_to_mint_ms = cctp_transfer_metrics_minute.sum_burn_to_mint_ms + p_burn_to_mint_ms,
        sum_burn_to_iris_ms = cctp_transfer_metrics_minute.sum_burn_to_iris_ms + p_burn_to_iris_ms,
        sum_iris_to_mint_ms = cctp_transfer_metrics_minute.sum_iris_to_mint_ms + p_iris_to_mint_ms,
        error_count = cctp_transfer_metrics_minute.error_count + CASE WHEN p_is_error THEN 1 ELSE 0 END,
        incomplete_count = cctp_transfer_metrics_minute.incomplete_count + CASE WHEN p_is_incomplete THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

