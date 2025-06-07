/**
 * X402 Tier 2 Command Module
 * 
 * Premium Plus tier command that accesses /premium-plus endpoint.
 * Demonstrates advanced X402 payment flow with enhanced premium features.
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
 * Tier 2 (Premium Plus) X402 command implementation
 */
export const tier2Command: CLICommand = {
  name: 'tier2',
  aliases: ['premium'],
  description: 'Test X402 Premium Plus tier (cost discovered dynamically)',
  usage: 'tier2',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    const config = X402_ENDPOINTS.tier2;
    const startTime = Date.now();
    
    try {
      logger.header('X402 Tier 2 Test', `Testing ${config.tierName} endpoint via discovery protocol`);
      
      // Show what this tier offers
      logger.ui(`🎯 ${config.tierName}: ${config.description}`);
      logger.ui(`💰 Expected Cost: ${config.expectedCost} (discovered dynamically)`);
      
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
        note: 'Higher tier - cost unknown until discovery'
      });
      
      // Make request to premium-plus endpoint - interceptor handles payments automatically
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