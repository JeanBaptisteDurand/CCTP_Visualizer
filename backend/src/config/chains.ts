/**
 * Chain registry configuration
 * Contains all CCTP-supported chains with their metadata, contracts, and capabilities
 */

import { ChainMetadata, VMType, ChainConfig } from '../types/chain';

// Common EVM contract addresses (most chains use the same addresses)
const COMMON_EVM_ADDRESSES = {
  tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
  messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64',
  tokenMinter: '0xfd78EE919681417d192449715b2594ab58f5D002',
  messageHelper: '0xec546b6B005471ECf012e5aF77FBeC07e0FD8f78'
};

export const MAINNET_CHAINS: Record<number, ChainMetadata> = {
  // Domain 0: Ethereum
  0: {
    domainId: 0,
    name: 'Ethereum',
    vmType: VMType.EVM,
    chainId: 1,
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: true
    },
    capabilities: {
      standardSource: true,
      fastSource: true,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      usycToken: '0xf29B01E5c6F9C44A0e41b42dF23A5e9Ef7c50c0f' // Example USYC address
    },
    blockTime: 12000
  },

  // Domain 1: Avalanche
  1: {
    domainId: 1,
    name: 'Avalanche',
    vmType: VMType.EVM,
    chainId: 43114,
    rpcUrl: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: false,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
    },
    blockTime: 2000
  },

  // Domain 2: OP Mainnet
  2: {
    domainId: 2,
    name: 'OP Mainnet',
    vmType: VMType.EVM,
    chainId: 10,
    rpcUrl: process.env.OP_MAINNET_RPC_URL || 'https://mainnet.optimism.io',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: true,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'
    },
    blockTime: 2000
  },

  // Domain 3: Arbitrum
  3: {
    domainId: 3,
    name: 'Arbitrum',
    vmType: VMType.EVM,
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: true,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
    },
    blockTime: 250
  },

  // Domain 5: Solana
  5: {
    domainId: 5,
    name: 'Solana',
    vmType: VMType.SOLANA,
    chainId: 'mainnet-beta',
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: true,
      destination: true
    },
    contracts: {
      messageTransmitter: 'CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC',
      tokenMessengerMinter: 'CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe',
      usdcMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    },
    blockTime: 400
  },

  // Domain 6: Base
  6: {
    domainId: 6,
    name: 'Base',
    vmType: VMType.EVM,
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: true,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    },
    blockTime: 2000
  },

  // Domain 7: Polygon PoS
  7: {
    domainId: 7,
    name: 'Polygon PoS',
    vmType: VMType.EVM,
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: false,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
    },
    blockTime: 2000
  },

  // Domain 10: Unichain
  10: {
    domainId: 10,
    name: 'Unichain',
    vmType: VMType.EVM,
    chainId: 1301,
    rpcUrl: process.env.UNICHAIN_RPC_URL || '',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: true,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: '' // TBD
    },
    blockTime: 2000
  },

  // Domain 11: Linea
  11: {
    domainId: 11,
    name: 'Linea',
    vmType: VMType.EVM,
    chainId: 59144,
    rpcUrl: process.env.LINEA_RPC_URL || 'https://rpc.linea.build',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: true,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff'
    },
    blockTime: 2000
  },

  // Domain 12: Codex
  12: {
    domainId: 12,
    name: 'Codex',
    vmType: VMType.EVM,
    chainId: 88888888,
    rpcUrl: process.env.CODEX_RPC_URL || '',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: true,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: ''
    },
    blockTime: 2000
  },

  // Domain 13: Sonic
  13: {
    domainId: 13,
    name: 'Sonic',
    vmType: VMType.EVM,
    chainId: 146,
    rpcUrl: process.env.SONIC_RPC_URL || '',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: false,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: ''
    },
    blockTime: 1000
  },

  // Domain 14: World Chain
  14: {
    domainId: 14,
    name: 'World Chain',
    vmType: VMType.EVM,
    chainId: 480,
    rpcUrl: process.env.WORLD_CHAIN_RPC_URL || '',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: true,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: ''
    },
    blockTime: 2000
  },

  // Domain 15: Monad
  15: {
    domainId: 15,
    name: 'Monad',
    vmType: VMType.EVM,
    chainId: 41454,
    rpcUrl: process.env.MONAD_RPC_URL || '',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: false,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: ''
    },
    blockTime: 1000
  },

  // Domain 16: Sei
  16: {
    domainId: 16,
    name: 'Sei',
    vmType: VMType.EVM,
    chainId: 1329,
    rpcUrl: process.env.SEI_RPC_URL || '',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: false,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: ''
    },
    blockTime: 400
  },

  // Domain 17: BNB Smart Chain
  17: {
    domainId: 17,
    name: 'BNB Smart Chain',
    vmType: VMType.EVM,
    chainId: 56,
    rpcUrl: process.env.BNB_RPC_URL || 'https://bsc-dataseed.binance.org',
    tokenSupport: {
      supportsUSDC: false,
      supportsUSYC: true  // BNB only supports USYC
    },
    capabilities: {
      standardSource: true,
      fastSource: false,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usycToken: '' // USYC token on BNB
    },
    blockTime: 3000
  },

  // Domain 18: XDC
  18: {
    domainId: 18,
    name: 'XDC',
    vmType: VMType.EVM,
    chainId: 50,
    rpcUrl: process.env.XDC_RPC_URL || 'https://rpc.xdc.org',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: false,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: ''
    },
    blockTime: 2000
  },

  // Domain 19: HyperEVM
  19: {
    domainId: 19,
    name: 'HyperEVM',
    vmType: VMType.EVM,
    chainId: 998,
    rpcUrl: process.env.HYPEREVM_RPC_URL || '',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: false,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: ''
    },
    blockTime: 2000
  },

  // Domain 21: Ink
  21: {
    domainId: 21,
    name: 'Ink',
    vmType: VMType.EVM,
    chainId: 57073,
    rpcUrl: process.env.INK_RPC_URL || '',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: true,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: ''
    },
    blockTime: 2000
  },

  // Domain 22: Plume
  22: {
    domainId: 22,
    name: 'Plume',
    vmType: VMType.EVM,
    chainId: 98865,
    rpcUrl: process.env.PLUME_RPC_URL || '',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: true,
      destination: true
    },
    contracts: {
      ...COMMON_EVM_ADDRESSES,
      usdcToken: ''
    },
    blockTime: 2000
  },

  // Domain 25: Starknet
  25: {
    domainId: 25,
    name: 'Starknet',
    vmType: VMType.STARKNET,
    chainId: 'SN_MAIN',
    rpcUrl: process.env.STARKNET_RPC_URL || 'https://starknet-mainnet.public.blastapi.io',
    tokenSupport: {
      supportsUSDC: true,
      supportsUSYC: false
    },
    capabilities: {
      standardSource: true,
      fastSource: true,
      destination: true
    },
    contracts: {
      tokenMessengerMinter: '0x07d421B9cA8aA32DF259965cDA8ACb93F7599F69209A41872AE84638B2A20F2a',
      messageTransmitter: '0x02EBB5777B6dD8B26ea11D68Fdf1D2c85cD2099335328Be845a28c77A8AEf183',
      usdcToken: ''
    },
    blockTime: 30000
  }
};

// Testnet chains (skeleton - to be populated as needed)
export const TESTNET_CHAINS: Record<number, ChainMetadata> = {
  // Add testnet configurations here
  // Example: Ethereum Sepolia, etc.
};

export const chainConfig: ChainConfig = {
  mainnet: MAINNET_CHAINS,
  testnet: TESTNET_CHAINS
};

// Helper functions
export function getChainByDomain(domain: number, network: 'mainnet' | 'testnet' = 'mainnet'): ChainMetadata | undefined {
  return chainConfig[network][domain];
}

export function getAllChains(network: 'mainnet' | 'testnet' = 'mainnet'): ChainMetadata[] {
  return Object.values(chainConfig[network]);
}

export function getChainName(domain: number, network: 'mainnet' | 'testnet' = 'mainnet'): string {
  return chainConfig[network][domain]?.name || `Unknown (${domain})`;
}

export function isFastTransferSupported(domain: number, network: 'mainnet' | 'testnet' = 'mainnet'): boolean {
  return chainConfig[network][domain]?.capabilities.fastSource || false;
}

