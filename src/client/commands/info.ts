/**
 * Info Command Module
 * 
 * Displays comprehensive wallet information including balance and session status.
 * Shows current state of the wallet and session for debugging.
 * 
 * Error Codes:
 * - INFO_001: Failed to get wallet information
 * - INFO_002: Failed to get wallet balance
 * - INFO_003: No wallet information available
 */

import type { CLICommand, CommandContext } from '../types/commands';
import { displayWalletInfo, displayError } from '../utils/display';
import { logger } from '../../shared/utils/logger';

// Custom error type for info operations
interface InfoError extends Error {
  code: string;
}

/**
 * Info command implementation
 * 
 * @param args - Command arguments (unused)
 * @param context - Command context with wallet manager and session status
 * @throws {InfoError} INFO_001: Failed to get wallet information
 * @throws {InfoError} INFO_002: Failed to get wallet balance
 * @throws {InfoError} INFO_003: No wallet information available
 */
export const infoCommand: CLICommand = {
  name: 'info',
  aliases: ['status'],
  description: 'Show wallet information and session status',
  usage: 'info',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    const { walletManager, isSessionActive } = context;

    try {
      // Log info request
      logger.flow('info_request', {
        action: 'Getting wallet information',
        sessionActive: isSessionActive
      });

      // Get wallet information
      const walletInfo = await walletManager.getWalletInfo();
      
      if (!walletInfo) {
        const error = new Error('No wallet information available.') as InfoError;
        error.code = 'INFO_003';
        throw error;
      }

      // Get wallet balance
      try {
        const balance = await walletManager.getUSDCBalance();
        displayWalletInfo(walletInfo, balance, isSessionActive);
        
        // Log successful info retrieval
        logger.flow('info_success', {
          action: 'Retrieved wallet information',
          addresses: walletInfo.addresses,
          balance: balance,
          sessionActive: isSessionActive
        });
      } catch (balanceError) {
        const error = new Error('Failed to get wallet balance') as InfoError;
        error.code = 'INFO_002';
        throw error;
      }
    } catch (caughtError: unknown) {
      if (caughtError instanceof Error) {
        // If it's not already an InfoError, wrap it
        if (!('code' in caughtError)) {
          const infoError = new Error('Failed to get wallet info') as InfoError;
          infoError.code = 'INFO_001';
          displayError('Failed to get wallet info', infoError);
          logger.error('Wallet info retrieval failed', {
            error: infoError.message,
            code: infoError.code,
            sessionActive: isSessionActive
          });
        } else {
          displayError('Failed to get wallet info', caughtError);
          logger.error('Wallet info retrieval failed', {
            error: caughtError.message,
            code: (caughtError as InfoError).code,
            sessionActive: isSessionActive
          });
        }
      } else {
        // Handle unknown error type
        const infoError = new Error('Unknown error occurred') as InfoError;
        infoError.code = 'INFO_001';
        displayError('Failed to get wallet info', infoError);
        logger.error('Wallet info retrieval failed', {
          error: 'Unknown error',
          code: infoError.code,
          sessionActive: isSessionActive
        });
      }
    }
  }
}; 