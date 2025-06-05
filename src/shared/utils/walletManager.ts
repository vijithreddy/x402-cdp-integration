/**
 * CDP Wallet Manager with Smart Caching
 * 
 * This class implements a stateful wallet management system with intelligent caching
 * for optimal performance in X402 payment flows and interactive CLI sessions.
 * 
 * Key Features:
 * - Lazy loading: Wallet data loaded only when needed
 * - Smart caching: Read operations use cache, write operations refresh cache
 * - Persistent storage: Wallet data saved locally for session recovery
 * - CDP Integration: Full integration with Coinbase Developer Platform SDK
 * 
 * Caching Strategy:
 * - Read operations (getUSDCBalance, getWalletInfo) use cached data when available
 * - Write operations (fundWallet, future payment methods) invalidate and refresh cache
 * - Cache automatically invalidated on errors to ensure data consistency
 */

import { CdpClient } from '@coinbase/cdp-sdk';
import { formatUnits } from 'viem';
import * as fs from 'fs';
import * as path from 'path';
import { WalletData, WalletConfig } from '../types/wallet';

/**
 * Stateful Wallet Manager with intelligent caching for CDP integration
 */
export class WalletManager {
  // Singleton pattern for session management
  private static instance: WalletManager;
  
  // Core wallet state
  private account: any | null = null;
  private cdp: CdpClient;
  private config: WalletConfig;
  private walletDataPath: string;
  
  // Smart caching system for performance optimization
  private cachedBalance: number | null = null;          // Cached USDC balance
  private cachedWalletData: WalletData | null = null;   // Cached wallet metadata
  private lastBalanceUpdate: Date | null = null;        // Timestamp of last balance fetch
  private isCacheValid: boolean = false;                // Cache validity flag

  private constructor(config: WalletConfig) {
    this.config = config;
    this.walletDataPath = path.join(process.cwd(), 'wallet-data.json');
    
    // Initialize CDP client
    this.cdp = new CdpClient({
      apiKeyId: config.apiKeyId,
      apiKeySecret: config.apiKeySecret,
      walletSecret: config.walletSecret,
    });
  }

