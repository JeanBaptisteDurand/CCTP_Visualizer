/**
 * EVM Chain Watchers
 * Creates watchers for all EVM-compatible chains dynamically from chain config
 */

import { EVMChainWatcher } from './EVMChainWatcher';
import { MAINNET_CHAINS } from '../config/chains';
import { VMType } from '../types/chain';
import { IChainWatcher } from './IChainWatcher';

/**
 * Create EVM chain watchers for all EVM chains in MAINNET_CHAINS
 */
export function createEVMWatchers(): IChainWatcher[] {
  const watchers: IChainWatcher[] = [];

  for (const chain of Object.values(MAINNET_CHAINS)) {
    if (chain.vmType === VMType.EVM) {
      watchers.push(new EVMChainWatcher(chain));
    }
  }

  return watchers;
}

/**
 * Create a watcher for a specific EVM chain by domain ID
 */
export function createEVMWatcher(domainId: number): IChainWatcher | null {
  const chain = MAINNET_CHAINS[domainId];
  if (!chain || chain.vmType !== VMType.EVM) {
    return null;
  }
  return new EVMChainWatcher(chain);
}

