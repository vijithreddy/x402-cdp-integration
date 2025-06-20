/**
 * Balance Command Module
 * 
 * Displays current USDC balance.
 * Provides detailed balance information.
 * 
 * Error Codes:
 * - BAL_001: Failed to get wallet balance
 * - BAL_003: Invalid balance format
 * - BAL_004: No wallet available
 */

import type { CLICommand, CommandContext } from '../types/commands';
import { displayBalance, displayError } from '../utils/display';
import { logger } from '../../shared/utils/logger';

// Custom error type for balance operations
interface BalanceError extends Error {
  code: string;
}

/**
 * Balance command implementation
 * 
 * @param args - Command arguments (unused)
 * @param context - Command context with wallet manager
 * @throws {BalanceError} BAL_001: Failed to get wallet balance
 * @throws {BalanceError} BAL_003: Invalid balance format
 * @throws {BalanceError} BAL_004: No wallet available
 */
export const balanceCommand: CLICommand = {
  name: 'balance',
  aliases: ['bal'],
  description: 'Show USDC balance',
  usage: 'balance',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    const { walletManager } = context;

    try {
      // Log balance check request
      logger.flow('balance_check', {
        action: 'Checking wallet balance',
        timestamp: new Date().toISOString()
      });

      // Get wallet info first to ensure wallet exists
      const walletInfo = await walletManager.getWalletInfo();
      if (!walletInfo) {
        const error = new Error('No wallet available. Please initialize a wallet first.') as BalanceError;
        error.code = 'BAL_004';
        throw error;
      }

      // Get current balance
      try {
        const balance = await walletManager.getUSDCBalance();
        
        // Validate balance format
        if (isNaN(balance) || balance < 0) {
          const error = new Error('Invalid balance format received') as BalanceError;
          error.code = 'BAL_003';
          throw error;
        }

        // Display balance
        displayBalance(balance);
        
        // Log successful balance retrieval
        logger.flow('balance_success', {
          action: 'Retrieved wallet balance',
          balance: balance,
          timestamp: new Date().toISOString()
        });
      } catch (balanceError) {
        const error = new Error('Failed to get wallet balance') as BalanceError;
        error.code = 'BAL_001';
        throw error;
      }
    } catch (caughtError: unknown) {
      if (caughtError instanceof Error) {
        // If it's not already a BalanceError, wrap it
        if (!('code' in caughtError)) {
          const balanceError = new Error('Failed to get balance information') as BalanceError;
          balanceError.code = 'BAL_001';
          displayError('Failed to get balance', balanceError);
          logger.error('Balance retrieval failed', {
            error: balanceError.message,
            code: balanceError.code,
            timestamp: new Date().toISOString()
          });
        } else {
          displayError('Failed to get balance', caughtError);
          logger.error('Balance retrieval failed', {
            error: caughtError.message,
            code: (caughtError as BalanceError).code,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Handle unknown error type
        const balanceError = new Error('Unknown error occurred') as BalanceError;
        balanceError.code = 'BAL_001';
        displayError('Failed to get balance', balanceError);
        logger.error('Balance retrieval failed', {
          error: 'Unknown error',
          code: balanceError.code,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
}; 