/**
 * X402 Payment Command Types
 * 
 * Shared type definitions for all X402 payment tier commands.
 * Defines the structure of payment responses and content tiers.
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
 * AI analysis data structure
 */
export interface AIAnalysis {
  sentiment: string;
  confidence: string;
  keywords: string[];
  summary: string;
  modelVersion?: string;
  riskAssessment?: {
    score: string;
    factors: string[];
    recommendation: string;
  };
}

/**
 * Market data structure
 */
export interface MarketData {
  priceHistory: Array<{
    timestamp: string;
    price: string;
    volume: number;
  }>;
  predictiveModel: {
    nextHour: string;
    accuracy: string;
    signals: string[];
  };
  institutionalData?: {
    volumeProfile: string;
    liquidityScore: string;
    institutionalFlow: string;
  };
}

/**
 * Exclusive content structure
 */
export interface ExclusiveContent {
  reportId: string;
  accessLevel: string;
  contentType: string;
  remainingCredits: number;
  customInsights?: string[];
  exclusiveReports?: Array<{
    id: string;
    title: string;
    confidenceLevel: string;
  }>;
}

/**
 * Premium features container
 */
export interface PremiumFeatures {
  aiAnalysis: AIAnalysis;
  marketData: MarketData;
  exclusiveContent: ExclusiveContent;
}

/**
 * Developer information
 */
export interface DeveloperInfo {
  note: string;
  implementation: string;
  cost: string;
  billing: string;
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
    premiumFeatures: PremiumFeatures;
    access: AccessInfo;
    insights: string[];
    developer: DeveloperInfo;
  };
} 