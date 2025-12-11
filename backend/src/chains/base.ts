/**
 * Base chain watcher
 */

import { EVMChainWatcher } from './EVMChainWatcher';
import { MAINNET_CHAINS } from '../config/chains';

export class BaseWatcher extends EVMChainWatcher {
  constructor() {
    super(MAINNET_CHAINS[6]); // Domain 6 = Base
  }
}

