/**
 * Free Content Route Module
 * 
 * Provides free tier content for comparison with premium offerings.
 * Demonstrates the value proposition of paid content.
 */

import type { Request, Response } from 'express';
import type { RouteDefinition } from './health';
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
 * Generate free content with basic AI analysis
 */
async function generateFreeContent() {
  // Try to get real AI content first
  const aiResponse = await callAiService('free');
  
  if (aiResponse && aiResponse.source === 'openai') {
    // Use real AI content
    return {
      aiAnalysis: {
        content: aiResponse.content,
        source: 'openai',
        tier: 'free'
      },
      basicFeatures: {
        reportId: `FREE-${Date.now()}`,
        accessLevel: 'FREE_TIER',
        contentType: 'Basic Market Overview',
        upgradeMessage: 'Upgrade to Premium for advanced analytics'
      }
    };
  } else {
    // Fallback to mock data
    return {
      basicAnalysis: {
        sentiment: 'neutral',
        summary: 'Basic market overview and trends',
        keywords: ['crypto', 'market', 'trends']
      },
      basicFeatures: {
        reportId: `FREE-${Date.now()}`,
        accessLevel: 'FREE_TIER',
        contentType: 'Basic Market Overview',
        upgradeMessage: 'Upgrade to Premium for advanced analytics'
      }
    };
  }
}

/**
 * Free content route handler
 */
async function freeHandler(req: Request, res: Response): Promise<void> {
  try {
    const freeFeatures = await generateFreeContent();
    
    res.json({
      paymentVerified: false,
      contentTier: 'FREE',
      message: '🎉 FREE CONTENT ACCESS GRANTED',
      subtitle: 'Basic market overview - no payment required',
      data: {
        freeFeatures,
        access: {
          contentId: `free-${Date.now()}`,
          accessLevel: 'FREE_TIER',
          upgradeMessage: 'Upgrade to Premium for advanced analytics and AI insights'
        },
        basicInfo: {
          service: 'X402 Demo API',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          accessLevel: 'PUBLIC'
        },
        freeFeatureList: [
          '📊 Basic market data (15-minute delay)',
          '📈 Simple price charts',
          '📱 Standard API rate limits',
          '🔍 Limited search functionality',
          '⏰ Business hours support only'
        ],
        limitations: {
          updateFrequency: '15 minutes',
          dataAccuracy: 'Standard',
          apiCallsPerHour: 10,
          supportLevel: 'Community forum only',
          advancedFeatures: 'Not available'
        },
        upgradeInfo: {
          note: 'Want real-time data and AI insights?',
          upgrade: 'Try the /protected endpoint (requires payment)',
          benefits: 'Unlock premium features, real-time data, and AI analysis'
        },
        developer: {
          note: 'This content is free - no X402 payment required',
          implementation: 'Direct access without payment verification',
          upgrade: 'Use /protected, /premium-plus, or /enterprise for paid tiers'
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error in free endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Free content route definition
 */
export const freeRoute: RouteDefinition = {
  path: '/free',
  method: 'get', 
  handler: freeHandler,
  requiresPayment: false,
  description: 'Free tier content for comparison'
}; 