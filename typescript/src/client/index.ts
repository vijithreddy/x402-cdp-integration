/**
 * CDP Wallet CLI Entry Point
 * 
 * Clean, minimal entry point that demonstrates the power of modular architecture.
 * The entire CLI is now just a few lines thanks to proper separation of concerns.
 */

import { CDPWalletCLI } from './core/cli';

// Start the CLI
const cli = new CDPWalletCLI();
cli.start().catch((error) => {
  console.error('❌ Failed to start CLI:', error);
  process.exit(1);
}); 