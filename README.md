# X402 Payment System - Interactive Developer Playground

A **X402 micropayment system** with modular architecture, comprehensive logging, and tiered payment system. Perfect for learning X402 integration or building payment-protected content APIs.

## 🚀 **Quick Start**

```bash
# 1. Clone and install
git clone git@github.com:vijithreddy/x402-cdp-integration.git
cd x402-cdp-integration
npm install

# 2. Setup environment (.env file)
cp .env.example .env
# Add your CDP API credentials to .env

# 3. One-command setup (creates wallets automatically)
npm run setup

# 4. Start testing X402 payments
npm run dev:server  # Terminal 1: Payment server
npm run dev:client  # Terminal 2: Interactive CLI
```

## 🎮 **Interactive CLI Features**

### **Three-Tier Payment System**
Test different pricing models and content quality levels:

| Command | Cost | Content Type | Features |
|---------|------|--------------|----------|
| `free` | **FREE** | Public content | Basic data, 15-min delays, limited features |
| `test` / `x402` | **0.01 USDC** | Basic premium | Real-time AI analysis, market predictions |
| `tier2` | **0.1 USDC** | Premium Plus | Institutional-grade analytics, whale tracking |
| `tier3` | **1.0 USDC** | Enterprise | Custom insights, sub-millisecond data, compliance |

### **Wallet Management Commands**
| Command | Description | Example |
|---------|-------------|---------|
| `balance` / `bal` | Check USDC balance | `💰 Current USDC balance: 4.75 USDC` |
| `fund [amount]` | Add USDC from faucet | `✅ Funding operation completed!` |
| `info` / `status` | Show wallet info | Address, balance, session status |
| `refresh` / `reload` | Force refresh from blockchain | Updates cached balance |

### **Utility Commands**
| Command | Description |
|---------|-------------|
| `help` / `h` | Show all available commands |
| `clear` / `cls` | Clear the screen |
| `exit` / `quit` / `q` | Exit CLI with cleanup |

## 📊 **Server Logging Examples**

### **Clean Output**
```bash
X402 Payment Server - Base Sepolia    
Listening: http://localhost:3000
Server Wallet: 0x9c5F...cA36 | Client Wallet: 0xA35d...E308
──────────────────────────────────────────────────

# Free content access
[18:45:01] [FREE_CONTENT_ACCESSED] Client: public | Endpoint: /free | Cost: FREE

# Basic premium payment flow
[18:45:27] [PAYMENT_REQUIRED] Client: requesting Basic | Amount: 0.01 USDC
[18:45:28] [PAYMENT_VERIFIED] 0.01 USDC 0xA35d...E308 → 0x9c5F...cA36
[18:45:28] [CONTENT_DELIVERED] Client: 0xA35d...E308 | Status: Success

# Premium Plus payment flow  
[18:45:41] [PAYMENT_REQUIRED] Client: requesting Premium | Amount: 0.1 USDC
[18:45:42] [PAYMENT_VERIFIED] 0.1 USDC 0xA35d...E308 → 0x9c5F...cA36
[18:45:42] [CONTENT_DELIVERED] Client: 0xA35d...E308 | Status: Success

# Enterprise payment flow
[18:45:59] [PAYMENT_REQUIRED] Client: requesting Enterprise | Amount: 1.0 USDC
[18:46:00] [PAYMENT_VERIFIED] 1.0 USDC 0xA35d...E308 → 0x9c5F...cA36
[18:46:00] [CONTENT_DELIVERED] Client: 0xA35d...E308 | Status: Success
```

## 🏗️ **Modular Architecture**

### **🎯 Key Architectural Decision: Centralized X402 Middleware**

**No per-route middleware needed!** We use a **centralized approach**:

```typescript
// ✅ ONE middleware handles ALL payment routes
app.use(paymentMiddleware(serverWallet, routeConfigs, facilitator));

// ✅ Routes just define requirements declaratively  
const route = {
  requiresPayment: true,
  price: '0.05 USDC',
  handler: justReturnsContent  // No payment logic needed!
};
```

**Benefits:**
- 🚀 **Simple route handlers** - Just return content, no payment code
- 🔧 **Auto-configuration** - Payment setup derived from route definitions  
- 📊 **Consistent logging** - All payments tracked the same way
- 🛠️ **Easy maintenance** - One place to update payment logic

