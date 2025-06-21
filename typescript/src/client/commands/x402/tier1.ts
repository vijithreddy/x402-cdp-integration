/**
 * Tier 1 X402 Command
 * 
 * Executes tier1 payment and displays premium content with enhanced error handling.
 */

import { logger } from '../../../shared/utils/logger';
import type { CLICommand, CommandContext } from '../../types/commands';
import { X402_ENDPOINTS, validateBalanceForX402, createX402Client, displayPremiumContent, handlePaymentCompletion, handleX402Error } from './index';
import { ErrorFactory, ErrorHandler } from '../../../shared/errors';
import { ServerResponse } from './types';

export const tier1Command: CLICommand = {
  name: 'tier1',
  aliases: ['basic'],
  description: 'Test X402 Basic Premium (~0.01 USDC)',
  usage: 'tier1',
  async execute(_args: string[], context: CommandContext): Promise<void> {
    const startTime = Date.now();
    const config = X402_ENDPOINTS.tier1;
    
    try {
      logger.flow('tier1_start', { action: 'Starting tier1 payment process' });
      
      // Validate balance first
      const balance = await validateBalanceForX402(context);
      if (balance === null) return;
      
      // Create X402 client
      const { api, viemAccount } = await createX402Client(context);
      
      // Make request to protected endpoint
      const response = await api.get(config.endpoint);
      
      // Type-safe response handling
      const serverResponse = response.data as ServerResponse;
      
      if (!serverResponse.paymentVerified) {
        throw new Error('Payment verification failed');
      }
      
      // Display premium content
      displayPremiumContent(response, config);
      
      // Handle payment completion
      await handlePaymentCompletion(response, viemAccount, ((Date.now() - startTime) / 1000).toFixed(2), context);
      
      logger.flow('tier1_success', { action: 'Tier1 payment completed successfully' });
      
    } catch (error: any) {
      // Use the new error handling system
      const x402Error = ErrorFactory.createPaymentError(error);
      ErrorHandler.logError(x402Error, { 
        command: 'tier1', 
        endpoint: config.endpoint,
        duration: ((Date.now() - startTime) / 1000).toFixed(2)
      });
      
      const userMessage = ErrorHandler.formatForUser(x402Error);
      console.error(`\n${userMessage}`);
      
      if (ErrorHandler.isRetryable(x402Error)) {
        console.log('\n💡 This error may be temporary. You can try again.');
      }
      
      // Fall back to original error handling for compatibility
      handleX402Error(error, config);
    }
  }
}; 