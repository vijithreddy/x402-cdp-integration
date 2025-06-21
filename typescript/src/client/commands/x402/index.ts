/**
 * X402 Shared Utilities
 * 
 * Common functions and utilities used by X402 payment commands.
 */

import type { CLICommand, CommandContext } from '../../types/commands';
import { displayError } from '../../utils/display';
import { logger } from '../../../shared/utils/logger';
import { config } from '../../../shared/config';
import { WalletManager } from '../../../shared/utils/walletManager';
import { toAccount } from 'viem/accounts';
import { withPaymentInterceptor, decodeXPaymentResponse } from 'x402-axios';
import axios from 'axios';
import type { X402EndpointConfig } from './types';

/**
 * X402 endpoint configurations for all tiers
 */
export const X402_ENDPOINTS: Record<string, X402EndpointConfig> = {
  tier1: {
    endpoint: '/protected',
    expectedCost: '~0.01 USDC',
    tier: 'tier1',
    tierName: 'Basic Premium',
    description: 'Basic premium features with AI analysis and market data'
  },
  tier2: {
    endpoint: '/premium-plus',
    expectedCost: '~0.1 USDC',
    tier: 'tier2',
    tierName: 'Premium Plus',
    description: 'Advanced AI models, predictive analytics, and exclusive reports'
  },
  tier3: {
    endpoint: '/enterprise',
    expectedCost: '~1.0 USDC',
    tier: 'tier3',
    tierName: 'Enterprise',
    description: 'Enterprise analytics, institutional data, and custom insights'
  }
};

/**
 * Validate user balance for X402 payments using discovery protocol
 */
export async function validateBalanceForX402(context: CommandContext): Promise<number | null> {
  const { walletManager } = context;
  
  // Check balance first with validation
  logger.flow('balance_check', { action: 'Checking wallet balance' });
  const balance = await walletManager.getUSDCBalance();
  logger.ui(`Balance: ${balance} USDC → ${balance > 0 ? 'Available for X402 payments ✓' : 'Zero balance - no funds available ✗'}`);
  
  // Validate balance for any potential payment (X402 discovery protocol)
  if (isNaN(balance) || balance < 0) {
    logger.error('Invalid balance detected', { balance });
    return null;
  }
  
  if (balance === 0) {
    logger.error('No USDC balance available for potential payments');
    logger.ui('💡 Type "fund" to add USDC for X402 payments');
    logger.ui('ℹ️  X402 uses dynamic pricing - we discover costs during the request');
    return null;
  }

  return balance;
}

/**
 * Create X402-enabled HTTP client with payment interceptor
 */
export async function createX402Client(context: CommandContext) {
  const { walletManager } = context;
  
  logger.flow('client_init', { action: 'Creating X402-enabled HTTP client' });
  
  // Get CDP account and client, then create viem account using adapter
  let cdpAccount, cdpClient;
  try {
    const accountData = await walletManager.getAccountForX402();
    cdpAccount = accountData.account;
    cdpClient = accountData.client;
    
    if (!cdpAccount?.address || !cdpClient) {
      throw new Error('Invalid account or client data');
    }
  } catch (accountError) {
    logger.error('Failed to get account for X402', { error: accountError as Error });
    throw accountError;
  }
  
  try {
    const viemAccount = toAccount(cdpAccount);
    
    if (!viemAccount?.address) {
      throw new Error('Failed to create valid viem account');
    }
    
    logger.ui(`Wallet: ${viemAccount.address}`);
    
    // Create X402-enabled axios client with payment interceptor
    const serverConfig = config.getServerConfig('typescript');
    const baseURL = `http://${serverConfig.host}:${serverConfig.port}`;
    
    const api = withPaymentInterceptor(
      axios.create({
        baseURL: baseURL,
        timeout: 60000, // Increased timeout for payment processing
      }),
      viemAccount as any
    );
    
    return { api, viemAccount };
  } catch (error) {
    logger.error('Failed to create X402 client', { error: error as Error });
    throw error;
  }
}

/**
 * Display premium content response in a simple format
 */
