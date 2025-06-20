/**
 * Free Content Route Module
 * 
 * Provides free tier content for comparison with premium offerings.
 * Demonstrates the value proposition of paid content.
 */

import type { Request, Response } from 'express';
import type { RouteDefinition } from './health';

/**
 * Free content route handler
 */
function freeHandler(req: Request, res: Response): void {
  res.json({
    contentTier: 'FREE',
    message: '📖 Free Content - No Payment Required',
    subtitle: 'This content is available without any payment',
    data: {
      basicInfo: {
        service: 'X402 Demo API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        accessLevel: 'PUBLIC'
      },
      freeFeatures: [
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
      }
    }
  });
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