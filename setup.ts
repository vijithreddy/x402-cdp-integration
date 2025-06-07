#!/usr/bin/env ts-node

/**
 * X402 Wallet Setup Script
 * 
 * This script automatically sets up everything needed for X402 testing:
 * 1. Creates a client wallet (for making payments)
 * 2. Creates a server wallet (for receiving payments)
 * 3. Funds the client wallet with USDC
 * 4. Configures both wallets for testing
 * 
 * Usage: npm run setup [--verbose] [--quiet] [--json]
 */

import { WalletManager } from './src/shared/utils/walletManager';
import { CdpClient } from '@coinbase/cdp-sdk';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { createLogger, parseLogFlags } from './src/shared/utils/logger';

// Load environment variables
dotenv.config();

class X402Setup {
  private logger = createLogger(parseLogFlags());

  constructor() {
    // Validate required environment variables
    const requiredEnvVars = ['CDP_API_KEY_ID', 'CDP_API_KEY_SECRET', 'CDP_WALLET_SECRET'];
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      this.logger.error('Missing required environment variables', { 
        missing: missing.map(key => key.replace(/_SECRET$/, '_SECRET (hidden)'))
      });
      this.logger.ui('\n💡 Please set these in your .env file:');
      this.logger.ui('   CDP_API_KEY_ID=your_api_key_id');
      this.logger.ui('   CDP_API_KEY_SECRET=your_private_key_content');
      this.logger.ui('   CDP_WALLET_SECRET=your_wallet_secret');
      process.exit(1);
    }

