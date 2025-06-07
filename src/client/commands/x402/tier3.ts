/**
 * X402 Tier 3 Command Module
 * 
 * Enterprise tier command that accesses /enterprise endpoint.
 * Demonstrates high-value X402 payment flow with institutional-grade features.
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
 * Tier 3 (Enterprise) X402 command implementation
 */
export const tier3Command: CLICommand = {
  name: 'tier3',
  aliases: ['enterprise'],
  description: 'Test X402 Enterprise tier (cost discovered dynamically)',
  usage: 'tier3',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    const config = X402_ENDPOINTS.tier3;
    const startTime = Date.now();
    
    try {
      logger.header('X402 Tier 3 Test', `Testing ${config.tierName} endpoint via discovery protocol`);
      
      // Show what this tier offers
      logger.ui(`🎯 ${config.tierName}: ${config.description}`);
      logger.ui(`💰 Expected Cost: ${config.expectedCost} (discovered dynamically)`);
      logger.ui(`🏛️  Target Audience: Institutional traders and enterprises`);
      
      // Validate balance using shared utility
      const balance = await validateBalanceForX402(context);
      if (balance === null) return;
      
      // Additional warning for higher cost
      if (balance < 1.0) {
        logger.warn(`Enterprise tier typically costs ~1.0 USDC. Current balance: ${balance} USDC`);
        logger.ui('💡 Consider funding your wallet if the payment fails due to insufficient balance');
      }
      
      // Create X402-enabled client
      const { api, viemAccount } = await createX402Client(context);
      
      logger.flow('payment_request', { 
        action: 'Discovering payment requirements', 
        endpoint: config.endpoint,
        client: viemAccount.address,
        tier: config.tierName,
        note: 'Enterprise tier - highest cost, premium features'
      });
      
      // Make request to enterprise endpoint - interceptor handles payments automatically
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