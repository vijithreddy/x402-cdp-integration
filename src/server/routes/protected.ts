/**
 * Protected Premium Content Route Module
 * 
 * Provides premium content that requires X402 payment to access.
 * Demonstrates rich premium features and AI analysis.
 */

import type { Request, Response } from 'express';
import type { RouteDefinition } from './health';

/**
 * Generate premium content with AI analysis and market data
 */
function generatePremiumContent() {
  return {
    aiAnalysis: {
      sentiment: Math.random() > 0.5 ? 'positive' : 'bullish',
      confidence: (Math.random() * 40 + 60).toFixed(1) + '%',
      keywords: ['blockchain', 'payments', 'web3', 'fintech'],
      summary: 'Advanced AI analysis of payment trends and market sentiment'
    },
    marketData: {
      priceHistory: Array.from({length: 5}, (_, i) => ({
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        price: (Math.random() * 100 + 2000).toFixed(2),
        volume: Math.floor(Math.random() * 1000000)
      })),
      predictiveModel: {
        nextHour: '+' + (Math.random() * 5).toFixed(2) + '%',
        accuracy: '87.3%',
        signals: ['bullish_momentum', 'volume_surge']
      }
    },
    exclusiveContent: {
      reportId: `PREMIUM-${Date.now()}`,
      accessLevel: 'GOLD_TIER',
      contentType: 'Real-time Analytics + AI Insights',
      remainingCredits: Math.floor(Math.random() * 50 + 10)
    }
  };
}

/**
 * Extract client address from payment header
 */
function getClientFromPayment(req: Request): string {
  const xPayment = req.headers['x-payment'] as string;
  if (!xPayment) return 'unknown';
  
  try {
    if (/^[A-Za-z0-9+/]*={0,2}$/.test(xPayment)) {
      const decoded = Buffer.from(xPayment, 'base64').toString('utf-8');
      const paymentData = JSON.parse(decoded);
      
      if (paymentData?.payload?.authorization?.from) {
        const clientAddress = paymentData.payload.authorization.from;
        if (typeof clientAddress === 'string' && clientAddress.startsWith('0x')) {
          return clientAddress;
        }
      }
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Protected content route handler
 */
function protectedHandler(req: Request, res: Response): void {
  try {
    const premiumFeatures = generatePremiumContent();
    const clientAddress = getClientFromPayment(req);

    res.json({
      paymentVerified: true,
      contentTier: 'PREMIUM',
      message: '🔓 PREMIUM ACCESS GRANTED - Payment Verified',
      subtitle: 'You have successfully accessed protected content via X402 payment',
      data: {
        payment: {
          amount: '0.01 USDC',
          paidBy: clientAddress,
          timestamp: new Date().toISOString(),
          transactionType: 'X402_MICROPAYMENT'
        },
        premiumFeatures,
        access: {
          contentId: `protected-${Date.now()}`,
          accessLevel: 'PREMIUM',
          validUntil: new Date(Date.now() + 3600000).toISOString(),
          apiCallsRemaining: 99
        },
        insights: [
          '📊 Real-time market analysis updated every 30 seconds',
          '🤖 AI-powered predictions with 87%+ accuracy',
          '📈 Exclusive trading signals not available on free tier',
          '🔮 Predictive models based on 10M+ data points',
          '⚡ Sub-millisecond API response times'
        ],
        developer: {
          note: 'This content required X402 micropayment to access',
          implementation: 'Automatic payment handled by x402-axios interceptor',
          cost: '0.01 USDC per request',
          billing: 'Pay-per-use model - no subscriptions needed'
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error in protected endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Protected premium route definition
 */
export const protectedRoute: RouteDefinition = {
  path: '/protected',
  method: 'get',
  handler: protectedHandler,
  requiresPayment: true,
  price: '0.01 USDC',
  network: 'base-sepolia',
  description: 'Premium content with AI analysis and market data'
}; 