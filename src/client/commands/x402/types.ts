/**
 * X402 Payment Command Types
 * 
 * Shared type definitions for X402 payment commands.
 */

/**
 * X402 payment tiers available in the system
 */
export type X402Tier = 'tier1' | 'tier2' | 'tier3';

/**
 * X402 endpoint configuration
 */
export interface X402EndpointConfig {
  endpoint: string;
  expectedCost: string;
  tier: X402Tier;
  tierName: string;
  description: string;
}

/**
 * Payment details returned from server
 */
export interface PaymentDetails {
  amount: string;
  paidBy: string;
  timestamp: string;
  transactionType: string;
}

/**
 * Access information for premium content
 */
export interface AccessInfo {
  contentId: string;
  accessLevel: string;
  validUntil: string;
  apiCallsRemaining: number;
}

/**
 * Complete X402 payment response structure
 */
export interface X402PaymentResponse {
  paymentVerified: boolean;
  contentTier: string;
  message: string;
  subtitle: string;
  data: {
    payment: PaymentDetails;
    access: AccessInfo;
    insights: string[];
  };
} 