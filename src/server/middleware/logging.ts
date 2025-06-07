/**
 * Logging Middleware
 * 
 * Handles comprehensive request and response logging for X402 payment flows.
 * Provides clear visibility into free vs paid content access patterns.
 */

import type { Request, Response, NextFunction } from 'express';
import { createLogger, parseLogFlags } from '../../shared/utils/logger';
import { getClientFromPayment } from '../utils/payment-parser';

// Initialize server logger
const logConfig = parseLogFlags();
const serverLogger = createLogger(logConfig);

/**
 * Request logging middleware
 * 
 * Logs incoming requests with appropriate classification (FREE, PROTECTED, etc.)
 * Skips health checks to reduce noise while capturing important content requests.
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
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
}

/**
 * Response logging middleware
 * 
 * Logs responses with payment status and content delivery confirmation.
 * Tracks the complete flow from request to content delivery.
 */
export function responseLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const originalSend = res.send;
  const originalJson = res.json;
  let responseLogged = false; // Prevent duplicate logging
  
  const logResponse = (statusCode: number) => {
    if (responseLogged) return;
    responseLogged = true;
    
    const clientAddress = getClientFromPayment(req);
    
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
        to: 'server', // Will be populated with actual server address
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
}

// Logger is used internally within middleware only 