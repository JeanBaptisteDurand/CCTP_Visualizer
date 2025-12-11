/**
 * Graph layout logic
 * Creates a radial layout with Iris at center and chains in a circle
 */

import { GraphNode, GraphEdge, NodeType, GraphData } from '../../types/graph';

// Chain metadata (simplified - domain -> name mapping)
const CHAIN_NAMES: Record<number, string> = {
  0: 'Ethereum',
  1: 'Avalanche',
  2: 'OP Mainnet',
  3: 'Arbitrum',
  5: 'Solana',
  6: 'Base',
  7: 'Polygon',
  10: 'Unichain',
  11: 'Linea',
  12: 'Codex',
  13: 'Sonic',
  14: 'World Chain',
  15: 'Monad',
  16: 'Sei',
  17: 'BNB Chain',
  18: 'XDC',
  19: 'HyperEVM',
  21: 'Ink',
  22: 'Plume',
  25: 'Starknet'
};

const ACTIVE_DOMAINS = [0, 1, 2, 3, 5, 6, 7]; // Start with main chains

export function createGraphLayout(): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphEdge[] = [];

  const centerX = 0;
  const centerY = 0;
  const radius = 400; // Radius of chain circle
  const nodeSpacing = 60; // Spacing between nodes in a chain sector

  // Create center nodes
  nodes.push({
    id: 'iris',
    name: 'Iris',
    type: NodeType.IRIS,
    fx: centerX,
    fy: centerY,
    color: '#8b5cf6',
    size: 20
  });

  nodes.push({
    id: 'api-consumer',
    name: 'API Consumer',
    type: NodeType.API_CONSUMER,
    fx: centerX + 50,
    fy: centerY,
    color: '#10b981',
    size: 12
  });

  // Create chain nodes in a circle
  const numChains = ACTIVE_DOMAINS.length;
  const angleStep = (2 * Math.PI) / numChains;

  ACTIVE_DOMAINS.forEach((domain, index) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top
    const chainName = CHAIN_NAMES[domain] || `Domain ${domain}`;

    // Base position for this chain
    const baseX = centerX + Math.cos(angle) * radius;
    const baseY = centerY + Math.sin(angle) * radius;

    // Create nodes for this chain (from center outward)
    const chainNodes = [
      {
        id: `chain-${domain}-transmitter`,
        name: `${chainName} MessageTransmitter`,
        type: NodeType.MESSAGE_TRANSMITTER,
        domain,
        fx: baseX + Math.cos(angle) * (nodeSpacing * 0),
        fy: baseY + Math.sin(angle) * (nodeSpacing * 0),
        color: '#3b82f6',
        size: 8
      },
      {
        id: `chain-${domain}-messenger`,
        name: `${chainName} TokenMessenger`,
        type: NodeType.TOKEN_MESSENGER,
        domain,
        fx: baseX + Math.cos(angle) * (nodeSpacing * 1),
        fy: baseY + Math.sin(angle) * (nodeSpacing * 1),
        color: '#6366f1',
        size: 8
      },
      {
        id: `chain-${domain}-minter`,
        name: `${chainName} TokenMinter`,
        type: NodeType.TOKEN_MINTER,
        domain,
        fx: baseX + Math.cos(angle) * (nodeSpacing * 2),
        fy: baseY + Math.sin(angle) * (nodeSpacing * 2),
        color: '#8b5cf6',
        size: 8
      },
      {
        id: `chain-${domain}-usdc`,
        name: `${chainName} USDC`,
        type: NodeType.TOKEN_USDC,
        domain,
        fx: baseX + Math.cos(angle) * (nodeSpacing * 3),
        fy: baseY + Math.sin(angle) * (nodeSpacing * 3),
        color: '#2563eb',
        size: 10
      },
      {
        id: `chain-${domain}-users`,
        name: `${chainName} Users`,
        type: NodeType.USER_CLUSTER,
        domain,
        fx: baseX + Math.cos(angle) * (nodeSpacing * 4),
        fy: baseY + Math.sin(angle) * (nodeSpacing * 4),
        color: '#64748b',
        size: 12
      }
    ];

    nodes.push(...chainNodes);

    // Create links within chain (outbound path)
    links.push(
      { source: `chain-${domain}-users`, target: `chain-${domain}-usdc`, color: '#64748b', width: 1 },
      { source: `chain-${domain}-usdc`, target: `chain-${domain}-minter`, color: '#3b82f6', width: 1 },
      { source: `chain-${domain}-minter`, target: `chain-${domain}-messenger`, color: '#6366f1', width: 1 },
      { source: `chain-${domain}-messenger`, target: `chain-${domain}-transmitter`, color: '#8b5cf6', width: 1 },
      { source: `chain-${domain}-transmitter`, target: 'iris', color: '#a78bfa', width: 2 }
    );

    // Inbound path (from Iris back to chain)
    links.push(
      { source: 'iris', target: `chain-${domain}-transmitter`, color: '#a78bfa', width: 2 }
    );
  });

  return { nodes, links };
}

/**
 * Get the path (sequence of node IDs) for a transfer
 */
export function getTransferPath(
  sourceDomain: number,
  destinationDomain: number,
  status: string
): string[] {
  const path: string[] = [];

  // Source chain path
  path.push(`chain-${sourceDomain}-users`);
  path.push(`chain-${sourceDomain}-usdc`);
  path.push(`chain-${sourceDomain}-minter`);
  path.push(`chain-${sourceDomain}-messenger`);
  path.push(`chain-${sourceDomain}-transmitter`);

  // Iris
  path.push('iris');

  // Destination chain path (only if attested)
  if (status !== 'BURN_INITIATED' && status !== 'MESSAGE_SENT' && status !== 'ATTESTATION_PENDING') {
    path.push(`chain-${destinationDomain}-transmitter`);
    path.push(`chain-${destinationDomain}-messenger`);
    path.push(`chain-${destinationDomain}-minter`);
    path.push(`chain-${destinationDomain}-usdc`);
    path.push(`chain-${destinationDomain}-users`);
  }

  return path;
}

/**
 * Determine current edge based on transfer status
 */
export function getCurrentEdge(
  sourceDomain: number,
  destinationDomain: number,
  status: string
): { source: string; target: string } | null {
  switch (status) {
    case 'BURN_INITIATED':
      return { source: `chain-${sourceDomain}-users`, target: `chain-${sourceDomain}-usdc` };
    case 'MESSAGE_SENT':
    case 'ATTESTATION_PENDING':
      return { source: `chain-${sourceDomain}-transmitter`, target: 'iris' };
    case 'ATTESTATION_COMPLETE':
    case 'RECEIVE_MESSAGE_PENDING':
      return { source: 'iris', target: `chain-${destinationDomain}-transmitter` };
    case 'MINT_COMPLETE':
      return { source: `chain-${destinationDomain}-usdc`, target: `chain-${destinationDomain}-users` };
    default:
      return null;
  }
}

