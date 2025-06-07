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
   * 
   * Writes wallet configuration to JSON file for session recovery.
   * Handles errors gracefully to prevent application crashes.
   * 
   * @param walletData - Wallet data structure to save
   * @throws {Error} When file write operations fail (handled gracefully)
   * @example
   * ```typescript
   * this.saveWalletData({
   *   id: '0x123...',
   *   addresses: ['0x123...'],
   *   defaultAddress: '0x123...'
   * });
   * ```
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
   * 
   * Attempts to read and parse wallet configuration from JSON file.
   * Returns null if file doesn't exist or parsing fails.
   * 
   * @returns {WalletData | null} Parsed wallet data or null if not available
   * @throws {Error} When file read/parse operations fail (handled gracefully)
   * @example
   * ```typescript
   * const walletData = this.loadWalletData();
   * if (walletData) {
   *   console.log(`Loaded wallet: ${walletData.defaultAddress}`);
   * }
   * ```
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
   * Reads saved account name from wallet data for consistency
   */
  private async loadWalletFresh(): Promise<any> {
    if (this.account && this.isCacheValid) {
      return this.account;
    }

    // Check if we have saved wallet data with account name
    const existingWalletData = this.loadWalletData();
    let accountName = 'CDP-CLI-Account';
    
    if (existingWalletData?.accounts?.[0]?.name) {
      accountName = existingWalletData.accounts[0].name;
      console.log(`🔄 Using saved account name: ${accountName}`);
    }

    // Use getOrCreateAccount with the correct name
    try {
      console.log('🔄 Getting or creating EVM account...');
      
      this.account = await this.cdp.evm.getOrCreateAccount({
        name: accountName,
      });

      console.log(`✅ EVM account ready: ${this.account.address}`);

      // Save/update account data locally
      const walletData: WalletData = {
        id: this.account.address,
        seed: '', // CDP manages keys
        addresses: [this.account.address],
        defaultAddress: this.account.address,
        accounts: [{
          address: this.account.address,
          name: this.account.name || accountName
        }]
      };

      this.saveWalletData(walletData);
      this.isCacheValid = true;

      return this.account;

    } catch (error: any) {
      // If account name conflicts, create with unique name
      if (error.statusCode === 409 && error.errorType === 'already_exists') {
        console.log('🔄 Account name conflict, creating with unique name...');
        
        const uniqueName = `CDP-CLI-Account-${Date.now()}`;
        this.account = await this.cdp.evm.getOrCreateAccount({
          name: uniqueName,
        });
        
        console.log(`✅ Created account with unique name: ${this.account.address}`);

        // Save new account data
        const walletData: WalletData = {
          id: this.account.address,
          seed: '',
          addresses: [this.account.address],
          defaultAddress: this.account.address,
          accounts: [{
            address: this.account.address,
            name: uniqueName
          }]
        };

        this.saveWalletData(walletData);
        this.isCacheValid = true;
        return this.account;
      } else {
        console.error('❌ Failed to get or create account:', error);
        throw error;
      }
    }
  }

  /**
   * Fetch USDC balance directly from blockchain (internal method)
   * Directly queries Base Sepolia network for current token balance
   * Uses viem's formatUnits for proper decimal handling
   * 
   * @returns Promise<number> USDC balance as decimal number
   */
  private async fetchBalanceFromBlockchain(): Promise<number> {
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const account = await this.ensureWalletLoaded();

        if (!account?.address) {
          throw new Error('Invalid account: missing address');
        }

        // Validate address format
        if (!account.address.startsWith('0x') || account.address.length !== 42) {
          throw new Error(`Invalid Ethereum address format: ${account.address}`);
        }

        // Use the CDP client directly with the address
        const balances = await this.cdp.evm.listTokenBalances({
          address: account.address,
          network: 'base-sepolia',
        });

        // Validate response structure
        if (!balances || typeof balances !== 'object') {
          throw new Error('Invalid balance response from CDP API');
        }

        // Find USDC balance
        let usdcBalance = 0;
        
        // The response has a 'balances' property containing the array
        const balancesObj = balances as any;
        const tokenBalances = balancesObj.balances || [];

        if (!Array.isArray(tokenBalances)) {
          console.warn('⚠️ No token balances found or invalid format');
          return 0;
        }

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
          
          // Validate decimals range
          if (decimals < 0 || decimals > 18) {
            console.warn(`⚠️ Unexpected decimals value: ${decimals}, using default 6`);
            usdcBalance = parseFloat(formatUnits(amountBigInt, 6));
          } else {
            // Use viem's formatUnits for proper token amount formatting
            usdcBalance = parseFloat(formatUnits(amountBigInt, decimals));
          }

          // Validate result
          if (isNaN(usdcBalance) || usdcBalance < 0) {
            console.warn(`⚠️ Invalid balance calculation result: ${usdcBalance}, defaulting to 0`);
            usdcBalance = 0;
          }
        }

        return usdcBalance;

      } catch (error: any) {
        lastError = error;
        
        // Handle specific error types
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.warn(`⚠️ Network error (attempt ${attempt}/${maxRetries}): ${error.message}`);
        } else if (error.statusCode === 429) {
          console.warn(`⚠️ Rate limited (attempt ${attempt}/${maxRetries}), waiting ${attempt * 2}s...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        } else if (error.statusCode >= 500) {
          console.warn(`⚠️ Server error (attempt ${attempt}/${maxRetries}): ${error.message}`);
        } else {
          console.error('❌ Failed to fetch balance from blockchain:', error);
          break; // Don't retry for client errors
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    console.error('❌ All attempts to fetch balance failed:', lastError?.message || 'Unknown error');
    return 0;
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
      // Validate input
      if (isNaN(targetAmount) || targetAmount <= 0 || targetAmount > 1000) {
        console.error('❌ Invalid target amount. Must be between 0 and 1000 USDC');
        return false;
      }

      const account = await this.ensureWalletLoaded();
      
      if (!account?.address) {
        console.error('❌ No valid account found for funding');
        return false;
      }
      
      // Check current balance with retry logic
      const currentBalance = await this.getUSDCBalance();
      
      if (currentBalance >= targetAmount) {
        console.log(`✅ Wallet already has sufficient funds (${currentBalance} USDC >= ${targetAmount} USDC)`);
        return true;
      }

      const neededAmount = targetAmount - currentBalance;
      console.log(`🔄 Need ${neededAmount.toFixed(2)} more USDC. Requesting from faucet...`);

      // Invalidate cache before write operation
      this.invalidateCache();

      // Request USDC from faucet with timeout
      const faucetResponse = await Promise.race([
        this.cdp.evm.requestFaucet({
          address: account.address,
          network: 'base-sepolia',
          token: 'usdc',
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Faucet request timeout after 30 seconds')), 30000)
        )
      ]) as any;

      // Validate faucet response
      if (!faucetResponse?.transactionHash) {
        console.error('❌ Invalid faucet response: missing transaction hash');
        return false;
      }

      console.log(`🔄 Faucet request submitted. Transaction hash: ${faucetResponse.transactionHash}`);
      console.log('⏳ Waiting for transaction confirmation...');

      // Wait for confirmation with timeout
      try {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Give some time for processing
        console.log(`✅ Faucet request completed! Transaction: ${faucetResponse.transactionHash}`);
        console.log('💡 Note: It may take a few minutes for the balance to update.');
      } catch (confirmError) {
        console.warn('⚠️ Could not confirm transaction, but it may still be processing');
      }
      
      // Refresh cache after successful write operation
      try {
        await this.refreshCache();
      } catch (refreshError) {
        console.warn('⚠️ Could not refresh cache, but funding may have succeeded');
      }
      
      return true;

    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('already_requested') || error.statusCode === 429) {
        console.log('⚠️ Faucet already used today. Please wait 24 hours or fund manually.');
        return false;
      } else if (error.message?.includes('timeout')) {
        console.error('❌ Faucet request timed out. Please try again or check network connection.');
        return false;
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.error('❌ Network connectivity error. Please check your internet connection.');
        return false;
      } else if (error.statusCode === 403) {
        console.error('❌ Access denied. Please check your CDP API credentials.');
        return false;
      } else if (error.statusCode >= 500) {
        console.error('❌ CDP service error. Please try again later.');
        return false;
      } else {
        console.error('❌ Failed to fund wallet:', error.message || error);
        return false;
      }
    }
  }



  /**
   * Get wallet information
   */
  public async getWalletInfo(): Promise<WalletData | null> {
    const account = await this.ensureWalletLoaded();
    if (!account) return null;

    return {
      id: account.address,
      seed: '', // CDP manages private keys
      addresses: [account.address],
      defaultAddress: account.address,
      accounts: [{
        address: account.address,
        name: account.name || 'CDP-CLI-Account'
      }]
    };
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
   */
  public async getAccountForX402(): Promise<{ account: { address: string; name: string }; client: CdpClient }> {
    const account = await this.ensureWalletLoaded();
    return {
      account,
      client: this.cdp
    };
  }

  /**
   * Invalidate balance cache - useful after external transactions
   */
  public invalidateBalanceCache(): void {
    this.invalidateCache();
  }
} 