/**
 * EVM Chain Watcher base class
 * Implements IChainWatcher for EVM-compatible chains using Viem
 */

import { createPublicClient, http, Log, parseAbiItem, PublicClient } from 'viem';
import { IChainWatcher } from './IChainWatcher';
import { BurnEvent, MessageSentEvent, ReceiveMessageEvent, MintEvent, TokenType } from '../types/transfer';
import { ChainMetadata, EVMContracts } from '../types/chain';
import { createLogger } from '../utils/logger';

const logger = createLogger('EVMChainWatcher');

// ABI fragments for the events we care about
const DEPOSIT_FOR_BURN_ABI = parseAbiItem('event DepositForBurn(uint64 indexed nonce, address indexed burnToken, uint256 amount, address indexed depositor, bytes32 mintRecipient, uint32 destinationDomain, bytes32 destinationTokenMessenger, bytes32 destinationCaller)');

const MESSAGE_SENT_ABI = parseAbiItem('event MessageSent(bytes message)');

const MESSAGE_RECEIVED_ABI = parseAbiItem('event MessageReceived(address indexed caller, uint32 sourceDomain, uint64 indexed nonce, bytes32 sender, bytes messageBody)');

const MINT_ABI = parseAbiItem('event MintAndWithdraw(address indexed mintRecipient, uint256 amount, address indexed mintToken)');

export class EVMChainWatcher implements IChainWatcher {
  private client: PublicClient;
  private metadata: ChainMetadata;
  private contracts: EVMContracts;
  private running: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastBlockNumber: bigint = 0n;

  private burnCallbacks: Array<(event: BurnEvent) => void> = [];
  private messageSentCallbacks: Array<(event: MessageSentEvent) => void> = [];
  private receiveMessageCallbacks: Array<(event: ReceiveMessageEvent) => void> = [];
  private mintCallbacks: Array<(event: MintEvent) => void> = [];

  constructor(metadata: ChainMetadata) {
    this.metadata = metadata;
    this.contracts = metadata.contracts as EVMContracts;

    // Create Viem public client
    this.client = createPublicClient({
      transport: http(metadata.rpcUrl, {
        batch: true,
        retryCount: 3,
        retryDelay: 1000
      })
    });
  }

  async start(): Promise<void> {
    if (this.running) {
      logger.warn(`Chain watcher for ${this.metadata.name} already running`);
      return;
    }

    logger.info(`Starting chain watcher for ${this.metadata.name}`);
    this.running = true;

    // Get current block number
    try {
      this.lastBlockNumber = await this.client.getBlockNumber();
      logger.info(`${this.metadata.name} starting from block ${this.lastBlockNumber}`);
    } catch (error) {
      logger.error(`Failed to get block number for ${this.metadata.name}`, error);
      throw error;
    }

    // Start polling for new blocks
    this.pollInterval = setInterval(() => {
      this.pollNewBlocks();
    }, this.metadata.blockTime);
  }

