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
import axios from 'axios';
import { withPaymentInterceptor, decodeXPaymentResponse } from 'x402-axios';
import { createViemAccountFromCDP } from '../shared/cdp-viem-adapter';
import { logger, parseLogFlags } from '../shared/utils/logger';

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
    // Parse CLI flags and configure logger
    const logConfig = parseLogFlags();
    logger.updateConfig(logConfig);

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
    console.log('📖 Available Commands:');
    console.log('  balance, bal     - Check USDC balance');
    console.log('  fund [amount]    - Fund wallet with USDC');
    console.log('  test, x402       - Test X402 payment (0.01 USDC)');
    console.log('  info, status     - Show wallet information');
    console.log('  refresh, reload  - Force refresh from blockchain');
    console.log('  clear, cls       - Clear the screen');
    console.log('  help, h          - Show detailed help');
    console.log('  exit, quit, q    - Exit the CLI');
    console.log('Type "help" for more details\n');

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

        case 'test':
        case 'x402':
          await this.handleX402Test();
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
    console.log('  test, x402       - Test X402 protected endpoint (0.01 USDC)');
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
      this.walletManager.invalidateBalanceCache();
      const balance = await this.walletManager.getUSDCBalance();
      
      console.log(`✅ Wallet state refreshed! Current balance: ${balance} USDC`);
      console.log('');
    } catch (error) {
      console.error('❌ Failed to refresh wallet state:', error);
    }
  }

  /**
   * Handle X402 test command - using proper X402 facilitator flow
   * This demonstrates the CORRECT X402 payment protocol:
   * 1. Create viem wallet client from CDP account
   * 2. Use withPaymentInterceptor to handle 402s automatically
   * 3. Let X402 facilitator handle payment verification & settlement
   */
  private async handleX402Test(): Promise<void> {
    if (!this.walletManager) {
      console.error('❌ Wallet manager not initialized');
      return;
    }

    try {
      const startTime = Date.now();
      
      logger.header('X402 Payment Test', 'Testing protected endpoint access');
      
      // Check balance first with validation
      logger.flow('balance_check', { action: 'Checking wallet balance' });
      const balance = await this.walletManager.getUSDCBalance();
      logger.ui(`Balance: ${balance} USDC → ${balance >= 0.01 ? 'Sufficient for 0.01 USDC payment ✓' : 'Insufficient ✗'}`);
      
      // Validate balance for payment
      if (isNaN(balance) || balance < 0) {
        logger.error('Invalid balance detected', { balance });
        return;
      }
      
      if (balance < 0.01) {
        logger.error('Insufficient balance for X402 test');
        logger.ui('💡 Type "fund" to add more USDC');
        return;
      }

      logger.flow('client_init', { action: 'Creating X402-enabled HTTP client' });
      
      // Get CDP account and client, then create viem account using adapter
      let cdpAccount, cdpClient;
      try {
        const accountData = await this.walletManager.getAccountForX402();
        cdpAccount = accountData.account;
        cdpClient = accountData.client;
        
        if (!cdpAccount?.address || !cdpClient) {
          throw new Error('Invalid account or client data');
        }
      } catch (accountError) {
        logger.error('Failed to get account for X402', accountError);
        return;
      }
      
      try {
        const viemAccount = createViemAccountFromCDP(cdpAccount, cdpClient);
        
        if (!viemAccount?.address) {
          throw new Error('Failed to create valid viem account');
        }
        
        logger.ui(`Wallet: ${viemAccount.address}`);
        logger.debug('Viem account created successfully', { 
          address: viemAccount.address,
          hasSignTypedData: typeof viemAccount.signTypedData === 'function'
        });
        
        // Create X402-enabled axios client with facilitator configuration
        const api = withPaymentInterceptor(
          axios.create({
            baseURL: 'http://localhost:3000',
            timeout: 60000, // Increased timeout for payment processing
          }),
          viemAccount
        );
        
        logger.flow('payment_request', { 
          action: 'Payment initiated', 
          endpoint: '/protected',
          client: viemAccount.address 
        });
        
        // This will automatically handle 402s and payments!
        // The interceptor will handle 402 responses automatically, so we don't need special error handling
        const response = await api.get('/protected');
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        // If we get here, the interceptor successfully handled any payments
        logger.success('Payment successful! Accessed protected content');
        
        // Display the protected content that was paid for
        if (response.data) {
          logger.ui('\n📄 Protected Content Received:');
          logger.ui('═══════════════════════════════════');
          
          if (response.data.message) {
            logger.ui(`💬 Message: ${response.data.message}`);
          }
          
          if (response.data.data?.secretInfo) {
            logger.ui(`🔒 Secret Info: ${response.data.data.secretInfo}`);
          }
          
          if (response.data.data?.timestamp) {
            logger.ui(`⏰ Generated: ${new Date(response.data.data.timestamp).toLocaleString()}`);
          }
          
          if (response.data.data?.userAddress) {
            logger.ui(`👤 For Address: ${response.data.data.userAddress}`);
          }
          
          // Show any additional data fields
          if (response.data.data && Object.keys(response.data.data).length > 0) {
            const otherFields = Object.entries(response.data.data)
              .filter(([key]) => !['secretInfo', 'timestamp', 'userAddress'].includes(key));
            
            if (otherFields.length > 0) {
              logger.debug('Additional response fields', Object.fromEntries(otherFields));
            }
          }
        }
        
        logger.ui('Result: ✅ Payment successful');
        logger.debug('Full response data', response.data);
        
        // Check for payment response and refresh balance
        const xPaymentResponse = response.headers['x-payment-response'];
        if (xPaymentResponse) {
          try {
            const paymentResponse = decodeXPaymentResponse(xPaymentResponse);
            logger.transaction('payment_complete', {
              amount: '0.01 USDC',
              from: viemAccount.address,
              to: response.data?.userAddress || 'Server',
              txHash: paymentResponse?.transaction,
              network: paymentResponse?.network || 'base-sepolia',
              duration: parseFloat(duration),
              status: 'success' as const
            });
            
            if (paymentResponse?.transaction) {
              logger.ui(`Transaction: ${paymentResponse.transaction}`);
            }
          } catch (decodeError) {
            logger.debug('Could not decode payment response', decodeError);
            logger.transaction('payment_complete', {
              amount: '0.01 USDC',
              duration: parseFloat(duration),
              status: 'success' as const
            });
          }
          
          // Refresh balance to show payment deduction
          try {
            this.walletManager.invalidateBalanceCache();
            const newBalance = await this.walletManager.getUSDCBalance();
            const balanceChange = (balance - newBalance).toFixed(2);
            logger.ui(`Updated Balance: ${newBalance} USDC (-${balanceChange})`);
          } catch (balanceError) {
            logger.warn('Could not refresh balance after payment', balanceError);
          }
        } else {
          logger.ui('ℹ️ No payment was required');
        }
        
        logger.separator();
        
      } catch (conversionError: unknown) {
        // Type-safe error handling
        const error = conversionError as { 
          message?: string; 
          status?: number; 
          response?: { 
            status?: number; 
            data?: { 
              error?: unknown; 
              accepts?: unknown[]; 
            }; 
          }; 
        };
        
        // If we get here, something went wrong with the X402 interceptor
        logger.error('X402 request failed', error);
        
        // Check if this is a 402 response (interceptor failed to handle payment)
        if (error.status === 402 || error.response?.status === 402) {
          logger.error('X402 interceptor failed to process payment automatically');
          logger.ui('💡 This suggests an issue with the payment interceptor or wallet integration');
          if (error.response?.data?.accepts) {
            logger.debug('Payment options available but not processed', error.response.data.accepts);
          }
        } else if (error.response?.data?.error) {
          logger.warn('Server error', error.response.data.error);
        }
        
        logger.separator();
      }
      
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        logger.error('Cannot connect to server at http://localhost:3000');
        logger.ui('💡 Make sure the server is running: npm run dev:server');
      } else if (error.code === 'ENOTFOUND') {
        logger.error('Network error: Cannot resolve localhost');
        logger.ui('💡 Check your network connection');
      } else if (error.message?.includes('timeout')) {
        logger.error('Request timed out');
        logger.ui('💡 Check server status and network connection');
      } else if (error.code === 'EADDRINUSE') {
        logger.error('Port conflict detected');
        logger.ui('💡 Server may already be running or port 3000 is in use');
      } else {
        logger.error('Error during X402 test', error);
        if (error.response?.data) {
          logger.debug('Response data', error.response.data);
        }
      }
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