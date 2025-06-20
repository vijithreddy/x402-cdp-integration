/**
 * Security Middleware
 * 
 * Implements basic security headers and request validation for the X402 server.
 * Provides essential security without interfering with payment functionality.
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Apply security headers to all responses
 * 
 * Sets essential security headers to protect against common web vulnerabilities
 * while maintaining compatibility with X402 payment flows.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Note: We don't set CORS headers here as X402 may need specific CORS handling
  
  next();
}

/**
 * Validate port number for server startup
 * 
 * @param port - Port number to validate
 * @returns True if port is valid
 */
export function validatePort(port: string | number): boolean {
  const portNum = Number(port);
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
}

/**
 * Basic request size and format validation
 * 
 * Validates incoming requests to prevent abuse while allowing legitimate X402 payments.
 */
export function requestValidationMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check for extremely large requests (basic protection)
  const contentLength = req.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    res.status(413).json({ 
      error: 'Request too large',
      message: 'Request body exceeds size limit'
    });
    return;
  }
  
  next();
} 