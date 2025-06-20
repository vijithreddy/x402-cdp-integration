/**
 * Payment Header Parser Utility
 * 
 * Handles parsing and extraction of client addresses from X402 payment headers.
 * Centralizes payment parsing logic for reuse across different endpoints.
 */

import type { Request } from 'express';

/**
 * Extract client address from X402 payment header
 * 
 * Attempts to decode the x-payment header and extract the client's wallet address.
 * This is used for logging and response personalization.
 * 
 * @param req - Express request object containing headers
 * @returns Client wallet address or 'unknown' if not found
 */
export function getClientFromPayment(req: Request): string {
  const xPayment = req.headers['x-payment'] as string;
  if (!xPayment) return 'unknown';
  
  try {
    // Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(xPayment)) {
      return 'unknown';
    }
    
    // Decode and parse payment data
    const decoded = Buffer.from(xPayment, 'base64').toString('utf-8');
    const paymentData = JSON.parse(decoded);
    
    // X402 payment structure: payload.authorization.from contains client address
    if (paymentData?.payload?.authorization?.from) {
      const clientAddress = paymentData.payload.authorization.from;
      if (typeof clientAddress === 'string' && clientAddress.startsWith('0x')) {
        return clientAddress;
      }
    }
    
    // Fallback: check other common address fields
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
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Check if request has valid payment header
 * 
 * @param req - Express request object
 * @returns True if payment header exists and is valid format
 */
export function hasValidPaymentHeader(req: Request): boolean {
  const xPayment = req.headers['x-payment'] as string;
  return !!(xPayment && /^[A-Za-z0-9+/]*={0,2}$/.test(xPayment));
}

/**
 * Get payment metadata from request headers
 * 
 * @param req - Express request object
 * @returns Payment metadata object or null if not found
 */
export function getPaymentMetadata(req: Request): any | null {
  const xPayment = req.headers['x-payment'] as string;
  if (!xPayment) return null;
  
  try {
    const decoded = Buffer.from(xPayment, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
} 