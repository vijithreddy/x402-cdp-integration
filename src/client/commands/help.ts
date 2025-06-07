/**
 * Help Command Module
 * 
 * Provides comprehensive help and documentation for CLI users.
 * Shows available commands and usage examples.
 */

import type { CLICommand, CommandContext } from '../types/commands';
import { showDetailedHelp } from '../utils/display';

/**
 * Help command implementation
 */
export const helpCommand: CLICommand = {
  name: 'help',
  aliases: ['h'],
  description: 'Show detailed help information',
  usage: 'help',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    showDetailedHelp();
  }
}; 