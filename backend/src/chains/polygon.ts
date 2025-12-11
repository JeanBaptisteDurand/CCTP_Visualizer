/**
 * Polygon PoS chain watcher
 */

import { EVMChainWatcher } from './EVMChainWatcher';
import { MAINNET_CHAINS } from '../config/chains';

export class PolygonWatcher extends EVMChainWatcher {
  constructor() {
    super(MAINNET_CHAINS[7]); // Domain 7 = Polygon PoS
  }
}

