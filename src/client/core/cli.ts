/**
 * Main CLI Class
 * 
 * Manages the interactive CLI session with wallet initialization, 
 * command routing, and graceful shutdown handling.
 */

import * as readline from 'readline';
import dotenv from 'dotenv';
import { WalletManager } from '../../shared/utils/walletManager';
import { WalletConfig } from '../../shared/types/wallet';
import { logger, parseLogFlags } from '../../shared/utils/logger';
import { showWelcomeBanner, showCommandSummary } from '../utils/display';
import { CommandRouter } from './commands';
import type { CommandContext, CLISession } from '../types/commands';

// Load environment variables
dotenv.config();

/**
 * Interactive CLI class with session management and command routing
 */
export class CDPWalletCLI {
  // Core session state
  private session: CLISession = {
    walletManager: null,
    isActive: false,
    startTime: new Date()
  };
  
  private rl: readline.Interface;
  private commandRouter: CommandRouter;

  constructor() {
    // Parse CLI flags and configure logger
    const logConfig = parseLogFlags();
    logger.updateConfig(logConfig);

    // Initialize readline interface with custom prompt
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'cdp-wallet> '
    });

    // Initialize command router
    this.commandRouter = new CommandRouter();

    // Handle CTRL+C gracefully with session cleanup
    process.on('SIGINT', () => {
      this.handleExit();
    });
  }

  /**
   * Start interactive REPL session with wallet initialization
   */
  public async start(): Promise<void> {
    showWelcomeBanner();
    showCommandSummary();

    // Initialize wallet manager
    if (!this.initializeWalletManager()) {
      process.exit(1);
    }

    // Initialize session
    try {
      console.log('🔄 Initializing wallet session...');
      await this.session.walletManager!.getOrCreateWallet();
      console.log('✅ Session initialized successfully!\n');
      this.session.isActive = true;
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
   * Validate environment and initialize wallet manager
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

      this.session.walletManager = WalletManager.getInstance(config);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize wallet manager:', error);
      return false;
    }
  }

  /**
   * Handle user commands with error isolation
   */
  private async handleCommand(input: string): Promise<void> {
    if (!this.session.walletManager || !this.session.isActive) {
      console.error('❌ Session not active. Please restart the CLI.');
      return;
    }

    // Create command execution context
    const context: CommandContext = {
      walletManager: this.session.walletManager,
      isSessionActive: this.session.isActive,
      exit: () => this.handleExit()
    };

    // Route command through command router
    await this.commandRouter.executeCommand(input, context);
  }

  /**
   * Handle graceful session termination
   */
  private handleExit(): void {
    console.log('\n👋 Saving session state and exiting...');
    
    // Graceful cleanup
    this.session.isActive = false;
    this.rl.close();
    
    console.log('✅ Session saved. Goodbye!');
    process.exit(0);
  }
} 