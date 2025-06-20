/**
 * Tier 1 X402 Payment Command
 * 
 * Basic premium features with AI analysis and market data.
 */

import { logger } from '../../../shared/utils/logger';
import type { CLICommand, CommandContext } from '../../types/commands';
import { X402_ENDPOINTS, validateBalanceForX402, createX402Client, displayPremiumContent, handlePaymentCompletion, handleX402Error } from './index';

export const tier1Command: CLICommand = {
  name: 'tier1',
  aliases: ['basic'],
  description: 'Test X402 Basic Premium (~0.01 USDC)',
  usage: 'tier1',
  async execute(_args: string[], context: CommandContext): Promise<void> {
    const startTime = Date.now();
    const config = X402_ENDPOINTS.tier1;
    try {
      // Validate balance first
      const balance = await validateBalanceForX402(context);
      if (balance === null) return;
      // Create X402 client
      const { api, viemAccount } = await createX402Client(context);
      // Make request to protected endpoint
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