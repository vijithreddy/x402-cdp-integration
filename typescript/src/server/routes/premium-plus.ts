/**
 * Premium Plus Content Route Module
 * 
 * Provides premium plus content that requires X402 payment to access.
 * Demonstrates advanced AI models and institutional features.
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
 * Generate premium plus content with advanced AI models
 */
async function generatePremiumPlusContent() {
  // Try to get real AI content first
  const aiResponse = await callAiService('tier2');
  
  if (aiResponse && aiResponse.source === 'openai') {
    // Use real AI content
    return {
      aiAnalysis: {
        content: aiResponse.content,
        source: 'openai',
        tier: 'tier2'
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
        content: '# Market Analysis - Tier2\n\n**Status:** AI service temporarily unavailable\n\n**Fallback Analysis:** Advanced market conditions are being monitored.',
        source: 'fallback',
        tier: 'tier2'
      },
      marketData: {},
      exclusiveContent: [],
      keyInsights: [],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Premium plus content route handler
 */
async function premiumPlusHandler(req: Request, res: Response): Promise<void> {
  try {
    // At this point, payment is already verified by the middleware.
    // Just serve the premium plus content.
    const premiumPlusFeatures = await generatePremiumPlusContent();
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
  description: 'Premium plus content with advanced AI models and institutional features'
}; 