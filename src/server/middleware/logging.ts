/**
 * Logging Middleware
 * 
 * Handles comprehensive request and response logging for X402 payment flows.
 * Provides clear visibility into free vs paid content access patterns.
 */

import type { Request, Response, NextFunction } from 'express';
import { logger, parseLogFlags } from '../../shared/utils/logger';
import { getClientFromPayment } from '../utils/payment-parser';

// Initialize server logger
const logConfig = parseLogFlags();
logger.updateConfig(logConfig);

/**
 * Request logging middleware
 * 
 * Now disabled - all logging happens in response middleware to avoid duplicates
 * and provide better payment flow visibility.
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip all request logging - everything happens in response middleware
  // This prevents duplicate logs and provides cleaner payment flow tracking
  
  // Only log request body in debug mode for debugging
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug('Request body', req.body);
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
    const shortClient = clientAddress !== 'unknown' ? 
      `${clientAddress.substring(0, 6)}...${clientAddress.substring(38)}` : 
      'unknown';
    
    // Log based on status code and endpoint
    if (statusCode === 402) {
      // Payment required - determine price and content type from route config
      let routePrice = 'varies';
      let contentType = 'content';
      
      if (req.url === '/protected') {
        routePrice = '0.01 USDC';
        contentType = 'Basic';
      } else if (req.url === '/premium-plus') {
        routePrice = '0.1 USDC';
        contentType = 'Premium';
      } else if (req.url === '/enterprise') {
        routePrice = '1.0 USDC';
        contentType = 'Enterprise';
      }
      
      // For 402 status, show descriptive client request message
      let paymentClient = shortClient;
      if (paymentClient === 'unknown') {
        paymentClient = `requesting ${contentType}`;
      } else {
        paymentClient = `${shortClient} requesting ${contentType}`;
      }
      
      logger.flow('payment_required', {
        client: paymentClient,
        endpoint: req.url,
        amount: routePrice
      });
    } else if (statusCode === 200) {
      if (req.url === '/free') {
        // Free content access
        logger.flow('free_content_accessed', {
          client: 'public',
          endpoint: req.url,
          cost: 'FREE',
          tier: 'PUBLIC'
        });
      } else if (req.url === '/protected' || req.url === '/premium-plus' || req.url === '/enterprise') {
        // Successful payment and content delivery
        const routePrice = req.url === '/protected' ? '0.01 USDC' :
                          req.url === '/premium-plus' ? '0.1 USDC' :
                          req.url === '/enterprise' ? '1.0 USDC' : 'varies';
        
        logger.info('Payment verified', {
          amount: routePrice,
          from: shortClient,
          to: 'server',
          status: 'success'
        });
        
        logger.flow('content_delivered', {
          client: shortClient,
          status: 'Success'
        });
      }
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
      logger.debug('Payment options', {
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