/**
 * X402 Shared Utilities
 * 
 * Common functions and utilities used by all X402 payment tier commands.
 * Provides consistent payment handling, balance checking, and response display.
 */

import axios from 'axios';
import { withPaymentInterceptor, decodeXPaymentResponse } from 'x402-axios';
import { createViemAccountFromCDP } from '../../../shared/cdp-viem-adapter';
import { logger } from '../../../shared/utils/logger';
import type { CommandContext } from '../../types/commands';
import type { X402EndpointConfig, X402PaymentResponse } from './types';

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
    logger.error('Failed to get account for X402', accountError);
    throw accountError;
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
    
    return { api, viemAccount };
  } catch (conversionError) {
    logger.error('Failed to create X402 client', conversionError);
    throw conversionError;
  }
}

/**
 * Display premium content response in a consistent format
 */
export function displayPremiumContent(response: any, config: X402EndpointConfig): void {
  if (!response.data) return;
  
  logger.ui(`\n🔓 ${config.tierName.toUpperCase()} CONTENT ACCESSED`);
  logger.ui('═══════════════════════════════════════════════════════════');
  
  // Payment verification status
  if (response.data.paymentVerified) {
    logger.ui(`✅ PAYMENT VERIFIED - Access Granted to ${config.tierName}`);
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
  
  // Premium Features Demo
  if (data.premiumFeatures) {
    logger.ui(`\n🚀 ${config.tierName} Features Unlocked:`);
    
    // AI Analysis
    if (data.premiumFeatures.aiAnalysis) {
      const ai = data.premiumFeatures.aiAnalysis;
      logger.ui(`   🤖 AI Analysis: ${ai.sentiment} (${ai.confidence} confidence)`);
      if (ai.modelVersion) {
        logger.ui(`      Model: ${ai.modelVersion}`);
      }
      logger.ui(`      Keywords: ${ai.keywords.join(', ')}`);
      logger.ui(`      Summary: ${ai.summary}`);
      
      // Advanced features for higher tiers
      if (ai.riskAssessment) {
        logger.ui(`      🎯 Risk Score: ${ai.riskAssessment.score}`);
        logger.ui(`      📋 Risk Factors: ${ai.riskAssessment.factors.join(', ')}`);
        logger.ui(`      💡 Recommendation: ${ai.riskAssessment.recommendation}`);
      }
    }
    
    // Market Data
    if (data.premiumFeatures.marketData) {
      const market = data.premiumFeatures.marketData;
      logger.ui(`   📊 Market Prediction: ${market.predictiveModel.nextHour} (${market.predictiveModel.accuracy} accuracy)`);
      logger.ui(`   📈 Signals: ${market.predictiveModel.signals.join(', ')}`);
      logger.ui(`   📋 Price History: ${market.priceHistory.length} data points available`);
      
      // Enterprise features for tier 3
      if (market.institutionalData) {
        logger.ui(`   🏛️  Volume Profile: ${market.institutionalData.volumeProfile}`);
        logger.ui(`   💧 Liquidity Score: ${market.institutionalData.liquidityScore}`);
        logger.ui(`   🌊 Institutional Flow: ${market.institutionalData.institutionalFlow}`);
      }
    }
    
    // Exclusive Content
    if (data.premiumFeatures.exclusiveContent) {
      const exclusive = data.premiumFeatures.exclusiveContent;
      logger.ui(`   ⭐ Report ID: ${exclusive.reportId}`);
      logger.ui(`   🏆 Tier: ${exclusive.accessLevel}`);
      logger.ui(`   📊 Content Type: ${exclusive.contentType}`);
      logger.ui(`   💳 Remaining Credits: ${exclusive.remainingCredits}`);
      
      // Custom insights for higher tiers
      if (exclusive.customInsights && exclusive.customInsights.length > 0) {
        logger.ui(`   🎨 Custom Insights:`);
        exclusive.customInsights.forEach((insight: string) => {
          logger.ui(`      • ${insight}`);
        });
      }
      
      // Exclusive reports for enterprise tier
      if (exclusive.exclusiveReports && exclusive.exclusiveReports.length > 0) {
        logger.ui(`   📑 Exclusive Reports:`);
        exclusive.exclusiveReports.forEach((report: any) => {
          logger.ui(`      • ${report.title} (${report.confidenceLevel} confidence)`);
        });
      }
    }
  }
  
  // Value Proposition
  if (data.insights && data.insights.length > 0) {
    logger.ui(`\n💎 ${config.tierName} Features You're Now Accessing:`);
    data.insights.forEach((insight: string) => {
      logger.ui(`   ${insight}`);
    });
  }
  
  // Developer Information
  if (data.developer) {
    logger.ui('\n🛠️  Developer Information:');
    logger.ui(`   ${data.developer.note}`);
    logger.ui(`   Implementation: ${data.developer.implementation}`);
    logger.ui(`   Cost Model: ${data.developer.cost} - ${data.developer.billing}`);
  }
  
  logger.ui(`\n🎉 This ${config.tierName} content was protected by X402 and required payment to access!`);
  logger.ui('   Without payment, you would have received a 402 Payment Required error.');
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
      const paymentResponse = decodeXPaymentResponse(xPaymentResponse);
      logger.transaction('payment_complete', {
        amount: 'Dynamically discovered via X402',
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
        amount: 'Dynamically discovered via X402',
        duration: parseFloat(duration),
        status: 'success' as const
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
      logger.warn('Could not refresh balance after payment', balanceError);
    }
  } else {
    logger.ui('ℹ️ No payment was required');
  }
}

/**
 * Handle X402 request errors consistently
 */
export function handleX402Error(error: any, config: X402EndpointConfig): void {
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
    logger.error('Cannot connect to server at http://localhost:3000');
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
    logger.ui(`💡 This suggests an issue with the payment interceptor for ${config.tierName}`);
    if (typedError.response?.data?.accepts) {
      logger.debug('Payment options available but not processed', typedError.response.data.accepts);
    }
  } else if (typedError.response?.data?.error) {
    logger.warn('Server error', typedError.response.data.error);
  } else {
    logger.error(`Error during ${config.tierName} X402 test`, typedError);
    if (typedError.response?.data) {
      logger.debug('Response data', typedError.response.data);
    }
  }
} 