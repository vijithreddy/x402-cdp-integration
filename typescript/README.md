# TypeScript Implementation

This directory contains the TypeScript implementation of the X402-CDP integration.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup wallet
npm run setup

# Start server
npm run dev:server

# Start client
npm run dev:client
```

## 📁 Structure

```
typescript/
├── src/
│   ├── client/
│   │   ├── commands/          # CLI commands
│   │   │   ├── x402/         # X402 payment commands
│   │   │   └── types/        # TypeScript types
│   │   ├── core/             # Core CLI functionality
│   │   └── utils/            # Utility functions
│   ├── server/
│   │   ├── routes/           # Express routes
│   │   ├── middleware/       # Express middleware
│   │   └── utils/            # Server utilities
│   └── shared/               # Shared utilities
├── package.json
└── README.md
```

## 🔧 How to Add Your Own Command

### 1. Create a New Command File
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

### 2. Register the Command
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

### 3. Test Your Command
```bash
npm run dev:client
cdp-wallet> my-command test args
🎉 My custom command executed!
Arguments: ['test', 'args']
Wallet address: 0xA35d0FD4a75b50F2Bc71c50a922C8215b9bBE308
```

## 💳 How to Add Your Own X402 Route

### 1. Create a Route Module
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

### 2. Register Your Route
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

### 3. Create a Client Command (Optional)
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

### 4. Test Your Custom Route
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

## 📋 Available Commands

- `balance` - Check USDC balance
- `fund [amount]` - Fund wallet with USDC
- `info` - Show wallet information
- `free` - Access free content
- `tier1` - Premium content (0.01 USDC)
- `tier2` - Premium+ content (0.1 USDC)
- `tier3` - Enterprise content (1.0 USDC)
- `help` - Show help

## 🔧 Development

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npx tsc --noEmit
``` 