### **Client Architecture**
```
src/client/
├── index.ts                 # Clean 8-line entry point
├── core/
│   ├── cli.ts              # Main CLI class with session management  
│   └── commands.ts         # Command registry and router
├── commands/
│   ├── balance.ts          # Wallet balance checking
│   ├── fund.ts             # Faucet funding
│   ├── info.ts             # Wallet information
│   ├── free.ts             # Free content test
│   ├── help.ts             # Command help system
│   └── x402/               # Modular X402 payment system
│       ├── index.ts        # Shared utilities & config
│       ├── types.ts        # TypeScript interfaces
│       ├── tier1.ts        # Basic Premium (0.01 USDC)
│       ├── tier2.ts        # Premium Plus (0.1 USDC)
│       └── tier3.ts        # Enterprise (1.0 USDC)
├── types/
│   └── commands.ts         # CLI command interfaces
└── utils/
    └── display.ts          # Output formatting utilities
```

### **Server Architecture**
```
src/server/
├── index.ts                # Main server with proper imports
├── routes/
│   ├── index.ts           # Route registry with auto-discovery
│   ├── health.ts          # Health check endpoint
│   ├── free.ts            # Free content endpoint
│   ├── protected.ts       # Basic premium (0.01 USDC)
│   ├── premium-plus.ts    # Premium Plus (0.1 USDC)
│   └── enterprise.ts      # Enterprise (1.0 USDC)
├── middleware/
│   ├── logging.ts         # Professional request/response logging
│   └── security.ts        # Security headers & validation
├── utils/
│   └── payment-parser.ts  # X402 payment header parsing
└── config/
    ├── wallet.ts          # Dynamic wallet loading
    └── x402.ts            # X402 payment configuration
```

## 🔧 **How to Add Your Own Command**

### **1. Create a New Command File**
Create `src/client/commands/my-command.ts`:

```typescript
import type { CLICommand, CommandContext } from '../types/commands';

export const myCommand: CLICommand = {
  name: 'my-command',
  aliases: ['mc'],
  description: 'My custom command description',
  usage: 'my-command [arguments]',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    console.log('🎉 My custom command executed!');
    console.log('Arguments:', args);
    console.log('Wallet address:', context.walletManager.getAddress());
    
    // Add your custom logic here
    // You can access:
    // - context.walletManager for wallet operations
    // - context.logger for structured logging
    // - args for command arguments
  }
};
```

### **2. Register the Command**
Add your command to `src/client/core/commands.ts`:

```typescript
// Import your command
import { myCommand } from '../commands/my-command';

// Add to the commands array
const commands: CLICommand[] = [
  balanceCommand,
  fundCommand,
  infoCommand,
  freeCommand,
  x402Command,
  myCommand,  // <-- Add your command here
  helpCommand
];
```

### **3. Test Your Command**
```bash
npm run dev:client
cdp-wallet> my-command test args
🎉 My custom command executed!
Arguments: ['test', 'args']
Wallet address: 0xA35d0FD4a75b50F2Bc71c50a922C8215b9bBE308
```

## 💳 **How to Add Your Own X402 Route**

### **1. Create a Route Module**
Create `src/server/routes/my-premium.ts`:

```typescript
import type { Request, Response } from 'express';
import type { RouteDefinition } from './health';

/**
 * Generate your custom premium content
 */
function generateMyPremiumContent() {
  return {
    customFeature: {
      data: 'Your premium data here',
      timestamp: new Date().toISOString(),
      value: Math.random() * 100
    },
    exclusiveContent: {
      message: 'This required payment to access!',
      contentId: `my-premium-${Date.now()}`,
      features: [
        '🎯 Custom feature 1',
        '⚡ Custom feature 2', 
        '🚀 Custom feature 3'
      ]
    }
  };
}

/**
 * Route handler for your premium content
 */
function myPremiumHandler(req: Request, res: Response): void {
  try {
    const premiumData = generateMyPremiumContent();
    
    res.json({
      paymentVerified: true,
      message: '🎉 MY PREMIUM CONTENT - Payment Verified!',
      data: {
        payment: {
          amount: '0.05 USDC',  // Your custom price
          type: 'MY_CUSTOM_PAYMENT'
        },
        content: premiumData,
        developer: {
          note: 'This content required 0.05 USDC payment',
          cost: '0.05 USDC per request'
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error in my-premium endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Route definition - Easy to customize!
 */
export const myPremiumRoute: RouteDefinition = {
  path: '/my-premium',
  method: 'get',
  handler: myPremiumHandler,
  requiresPayment: true,
  price: '0.05 USDC',        // Your custom price
  network: 'base-sepolia',
  description: 'My custom premium content (0.05 USDC)'
};
```

### **2. Register Your Route**
Add to `src/server/routes/index.ts`:

