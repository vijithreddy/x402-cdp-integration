/**
 * Info Command Module
 * 
 * Displays comprehensive wallet information including balance and session status.
 * Shows current state of the wallet and session for debugging.
 */

import type { CLICommand, CommandContext } from '../types/commands';
import { displayWalletInfo, displayError } from '../utils/display';

/**
 * Info command implementation
 */
export const infoCommand: CLICommand = {
  name: 'info',
  aliases: ['status'],
  description: 'Show wallet information and session status',
  usage: 'info',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    const { walletManager, isSessionActive } = context;

    try {
      const walletInfo = await walletManager.getWalletInfo();
      const balance = await walletManager.getUSDCBalance();
      
      if (walletInfo) {
        displayWalletInfo(walletInfo, balance, isSessionActive);
      } else {
        console.log('❌ No wallet information available.');
      }
    } catch (error) {
      displayError('Failed to get wallet info', error);
    }
  }
}; 