export function displayPremiumContent(response: any, endpointConfig: X402EndpointConfig): void {
  if (!response.data) return;
  
  logger.ui(`\n${endpointConfig.tierName.toUpperCase()} CONTENT ACCESSED`);
  logger.ui('═══════════════════════════════════════════════════════════');
  
  // Payment verification status
  if (response.data.paymentVerified) {
    logger.ui(`✅ PAYMENT VERIFIED - Access Granted to ${endpointConfig.tierName}`);
  }
  
  if (response.data.message) {
    logger.ui(`📢 ${response.data.message}`);
  }
  
  if (response.data.subtitle) {
    logger.ui(`   ${response.data.subtitle}`);
  }
  
  const data = response.data.data;
  if (!data) return;
  
  // Payment Information
  if (data.payment) {
    logger.ui('\n💰 Payment Details:');
    logger.ui(`   Amount Paid: ${data.payment.amount}`);
    logger.ui(`   Paid By: ${data.payment.paidBy}`);
    logger.ui(`   Type: ${data.payment.transactionType}`);
  }
  
  // Access Information
  if (data.access) {
    logger.ui('\n🎫 Access Information:');
    logger.ui(`   Content ID: ${data.access.contentId}`);
    logger.ui(`   Access Level: ${data.access.accessLevel}`);
    logger.ui(`   Valid Until: ${new Date(data.access.validUntil).toLocaleString()}`);
    logger.ui(`   API Calls Remaining: ${data.access.apiCallsRemaining}`);
  }
  
  // Insights
  if (data.insights && data.insights.length > 0) {
    logger.ui(`\n💎 ${endpointConfig.tierName} Features You're Now Accessing:`);
    data.insights.forEach((insight: string) => {
      logger.ui(`   ${insight}`);
    });
  }
}

/**
 * Handle payment completion and balance refresh
 */
export async function handlePaymentCompletion(
  response: any, 
  viemAccount: any, 
  duration: string, 
  context: CommandContext
): Promise<void> {
  const { walletManager } = context;
  
  // Check for payment response and refresh balance
  const xPaymentResponse = response.headers['x-payment-response'];
  if (xPaymentResponse) {
    try {
      // Decode the X402 payment response header
      const paymentResponse = decodeXPaymentResponse(xPaymentResponse);
      
      // Log transaction details
      logger.info('Payment completed', {
        amount: 'Dynamically discovered via X402',
        from: viemAccount.address,
        to: paymentResponse?.payer || response.data?.userAddress || 'Server',
        txHash: paymentResponse?.transaction,
        network: paymentResponse?.network || 'base-sepolia',
        duration: parseFloat(duration),
        status: 'success'
      });
      
      // Display transaction details to user
      if (paymentResponse?.transaction) {
        logger.ui(`Transaction: ${paymentResponse.transaction}`);
        logger.ui(`Network: ${paymentResponse.network}`);
        logger.ui(`Payer: ${paymentResponse.payer}`);
      }
    } catch (decodeError) {
      logger.debug('Could not decode payment response', { error: decodeError as Error });
      logger.info('Payment completed', {
        amount: 'Dynamically discovered via X402',
        duration: parseFloat(duration),
        status: 'success'
      });
    }
    
    // Refresh balance to show payment deduction
    try {
      const initialBalance = await walletManager.getUSDCBalance();
      walletManager.invalidateBalanceCache();
      const newBalance = await walletManager.getUSDCBalance();
      const balanceChange = (initialBalance - newBalance).toFixed(6);
      logger.ui(`Updated Balance: ${newBalance} USDC (-${balanceChange})`);
    } catch (balanceError) {
      logger.warn('Could not refresh balance after payment', { error: balanceError as Error });
    }
  } else {
    logger.ui('ℹ️ No payment was required');
  }
}

/**
 * Handle X402 request errors consistently
 */
export function handleX402Error(error: any, endpointConfig: X402EndpointConfig): void {
  // Type-safe error handling
  const typedError = error as { 
    message?: string; 
    status?: number; 
    response?: { 
      status?: number; 
      data?: { 
        error?: unknown; 
        accepts?: unknown[]; 
      }; 
    }; 
    code?: string;
  };
  
  if (typedError.code === 'ECONNREFUSED') {
    const tsServerConfig = config.getServerConfig('typescript');
    const serverURL = `http://${tsServerConfig.host}:${tsServerConfig.port}`;
    logger.error(`Cannot connect to server at ${serverURL}`);
    logger.ui('💡 Make sure the server is running: npm run dev:server');
  } else if (typedError.code === 'ENOTFOUND') {
    logger.error('Network error: Cannot resolve localhost');
    logger.ui('💡 Check your network connection');
  } else if (typedError.message?.includes('timeout')) {
    logger.error('Request timed out');
    logger.ui('💡 Check server status and network connection');
  } else if (typedError.code === 'EADDRINUSE') {
    logger.error('Port conflict detected');
    logger.ui('💡 Server may already be running or port 3000 is in use');
  } else if (typedError.status === 402 || typedError.response?.status === 402) {
    logger.error('X402 interceptor failed to process payment automatically');
    logger.ui(`💡 This suggests an issue with the payment interceptor for ${endpointConfig.tierName}`);
    if (typedError.response?.data?.accepts) {
      logger.debug('Payment options available but not processed', typedError.response.data.accepts);
    }
  } else if (typedError.response?.data?.error) {
    logger.warn('Server error', typedError.response.data.error);
  } else {
    logger.error(`Error during ${endpointConfig.tierName} X402 test`, typedError);
    if (typedError.response?.data) {
      logger.debug('Response data', typedError.response.data);
    }
  }
}

// Re-export tier commands
export { tier1Command } from './tier1';
export { tier2Command } from './tier2';
export { tier3Command } from './tier3'; 