```typescript
// Import your route
import { myPremiumRoute } from './my-premium';

// Add to the routes array - X402 middleware auto-configures from this!
export const allRoutes: RouteDefinition[] = [
  healthRoute,
  freeRoute,
  protectedRoute,
  premiumPlusRoute,
  enterpriseRoute,
  myPremiumRoute  // <-- Add here, no additional middleware needed!
];
```

**🎯 That's it!** The central X402 middleware automatically:
- Reads your route definition  
- Configures payment requirements
- Handles payment verification
- Your route handler just returns content

### **3. Create a Client Command (Optional)**
Create `src/client/commands/x402/my-tier.ts`:

```typescript
import type { CLICommand, CommandContext } from '../../types/commands';
import { makeX402Request, formatPaymentResponse } from './index';

export const myTierCommand: CLICommand = {
  name: 'my-tier',
  description: 'Test my custom premium content (0.05 USDC)',
  usage: 'my-tier',
  
  async execute(args: string[], context: CommandContext): Promise<void> {
    console.log('My Custom Premium Test');
    console.log('Testing my premium endpoint');
    console.log('=======================');
    
    try {
      const response = await makeX402Request('/my-premium', context);
      formatPaymentResponse(response, context);
    } catch (error: any) {
      console.error('❌ Payment failed:', error.message);
    }
  }
};
```

### **4. Test Your Custom Route**
```bash
# Start server (automatically picks up new route)
npm run dev:server

# In client
cdp-wallet> my-tier

My Custom Premium Test
Testing my premium endpoint  
=======================
[PAYMENT_REQUIRED] Client: requesting content | Amount: 0.05 USDC
[PAYMENT_VERIFIED] 0.05 USDC 0xA35d...E308 → server
🎉 MY PREMIUM CONTENT - Payment Verified!
```

## 📋 **Project Dependencies**

### **Core Dependencies**
```json
{
  "@coinbase/cdp-sdk": "^1.12.0",
  "@coinbase/x402": "^0.3.8",
  "express": "^4.18.0", 
  "x402-express": "^0.3.4",
  "x402-axios": "^0.3.3",
  "winston": "^3.0.0",
  "axios": "^1.6.0",
  "dotenv": "^16.3.0",
  "viem": "^2.30.6"
}
```

### **Available Scripts**
```bash
npm run setup          # One-time wallet setup
npm run dev:server     # Start X402 payment server
npm run dev:client     # Start interactive CLI
npm run lint           # TypeScript & ESLint validation  
npm run clean          # Remove generated files
```

## ⚙️ **Environment Setup**

### **Prerequisites**
- **Node.js 23+**
- **CDP Account**: [Coinbase Developer Platform](https://www.coinbase.com/cloud)

### **Environment Variables** 
Create `.env` file:
```bash
# Required: CDP API Credentials
CDP_API_KEY_ID=your_api_key_id_here
CDP_API_KEY_SECRET=your_private_key_here
CDP_WALLET_SECRET=your_wallet_secret_here

# Optional: Server Configuration
PORT=3000
LOG_LEVEL=info
```

## 🎯 **What Makes This Special**

### **✅ Production-Ready Architecture**
- **Modular design** - Easy to extend with new commands and routes
- **TypeScript throughout** - Full type safety and excellent DX
- **Professional logging** - Structured, configurable output
- **Error handling** - Graceful failures with clear messaging
- **Security first** - Proper headers, input validation, no credential logging

### **✅ Educational Value**
- **Three payment tiers** - See how pricing affects content quality
- **Complete payment flow** - From discovery to verification to delivery
- **Real transaction logs** - Understand X402 protocol in action
- **Modular examples** - Easy templates for adding your own features

### **✅ Developer Experience**  
- **8-line entry point** - Clean, minimal startup
- **Auto-discovery** - Routes and commands register automatically
- **Live reloading** - Changes reflected immediately
- **Comprehensive help** - Built-in documentation for all commands
- **Smart caching** - Optimized balance management and API calls

## 🚀 **Next Steps**

1. **Follow the Quick Start** to get running in minutes
2. **Try all three payment tiers** to see content quality differences  
3. **Add your own command** using the template above
4. **Create a custom X402 route** with your own pricing
5. **Study the logs** to understand X402 payment flows
6. **Experiment with pricing** - see how cost affects user behavior

## 💡 **Use Cases**

- **Learning X402** - Understanding micropayments in practice
- **API Monetization** - Adding payments to existing APIs
- **Content Gating** - Different content tiers based on payment
- **Developer Tools** - Building X402-enabled applications
- **Research** - Studying micropayment user behavior

---

**Built with ❤️ for the X402 developer community**

*Perfect for hackathons, learning, and building the future of micropayments*

