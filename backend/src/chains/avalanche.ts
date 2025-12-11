/**
 * Avalanche chain watcher
 */

import { EVMChainWatcher } from './EVMChainWatcher';
import { MAINNET_CHAINS } from '../config/chains';

export class AvalancheWatcher extends EVMChainWatcher {
  constructor() {
    super(MAINNET_CHAINS[1]); // Domain 1 = Avalanche
  }
}

