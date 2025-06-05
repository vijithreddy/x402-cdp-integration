// Express Server Entry Point
// TODO: Implement your Express server here

import express from 'express';
import dotenv from 'dotenv';
import { paymentMiddleware } from 'x402-express';
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
  
  // Facilitator configuration
  {
    url: 'https://x402.org/facilitator'
  }
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
  console.log(`🚀 X402 Server running on http://localhost:${PORT}`);
  console.log(`💰 Protected endpoint: http://localhost:${PORT}/protected`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Server wallet (receives): ${serverWallet.address}`);
  console.log(`💼 Client wallet (pays): ${clientWallet.address}`);
  console.log(`💳 Payment required: 0.01 USDC per request`);
  console.log(`📋 Wallet names: Server="${serverWallet.name}", Client="${clientWallet.name}"`);
}); 