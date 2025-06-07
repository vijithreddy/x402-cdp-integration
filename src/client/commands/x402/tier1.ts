/**
 * X402 Tier 1 Command Module
 * 
 * Basic premium tier command that accesses /protected endpoint.
 * Demonstrates fundamental X402 payment flow with basic premium features.
 */

import type { CLICommand, CommandContext } from '../../types/commands';
import { logger } from '../../../shared/utils/logger';
import { 
  X402_ENDPOINTS, 
  validateBalanceForX402, 
  createX402Client, 
  displayPremiumContent, 
  handlePaymentCompletion,
  handleX402Error 
} from './index';

/**
 * Tier 1 (Basic Premium) X402 command implementation
 */
export const tier1Command: CLICommand = {
  name: 'tier1',
  aliases: ['basic'],
  description: 'Test X402 Basic Premium tier (cost discovered dynamically)',
  usage: 'tier1',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    const config = X402_ENDPOINTS.tier1;
    const startTime = Date.now();
    
    try {
      logger.header('X402 Tier 1 Test', `Testing ${config.tierName} endpoint via discovery protocol`);
      
      // Validate balance using shared utility
      const balance = await validateBalanceForX402(context);
      if (balance === null) return;
      
      // Create X402-enabled client
      const { api, viemAccount } = await createX402Client(context);
      
      logger.flow('payment_request', { 
        action: 'Discovering payment requirements', 
        endpoint: config.endpoint,
        client: viemAccount.address,
        tier: config.tierName,
        note: 'Cost unknown - X402 discovery in progress'
      });
      
      // Make request to protected endpoint - interceptor handles payments automatically
      const response = await api.get(config.endpoint);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Success! Display the content
      logger.success(`Payment successful! Accessed ${config.tierName} content`);
      
      // Display premium content using shared utility
      displayPremiumContent(response, config);
      
      logger.ui('Result: ✅ Payment successful');
      logger.debug('Full response data', response.data);
      
      // Handle payment completion and balance refresh
      await handlePaymentCompletion(response, viemAccount, duration, context);
      
      logger.separator();
      
    } catch (error: any) {
      handleX402Error(error, config);
      logger.separator();
    }
  }
}; 