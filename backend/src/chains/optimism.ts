/**
 * OP Mainnet chain watcher
 */

import { EVMChainWatcher } from './EVMChainWatcher';
import { MAINNET_CHAINS } from '../config/chains';

export class OptimismWatcher extends EVMChainWatcher {
  constructor() {
    super(MAINNET_CHAINS[2]); // Domain 2 = OP Mainnet
  }
}

