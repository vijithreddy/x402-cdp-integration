/**
 * Health Check Route Module
 * 
 * Simple health check endpoint for server monitoring.
 * This route is free and doesn't require any payments.
 */

import type { Request, Response } from 'express';

export interface RouteDefinition {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete';
  handler: (req: Request, res: Response) => void;
  requiresPayment?: boolean;
  price?: string;
  network?: string;
  description?: string;
}

/**
 * Health check route handler
 */
function healthHandler(req: Request, res: Response): void {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Server is running - this endpoint is free!',
    walletInfo: {
      server: process.env.SERVER_WALLET || 'Not configured',
      client: 'Dynamic'
    }
  });
}

/**
 * Health route definition
 */
export const healthRoute: RouteDefinition = {
  path: '/health',
  method: 'get',
  handler: healthHandler,
  requiresPayment: false,
  description: 'Server health check (free)'
}; 