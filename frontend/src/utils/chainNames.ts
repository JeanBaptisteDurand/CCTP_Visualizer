/**
 * Chain domain to name mapping
 * Based on CCTP official domain list
 */

export const CHAIN_NAMES: Record<number, string> = {
  0: 'Ethereum',
  1: 'Avalanche',
  2: 'OP',
  3: 'Arbitrum',
  5: 'Solana',
  6: 'Base',
  7: 'Polygon PoS',
  10: 'Unichain',
  11: 'Linea',
  12: 'Codex',
  13: 'Sonic',
  14: 'World Chain',
  15: 'Monad',
  16: 'Sei',
  17: 'BNB Smart Chain',
  18: 'XDC',
  19: 'HyperEVM',
  21: 'Ink',
  22: 'Plume',
  25: 'Starknet',
  26: 'Arc Testnet',
};

export function getChainName(domain: number): string {
  return CHAIN_NAMES[domain] || `Chain ${domain}`;
}

