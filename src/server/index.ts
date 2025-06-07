/**
 * X402 Express Server for Payment-Protected Content
 * 
 * A production-ready Express server implementing the X402 payment protocol
 * for serving payment-protected content. Features professional logging,
 * security headers, and dynamic wallet configuration.
 * 
 * Features:
 * - X402 payment middleware integration
 * - Dynamic server/client wallet loading
 * - Professional structured logging
 * - Security headers and input validation
 * - Graceful error handling and shutdown
 * - Real-time payment verification and logging
 * 
 * @example
 * ```bash
 * npm run dev:server
 * # Server starts on http://localhost:3000
 * # Protected endpoint: GET /protected (requires 0.01 USDC payment)
 * ```
 * 
 * @since 1.0.0
 */

// Express Server Entry Point
// TODO: Implement your Express server here

import express from 'express';
import dotenv from 'dotenv';
import { paymentMiddleware } from 'x402-express';
import { facilitator } from '@coinbase/x402';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger, parseLogFlags } from '../shared/utils/logger';

// Load environment variables
dotenv.config();

// Initialize server logger
const logConfig = parseLogFlags();
const serverLogger = createLogger(logConfig);

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * Load server wallet configuration dynamically from saved wallet data
 * 
 * Reads the server wallet configuration from the JSON file created during setup.
 * This ensures the server uses the correct wallet address for receiving payments.
 * 
 * @returns {{ address: string, name: string }} Server wallet configuration with address and name
 * @throws {Error} When server wallet file is missing or invalid
 * @example
 * ```typescript
 * const serverWallet = loadServerWallet();
 * console.log(`Server wallet: ${serverWallet.address}`);
 * ```
 */
function loadServerWallet(): { address: string; name: string } {
  const serverWalletPath = path.join(process.cwd(), 'server-wallet-data.json');
  
  if (!fs.existsSync(serverWalletPath)) {
    console.error('❌ Server wallet not found! Please run: npm run setup');
    console.log('💡 This will create both client and server wallets automatically.');
    process.exit(1);
  }

  try {
    const walletData = JSON.parse(fs.readFileSync(serverWalletPath, 'utf8'));
    
    // Validate wallet data structure
    if (!walletData || typeof walletData !== 'object') {
      throw new Error('Invalid wallet data format');
    }
    
    const serverAddress = walletData.defaultAddress || walletData.addresses?.[0];
    const serverName = walletData.accounts?.[0]?.name || 'Unknown';
    
    if (!serverAddress || !serverAddress.startsWith('0x') || serverAddress.length !== 42) {
      throw new Error('No valid address found in server wallet data');
    }

    console.log(`✅ Server wallet loaded: ${serverAddress}`);
    return { address: serverAddress, name: serverName };
  } catch (error: any) {
    console.error('❌ Failed to load server wallet:', error.message || error);
    console.log('💡 Please run: npm run setup');
    process.exit(1);
  }
}

/**
 * Load client wallet configuration for display purposes
 * 
 * Attempts to load client wallet information for logging and display.
 * This is optional and used only for better user experience in logs.
 * 
 * @returns {{ address: string, name: string }} Client wallet information (may contain placeholder values)
 * @example
 * ```typescript
 * const clientWallet = loadClientWallet();
 * console.log(`Client wallet: ${clientWallet.address}`);
 * ```
 */
