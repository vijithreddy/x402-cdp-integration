/**
 * Protected Premium Content Route Module
 * 
 * Provides premium content that requires X402 payment to access.
 * Demonstrates rich premium features and AI analysis.
 */

import type { Request, Response } from 'express';
import type { RouteDefinition } from './health';
import { getClientFromPayment } from '../utils/payment-parser';
import { config } from '../../shared/config';
import axios from 'axios';

// AI Service configuration from centralized config
const aiConfig = config.getAIServerConfig();
const AI_SERVICE_URL = `http://${aiConfig.host}:${aiConfig.port}`;

/**
 * Call the AI service to generate content for the specified tier
 */
async function callAiService(tier: string, userPrompt: string = ''): Promise<any> {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/generate/${tier}`,
      { tier, user_prompt: userPrompt },
      { timeout: 30000 }
    );
    return response.data;
  } catch (error) {
    console.warn(`AI service call failed for tier ${tier}:`, error);
    return null;
  }
}

/**
 * Generate premium content with AI analysis and market data
 */
async function generatePremiumContent() {
  // Try to get real AI content first
  const aiResponse = await callAiService('tier1');
  
  if (aiResponse && aiResponse.source === 'openai') {
    // Use real AI content
    return {
      aiAnalysis: {
        content: aiResponse.content,
        source: 'openai',
        tier: 'tier1'
      },
      marketData: aiResponse.market_data || {},
      exclusiveContent: aiResponse.key_insights || [],
      keyInsights: aiResponse.key_insights || [],
      timestamp: aiResponse.timestamp || new Date().toISOString()
    };
  } else {
    // Fallback to mock data (standardized)
    return {
      aiAnalysis: {
        content: '# Market Analysis - Tier1\n\n**Status:** AI service temporarily unavailable\n\n**Fallback Analysis:** Market conditions are being monitored.',
        source: 'fallback',
        tier: 'tier1'
      },
      marketData: {},
      exclusiveContent: [],
      keyInsights: [],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Protected content route handler
 */
async function protectedHandler(req: Request, res: Response): Promise<void> {
  try {
    // At this point, payment is already verified by the middleware.
    // Just serve the premium content.
    const premiumFeatures = await generatePremiumContent();
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