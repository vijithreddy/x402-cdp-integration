/**
 * Premium Content Response Generator
 * 
 * Generates dynamic premium content that demonstrates the value of paid API access.
 * Creates realistic mock data that developers can see justifies the payment cost.
 */

/**
 * Generate premium AI analysis data
 */
function generateAIAnalysis() {
  return {
    sentiment: Math.random() > 0.5 ? 'positive' : 'bullish',
    confidence: (Math.random() * 40 + 60).toFixed(1) + '%',
    keywords: ['blockchain', 'payments', 'web3', 'fintech'],
    summary: 'Advanced AI analysis of payment trends and market sentiment'
  };
}

/**
 * Generate premium market data
 */
function generateMarketData() {
  return {
    priceHistory: Array.from({length: 5}, (_, i) => ({
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      price: (Math.random() * 100 + 2000).toFixed(2),
      volume: Math.floor(Math.random() * 1000000)
    })),
    predictiveModel: {
      nextHour: '+' + (Math.random() * 5).toFixed(2) + '%',
      accuracy: '87.3%',
      signals: ['bullish_momentum', 'volume_surge']
    }
  };
}

/**
 * Generate exclusive premium content metadata
 */
function generateExclusiveContent() {
  return {
    reportId: `PREMIUM-${Date.now()}`,
    accessLevel: 'GOLD_TIER',
    contentType: 'Real-time Analytics + AI Insights',
    remainingCredits: Math.floor(Math.random() * 50 + 10)
  };
}

/**
 * Generate complete premium content response
 * 
 * @param clientAddress - Address of the paying client
 * @returns Complete premium content response object
 */
export function generatePremiumContent(clientAddress: string) {
  const premiumFeatures = {
    aiAnalysis: generateAIAnalysis(),
    marketData: generateMarketData(),
    exclusiveContent: generateExclusiveContent()
  };

  return {
    // Payment success indicators
    paymentVerified: true,
    contentTier: 'PREMIUM',
    
    // Clear messaging
    message: '🔓 PREMIUM ACCESS GRANTED - Payment Verified',
    subtitle: 'You have successfully accessed protected content via X402 payment',
    
    // Premium content payload
    data: {
      // Payment metadata
      payment: {
        amount: '0.01 USDC',
        paidBy: clientAddress,
        timestamp: new Date().toISOString(),
        transactionType: 'X402_MICROPAYMENT'
      },
      
      // Mock premium features
      premiumFeatures,
      
      // Access metadata
      access: {
        contentId: `protected-${Date.now()}`,
        accessLevel: 'PREMIUM',
        validUntil: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        apiCallsRemaining: 99
      },
      
      // Real premium content examples
      insights: [
        '📊 Real-time market analysis updated every 30 seconds',
        '🤖 AI-powered predictions with 87%+ accuracy',
        '📈 Exclusive trading signals not available on free tier',
        '🔮 Predictive models based on 10M+ data points',
        '⚡ Sub-millisecond API response times'
      ],
      
      // Developer-friendly demonstration
      developer: {
        note: 'This content required X402 micropayment to access',
        implementation: 'Automatic payment handled by x402-axios interceptor',
        cost: '0.01 USDC per request',
        billing: 'Pay-per-use model - no subscriptions needed'
      }
    }
  };
} 