function loadClientWallet(): { address: string; name: string } {
  const clientWalletPath = path.join(process.cwd(), 'wallet-data.json');
  
  try {
    if (fs.existsSync(clientWalletPath)) {
      const walletData = JSON.parse(fs.readFileSync(clientWalletPath, 'utf8'));
      
      if (walletData && typeof walletData === 'object') {
        const clientAddress = walletData.defaultAddress || walletData.addresses?.[0];
        const clientName = walletData.accounts?.[0]?.name || 'Unknown';
        return { address: clientAddress || 'Not configured', name: clientName };
      }
    }
  } catch {
    console.warn('⚠️ Could not load client wallet info for display');
  }
  
  return { address: 'Not configured', name: 'Unknown' };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Validate port
if (isNaN(Number(PORT)) || Number(PORT) < 1 || Number(PORT) > 65535) {
  console.error('❌ Invalid PORT value. Must be a number between 1-65535');
  process.exit(1);
}

// Load wallet configurations
const serverWallet = loadServerWallet();
const clientWallet = loadClientWallet();

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Middleware for parsing JSON with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware - optimized telemetry
app.use((req, res, next) => {
  // Log content requests (both free and paid) for comparison, skip health checks
  if (req.url === '/protected' || req.url === '/free' || req.url.startsWith('/api/') || res.statusCode >= 400) {
    const requestType = req.url === '/free' ? 'FREE content request' : 
                       req.url === '/protected' ? 'PROTECTED content request' : 'Request';
    
    serverLogger.flow('request', {
      method: req.method,
      url: req.url,
      type: requestType,
      client: req.url === '/free' ? 'public' : 'Processing...' // Free = public, protected = identify after payment
    });
  }
  
  // Only log request body in verbose mode for debugging
  if (req.body && Object.keys(req.body).length > 0) {
    serverLogger.debug('Request body', req.body);
  }
  
  next();
});

// Response logging middleware - eliminate duplicates
app.use((req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  let responseLogged = false; // Prevent duplicate logging
  
  // Helper to extract client address from x-payment header
  const getClientFromPayment = (): string => {
    const xPayment = req.headers['x-payment'] as string;
    if (!xPayment) return 'unknown';
    
    try {
      // Try to decode as base64 and parse JSON
      if (/^[A-Za-z0-9+/]*={0,2}$/.test(xPayment)) {
        const decoded = Buffer.from(xPayment, 'base64').toString('utf-8');
        const paymentData = JSON.parse(decoded);
        
        // X402 payment structure: payload.authorization.from contains the client address
        if (paymentData?.payload?.authorization?.from) {
          const clientAddress = paymentData.payload.authorization.from;
          if (typeof clientAddress === 'string' && clientAddress.startsWith('0x')) {
            return clientAddress;
          }
        }
        
        // Fallback: look for other common address fields
        const possibleAddresses = [
          paymentData.from,
          paymentData.payer, 
          paymentData.sender,
          paymentData.address,
          paymentData.wallet,
          paymentData.account
        ].filter(addr => addr && typeof addr === 'string' && addr.startsWith('0x'));
        
        if (possibleAddresses.length > 0) {
          return possibleAddresses[0];
        }
      }
      
      return 'unknown';
    } catch {
      return 'unknown';
    }
  };
  
  const logResponse = (statusCode: number) => {
    if (responseLogged) return;
    responseLogged = true;
    
    const clientAddress = getClientFromPayment();
    
    if (statusCode === 402) {
      serverLogger.flow('payment_required', {
        client: clientAddress,
        endpoint: req.url,
        amount: '0.01 USDC'
      });
    } else if (statusCode === 200 && req.url === '/protected') {
      serverLogger.transaction('payment_verified', {
        amount: '0.01 USDC',
        from: clientAddress,
        to: serverWallet.address,
        status: 'success' as const
      });
      
      serverLogger.flow('content_delivered', {
        client: clientAddress,
        status: 'Success'
      });
    } else if (statusCode === 200 && req.url === '/free') {
      // Log free content access for comparison with paid content
      serverLogger.flow('free_content_accessed', {
        client: 'public',
        endpoint: req.url,
        cost: 'FREE',
        tier: 'PUBLIC'
      });
      
      serverLogger.ui('Free tier request - no payment required');
    }
  };
  
  res.send = function(data) {
    logResponse(res.statusCode);
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    logResponse(res.statusCode);
    
    // Only log payment options in verbose/debug mode
    if (res.statusCode === 402 && data.accepts) {
      serverLogger.debug('Payment options', {
        options: data.accepts.map((a: any) => {
          const amount = a.maxAmountRequired ? (parseInt(a.maxAmountRequired) / 1000000).toFixed(2) : a.price;
          const currency = a.network === 'base-sepolia' ? 'USDC' : (a.extra?.name || 'tokens');
          return `${amount} ${currency} on ${a.network}`;
        })
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
});

// Basic health check endpoint (free)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Server is running - this endpoint is free!',
    walletInfo: {
      server: serverWallet.address,
      client: clientWallet.address
    }
  });
});

// Free tier endpoint for comparison
app.get('/free', (req, res) => {
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
        upgrade: 'Try the /protected endpoint (requires 0.01 USDC payment)',
        benefits: 'Unlock premium features, real-time data, and AI analysis'
      }
    }
  });
});

// X402 payment middleware - configure for protected routes
try {
  app.use(paymentMiddleware(
    // Server wallet address loaded dynamically from server-wallet-data.json
    serverWallet.address as `0x${string}`,
    
    // Route configurations
    {
      '/protected': {
        price: '0.01 USDC',
        network: 'base-sepolia',
        config: {
          description: 'Access to protected AI service endpoint',
          maxTimeoutSeconds: 60
        }
      }
    },
    
    // Use official Coinbase facilitator instead of broken testnet one
    facilitator
  ));
} catch (middlewareError: any) {
  console.error('❌ Failed to initialize X402 middleware:', middlewareError.message);
  process.exit(1);
}

