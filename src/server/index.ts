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
import { registerRoutes, allRoutes } from './routes';
import { requestLoggingMiddleware, responseLoggingMiddleware } from './middleware/logging';

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

// Apply logging middleware
app.use(requestLoggingMiddleware);
app.use(responseLoggingMiddleware);

// Configure X402 payment middleware for all premium routes
try {
  // Build route configurations from modular route definitions
  const routeConfigs: Record<string, any> = {};
  
  for (const route of allRoutes) {
    if (route.requiresPayment) {
      routeConfigs[route.path] = {
        price: route.price,
        network: route.network || 'base-sepolia',
        config: {
          description: route.description || `Access to ${route.path} endpoint`,
          maxTimeoutSeconds: 60
        }
      };
    }
  }
  
  console.log('🔧 Configuring X402 middleware for routes:', Object.keys(routeConfigs));
  
  app.use(paymentMiddleware(
    // Server wallet address loaded dynamically from server-wallet-data.json
    serverWallet.address as `0x${string}`,
    
    // Route configurations from modular route definitions
    routeConfigs,
    
    // Use official Coinbase facilitator
    facilitator
  ));
} catch (middlewareError: any) {
  console.error('❌ Failed to initialize X402 middleware:', middlewareError.message);
  process.exit(1);
}

// Register all modular routes
registerRoutes(app);

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
  // Generate available endpoints dynamically from route registry
  const availableEndpoints = allRoutes.map(route => {
    const costInfo = route.requiresPayment ? `requires ${route.price} payment` : 'free';
    return `${route.method.toUpperCase()} ${route.path} (${costInfo})`;
  });
  
  res.status(404).json({ 
    error: 'Not found',
    message: `Endpoint ${req.originalUrl} not found`,
    availableEndpoints
  });
});

// Start server with error handling
const server = app.listen(PORT, () => {
  serverLogger.header('X402 Payment Server - Base Sepolia', `Listening: http://localhost:${PORT}`);
  serverLogger.ui(`Server Wallet: ${serverWallet.address} | Client Wallet: ${clientWallet.address}`);
  serverLogger.separator();
  
  // Show all available endpoints
  const endpointSummary = allRoutes.reduce((acc: Record<string, string>, route) => {
    const costInfo = route.requiresPayment ? route.price : 'free';
    acc[route.path] = `${route.path} (${costInfo})`;
    return acc;
  }, {});
  
  // Verbose configuration details only in debug mode
  serverLogger.debug('Server configuration', {
    port: PORT,
    endpoints: endpointSummary,
    payment: {
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