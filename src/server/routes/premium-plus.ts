/**
 * Premium Plus Content Route Module
 * 
 * High-value premium content that costs 0.1 USDC per request.
 * Demonstrates how easy it is to add new premium tiers to the X402 playground.
 */

import type { Request, Response } from 'express';
import type { RouteDefinition } from './health';

/**
 * Generate premium plus content with advanced features
 */
function generatePremiumPlusContent() {
  return {
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
    exclusiveFeatures: {
      reportId: `PREMIUM_PLUS-${Date.now()}`,
      accessLevel: 'PLATINUM_TIER',
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
 * Premium Plus content route handler
 */
function premiumPlusHandler(req: Request, res: Response): void {
  try {
    const premiumPlusFeatures = generatePremiumPlusContent();
    
    // Extract client from payment header (same logic as protected route)
    const xPayment = req.headers['x-payment'] as string;
    let clientAddress = 'unknown';
    
    if (xPayment) {
      try {
        const decoded = Buffer.from(xPayment, 'base64').toString('utf-8');
        const paymentData = JSON.parse(decoded);
        clientAddress = paymentData?.payload?.authorization?.from || 'unknown';
      } catch {
        // Payment parsing failed, keep unknown
      }
    }

    res.json({
      paymentVerified: true,
      contentTier: 'PREMIUM_PLUS',
      message: '💎 PREMIUM PLUS ACCESS GRANTED - Higher Tier Payment Verified',
      subtitle: 'You have accessed our highest tier content with institutional-grade features',
      data: {
        payment: {
          amount: '0.1 USDC',
          paidBy: clientAddress,
          timestamp: new Date().toISOString(),
          transactionType: 'X402_PREMIUM_MICROPAYMENT',
          tier: 'PLATINUM'
        },
        premiumPlusFeatures,
        access: {
          contentId: `premium-plus-${Date.now()}`,
          accessLevel: 'PREMIUM_PLUS',
          validUntil: new Date(Date.now() + 7200000).toISOString(), // 2 hours
          apiCallsRemaining: 50
        },
        insights: [
          '🏦 Institutional-grade analytics (95%+ accuracy)',
          '🐋 Real-time whale movement tracking',
          '💰 Exclusive yield farming strategies (15%+ APY)',
          '⚡ Lightning-fast arbitrage signals (<100ms)',
          '🎯 Multi-DEX opportunity scanning',
          '📈 Advanced risk modeling and portfolio optimization'
        ],
        developer: {
          note: 'This premium content required 0.1 USDC X402 micropayment',
          implementation: 'Same X402 flow, just higher pricing tier',
          cost: '0.1 USDC per request (10x premium tier)',
          billing: 'Pay-per-use model - perfect for high-value content'
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error in premium-plus endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Premium Plus route definition - Easy to add new premium tiers!
 */
export const premiumPlusRoute: RouteDefinition = {
  path: '/premium-plus',
  method: 'get',
  handler: premiumPlusHandler,
  requiresPayment: true,
  price: '0.1 USDC',
  network: 'base-sepolia',
  description: 'Premium Plus content - institutional-grade analytics (0.1 USDC)'
}; 