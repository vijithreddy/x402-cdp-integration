/**
 * Help Command Module
 * 
 * Displays available commands and usage information.
 * Provides guidance for using the CLI.
 * 
 * Error Codes:
 * - HELP_001: Failed to display help information
 */

import type { CLICommand, CommandContext } from '../types/commands';
import { logger } from '../../shared/utils/logger';
import { displayError, showDetailedHelp } from '../utils/display';

// Custom error type for help operations
interface HelpError extends Error {
  code: string;
}

/**
 * Help command implementation
 * 
 * @param args - Command arguments (unused)
 * @param context - Command context
 * @throws {HelpError} HELP_001: Failed to display help information
 */
export const helpCommand: CLICommand = {
  name: 'help',
  aliases: ['h', '--help'],
  description: 'Show help and usage information',
  usage: 'help',

  async execute(args: string[], context: CommandContext): Promise<void> {
    try {
      logger.flow('help_request', {
        action: 'Displaying help information',
        timestamp: new Date().toISOString()
      });

      showDetailedHelp();

      logger.flow('help_success', {
        action: 'Displayed help information',
        timestamp: new Date().toISOString()
      });
    } catch (caughtError: unknown) {
      if (caughtError instanceof Error) {
        // If it's not already a HelpError, wrap it
        if (!('code' in caughtError)) {
          const helpError = new Error('Failed to display help information') as HelpError;
          helpError.code = 'HELP_001';
          displayError('Failed to display help', helpError);
          logger.error('Help display failed', {
            error: helpError.message,
            code: helpError.code,
            timestamp: new Date().toISOString()
          });
        } else {
          displayError('Failed to display help', caughtError);
          logger.error('Help display failed', {
            error: caughtError.message,
            code: (caughtError as HelpError).code,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Handle unknown error type
        const helpError = new Error('Unknown error occurred') as HelpError;
        helpError.code = 'HELP_001';
        displayError('Failed to display help', helpError);
        logger.error('Help display failed', {
          error: 'Unknown error',
          code: helpError.code,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
}; 