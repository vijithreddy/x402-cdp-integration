/**
 * X402 Command Module (Backward Compatibility Alias)
 * 
 * This command is now an alias to the tier1 command for backward compatibility.
 * The original X402 functionality has been moved to the modular x402/ folder structure.
 * 
 * Error Codes:
 * - X402_001: Failed to execute X402 payment command
 */

import type { CLICommand, CommandContext } from '../types/commands';
import { tier1Command } from './x402/tier1';
import { logger } from '../../shared/utils/logger';
import { displayError } from '../utils/display';

// Custom error type for X402 operations
interface X402Error extends Error {
  code: string;
}

/**
 * X402 payment test command implementation (alias to tier1)
 * 
 * @param args - Command arguments
 * @param context - Command context
 * @throws {X402Error} X402_001: Failed to execute X402 payment command
 */
export const x402Command: CLICommand = {
  name: 'test',
  aliases: ['x402'],
  description: 'Test X402 payment flow (alias to tier1 - cost discovered dynamically)',
  usage: 'test',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    try {
      logger.flow('x402_command', {
        action: 'Executing X402 payment command (alias to tier1)',
        timestamp: new Date().toISOString()
      });
      // Delegate to tier1 command
      await tier1Command.execute([], context);
      logger.flow('x402_success', {
        action: 'X402 payment command executed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (caughtError: unknown) {
      if (caughtError instanceof Error) {
        // If it's not already an X402Error, wrap it
        if (!('code' in caughtError)) {
          const x402Error = new Error('Failed to execute X402 payment command') as X402Error;
          x402Error.code = 'X402_001';
          displayError('Failed to execute X402 payment command', x402Error);
          logger.error('X402 payment command failed', {
            error: x402Error.message,
            code: x402Error.code,
            timestamp: new Date().toISOString()
          });
        } else {
          displayError('Failed to execute X402 payment command', caughtError);
          logger.error('X402 payment command failed', {
            error: caughtError.message,
            code: (caughtError as X402Error).code,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Handle unknown error type
        const x402Error = new Error('Unknown error occurred') as X402Error;
        x402Error.code = 'X402_001';
        displayError('Failed to execute X402 payment command', x402Error);
        logger.error('X402 payment command failed', {
          error: 'Unknown error',
          code: x402Error.code,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
}; 