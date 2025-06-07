/**
 * Fund Command Module
 * 
 * Handles wallet funding operations with write-operation caching patterns.
 * Demonstrates cache invalidation → operation → refresh cycle.
 */

import type { CLICommand, CommandContext } from '../types/commands';
import { displayFundingResult, displayError } from '../utils/display';

/**
 * Fund command implementation
 */
export const fundCommand: CLICommand = {
  name: 'fund',
  aliases: [],
  description: 'Fund wallet with USDC (default: 5 USDC)',
  usage: 'fund [amount]',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    const { walletManager } = context;

    try {
      const targetAmount = args.length > 0 ? parseFloat(args[0]) : 5;
      
      if (isNaN(targetAmount) || targetAmount <= 0) {
        console.log('❌ Invalid amount. Please provide a positive number.');
        return;
      }

      console.log(`\n💰 Funding wallet to ${targetAmount} USDC...`);
      const success = await walletManager.fundWallet(targetAmount);
      
      displayFundingResult(success, targetAmount);
    } catch (error) {
      displayError('Failed to fund wallet', error);
    }
  }
}; 