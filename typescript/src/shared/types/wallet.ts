/**
 * Wallet Type Definitions for X402 Payment System
 * 
 * TypeScript interfaces for wallet data structures used throughout
 * the X402 payment system for CDP wallet integration and session management.
 * 
 * @since 1.0.0
 */

/**
 * Wallet data structure for persistent storage and session management
 * 
 * Contains all necessary information to restore and manage wallet state
 * across application sessions and between client/server components.
 * 
 * @example
 * ```typescript
 * const walletData: WalletData = {
 *   id: '0x123...',
 *   seed: '',
 *   addresses: ['0x123...'],
 *   defaultAddress: '0x123...',
 *   accounts: [{
 *     address: '0x123...',
 *     name: 'CDP-CLI-Account'
 *   }]
 * };
 * ```
 */
export interface WalletData {
  /** Unique identifier for the wallet (typically the primary address) */
  id: string;
  /** Wallet seed phrase (empty for CDP-managed wallets) */
  seed: string;
  /** Array of all addresses associated with this wallet */
  addresses: string[];
  /** Primary address used for transactions (optional, defaults to first address) */
  defaultAddress?: string;
  /** Account information including names for identification */
  accounts?: Array<{
    /** Ethereum address for this account */
    address: string;
    /** Human-readable name for this account */
    name: string;
  }>;
}

/**
 * Configuration required for CDP wallet initialization
 * 
 * Contains credentials and settings needed to connect to the
 * Coinbase Developer Platform and manage wallets.
 * 
 * @example
 * ```typescript
 * const config: WalletConfig = {
 *   apiKeyId: process.env.CDP_API_KEY_ID!,
 *   apiKeySecret: process.env.CDP_API_KEY_SECRET!,
 *   walletSecret: process.env.CDP_WALLET_SECRET
 * };
 * ```
 */
export interface WalletConfig {
  /** CDP API key identifier for authentication */
  apiKeyId: string;
  /** CDP private key content for signing operations */
  apiKeySecret: string;
  /** Optional wallet-specific secret for additional security */
  walletSecret?: string;
} 