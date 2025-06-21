/**
 * Enterprise Content Route Module
 * 
 * Provides enterprise content that requires X402 payment to access.
 * Demonstrates institutional-grade features and advanced analytics.
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
 * Generate enterprise content with institutional features
 */
async function generateEnterpriseContent() {
  // Try to get real AI content first
  const aiResponse = await callAiService('tier3');
  
  if (aiResponse && aiResponse.source === 'openai') {
    // Use real AI content
    return {
      aiAnalysis: {
        content: aiResponse.content,
        source: 'openai',
        tier: 'tier3'
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
        content: '# Market Analysis - Tier3\n\n**Status:** AI service temporarily unavailable\n\n**Fallback Analysis:** Institutional market conditions are being monitored.',
        source: 'fallback',
        tier: 'tier3'
      },
      marketData: {},
      exclusiveContent: [],
      keyInsights: [],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Enterprise content route handler
 */
async function enterpriseHandler(req: Request, res: Response): Promise<void> {
  try {
    // At this point, payment is already verified by the middleware.
    // Just serve the enterprise content.
    const enterpriseFeatures = await generateEnterpriseContent();
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
  description: 'Enterprise content with institutional features and advanced analytics'
}; 