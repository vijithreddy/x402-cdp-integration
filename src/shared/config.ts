/**
 * Centralized Configuration Module
 * 
 * All configuration settings for the X402-CDP integration.
 * Makes it easy to modify settings in one place.
 */

export const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    baseUrl: 'http://localhost:3000',
    network: 'base-sepolia',
    facilitator: 'Coinbase official'
  },

  // X402 payment tiers
  x402: {
    tiers: {
      basic: {
        name: 'Basic Premium',
        price: '0.01 USDC',
        endpoint: '/protected',
        description: 'Basic premium features with AI analysis and market data'
      },
      premium: {
        name: 'Premium Plus',
        price: '0.1 USDC',
        endpoint: '/premium-plus',
        description: 'Advanced AI models, predictive analytics, and exclusive reports'
      },
      enterprise: {
        name: 'Enterprise',
        price: '1.0 USDC',
        endpoint: '/enterprise',
        description: 'Enterprise analytics, institutional data, and custom insights'
      }
    },
    // Common X402 settings
    settings: {
      maxTimeoutSeconds: 60,
      defaultNetwork: 'base-sepolia'
    }
  },

  // Wallet configuration
  wallet: {
    fileNames: {
      client: 'wallet-data.json',
      server: 'server-wallet-data.json'
    },
    defaultName: 'CDP-CLI-Account'
  },

  // Logging configuration
  logging: {
    levels: {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      success: '✅',
      debug: '🔍',
      flow: '🔄',
      ui: '💬'
    },
    colors: {
      error: 'red',
      warn: 'yellow',
      info: 'blue',
      success: 'green',
      debug: 'gray',
      flow: 'cyan',
      ui: 'white'
    }
  }
}; 