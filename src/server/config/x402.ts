/**
 * X402 Payment Configuration Module
 * 
 * Configures the X402 payment middleware with route-specific settings.
 * Centralizes payment configuration for easy modification and understanding.
 */

import { paymentMiddleware } from 'x402-express';
import { facilitator } from '@coinbase/x402';
import type { Express } from 'express';

/**
 * Configure X402 payment middleware for the Express app
 * 
 * Sets up payment protection for specific routes with configured pricing
 * and payment options. Uses the official Coinbase facilitator for reliability.
 * 
 * @param app - Express application instance
 * @param serverWalletAddress - Server wallet address for receiving payments
 */
export function configureX402Middleware(app: Express, serverWalletAddress: string): void {
  try {
    app.use(paymentMiddleware(
      // Server wallet address for receiving payments
      serverWalletAddress as `0x${string}`,
      
      // Route-specific payment configurations
      {
        '/protected': {
          price: '0.01 USDC',              // Cost per request
          network: 'base-sepolia',          // Testnet for development
          config: {
            description: 'Access to protected AI service endpoint',
            maxTimeoutSeconds: 60           // Payment timeout
          }
        },
        '/premium-plus': {
          price: '0.1 USDC',               // Cost per request
          network: 'base-sepolia',          // Testnet for development
          config: {
            description: 'Premium Plus features with advanced AI models',
            maxTimeoutSeconds: 60           // Payment timeout
          }
        },
        '/enterprise': {
          price: '1.0 USDC',               // Cost per request
          network: 'base-sepolia',          // Testnet for development
          config: {
            description: 'Enterprise features with institutional data',
            maxTimeoutSeconds: 60           // Payment timeout
          }
        }
      },
      
      // Use official Coinbase facilitator for payment processing
      facilitator
    ));
    
    console.log('✅ X402 payment middleware configured');
  } catch (middlewareError: any) {
    console.error('❌ Failed to initialize X402 middleware:', middlewareError.message);
    process.exit(1);
  }
}

/**
 * X402 route configuration interface for type safety
 */
export interface X402RouteConfig {
  price: string;
  network: string;
  config?: {
    description?: string;
    maxTimeoutSeconds?: number;
  };
}

/**
 * Predefined route configurations for easy reference
 */
export const ROUTE_CONFIGS: Record<string, X402RouteConfig> = {
  '/protected': {
    price: '0.01 USDC',
    network: 'base-sepolia',
    config: {
      description: 'Premium AI-powered content with real-time analysis',
      maxTimeoutSeconds: 60
    }
  },
  '/premium-plus': {
    price: '0.1 USDC',
    network: 'base-sepolia',
    config: {
      description: 'Premium Plus features with advanced AI models',
      maxTimeoutSeconds: 60
    }
  },
  '/enterprise': {
    price: '1.0 USDC',
    network: 'base-sepolia',
    config: {
      description: 'Enterprise features with institutional data',
      maxTimeoutSeconds: 60
    }
  }
}; 