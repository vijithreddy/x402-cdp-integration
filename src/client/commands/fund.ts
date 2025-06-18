/**
 * Fund Command Module
 * 
 * Handles wallet funding operations with write-operation caching patterns.
 * Demonstrates cache invalidation → operation → refresh cycle.
 * 
 * Error Codes:
 * - FUND_001: Invalid amount provided
 * - FUND_002: Funding operation failed
 * - FUND_003: Balance refresh failed
 */

import type { CLICommand, CommandContext } from '../types/commands';
import { displayFundingResult, displayError } from '../utils/display';
import { logger } from '../../shared/utils/logger';

// Custom error type for funding operations
interface FundingError extends Error {
  code: string;
}

/**
 * Fund command implementation
 * 
 * @param args - Command arguments [amount]
 * @param context - Command context with wallet manager
 * @throws {FundingError} FUND_001: Invalid amount
 * @throws {FundingError} FUND_002: Funding operation failed
 * @throws {FundingError} FUND_003: Balance refresh failed
 */
export const fundCommand: CLICommand = {
  name: 'fund',
  aliases: [],
  description: 'Fund wallet with USDC (default: 5 USDC)',
  usage: 'fund [amount]',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    const { walletManager } = context;

    try {
      // Parse and validate amount
      const targetAmount = args.length > 0 ? parseFloat(args[0]) : 5;
      
      if (isNaN(targetAmount) || targetAmount <= 0) {
        const error = new Error('Invalid amount. Please provide a positive number.') as FundingError;
        error.code = 'FUND_001';
        throw error;
      }

      // Log funding attempt
      logger.flow('funding', {
        action: 'Funding wallet',
        amount: targetAmount,
        currency: 'USDC'
      });

      logger.ui(`\n💰 Funding wallet to ${targetAmount} USDC...`);
      
      // Attempt funding operation
      const success = await walletManager.fundWallet(targetAmount);
      
      if (!success) {
        const error = new Error('Failed to fund wallet') as FundingError;
        error.code = 'FUND_002';
        throw error;
      }

      // Display result and refresh balance
      displayFundingResult(success, targetAmount);
      
      // Refresh balance to show new amount
      try {
        const newBalance = await walletManager.getUSDCBalance();
        logger.ui(`Updated Balance: ${newBalance} USDC`);
      } catch (balanceError) {
        const error = new Error('Failed to refresh balance after funding') as FundingError;
        error.code = 'FUND_003';
        throw error;
      }
    } catch (error: unknown) {
      displayError('Failed to fund wallet', error);
      if (error instanceof Error) {
        logger.error('Funding operation failed', {
          error: error.message,
          code: (error as FundingError).code || 'UNKNOWN',
          amount: args[0] || 5
        });
      }
    }
  }
}; 