    this.logger.success('Environment variables validated');
    this.logger.debug('Configuration loaded', { 
      hasApiKeyId: !!process.env.CDP_API_KEY_ID,
      hasApiKeySecret: !!process.env.CDP_API_KEY_SECRET,
      hasWalletSecret: !!process.env.CDP_WALLET_SECRET,
      // Never log actual key values
    });
  }

  /**
   * Create and setup a wallet using our existing WalletManager
   * 
   * @param name - Human readable name for the wallet
   * @param filename - File path to save wallet data
   * @returns Promise resolving to wallet address and balance information
   */
  private async createWallet(name: string, filename: string): Promise<{ address: string; balance: number }> {
    this.logger.flow('wallet_create_start', { wallet: name });
    
    try {
      const config = {
        apiKeyId: process.env.CDP_API_KEY_ID!,
        apiKeySecret: process.env.CDP_API_KEY_SECRET!,
        walletSecret: process.env.CDP_WALLET_SECRET!,
      };
      
      const walletManager = WalletManager.getInstance(config);
      
      // Get or create wallet (this handles initialization internally)
      const account = await walletManager.getOrCreateWallet();
      this.logger.success(`${name} wallet created/loaded`, { address: account.address });

      // Get wallet info for saving
      const walletInfo = await walletManager.getWalletInfo();
      if (walletInfo) {
        // Save wallet data to specified file
        const walletData = {
          id: walletInfo.id,
          defaultAddress: walletInfo.defaultAddress,
          addresses: walletInfo.addresses,
          accounts: [{
            address: account.address,
            name: account.name
          }]
        };

        const filepath = join(process.cwd(), filename);
        writeFileSync(filepath, JSON.stringify(walletData, null, 2));
        this.logger.debug('Wallet data saved', { filename, addressCount: walletInfo.addresses.length });
      }

      // Get balance
      const balance = await walletManager.getUSDCBalance();
      this.logger.flow('wallet_balance_check', { wallet: name, balance: `${balance} USDC` });

      return { address: account.address, balance };
    } catch (error: any) {
      this.logger.error(`Failed to create ${name} wallet`, error);
      throw error;
    }
  }

  /**
   * Create server wallet directly using CDP client (bypasses singleton)
   * 
   * @returns Promise resolving to server wallet address and balance information
   */
  private async createServerWallet(): Promise<{ address: string; balance: number }> {
    this.logger.flow('server_wallet_create_start', {});
    
    try {
      const config = {
        apiKeyId: process.env.CDP_API_KEY_ID!,
        apiKeySecret: process.env.CDP_API_KEY_SECRET!,
        walletSecret: process.env.CDP_WALLET_SECRET!,
      };

      // Create a direct CDP client (not using WalletManager singleton)
      const cdp = new CdpClient({
        apiKeyId: config.apiKeyId,
        apiKeySecret: config.apiKeySecret,
        walletSecret: config.walletSecret,
      });

      // Create a new account with unique name
      const uniqueName = `CDP-Server-Account-${Date.now()}`;
      const account = await cdp.evm.createAccount({
        name: uniqueName,
      });

      this.logger.success('Server account created', { address: account.address });

      // Save server wallet data
      const walletData = {
        id: account.address,
        defaultAddress: account.address,
        addresses: [account.address],
        accounts: [{
          address: account.address,
          name: uniqueName
        }]
      };

      const filepath = join(process.cwd(), 'server-wallet-data.json');
      writeFileSync(filepath, JSON.stringify(walletData, null, 2));
      this.logger.debug('Server wallet data saved', { filename: 'server-wallet-data.json' });

      // For server wallet, balance will be 0 initially (server receives payments)
      this.logger.flow('server_wallet_ready', { balance: '0 USDC', role: 'payment receiver' });

      return { address: account.address, balance: 0 };
    } catch (error: any) {
      this.logger.error('Failed to create Server wallet', error);
      throw error;
    }
  }

  /**
   * Fund the client wallet
   * 
   * @returns Promise resolving to true if funding succeeded, false otherwise
   */
  private async fundClientWallet(): Promise<boolean> {
     this.logger.flow('wallet_funding_start', { target: '5 USDC' });
     
     try {
       const config = {
         apiKeyId: process.env.CDP_API_KEY_ID!,
         apiKeySecret: process.env.CDP_API_KEY_SECRET!,
         walletSecret: process.env.CDP_WALLET_SECRET!,
       };
       
       const walletManager = WalletManager.getInstance(config);
      
      const success = await walletManager.fundWallet(5);
      if (success) {
        this.logger.success('Client wallet funding successful');
        
        // Check new balance
        const balance = await walletManager.getUSDCBalance();
        this.logger.flow('wallet_funding_complete', { balance: `${balance} USDC` });
        return true;
      } else {
        this.logger.error('Client wallet funding failed');
        return false;
      }
    } catch (error: any) {
      this.logger.error('Funding error', error);
      return false;
    }
  }

  /**
   * Update server configuration to use the new server wallet
   * 
   * @param serverAddress - The server wallet address to configure
   */
  private updateServerConfig(serverAddress: string): void {
    this.logger.flow('server_config_update', { address: serverAddress });
    
    try {
      const serverPath = join(process.cwd(), 'src/server/index.ts');
      
      if (existsSync(serverPath)) {
        let serverContent = readFileSync(serverPath, 'utf-8');
        
        // Check if server uses dynamic wallet loading (preferred)
        if (serverContent.includes('serverWallet.address')) {
          this.logger.success('Server uses dynamic wallet loading - no update needed');
        } else {
          // Legacy: Update the payTo address in the server configuration
          // Look for the paymentMiddleware configuration
          const payToRegex = /payTo:\s*['"`]0x[a-fA-F0-9]{40}['"`]/;
          const newPayTo = `payTo: '${serverAddress}'`;
          
          if (payToRegex.test(serverContent)) {
            serverContent = serverContent.replace(payToRegex, newPayTo);
            writeFileSync(serverPath, serverContent);
            this.logger.success('Server configured to receive payments', { address: serverAddress });
          } else {
            this.logger.warn('Could not auto-update server config', { 
              manual: `Set payTo: '${serverAddress}'` 
            });
          }
        }
      } else {
        this.logger.warn('Server file not found', { 
          path: serverPath,
          manual: `Configure payTo: '${serverAddress}'`
        });
      }
    } catch (error: any) {
      this.logger.warn('Could not update server config', { 
        error: error.message,
        manual: `Manually configure server to use: ${serverAddress}`
      });
    }
  }

  /**
   * Main setup process
   */
  public async run(): Promise<void> {
    this.logger.header('X402 Wallet Setup', 'Initializing wallets and configuration');

    try {
      // Step 1: Create client wallet
      this.logger.ui('📱 Step 1: Creating Client Wallet');
      const clientWallet = await this.createWallet('Client', 'wallet-data.json');

      // Step 2: Create server wallet (force creation of a new account)
      this.logger.ui('\n🖥️  Step 2: Creating Server Wallet');
      const serverWallet = await this.createServerWallet();

      // Step 3: Fund client wallet
      this.logger.ui('\n💰 Step 3: Funding Client Wallet');
      await this.fundClientWallet();

      // Step 4: Update server configuration
      this.logger.ui('\n⚙️  Step 4: Updating Server Configuration');
      this.updateServerConfig(serverWallet.address);

      // Step 5: Setup summary
      this.logger.ui('\n🎉 Setup Complete!');
      this.logger.separator();
      this.logger.ui(`📱 Client Wallet: ${clientWallet.address}`);
      this.logger.ui(`🖥️  Server Wallet: ${serverWallet.address}`);
      this.logger.ui(`💰 Client Balance: Check with 'npm run dev:client' → 'balance'`);
      this.logger.ui('');
      this.logger.success('Ready to test X402 payments!');
      this.logger.ui('');
      this.logger.ui('Next steps:');
      this.logger.ui('1. Start the server: npm run dev:server');
      this.logger.ui('2. Start the client: npm run dev:client');
      this.logger.ui('3. Test balance: type "balance"');
      this.logger.ui('4. Test X402 payment: type "test"');
      this.logger.ui('');
      this.logger.ui('📋 Available commands in client CLI:');
      this.logger.ui('   • balance  - Check USDC balance');
      this.logger.ui('   • fund     - Add more USDC to wallet');
      this.logger.ui('   • test     - Test X402 payment flow');
      this.logger.ui('   • info     - Show wallet information');
      this.logger.ui('   • refresh  - Force refresh balance from blockchain');
      this.logger.ui('   • help     - Show all commands');
      this.logger.ui('   • exit/q   - Quit the CLI');

    } catch (error: any) {
      this.logger.error('Setup failed', error);
      this.logger.ui('\n💡 Troubleshooting:');
      this.logger.ui('1. Check your .env file has correct CDP credentials');
      this.logger.ui('2. Ensure you have internet connectivity');
      this.logger.ui('3. Verify your CDP account has API access enabled');
      this.logger.ui('4. Try running individual steps manually if needed');
      process.exit(1);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new X402Setup();
  setup.run().catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

export default X402Setup; 