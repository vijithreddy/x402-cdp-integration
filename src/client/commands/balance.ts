/**
 * Balance Command Module
 * 
 * Handles wallet balance checking with intelligent caching.
 * Demonstrates read operations with caching for optimal performance.
 */

import type { CLICommand, CommandContext } from '../types/commands';
import { displayBalance, displayError } from '../utils/display';

/**
 * Balance command implementation
 */
export const balanceCommand: CLICommand = {
  name: 'balance',
  aliases: ['bal'],
  description: 'Check USDC balance (cached when possible)',
  usage: 'balance',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    const { walletManager } = context;

    try {
      const balance = await walletManager.getUSDCBalance();
      displayBalance(balance);
    } catch (error) {
      displayError('Failed to check balance', error);
    }
  }
}; 