  public static getInstance(config: WalletConfig): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager(config);
    }
    return WalletManager.instance;
  }

  /**
   * Save wallet data to local file for persistence
   */
  private saveWalletData(walletData: WalletData): void {
    try {
      fs.writeFileSync(this.walletDataPath, JSON.stringify(walletData, null, 2));
      console.log(`✅ Wallet data saved to ${this.walletDataPath}`);
    } catch (error) {
      console.error('❌ Failed to save wallet data:', error);
    }
  }

  /**
   * Load wallet data from local file
   */
  private loadWalletData(): WalletData | null {
    try {
      if (fs.existsSync(this.walletDataPath)) {
        const data = fs.readFileSync(this.walletDataPath, 'utf8');
        return JSON.parse(data) as WalletData;
      }
    } catch (error) {
      console.error('❌ Failed to load wallet data:', error);
    }
    return null;
  }



  /**
   * Ensure wallet is loaded using lazy loading pattern
   * Returns cached account if valid, otherwise loads fresh from storage/blockchain
   */
  private async ensureWalletLoaded(): Promise<any> {
    if (this.account && this.isCacheValid) {
      return this.account;
    }

    return await this.loadWalletFresh();
  }

  /**
   * Invalidate cache before write operations
   * Called before any operation that modifies blockchain state (payments, funding)
   * Ensures next read operation fetches fresh data
   */
  private invalidateCache(): void {
    this.isCacheValid = false;
    this.cachedBalance = null;
    this.lastBalanceUpdate = null;
    console.log('🔄 Cache invalidated');
  }

  /**
   * Refresh cache after successful write operations
   * Fetches fresh balance from blockchain and updates cache
   * Called after funding, payments, or other state-changing operations
   */
  private async refreshCache(): Promise<void> {
    console.log('🔄 Refreshing cache from blockchain...');
    this.cachedBalance = await this.fetchBalanceFromBlockchain();
    this.lastBalanceUpdate = new Date();
    this.isCacheValid = true;
    console.log(`✅ Cache refreshed: ${this.cachedBalance} USDC`);
  }

  /**
   * Get or create EVM account (main public interface)
   * Handles wallet initialization with lazy loading and caching
   * 
   * @returns Promise<any> The wallet account object
   */
  public async getOrCreateWallet(): Promise<any> {
    return await this.ensureWalletLoaded();
  }

  /**
   * Load wallet fresh from persistent storage or create new one
   * Handles the complete wallet lifecycle: load existing → create new → save state
   */
  private async loadWalletFresh(): Promise<any> {
    if (this.account && this.isCacheValid) {
      return this.account;
    }

    // First, check if we have a saved account locally
    const existingWalletData = this.loadWalletData();
    
    if (existingWalletData && existingWalletData.id) {
      console.log('🔄 Found existing wallet data, reusing account...');
      console.log(`✅ Using existing EVM account: ${existingWalletData.id}`);
      
      // Create account object for consistency
      this.account = {
        address: existingWalletData.defaultAddress,
        name: 'CDP-CLI-Account-Existing'
      };
      
      this.isCacheValid = true;
      return this.account;
    }

    try {
      // Try to create a new account
      console.log('🔄 Creating new EVM account...');
      
      this.account = await this.cdp.evm.createAccount({
        name: 'CDP-CLI-Account',
      });

      console.log(`✅ New EVM account created: ${this.account.address}`);

    } catch (error: any) {
      // If account already exists (409 error), create with unique name
      if (error.statusCode === 409 && error.errorType === 'already_exists') {
        console.log('🔄 Account name already exists, creating with unique name...');
        
        const uniqueName = `CDP-CLI-Account-${Date.now()}`;
        this.account = await this.cdp.evm.createAccount({
          name: uniqueName,
        });
        
        console.log(`✅ Created account with unique name: ${this.account.address}`);
      } else {
        console.error('❌ Failed to create account:', error);
        throw error;
      }
    }

    // Save account data locally for future reuse
    const walletData: WalletData = {
      id: this.account.address,
      seed: '', // CDP manages keys
      addresses: [this.account.address],
      defaultAddress: this.account.address,
    };

    this.saveWalletData(walletData);
    this.isCacheValid = true;
    console.log(`✅ EVM account ready: ${this.account.address}`);

    return this.account;
  }

  /**
   * Fetch USDC balance directly from blockchain (internal method)
   * Directly queries Base Sepolia network for current token balance
   * Uses viem's formatUnits for proper decimal handling
   * 
   * @returns Promise<number> USDC balance as decimal number
   */
  private async fetchBalanceFromBlockchain(): Promise<number> {
    try {
      const account = await this.ensureWalletLoaded();

      // Use the CDP client directly with the address
      const balances = await this.cdp.evm.listTokenBalances({
        address: account.address,
        network: 'base-sepolia',
      });

      // Find USDC balance
      let usdcBalance = 0;
      
      // The response has a 'balances' property containing the array
      const balancesObj = balances as any;
      const tokenBalances = balancesObj.balances || [];

      if (Array.isArray(tokenBalances)) {
        // USDC on Base Sepolia contract address (case insensitive)
        const BASE_SEPOLIA_USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'.toLowerCase();
        
        const usdcItem = tokenBalances.find((balance: any) => {
          const contractAddress = balance.token?.contractAddress?.toLowerCase() || '';
          const network = balance.token?.network || '';
          
          return contractAddress === BASE_SEPOLIA_USDC_ADDRESS && network === 'base-sepolia';
        });
        
        if (usdcItem) {
          // Handle the amount object with BigInt and decimals using viem
          const amountBigInt = usdcItem.amount?.amount || 0n;
          const decimals = Number(usdcItem.amount?.decimals || 6n);
          
          // Use viem's formatUnits for proper token amount formatting
          usdcBalance = parseFloat(formatUnits(amountBigInt, decimals));
        }
      }

      return usdcBalance;
    } catch (error) {
      console.error('❌ Failed to fetch balance from blockchain:', error);
      return 0;
    }
  }

  /**
   * Get USDC balance with intelligent caching
   * Returns cached balance if available, otherwise fetches fresh from blockchain
   * Perfect for frequent balance checks in X402 payment flows
   * 
   * @returns Promise<number> USDC balance as decimal number
   */
  public async getUSDCBalance(): Promise<number> {
    try {
      // Use cached balance if available and valid
      if (this.isCacheValid && this.cachedBalance !== null) {
        console.log(`💰 Current USDC balance (cached): ${this.cachedBalance} USDC`);
        return this.cachedBalance;
      }

      // Load fresh if cache is invalid
      console.log('🔄 Checking USDC balance from blockchain...');
      const balance = await this.fetchBalanceFromBlockchain();
      
      // Update cache
      this.cachedBalance = balance;
      this.lastBalanceUpdate = new Date();
      this.isCacheValid = true;
      
      console.log(`💰 Current USDC balance: ${balance} USDC`);
      return balance;
    } catch (error) {
      console.error('❌ Failed to check USDC balance:', error);
      // Return cached balance if available, otherwise 0
      return this.cachedBalance || 0;
    }
  }

  /**
   * Fund wallet with USDC if balance is below threshold
   * Implements write-operation caching pattern: invalidate → execute → refresh
   * 
   * @param targetAmount Target USDC amount (default: 5)
   * @returns Promise<boolean> Success status of funding operation
   */
  public async fundWallet(targetAmount: number = 5): Promise<boolean> {
    try {
      const account = await this.ensureWalletLoaded();
      
      // Check current balance
      const currentBalance = await this.getUSDCBalance();
      
      if (currentBalance >= targetAmount) {
        console.log(`✅ Wallet already has sufficient funds (${currentBalance} USDC >= ${targetAmount} USDC)`);
        return true;
      }

      const neededAmount = targetAmount - currentBalance;
      console.log(`🔄 Need ${neededAmount} more USDC. Requesting from faucet...`);

      // Invalidate cache before write operation
      this.invalidateCache();

      // Request USDC from faucet
      const faucetResponse = await this.cdp.evm.requestFaucet({
        address: account.address,
        network: 'base-sepolia',
        token: 'usdc',
      });

      console.log(`🔄 Faucet request submitted. Transaction hash: ${faucetResponse.transactionHash}`);
      console.log('⏳ Waiting for transaction confirmation...');

      console.log(`✅ Faucet request completed! Transaction: ${faucetResponse.transactionHash}`);
      console.log('💡 Note: It may take a few minutes for the balance to update.');
      
      // Refresh cache after successful write operation
      await this.refreshCache();
      
      return true;

    } catch (error: any) {
      if (error.message?.includes('already_requested') || error.statusCode === 429) {
        console.log('⚠️ Faucet already used today. Please wait 24 hours or fund manually.');
      } else {
        console.error('❌ Failed to fund wallet:', error);
      }
      return false;
    }
  }



  /**
   * Get wallet information (uses cache when possible)
   */
  public async getWalletInfo(): Promise<WalletData | null> {
    // Use cached wallet data if available
    if (this.cachedWalletData) {
      return this.cachedWalletData;
    }

    const account = await this.ensureWalletLoaded();
    
    if (!account) return null;

    // Cache wallet data
    this.cachedWalletData = {
      id: account.address,
      seed: '', // CDP manages private keys
      addresses: [account.address],
      defaultAddress: account.address,
    };

    return this.cachedWalletData;
  }

  /**
   * Get the CDP client instance for advanced operations
   * Useful for direct CDP SDK operations not covered by this manager
   * 
   * @returns CdpClient The initialized CDP client
   */
  public getCdpClient(): CdpClient {
    return this.cdp;
  }

  /**
   * Get account for X402 viem integration
   * Returns both the CDP account and client for the adapter
   * 
   * @returns Object with CDP account and client for adapter
   */
  public async getAccountForX402(): Promise<{ account: { address: string; name: string }; client: CdpClient }> {
    const account = await this.ensureWalletLoaded();
    return {
      account,
      client: this.cdp
    };
  }

  /**
   * Public method to invalidate cache - useful after external transactions
   * like X402 payments that change balance outside our control
   */
  public invalidateBalanceCache(): void {
    this.invalidateCache();
  }
} 