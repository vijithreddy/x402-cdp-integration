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

// Load server wallet configuration dynamically
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

// Load client wallet configuration for display
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
  } catch (error) {
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
  // Only log payment-related requests and errors, skip health checks
  if (req.url === '/protected' || req.url.startsWith('/api/') || res.statusCode >= 400) {
    serverLogger.flow('request', {
      method: req.method,
      url: req.url,
      client: 'Processing...' // We'll identify client after payment verification
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
    } catch (error) {
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
      } catch (error) {
        return 'unknown';
      }
    };
    
    res.json({
      success: true,
      message: '🎉 Payment successful! You accessed the protected endpoint.',
      data: {
        secretInfo: 'This is premium content that costs 0.01 USDC',
        timestamp: new Date().toISOString(),
        userAddress: getClientFromPayment()
      }
    });
  } catch (error: any) {
    console.error('❌ Error in protected endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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