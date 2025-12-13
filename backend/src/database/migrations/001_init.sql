-- CCTP Visualizer POC - Database Schema
-- Single migration file for EVM-only indexing

-- Table: burns (OUT - depositForBurn events)
CREATE TABLE IF NOT EXISTS burns (
    id BIGSERIAL PRIMARY KEY,
    chain_domain INTEGER NOT NULL,
    destination_domain INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    token TEXT NOT NULL,
    block_time TIMESTAMPTZ NOT NULL,
    tx_hash TEXT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicates
    UNIQUE(chain_domain, tx_hash, log_index)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_burns_chain_domain ON burns(chain_domain);
CREATE INDEX IF NOT EXISTS idx_burns_destination_domain ON burns(destination_domain);
CREATE INDEX IF NOT EXISTS idx_burns_block_time ON burns(block_time DESC);
CREATE INDEX IF NOT EXISTS idx_burns_chain_dest ON burns(chain_domain, destination_domain);
CREATE INDEX IF NOT EXISTS idx_burns_tx_hash ON burns(tx_hash);

-- Table: mints (IN - receiveMessage decoded)
CREATE TABLE IF NOT EXISTS mints (
    id BIGSERIAL PRIMARY KEY,
    chain_domain INTEGER NOT NULL,
    source_domain INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    token TEXT NOT NULL,
    mint_recipient TEXT NOT NULL,
    block_time TIMESTAMPTZ NOT NULL,
    tx_hash TEXT NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INTEGER DEFAULT -1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicates
    UNIQUE(chain_domain, tx_hash, log_index)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_mints_chain_domain ON mints(chain_domain);
CREATE INDEX IF NOT EXISTS idx_mints_source_domain ON mints(source_domain);
CREATE INDEX IF NOT EXISTS idx_mints_block_time ON mints(block_time DESC);
CREATE INDEX IF NOT EXISTS idx_mints_chain_source ON mints(chain_domain, source_domain);
CREATE INDEX IF NOT EXISTS idx_mints_tx_hash ON mints(tx_hash);

-- Table: chain_checkpoints
-- Stores last processed block per chain for incremental indexing
CREATE TABLE IF NOT EXISTS chain_checkpoints (
    chain_domain INTEGER PRIMARY KEY,
    last_processed_block BIGINT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update checkpoint
CREATE OR REPLACE FUNCTION update_checkpoint(
    p_chain_domain INTEGER,
    p_last_block BIGINT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO chain_checkpoints (chain_domain, last_processed_block, updated_at)
    VALUES (p_chain_domain, p_last_block, NOW())
    ON CONFLICT (chain_domain) 
    DO UPDATE SET 
        last_processed_block = p_last_block,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get checkpoint (returns 0 if not found)
CREATE OR REPLACE FUNCTION get_checkpoint(p_chain_domain INTEGER)
RETURNS BIGINT AS $$
DECLARE
    v_block BIGINT;
BEGIN
    SELECT last_processed_block INTO v_block
    FROM chain_checkpoints
    WHERE chain_domain = p_chain_domain;
    
    RETURN COALESCE(v_block, 0);
END;
$$ LANGUAGE plpgsql;

