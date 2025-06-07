/**
 * X402 Command Module (Backward Compatibility Alias)
 * 
 * This command is now an alias to the tier1 command for backward compatibility.
 * The original X402 functionality has been moved to the modular x402/ folder structure.
 */

import type { CLICommand, CommandContext } from '../types/commands';
import { tier1Command } from './x402/tier1';

/**
 * X402 payment test command implementation (alias to tier1)
 */
export const x402Command: CLICommand = {
  name: 'test',
  aliases: ['x402'],
  description: 'Test X402 payment flow (alias to tier1 - cost discovered dynamically)',
  usage: 'test',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    // Simply delegate to tier1 command
    await tier1Command.execute(args, context);
  }
}; 