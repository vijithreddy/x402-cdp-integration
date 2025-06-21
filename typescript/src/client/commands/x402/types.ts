/**
 * X402 Payment Command Types
 * 
 * Shared type definitions for X402 payment commands.
 */

/**
 * X402 payment tiers available in the system
 */
export type X402Tier = 'free' | 'tier1' | 'tier2' | 'tier3';

/**
 * AI response source types
 */
export type AISource = 'openai' | 'boilerplate' | 'fallback';

/**
 * AI Analysis content structure
 */
export interface AIAnalysis {
  content: string;
  source: AISource;
  tier: X402Tier;
  sentiment?: string;
  confidence?: string;
  model?: string;
  market_data_used?: boolean;
}

/**
 * Market data structure from AI service
 */
export interface MarketData {
  nextHour?: string;
  nextDay?: string;
  nextWeek?: string;
  accuracy?: string;
  signals?: string[];
  sentiment?: string;
  confidence?: string;
  riskLevel?: string;
  [key: string]: any; // Allow additional market data fields
}

/**
 * Key insights structure
 */
export interface KeyInsights {
  insights: string[];
  timestamp: string;
}

/**
 * AI Service Response (matches Python AI service)
 */
export interface AIResponse {
  content: string;
  source: AISource;
  tier: X402Tier;
  market_data: MarketData;
  key_insights: string[];
  timestamp: string;
}

/**
 * Server Response Structure for AI Content
 */
export interface AIContentResponse {
  aiAnalysis: AIAnalysis;
  marketData: MarketData;
  exclusiveContent: any[];
  keyInsights: string[];
  timestamp: string;
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
 * Access information for content
 */
export interface AccessInfo {
  contentId: string;
  accessLevel: string;
  validUntil: string;
  apiCallsRemaining: number;
}

/**
 * Complete server response structure
 */
export interface ServerResponse {
  paymentVerified: boolean;
  contentTier: string;
  message: string;
  subtitle?: string;
  data: {
    payment: PaymentDetails;
    premiumFeatures?: AIContentResponse;
    premiumPlusFeatures?: AIContentResponse;
    enterpriseFeatures?: AIContentResponse;
    access: AccessInfo;
    insights: string[];
    developer?: {
      note: string;
      implementation: string;
      cost: string;
      billing: string;
    };
  };
}

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
 * Error types for better error handling
 */
export interface X402Error {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

/**
 * AI Service Health Check Response
 */
export interface AIHealthResponse {
  status: string;
  service: string;
  version: string;
  openai_available: boolean;
  use_ai_responses: boolean;
  market_data_available?: boolean;
  last_check?: string;
} 