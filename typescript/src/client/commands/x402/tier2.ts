/**
 * Tier 2 X402 Payment Command
 * 
 * Premium Plus features with advanced AI models and predictive analytics.
 */

import { logger } from '../../../shared/utils/logger';
import type { CLICommand, CommandContext } from '../../types/commands';
import { X402_ENDPOINTS, validateBalanceForX402, createX402Client, displayPremiumContent, handlePaymentCompletion, handleX402Error } from './index';

export const tier2Command: CLICommand = {
  name: 'tier2',
  aliases: ['premium'],
  description: 'Test X402 Premium Plus (~0.1 USDC)',
  usage: 'tier2',
  async execute(_args: string[], context: CommandContext): Promise<void> {
    const startTime = Date.now();
    const config = X402_ENDPOINTS.tier2;
    try {
      // Validate balance first
      const balance = await validateBalanceForX402(context);
      if (balance === null) return;
      // Create X402 client
      const { api, viemAccount } = await createX402Client(context);
      // Make request to premium-plus endpoint
      const response = await api.get(config.endpoint);
      // Display premium content
      displayPremiumContent(response, config);
      // Handle payment completion
      await handlePaymentCompletion(response, viemAccount, ((Date.now() - startTime) / 1000).toFixed(2), context);
    } catch (error) {
      handleX402Error(error, config);
    }
  }
}; 