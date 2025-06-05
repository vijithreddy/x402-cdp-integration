// Express Server Entry Point
// TODO: Implement your Express server here

import express from 'express';
import dotenv from 'dotenv';
import { paymentMiddleware } from 'x402-express';
import { facilitator } from '@coinbase/x402';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

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
    const serverAddress = walletData.defaultAddress || walletData.addresses?.[0];
    const serverName = walletData.accounts?.[0]?.name || 'Unknown';
    
    if (!serverAddress) {
      throw new Error('No valid address found in server wallet data');
    }

    console.log(`✅ Server wallet loaded: ${serverAddress}`);
    return { address: serverAddress, name: serverName };
  } catch (error) {
    console.error('❌ Failed to load server wallet:', error);
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
      const clientAddress = walletData.defaultAddress || walletData.addresses?.[0];
      const clientName = walletData.accounts?.[0]?.name || 'Unknown';
      return { address: clientAddress || 'Not configured', name: clientName };
    }
  } catch (error) {
    console.warn('⚠️ Could not load client wallet info for display');
  }
  
  return { address: 'Not configured', name: 'Unknown' };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Load wallet configurations
const serverWallet = loadServerWallet();
const clientWallet = loadClientWallet();

// Middleware for parsing JSON
app.use(express.json());

// Request logging middleware - shows all incoming requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📥 [${timestamp}] ${req.method} ${req.url}`);
  console.log(`🔍 Headers:`, {
    'user-agent': req.headers['user-agent']?.slice(0, 50) + '...',
    'content-type': req.headers['content-type'],
    'x-payment': req.headers['x-payment'] ? '✅ Payment header present' : '❌ No payment header',
    'x-wallet-address': req.headers['x-wallet-address'] || 'Not set'
  });
  
  // Log request body for payment-related requests
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📋 Body:`, req.body);
  }
  
  next();
});

// Response logging middleware - shows what we're sending back
app.use((req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function(data) {
    console.log(`📤 [${new Date().toISOString()}] ${req.method} ${req.url} → ${res.statusCode}`);
    if (res.statusCode === 402) {
      console.log(`💳 Sending 402 Payment Required for ${req.url}`);
      console.log(`🎯 Payment details will be in response body`);
    } else if (res.statusCode === 200 && req.url === '/protected') {
      console.log(`✅ Payment verified! Delivering protected content`);
    }
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    console.log(`📤 [${new Date().toISOString()}] ${req.method} ${req.url} → ${res.statusCode}`);
    if (res.statusCode === 402) {
      console.log(`💳 Sending 402 Payment Required for ${req.url}`);
      console.log(`🎯 Payment options:`, data.accepts?.map((a: any) => `${a.price || a.maxAmountRequired} ${a.extra?.name || 'tokens'} on ${a.network}`));
    } else if (res.statusCode === 200 && req.url === '/protected') {
      console.log(`✅ Payment verified! Delivering protected content`);
      console.log(`👤 User address: ${req.headers['x-wallet-address'] || 'unknown'}`);
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
app.use(paymentMiddleware(
  // Server wallet address loaded dynamically from server-wallet-data.json
  serverWallet.address as `0x${string}`,
  
  // Route configurations
  {
    '/protected': {
      price: '$0.01',
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

// Protected endpoint that requires payment
app.get('/protected', (req, res) => {
  res.json({
    success: true,
    message: '🎉 Payment successful! You accessed the protected endpoint.',
    data: {
      secretInfo: 'This is premium content that costs 0.01 USDC',
      timestamp: new Date().toISOString(),
      userAddress: req.headers['x-wallet-address'] || 'unknown'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
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

app.listen(PORT, () => {
  console.log('\n🚀====================================🚀');
  console.log('🚀         X402 SERVER READY         🚀');
  console.log('🚀====================================🚀');
  console.log(`\n📍 Server URL: http://localhost:${PORT}`);
  console.log(`💰 Protected endpoint: http://localhost:${PORT}/protected`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`\n🔑 Payment Configuration:`);
  console.log(`   💳 Price: 0.01 USDC per request`);
  console.log(`   🌐 Network: Base Sepolia`);
  console.log(`   🏦 Facilitator: Official Coinbase facilitator`);
  console.log(`\n💼 Wallet Configuration:`);
  console.log(`   📥 Server (receives): ${serverWallet.address}`);
  console.log(`   📤 Client (pays): ${clientWallet.address}`);
  console.log(`   📋 Names: Server="${serverWallet.name}", Client="${clientWallet.name}"`);
  console.log(`\n🔄 Waiting for X402 payment requests...`);
  console.log('📝 All requests and payment flows will be logged below:\n');
}); 