/**
 * Ethereum chain watcher
 */

import { EVMChainWatcher } from './EVMChainWatcher';
import { MAINNET_CHAINS } from '../config/chains';

export class EthereumWatcher extends EVMChainWatcher {
  constructor() {
    super(MAINNET_CHAINS[0]); // Domain 0 = Ethereum
  }
}

