/**
 * Wallet Configuration Module
 * 
 * Handles loading and validation of wallet configurations for the X402 server.
 * Separates wallet management logic from the main server file for better modularity.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface WalletInfo {
  address: string;
  name: string;
}

/**
 * Load server wallet configuration dynamically from saved wallet data
 * 
 * Reads the server wallet configuration from the JSON file created during setup.
 * This ensures the server uses the correct wallet address for receiving payments.
 * 
 * @returns Server wallet configuration with address and name
 * @throws {Error} When server wallet file is missing or invalid
 */
export function loadServerWallet(): WalletInfo {
  const serverWalletPath = path.join(process.cwd(), 'server-wallet-data.json');
  
  if (!fs.existsSync(serverWalletPath)) {
    console.error('❌ Server wallet not found! Please run: npm run setup');
    console.log('💡 This will create both client and server wallets automatically.');
    process.exit(1);
  }

  try {
    const walletData = JSON.parse(fs.readFileSync(serverWalletPath, 'utf8'));
    
    // Validate wallet data structure
    if (!walletData || typeof walletData !== 'object') {
      throw new Error('Invalid wallet data format');
    }
    
    const serverAddress = walletData.defaultAddress || walletData.addresses?.[0];
    const serverName = walletData.accounts?.[0]?.name || 'Unknown';
    
    if (!serverAddress || !serverAddress.startsWith('0x') || serverAddress.length !== 42) {
      throw new Error('No valid address found in server wallet data');
    }

    console.log(`✅ Server wallet loaded: ${serverAddress}`);
    return { address: serverAddress, name: serverName };
  } catch (error: any) {
    console.error('❌ Failed to load server wallet:', error.message || error);
    console.log('💡 Please run: npm run setup');
    process.exit(1);
  }
}

/**
 * Load client wallet configuration for display purposes
 * 
 * Attempts to load client wallet information for logging and display.
 * This is optional and used only for better user experience in logs.
 * 
 * @returns Client wallet information (may contain placeholder values)
 */
export function loadClientWallet(): WalletInfo {
  const clientWalletPath = path.join(process.cwd(), 'wallet-data.json');
  
  try {
    if (fs.existsSync(clientWalletPath)) {
      const walletData = JSON.parse(fs.readFileSync(clientWalletPath, 'utf8'));
      
      if (walletData && typeof walletData === 'object') {
        const clientAddress = walletData.defaultAddress || walletData.addresses?.[0];
        const clientName = walletData.accounts?.[0]?.name || 'Unknown';
        return { address: clientAddress || 'Not configured', name: clientName };
      }
    }
  } catch {
    console.warn('⚠️ Could not load client wallet info for display');
  }
  
  return { address: 'Not configured', name: 'Unknown' };
} 