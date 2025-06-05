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
 * Usage: npm run setup
 */

import { WalletManager } from './src/shared/utils/walletManager';
import { CdpClient } from '@coinbase/cdp-sdk';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class X402Setup {
  constructor() {
    // Validate required environment variables
    const requiredEnvVars = ['CDP_API_KEY_ID', 'CDP_API_KEY_SECRET', 'CDP_WALLET_SECRET'];
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(envVar => console.error(`   - ${envVar}`));
      console.log('\n💡 Please set these in your .env file:');
      console.log('   CDP_API_KEY_ID=your_api_key_id');
      console.log('   CDP_API_KEY_SECRET=your_private_key_content');
      console.log('   CDP_WALLET_SECRET=your_wallet_secret');
      process.exit(1);
    }

    console.log('✅ Environment variables validated');
  }

  /**
   * Create and setup a wallet using our existing WalletManager
   */
  private async createWallet(name: string, filename: string): Promise<{ address: string; balance: number }> {
    console.log(`🔄 Creating ${name} wallet...`);
    
    try {
      const config = {
        apiKeyId: process.env.CDP_API_KEY_ID!,
        apiKeySecret: process.env.CDP_API_KEY_SECRET!,
        walletSecret: process.env.CDP_WALLET_SECRET!,
      };
      
      const walletManager = WalletManager.getInstance(config);
      
      // Get or create wallet (this handles initialization internally)
      const account = await walletManager.getOrCreateWallet();
      console.log(`   ✅ ${name} wallet created/loaded: ${account.address}`);

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
        console.log(`   ✅ ${name} wallet data saved to ${filename}`);
      }

      // Get balance
      const balance = await walletManager.getUSDCBalance();
      console.log(`   💰 ${name} balance: ${balance} USDC`);

      return { address: account.address, balance };
    } catch (error) {
      console.error(`❌ Failed to create ${name} wallet:`, error);
      throw error;
    }
  }

    /**
   * Create server wallet directly using CDP client (bypasses singleton)
   */
  private async createServerWallet(): Promise<{ address: string; balance: number }> {
    console.log(`🔄 Creating Server wallet...`);
    
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

      console.log(`   ✅ Server account created: ${account.address}`);

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
      console.log(`   ✅ Server wallet data saved to server-wallet-data.json`);

      // For server wallet, balance will be 0 initially (server receives payments)
      console.log(`   💰 Server balance: 0 USDC (payment receiver)`);

      return { address: account.address, balance: 0 };
    } catch (error) {
      console.error(`❌ Failed to create Server wallet:`, error);
      throw error;
    }
  }

  /**
   * Fund the client wallet
   */
  private async fundClientWallet(): Promise<boolean> {
     console.log('🔄 Funding client wallet...');
     
     try {
       const config = {
         apiKeyId: process.env.CDP_API_KEY_ID!,
         apiKeySecret: process.env.CDP_API_KEY_SECRET!,
         walletSecret: process.env.CDP_WALLET_SECRET!,
       };
       
       const walletManager = WalletManager.getInstance(config);
      
      const success = await walletManager.fundWallet(5);
      if (success) {
        console.log('   ✅ Client wallet funding successful!');
        
        // Check new balance
        const balance = await walletManager.getUSDCBalance();
        console.log(`   💰 Client balance after funding: ${balance} USDC`);
        return true;
      } else {
        console.log('   ❌ Client wallet funding failed');
        return false;
      }
    } catch (error) {
      console.error('   ❌ Funding error:', error);
      return false;
    }
  }

  /**
   * Update server configuration to use the new server wallet
   */
  private updateServerConfig(serverAddress: string): void {
    console.log('🔄 Updating server configuration...');
    
    try {
      const serverPath = join(process.cwd(), 'src/server/index.ts');
      
      if (existsSync(serverPath)) {
        let serverContent = readFileSync(serverPath, 'utf-8');
        
                // Check if server uses dynamic wallet loading (preferred)
        if (serverContent.includes('serverWallet.address')) {
          console.log(`   ✅ Server uses dynamic wallet loading - no update needed`);
        } else {
          // Legacy: Update the payTo address in the server configuration
          // Look for the paymentMiddleware configuration
          const payToRegex = /payTo:\s*['"`]0x[a-fA-F0-9]{40}['"`]/;
          const newPayTo = `payTo: '${serverAddress}'`;
          
          if (payToRegex.test(serverContent)) {
            serverContent = serverContent.replace(payToRegex, newPayTo);
            writeFileSync(serverPath, serverContent);
            console.log(`   ✅ Server configured to receive payments at: ${serverAddress}`);
          } else {
            console.log(`   ⚠️ Could not auto-update server config. Manually set payTo: '${serverAddress}'`);
          }
        }
      } else {
        console.log(`   ⚠️ Server file not found. Make sure to configure payTo: '${serverAddress}'`);
      }
    } catch (error) {
      console.log(`   ⚠️ Could not update server config:`, error);
      console.log(`   💡 Manually configure server to use: ${serverAddress}`);
    }
  }

  /**
   * Main setup process
   */
  public async run(): Promise<void> {
    console.log('🚀 X402 Wallet Setup Starting...');
    console.log('====================================\n');

    try {
      // Step 1: Create client wallet
      console.log('📱 Step 1: Creating Client Wallet');
      const clientWallet = await this.createWallet('Client', 'wallet-data.json');

      // Step 2: Create server wallet (force creation of a new account)
      console.log('\n🖥️  Step 2: Creating Server Wallet');
      const serverWallet = await this.createServerWallet();

      // Step 3: Fund client wallet
      console.log('\n💰 Step 3: Funding Client Wallet');
      await this.fundClientWallet();

      // Step 4: Update server configuration
      console.log('\n⚙️  Step 4: Updating Server Configuration');
      this.updateServerConfig(serverWallet.address);

      // Step 5: Setup summary
      console.log('\n🎉 Setup Complete!');
      console.log('==================');
      console.log(`📱 Client Wallet: ${clientWallet.address}`);
      console.log(`🖥️  Server Wallet: ${serverWallet.address}`);
      console.log(`💰 Client Balance: Check with 'npm run dev:client' → 'balance'`);
      console.log('');
      console.log('🚀 Ready to test X402 payments!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Start the server: npm run dev:server');
      console.log('2. Start the client: npm run dev:client');
      console.log('3. Test balance: type "balance"');
      console.log('4. Test X402 payment: type "test"');
      console.log('');
      console.log('📋 Available commands in client CLI:');
      console.log('   • balance  - Check USDC balance');
      console.log('   • fund     - Add more USDC to wallet');
      console.log('   • test     - Test X402 payment flow');
      console.log('   • info     - Show wallet information');
      console.log('   • refresh  - Force refresh balance from blockchain');
      console.log('   • help     - Show all commands');
      console.log('   • exit/q   - Quit the CLI');

    } catch (error) {
      console.error('\n❌ Setup failed:', error);
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check your .env file has correct CDP credentials');
      console.log('2. Ensure you have internet connectivity');
      console.log('3. Verify your CDP account has API access enabled');
      console.log('4. Try running individual steps manually if needed');
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