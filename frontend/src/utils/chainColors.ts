/**
 * Chain domain to color mapping
 * Colors for visualization
 */

export const CHAIN_COLORS: Record<number, string> = {
  0: '#627EEA',   // Ethereum - Blue
  1: '#E84142',   // Avalanche - Red
  2: '#FF0420',   // OP - Red
  3: '#28A0F0',   // Arbitrum - Light Blue
  5: '#14F195',   // Solana - Green
  6: '#0052FF',   // Base - Blue
  7: '#8247E5',   // Polygon PoS - Purple
  10: '#FF6B35',  // Unichain - Orange
  11: '#000000',  // Linea - Black
  12: '#FF6B6B',  // Codex - Red
  13: '#FF6B9D',  // Sonic - Pink
  14: '#4ECDC4',  // World Chain - Teal
  15: '#FFD93D',  // Monad - Yellow
  16: '#6C5CE7',  // Sei - Purple
  17: '#F0B90B',  // BNB Smart Chain - Yellow
  18: '#141414',  // XDC - Dark Gray
  19: '#8B5CF6',  // HyperEVM - Purple
  21: '#FF5722',  // Ink - Deep Orange
  22: '#00D4AA',  // Plume - Teal
  25: '#FF6B35',  // Starknet - Orange
  26: '#9B59B6',  // Arc Testnet - Purple
};

export function getChainColor(domain: number): string {
  return CHAIN_COLORS[domain] || '#94a3b8'; // Default gray
}

