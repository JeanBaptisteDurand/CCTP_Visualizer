/**
 * Iris API client implementation
 */

import axios, { AxiosInstance } from 'axios';
import { IIrisClient } from './IIrisClient';
import {
  IrisMessageResponse,
  IrisMessagesQueryParams,
  IrisFastBurnAllowance,
  IrisBurnFee,
  IrisReattestRequest,
  IrisReattestResponse
} from '../types/iris';
import { createLogger } from '../utils/logger';

const logger = createLogger('IrisClient');

export class IrisClient implements IIrisClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.IRIS_API_URL || 'https://iris-api.circle.com';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      response => response,
      error => {
        logger.error('Iris API request failed', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        throw error;
      }
    );
  }

  async getMessage(params: IrisMessagesQueryParams): Promise<IrisMessageResponse | null> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.domain !== undefined) {
        queryParams.append('domain', params.domain.toString());
      }
      if (params.nonce) {
        queryParams.append('nonce', params.nonce);
      }
      if (params.transactionHash) {
        queryParams.append('transactionHash', params.transactionHash);
      }

      const response = await this.client.get(`/v2/messages?${queryParams.toString()}`);
      
      if (response.data && response.data.messages && response.data.messages.length > 0) {
        const message = response.data.messages[0];
        
        return {
          status: message.attestation === 'complete' ? 'complete' : 
                  message.attestation === 'failed' ? 'failed' : 'pending',
          attestation: message.attestation,
          message: message.message,
          finalityThresholdExecuted: message.finalityThresholdExecuted
        };
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Message not found yet
      }
      logger.error('Failed to get message from Iris', { params, error: error.message });
      throw error;
    }
  }

  async requestReattest(request: IrisReattestRequest): Promise<IrisReattestResponse> {
    try {
      const response = await this.client.post('/v2/reattest', {
        sourceDomain: request.sourceDomain,
        nonce: request.nonce
      });

      return {
        status: response.data.status || 'queued',
        message: response.data.message
      };
    } catch (error: any) {
      logger.error('Failed to request reattestation', { request, error: error.message });
      throw error;
    }
  }

  async getFastBurnAllowance(token: 'USDC' | 'USYC' = 'USDC'): Promise<IrisFastBurnAllowance> {
    try {
      const response = await this.client.get(`/v2/fastBurn/${token}/allowance`);
      
      return {
        allowance: response.data.allowance || '0',
        consumed: response.data.consumed || '0',
        available: response.data.available || response.data.allowance || '0'
      };
    } catch (error: any) {
      logger.error('Failed to get Fast Burn allowance', { token, error: error.message });
      throw error;
    }
  }

  async getBurnFees(token: 'USDC' | 'USYC' = 'USDC'): Promise<IrisBurnFee[]> {
    try {
      const response = await this.client.get(`/v2/burn/${token}/fees`);
      
      if (response.data && Array.isArray(response.data.fees)) {
        return response.data.fees.map((fee: any) => ({
          sourceDomain: fee.sourceDomain,
          destinationDomain: fee.destinationDomain,
          standardFee: fee.standardFee || '0',
          fastFee: fee.fastFee || '0'
        }));
      }

      return [];
    } catch (error: any) {
      logger.error('Failed to get burn fees', { token, error: error.message });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try to get allowance as a health check
      await this.getFastBurnAllowance('USDC');
      return true;
    } catch (error) {
      logger.warn('Iris health check failed');
      return false;
    }
  }
}

