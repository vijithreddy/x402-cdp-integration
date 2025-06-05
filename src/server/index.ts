// Express Server Entry Point
// TODO: Implement your Express server here

import express from 'express';
import dotenv from 'dotenv';
import { paymentMiddleware } from 'x402-express';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON
app.use(express.json());

// Basic health check endpoint (free)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Server is running - this endpoint is free!' 
  });
});

// X402 payment middleware - configure for protected routes
app.use(paymentMiddleware(
  // Server wallet address to receive payments (different from client wallet)  
  '0xA35d0FD4a75b50F2Bc71c50a922C8215b9bBE308',
  
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
  console.log(`🔑 Server wallet (receives): 0xA35d0FD4a75b50F2Bc71c50a922C8215b9bBE308`);
  console.log(`💼 Client wallet (pays): 0x5c5C20967E9E779C4510F3528b1156ea05bbFa42`);
  console.log(`💳 Payment required: 0.01 USDC per request`);
}); 