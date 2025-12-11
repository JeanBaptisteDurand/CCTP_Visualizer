/**
 * Arbitrum chain watcher
 */

import { EVMChainWatcher } from './EVMChainWatcher';
import { MAINNET_CHAINS } from '../config/chains';

export class ArbitrumWatcher extends EVMChainWatcher {
  constructor() {
    super(MAINNET_CHAINS[3]); // Domain 3 = Arbitrum
  }
}