  async stop(): Promise<void> {
    if (!this.running) return;

    logger.info(`Stopping chain watcher for ${this.metadata.name}`);
    this.running = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  subscribeBurnEvents(callback: (event: BurnEvent) => void): void {
    this.burnCallbacks.push(callback);
  }

  subscribeMessageSentEvents(callback: (event: MessageSentEvent) => void): void {
    this.messageSentCallbacks.push(callback);
  }

  subscribeReceiveMessageEvents(callback: (event: ReceiveMessageEvent) => void): void {
    this.receiveMessageCallbacks.push(callback);
  }

  subscribeMintEvents(callback: (event: MintEvent) => void): void {
    this.mintCallbacks.push(callback);
  }

  getDomainId(): number {
    return this.metadata.domainId;
  }

  isRunning(): boolean {
    return this.running;
  }

  private async pollNewBlocks(): Promise<void> {
    if (!this.running) return;

    try {
      const currentBlock = await this.client.getBlockNumber();

      if (currentBlock > this.lastBlockNumber) {
        const fromBlock = this.lastBlockNumber + 1n;
        const toBlock = currentBlock;

        logger.debug(`Polling ${this.metadata.name} blocks ${fromBlock} to ${toBlock}`);

        // Query all relevant events in parallel
        await Promise.all([
          this.queryBurnEvents(fromBlock, toBlock),
          this.queryMessageSentEvents(fromBlock, toBlock),
          this.queryReceiveMessageEvents(fromBlock, toBlock),
          this.queryMintEvents(fromBlock, toBlock)
        ]);

        this.lastBlockNumber = currentBlock;
      }
    } catch (error) {
      logger.error(`Error polling ${this.metadata.name}`, error);
    }
  }

  private async queryBurnEvents(fromBlock: bigint, toBlock: bigint): Promise<void> {
    try {
      const logs = await this.client.getLogs({
        address: this.contracts.tokenMessenger as `0x${string}`,
        event: DEPOSIT_FOR_BURN_ABI,
        fromBlock,
        toBlock
      });

      for (const log of logs) {
        await this.processBurnEvent(log);
      }
    } catch (error) {
      logger.error(`Error querying burn events on ${this.metadata.name}`, error);
    }
  }

  private async queryMessageSentEvents(fromBlock: bigint, toBlock: bigint): Promise<void> {
    try {
      const logs = await this.client.getLogs({
        address: this.contracts.messageTransmitter as `0x${string}`,
        event: MESSAGE_SENT_ABI,
        fromBlock,
        toBlock
      });

      for (const log of logs) {
        await this.processMessageSentEvent(log);
      }
    } catch (error) {
      logger.error(`Error querying MessageSent events on ${this.metadata.name}`, error);
    }
  }

  private async queryReceiveMessageEvents(fromBlock: bigint, toBlock: bigint): Promise<void> {
    try {
      const logs = await this.client.getLogs({
        address: this.contracts.messageTransmitter as `0x${string}`,
        event: MESSAGE_RECEIVED_ABI,
        fromBlock,
        toBlock
      });

      for (const log of logs) {
        await this.processReceiveMessageEvent(log);
      }
    } catch (error) {
      logger.error(`Error querying MessageReceived events on ${this.metadata.name}`, error);
    }
  }

  private async queryMintEvents(fromBlock: bigint, toBlock: bigint): Promise<void> {
    try {
      const logs = await this.client.getLogs({
        address: this.contracts.tokenMinter as `0x${string}`,
        event: MINT_ABI,
        fromBlock,
        toBlock
      });

      for (const log of logs) {
        await this.processMintEvent(log);
      }
    } catch (error) {
      logger.error(`Error querying mint events on ${this.metadata.name}`, error);
    }
  }

  private async processBurnEvent(log: Log): Promise<void> {
    try {
      const { args, blockNumber, transactionHash } = log as any;
      
      // Get block to extract timestamp
      const block = await this.client.getBlock({ blockNumber });
      const tx = await this.client.getTransaction({ hash: transactionHash });

      // Determine token type based on burnToken address
      let tokenType: TokenType = TokenType.USDC;
      if (args.burnToken?.toLowerCase() === this.contracts.usycToken?.toLowerCase()) {
        tokenType = TokenType.USYC;
      }

      const event: BurnEvent = {
        domain: this.metadata.domainId,
        nonce: args.nonce.toString(),
        txHash: transactionHash,
        blockNumber: Number(blockNumber),
        timestamp: new Date(Number(block.timestamp) * 1000),
        sender: tx.from,
        recipient: args.mintRecipient,
        amount: args.amount.toString(),
        destinationDomain: args.destinationDomain,
        minFinalityThreshold: 2000, // Default, would need to parse tx input to get actual value
        tokenType,
        tokenAddress: args.burnToken
      };

      this.burnCallbacks.forEach(cb => cb(event));
    } catch (error) {
      logger.error(`Error processing burn event on ${this.metadata.name}`, error);
    }
  }

  private async processMessageSentEvent(log: Log): Promise<void> {
    try {
      const { args, blockNumber, transactionHash } = log as any;
      const block = await this.client.getBlock({ blockNumber });

      // Parse message to extract nonce
      // Message format: version(4) + sourceDomain(4) + destDomain(4) + nonce(8) + ...
      const message = args.message as string;
      const nonceHex = message.slice(24, 40); // Extract nonce bytes
      const nonce = BigInt('0x' + nonceHex).toString();

      const event: MessageSentEvent = {
        domain: this.metadata.domainId,
        nonce,
        txHash: transactionHash,
        timestamp: new Date(Number(block.timestamp) * 1000),
        messageBody: message,
        sender: log.address
      };

      this.messageSentCallbacks.forEach(cb => cb(event));
    } catch (error) {
      logger.error(`Error processing MessageSent event on ${this.metadata.name}`, error);
    }
  }

  private async processReceiveMessageEvent(log: Log): Promise<void> {
    try {
      const { args, blockNumber, transactionHash } = log as any;
      const block = await this.client.getBlock({ blockNumber });

      const event: ReceiveMessageEvent = {
        domain: this.metadata.domainId,
        nonce: args.nonce.toString(),
        txHash: transactionHash,
        blockNumber: Number(blockNumber),
        timestamp: new Date(Number(block.timestamp) * 1000),
        caller: args.caller,
        sourceDomain: args.sourceDomain
      };

      this.receiveMessageCallbacks.forEach(cb => cb(event));
    } catch (error) {
      logger.error(`Error processing ReceiveMessage event on ${this.metadata.name}`, error);
    }
  }

  private async processMintEvent(log: Log): Promise<void> {
    try {
      const { args, blockNumber, transactionHash } = log as any;
      const block = await this.client.getBlock({ blockNumber });

      // Determine token type based on mintToken address
      let tokenType: TokenType = TokenType.USDC;
      if (args.mintToken?.toLowerCase() === this.contracts.usycToken?.toLowerCase()) {
        tokenType = TokenType.USYC;
      }

      const event: MintEvent = {
        domain: this.metadata.domainId,
        nonce: '0', // Nonce not directly available in MintAndWithdraw event, needs correlation
        txHash: transactionHash,
        timestamp: new Date(Number(block.timestamp) * 1000),
        recipient: args.mintRecipient,
        amount: args.amount.toString(),
        tokenType
      };

      this.mintCallbacks.forEach(cb => cb(event));
    } catch (error) {
      logger.error(`Error processing mint event on ${this.metadata.name}`, error);
    }
  }
}

