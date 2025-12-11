/**
 * Iris API client interface
 */

import {
  IrisMessageResponse,
  IrisMessagesQueryParams,
  IrisFastBurnAllowance,
  IrisBurnFee,
  IrisReattestRequest,
  IrisReattestResponse
} from '../types/iris';

export interface IIrisClient {
  /**
   * Get message status and attestation
   */
  getMessage(params: IrisMessagesQueryParams): Promise<IrisMessageResponse | null>;

  /**
   * Request re-attestation for a message
   */
  requestReattest(request: IrisReattestRequest): Promise<IrisReattestResponse>;

  /**
   * Get Fast Transfer allowance for USDC
   */
  getFastBurnAllowance(token: 'USDC' | 'USYC'): Promise<IrisFastBurnAllowance>;

  /**
   * Get burn fees for a route
   */
  getBurnFees(token: 'USDC' | 'USYC'): Promise<IrisBurnFee[]>;

  /**
   * Check if Iris API is healthy
   */
  healthCheck(): Promise<boolean>;
}

