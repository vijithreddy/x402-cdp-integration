/**
 * Tier 3 X402 Payment Command
 * 
 * Enterprise features with institutional data and custom insights.
 */

import { logger } from '../../../shared/utils/logger';
import type { CLICommand, CommandContext } from '../../types/commands';
import { X402_ENDPOINTS, validateBalanceForX402, createX402Client, displayPremiumContent, handlePaymentCompletion, handleX402Error } from './index';

export const tier3Command: CLICommand = {
  name: 'tier3',
  aliases: ['enterprise'],
  description: 'Test X402 Enterprise (~1.0 USDC)',
  usage: 'tier3',
  async execute(_args: string[], context: CommandContext): Promise<void> {
    const startTime = Date.now();
    const config = X402_ENDPOINTS.tier3;
    try {
      // Validate balance first
      const balance = await validateBalanceForX402(context);
      if (balance === null) return;
      // Create X402 client
      const { api, viemAccount } = await createX402Client(context);
      // Make request to enterprise endpoint
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