/**
 * X402 Command Module
 * 
 * Handles X402 payment testing with the proper facilitator flow.
 * Demonstrates the complete payment cycle from balance check to premium content access.
 */

import axios from 'axios';
import { withPaymentInterceptor, decodeXPaymentResponse } from 'x402-axios';
import { createViemAccountFromCDP } from '../../shared/cdp-viem-adapter';
import type { CLICommand, CommandContext } from '../types/commands';
import { displayError } from '../utils/display';
import { logger } from '../../shared/utils/logger';

/**
 * X402 payment test command implementation
 */
export const x402Command: CLICommand = {
  name: 'test',
  aliases: ['x402'],
  description: 'Test X402 payment flow (0.01 USDC)',
  usage: 'test',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    const { walletManager } = context;

    try {
      const startTime = Date.now();
      
      logger.header('X402 Payment Test', 'Testing protected endpoint access');
      
      // Check balance first with validation
      logger.flow('balance_check', { action: 'Checking wallet balance' });
      const balance = await walletManager.getUSDCBalance();
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
        const accountData = await walletManager.getAccountForX402();
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
        const response = await api.get('/protected');
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        // If we get here, the interceptor successfully handled any payments
        logger.success('Payment successful! Accessed protected content');
        
        // Display the premium protected content
        if (response.data) {
          logger.ui('\n🔓 PREMIUM CONTENT ACCESSED');
          logger.ui('═══════════════════════════════════════════════════════════');
          
          // Payment verification status
          if (response.data.paymentVerified) {
            logger.ui('✅ PAYMENT VERIFIED - Access Granted to Premium Tier');
          }
          
          if (response.data.message) {
            logger.ui(`📢 ${response.data.message}`);
          }
          
          if (response.data.subtitle) {
            logger.ui(`   ${response.data.subtitle}`);
          }
          
          const data = response.data.data;
          if (data) {
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
              logger.ui('\n🚀 Premium Features Unlocked:');
              
              // AI Analysis
              if (data.premiumFeatures.aiAnalysis) {
                const ai = data.premiumFeatures.aiAnalysis;
                logger.ui(`   🤖 AI Analysis: ${ai.sentiment} (${ai.confidence} confidence)`);
                logger.ui(`      Keywords: ${ai.keywords.join(', ')}`);
                logger.ui(`      Summary: ${ai.summary}`);
              }
              
              // Market Data
              if (data.premiumFeatures.marketData) {
                const market = data.premiumFeatures.marketData;
                logger.ui(`   📊 Market Prediction: ${market.predictiveModel.nextHour} (${market.predictiveModel.accuracy} accuracy)`);
                logger.ui(`   📈 Signals: ${market.predictiveModel.signals.join(', ')}`);
                logger.ui(`   📋 Price History: ${market.priceHistory.length} data points available`);
              }
              
              // Exclusive Content
              if (data.premiumFeatures.exclusiveContent) {
                const exclusive = data.premiumFeatures.exclusiveContent;
                logger.ui(`   ⭐ Report ID: ${exclusive.reportId}`);
                logger.ui(`   🏆 Tier: ${exclusive.accessLevel}`);
                logger.ui(`   📊 Content Type: ${exclusive.contentType}`);
                logger.ui(`   💳 Remaining Credits: ${exclusive.remainingCredits}`);
              }
            }
            
            // Value Proposition
            if (data.insights && data.insights.length > 0) {
              logger.ui('\n💎 Premium Features You\'re Now Accessing:');
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
          }
          
          logger.ui('\n🎉 This content was protected by X402 and required payment to access!');
          logger.ui('   Without payment, you would have received a 402 Payment Required error.');
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
            walletManager.invalidateBalanceCache();
            const newBalance = await walletManager.getUSDCBalance();
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
}; 