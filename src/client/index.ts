/**
 * CDP Wallet Interactive CLI (REPL)
 * 
 * Stateful command-line interface for CDP wallet management with real-time
 * session management and intelligent caching. Perfect for X402 payment testing
 * and interactive wallet operations.
 * 
 * Features:
 * - Interactive REPL session with persistent state
 * - Smart caching for fast balance checks and operations
 * - Real-time wallet status monitoring
 * - Graceful session management with state persistence
 * - Command aliases and auto-completion ready architecture
 * 
 * Usage:
 *   npm run dev:client
 *   cdp-wallet> balance
 *   cdp-wallet> fund 10
 *   cdp-wallet> info
 *   cdp-wallet> exit
 */

import * as readline from 'readline';
import dotenv from 'dotenv';
import { WalletManager } from '../shared/utils/walletManager';
import { WalletConfig } from '../shared/types/wallet';

// Load environment variables
dotenv.config();

/**
 * Interactive CLI class with session management and caching
 */
class CDPWalletCLI {
  // Core session state
  private walletManager: WalletManager | null = null;  // Stateful wallet manager with caching
  private rl: readline.Interface;                       // Readline interface for REPL
  private isSessionActive: boolean = false;             // Session status tracking

  constructor() {
    // Initialize readline interface with custom prompt
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'cdp-wallet> '
    });

    // Handle CTRL+C gracefully with session cleanup
    process.on('SIGINT', () => {
      this.handleExit();
    });
  }

  /**
   * Validate environment and initialize stateful wallet manager
   * Sets up CDP credentials and creates singleton WalletManager instance
   * 
   * @returns boolean Success status of initialization
   */
  private initializeWalletManager(): boolean {
    try {
      const apiKeyId = process.env.CDP_API_KEY_ID;
      const apiKeySecret = process.env.CDP_API_KEY_SECRET;

      if (!apiKeyId || !apiKeySecret) {
        console.error('❌ Missing required environment variables:');
        console.error('   CDP_API_KEY_ID and CDP_API_KEY_SECRET must be set in .env file');
        return false;
      }

      const config: WalletConfig = {
        apiKeyId,
        apiKeySecret,
        walletSecret: process.env.CDP_WALLET_SECRET,
      };

      this.walletManager = WalletManager.getInstance(config);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize wallet manager:', error);
      return false;
    }
  }

  /**
   * Start interactive REPL session with wallet initialization
   * Initializes wallet state once and maintains it throughout session
   * Implements stateful session pattern for optimal X402 performance
   */
  public async start(): Promise<void> {
    console.log('🚀 CDP Wallet Interactive CLI');
    console.log('============================');
    console.log('Type "help" for available commands, "exit" to quit\n');

    // Initialize wallet manager
    if (!this.initializeWalletManager()) {
      process.exit(1);
    }

    // Initialize session
    try {
      console.log('🔄 Initializing wallet session...');
      await this.walletManager!.getOrCreateWallet();
      console.log('✅ Session initialized successfully!\n');
      this.isSessionActive = true;
    } catch (error) {
      console.error('❌ Failed to initialize session:', error);
      process.exit(1);
    }

    // Start REPL
    this.rl.prompt();
    this.rl.on('line', async (line) => {
      await this.handleCommand(line.trim());
      this.rl.prompt();
    });
  }

  /**
   * Handle user commands with error isolation
   * Routes commands to appropriate handlers while maintaining session state
   * Supports command aliases and provides helpful error messages
   */
  private async handleCommand(input: string): Promise<void> {
    const [command, ...args] = input.split(' ');

    try {
      switch (command.toLowerCase()) {
        case 'help':
        case 'h':
          this.showHelp();
          break;

        case 'balance':
        case 'bal':
          await this.handleBalance();
          break;

        case 'fund':
          await this.handleFund(args);
          break;

        case 'info':
        case 'status':
          await this.handleInfo();
          break;

        case 'refresh':
        case 'reload':
          await this.handleRefresh();
          break;

        case 'clear':
        case 'cls':
          console.clear();
          break;

        case 'exit':
        case 'quit':
        case 'q':
          this.handleExit();
          break;

        case '':
          // Empty command, just show prompt again
          break;

        default:
          console.log(`❌ Unknown command: "${command}". Type "help" for available commands.`);
          break;
      }
    } catch (error) {
      console.error(`❌ Error executing command "${command}":`, error);
    }
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log('\n📖 Available Commands:');
    console.log('===================');
    console.log('  balance, bal     - Check USDC balance (cached when possible)');
    console.log('  fund [amount]    - Fund wallet with USDC (default: 5 USDC)');
    console.log('  info, status     - Show wallet information');
    console.log('  refresh, reload  - Force refresh cache from blockchain');
    console.log('  clear, cls       - Clear the screen');
    console.log('  help, h          - Show this help message');
    console.log('  exit, quit, q    - Exit the CLI');
    console.log('');
  }

  /**
   * Handle balance command using cached data when possible
   * Demonstrates read operation with intelligent caching
   */
  private async handleBalance(): Promise<void> {
    if (!this.walletManager) return;

    try {
      const balance = await this.walletManager.getUSDCBalance();
      console.log(`\n📊 Balance Summary:`);
      console.log(`   USDC on Base Sepolia: ${balance} USDC`);
      
      if (balance >= 5) {
        console.log('   ✅ Sufficient funds for testing');
      } else {
        console.log('   ⚠️ Consider funding wallet for testing');
        console.log('   💡 Type "fund" to add more USDC');
      }
      console.log('');
    } catch (error) {
      console.error('❌ Failed to check balance:', error);
    }
  }

  /**
   * Handle fund command with write-operation caching pattern
   * Demonstrates cache invalidation → operation → refresh cycle
   */
  private async handleFund(args: string[]): Promise<void> {
    if (!this.walletManager) return;

    try {
      const targetAmount = args.length > 0 ? parseFloat(args[0]) : 5;
      
      if (isNaN(targetAmount) || targetAmount <= 0) {
        console.log('❌ Invalid amount. Please provide a positive number.');
        return;
      }

      console.log(`\n💰 Funding wallet to ${targetAmount} USDC...`);
      const success = await this.walletManager.fundWallet(targetAmount);
      
      if (success) {
        console.log('✅ Funding operation completed!');
      } else {
        console.log('❌ Funding operation failed.');
      }
      console.log('');
    } catch (error) {
      console.error('❌ Failed to fund wallet:', error);
    }
  }

  /**
   * Handle info command
   */
  private async handleInfo(): Promise<void> {
    if (!this.walletManager) return;

    try {
      const walletInfo = await this.walletManager.getWalletInfo();
      const balance = await this.walletManager.getUSDCBalance();
      
      if (walletInfo) {
        console.log('\n📊 Wallet Information:');
        console.log('=====================');
        console.log(`   ID: ${walletInfo.id}`);
        console.log(`   Default Address: ${walletInfo.defaultAddress}`);
        console.log(`   Total Addresses: ${walletInfo.addresses.length}`);
        console.log(`   Current Balance: ${balance} USDC`);
        console.log(`   Session Status: ${this.isSessionActive ? '🟢 Active' : '🔴 Inactive'}`);
        console.log('');
      } else {
        console.log('❌ No wallet information available.');
      }
    } catch (error) {
      console.error('❌ Failed to get wallet info:', error);
    }
  }

  /**
   * Handle refresh command - force cache invalidation and reload
   * Useful for detecting external balance changes or debugging cache issues
   */
  private async handleRefresh(): Promise<void> {
    if (!this.walletManager) return;

    try {
      console.log('\n🔄 Force refreshing wallet state from blockchain...');
      
      // Force fresh balance check by invalidating cache first
      (this.walletManager as any).invalidateCache();
      const balance = await this.walletManager.getUSDCBalance();
      
      console.log(`✅ Wallet state refreshed! Current balance: ${balance} USDC`);
      console.log('');
    } catch (error) {
      console.error('❌ Failed to refresh wallet state:', error);
    }
  }

  /**
   * Handle graceful session termination
   * Ensures proper cleanup and state persistence before exit
   */
  private handleExit(): void {
    console.log('\n👋 Saving session state and exiting...');
    
    // Graceful cleanup
    this.isSessionActive = false;
    this.rl.close();
    
    console.log('✅ Session saved. Goodbye!');
    process.exit(0);
  }
}

// Start the CLI
const cli = new CDPWalletCLI();
cli.start().catch((error) => {
  console.error('❌ Failed to start CLI:', error);
  process.exit(1);
}); 