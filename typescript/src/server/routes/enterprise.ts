/**
 * Enterprise Content Route Module
 * 
 * Provides enterprise content that requires X402 payment to access.
 * Demonstrates institutional-grade features and custom insights.
 */

import type { Request, Response } from 'express';
import type { RouteDefinition } from './health';

/**
 * Generate enterprise content with institutional features
 */
function generateEnterpriseContent() {
  return {
    institutionalData: {
      whaleMovements: [
        { address: '0x742d35cc6c1b78...', amount: '2.5M USDC', direction: 'buy' },
        { address: '0x8e67b2a9c4f3d1...', amount: '1.8M USDC', direction: 'sell' }
      ],
      darkPoolActivity: {
        volume24h: '$45.2M',
        averageTradeSize: '$892K',
        premiumToSpot: '+0.23%'
      },
      yieldOpportunities: [
        { protocol: 'Aave V3', apy: '12.4%', tvl: '$2.1B', risk: 'low' },
        { protocol: 'Compound III', apy: '8.9%', tvl: '$890M', risk: 'low' }
      ]
    },
    advancedAI: {
      sentiment: 'highly_bullish',
      confidence: (Math.random() * 10 + 90).toFixed(1) + '%',
      modelVersion: 'GPT-4o Advanced',
      keywords: ['blockchain', 'defi', 'institutional', 'yield', 'arbitrage'],
      summary: 'Institutional-grade AI analysis with 95%+ accuracy',
      riskAssessment: {
        score: (Math.random() * 2 + 8).toFixed(1) + '/10',
        factors: ['market_volatility', 'liquidity_depth', 'regulatory_stability']
      }
    },
    exclusiveFeatures: {
      reportId: `ENTERPRISE-${Date.now()}`,
      accessLevel: 'ENTERPRISE_TIER',
      contentType: 'Institutional Analytics + Yield Strategies',
      remainingCredits: Math.floor(Math.random() * 20 + 5),
      personalizedInsights: [
        '🏦 Institutional-grade portfolio optimization',
        '📊 Real-time whale tracking and alerts',
        '💎 Exclusive DeFi yield strategies (15%+ APY)',
        '🎯 Arbitrage opportunities across 12 DEXs',
        '⚡ Sub-100ms execution signals'
      ]
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
 * Enterprise content route handler
 */
function enterpriseHandler(req: Request, res: Response): void {
  try {
    // At this point, payment is already verified by the middleware.
    // Just serve the enterprise content.
    const enterpriseFeatures = generateEnterpriseContent();
    const clientAddress = getClientFromPayment(req);

    res.json({
      paymentVerified: true,
      contentTier: 'ENTERPRISE',
      message: '🔓 ENTERPRISE ACCESS GRANTED - Payment Verified',
      subtitle: 'You have successfully accessed enterprise content via X402 payment',
      data: {
        payment: {
          amount: '1.0 USDC',
          paidBy: clientAddress,
          timestamp: new Date().toISOString(),
          transactionType: 'X402_MICROPAYMENT'
        },
        enterpriseFeatures,
        access: {
          contentId: `enterprise-${Date.now()}`,
          accessLevel: 'ENTERPRISE',
          validUntil: new Date(Date.now() + 3600000).toISOString(),
          apiCallsRemaining: 499
        },
        insights: [
          '🏛️ Institutional-grade analytics and insights',
          '🤖 Advanced AI models with 95%+ accuracy',
          '📈 Real-time whale tracking and market movements',
          '🔮 Quantitative models based on 1B+ data points',
          '⚡ Priority API access with sub-millisecond latency',
          '🎯 Custom alpha generation for systematic trading',
          '🔒 Advanced risk management and compliance tools'
        ],
        developer: {
          note: 'This content required X402 micropayment to access',
          implementation: 'Automatic payment handled by x402-axios interceptor',
          cost: '1.0 USDC per request',
          billing: 'Pay-per-use model - no subscriptions needed'
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error in enterprise endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Enterprise route definition
 */
export const enterpriseRoute: RouteDefinition = {
  path: '/enterprise',
  method: 'get',
  handler: enterpriseHandler,
  requiresPayment: true,
  price: '1.0 USDC',
  network: 'base-sepolia',
  description: 'Enterprise content with institutional features'
}; 