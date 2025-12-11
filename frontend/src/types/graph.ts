/**
 * Graph visualization types
 */

import { TransferMode, TokenType, TransferStatus } from './transfer';

export enum NodeType {
  IRIS = 'IRIS',
  API_CONSUMER = 'API_CONSUMER',
  CHAIN = 'CHAIN',
  USER_CLUSTER = 'USER_CLUSTER',
  TOKEN_USDC = 'TOKEN_USDC',
  TOKEN_USYC = 'TOKEN_USYC',
  TOKEN_MINTER = 'TOKEN_MINTER',
  TOKEN_MESSENGER = 'TOKEN_MESSENGER',
  MESSAGE_TRANSMITTER = 'MESSAGE_TRANSMITTER',
  EVENT_LOG = 'EVENT_LOG'
}

export interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  domain?: number;
  x?: number;
  y?: number;
  fx?: number; // Fixed x position
  fy?: number; // Fixed y position
  color?: string;
  size?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  color?: string;
  width?: number;
}

export interface Particle {
  id: string;
  transferId: string;
  sourceNodeId: string;
  targetNodeId: string;
  progress: number; // 0 to 1
  color: string;
  size: number;
  speed: number;
  mode: TransferMode;
  tokenType: TokenType;
  amount: string;
  status: TransferStatus;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}

