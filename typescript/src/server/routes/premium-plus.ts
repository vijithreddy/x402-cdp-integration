/**
 * Premium Plus Content Route Module
 * 
 * Provides premium plus content that requires X402 payment to access.
 * Demonstrates advanced AI models and predictive analytics.
 */

import type { Request, Response } from 'express';
import type { RouteDefinition } from './health';

/**
 * Generate premium plus content with advanced AI models
 */
function generatePremiumPlusContent() {
  return {
    aiModels: {
      sentiment: Math.random() > 0.5 ? 'very_positive' : 'extremely_bullish',
      confidence: (Math.random() * 20 + 80).toFixed(1) + '%',
      keywords: ['blockchain', 'payments', 'web3', 'fintech', 'defi', 'nft'],
      summary: 'Advanced AI analysis with deep learning models'
    },
    marketData: {
      priceHistory: Array.from({length: 10}, (_, i) => ({
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        price: (Math.random() * 100 + 2000).toFixed(2),
        volume: Math.floor(Math.random() * 1000000)
      })),
      predictiveModel: {
        nextHour: '+' + (Math.random() * 5).toFixed(2) + '%',
        nextDay: '+' + (Math.random() * 10).toFixed(2) + '%',
        accuracy: '92.5%',
        signals: ['bullish_momentum', 'volume_surge', 'institutional_interest']
      }
    },
    exclusiveContent: {
      reportId: `PREMIUM-PLUS-${Date.now()}`,
      accessLevel: 'PLATINUM_TIER',
      contentType: 'Advanced Analytics + AI Insights',
      remainingCredits: Math.floor(Math.random() * 100 + 50)
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
 * Premium plus content route handler
 */
function premiumPlusHandler(req: Request, res: Response): void {
  try {
    // At this point, payment is already verified by the middleware.
    // Just serve the premium plus content.
    const premiumPlusFeatures = generatePremiumPlusContent();
    const clientAddress = getClientFromPayment(req);

    res.json({
      paymentVerified: true,
      contentTier: 'PREMIUM_PLUS',
      message: '🔓 PREMIUM PLUS ACCESS GRANTED - Payment Verified',
      subtitle: 'You have successfully accessed premium plus content via X402 payment',
      data: {
        payment: {
          amount: '0.1 USDC',
          paidBy: clientAddress,
          timestamp: new Date().toISOString(),
          transactionType: 'X402_MICROPAYMENT'
        },
        premiumPlusFeatures,
        access: {
          contentId: `premium-plus-${Date.now()}`,
          accessLevel: 'PREMIUM_PLUS',
          validUntil: new Date(Date.now() + 3600000).toISOString(),
          apiCallsRemaining: 199
        },
        insights: [
          '📊 Advanced market analysis with deep learning models',
          '🤖 AI-powered predictions with 92%+ accuracy',
          '📈 Exclusive trading signals and institutional data',
          '🔮 Predictive models based on 100M+ data points',
          '⚡ Sub-millisecond API response times',
          '🎯 Custom alerts and notifications',
          '📱 Mobile-optimized data delivery'
        ],
        developer: {
          note: 'This content required X402 micropayment to access',
          implementation: 'Automatic payment handled by x402-axios interceptor',
          cost: '0.1 USDC per request',
          billing: 'Pay-per-use model - no subscriptions needed'
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error in premium plus endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Premium plus route definition
 */
export const premiumPlusRoute: RouteDefinition = {
  path: '/premium-plus',
  method: 'get',
  handler: premiumPlusHandler,
  requiresPayment: true,
  price: '0.1 USDC',
  network: 'base-sepolia',
  description: 'Premium plus content with advanced AI models'
}; 