// Protected endpoint that requires payment
app.get('/protected', (req, res) => {
  try {
    // Helper to extract client address from x-payment header
    const getClientFromPayment = (): string => {
      const xPayment = req.headers['x-payment'] as string;
      if (!xPayment) return 'unknown';
      
      try {
        // Try to decode as base64 and parse JSON
        if (/^[A-Za-z0-9+/]*={0,2}$/.test(xPayment)) {
          const decoded = Buffer.from(xPayment, 'base64').toString('utf-8');
          const paymentData = JSON.parse(decoded);
          
          // X402 payment structure: payload.authorization.from contains the client address
          if (paymentData?.payload?.authorization?.from) {
            const clientAddress = paymentData.payload.authorization.from;
            if (typeof clientAddress === 'string' && clientAddress.startsWith('0x')) {
              return clientAddress;
            }
          }
          
          // Fallback: look for other common address fields
          const possibleAddresses = [
            paymentData.from,
            paymentData.payer, 
            paymentData.sender,
            paymentData.address,
            paymentData.wallet,
            paymentData.account
          ].filter(addr => addr && typeof addr === 'string' && addr.startsWith('0x'));
          
          if (possibleAddresses.length > 0) {
            return possibleAddresses[0];
          }
        }
        
        return 'unknown';
      } catch {
        return 'unknown';
      }
    };
    
    // Generate mock premium content to demonstrate value
    const premiumFeatures = {
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

    res.json({
      // Payment success indicator
      paymentVerified: true,
      contentTier: 'PREMIUM',
      
      // Clear messaging
      message: '🔓 PREMIUM ACCESS GRANTED - Payment Verified',
      subtitle: 'You have successfully accessed protected content via X402 payment',
      
      // Premium content payload
      data: {
        // Payment metadata
        payment: {
          amount: '0.01 USDC',
          paidBy: getClientFromPayment(),
          timestamp: new Date().toISOString(),
          transactionType: 'X402_MICROPAYMENT'
        },
        
        // Mock premium features that would justify the payment
        premiumFeatures,
        
        // Access metadata
        access: {
          contentId: `protected-${Date.now()}`,
          accessLevel: 'PREMIUM',
          validUntil: new Date(Date.now() + 3600000).toISOString(), // 1 hour
          apiCallsRemaining: 99
        },
        
        // Real premium content examples
        insights: [
          '📊 Real-time market analysis updated every 30 seconds',
          '🤖 AI-powered predictions with 87%+ accuracy',
          '📈 Exclusive trading signals not available on free tier',
          '🔮 Predictive models based on 10M+ data points',
          '⚡ Sub-millisecond API response times'
        ],
        
        // Developer-friendly demonstration
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
});

// Enhanced error handling middleware
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  
  // Handle specific error types
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      error: 'Invalid JSON format',
      message: 'Request body contains invalid JSON' 
    });
  }
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ 
      error: 'Request too large',
      message: 'Request body exceeds size limit' 
    });
  }
  
  // Generic error response
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Endpoint ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /health (free)',
      'GET /free (free - compare with premium)',
      'GET /protected (requires 0.01 USDC payment)'
    ]
  });
});

// Start server with error handling
const server = app.listen(PORT, () => {
  serverLogger.header('X402 Payment Server - Base Sepolia', `Listening: http://localhost:${PORT}`);
  serverLogger.ui(`Server Wallet: ${serverWallet.address} | Client Wallet: ${clientWallet.address}`);
  serverLogger.separator();
  
  // Verbose configuration details only in debug mode
  serverLogger.debug('Server configuration', {
    port: PORT,
    endpoints: {
      protected: `/protected (0.01 USDC)`,
      health: `/health (free)`
    },
    payment: {
      price: '0.01 USDC',
      network: 'base-sepolia',
      facilitator: 'Coinbase official'
    },
    wallets: {
      server: serverWallet.address,
      client: clientWallet.address
    }
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n⚠️ ${signal} received. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle server startup errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.log('💡 Try a different port or stop the existing server');
  } else if (error.code === 'EACCES') {
    console.error(`❌ Permission denied for port ${PORT}`);
    console.log('💡 Try using a port number above 1024');
  } else {
    console.error('❌ Server startup error:', error.message);
  }
  process.exit(1);
}); 