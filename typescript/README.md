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
    // Access context.walletManager, context.logger, args
  }
};
```

### 2. Register the Command
Add to `src/client/core/commands.ts`:

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
          amount: '0.05 USDC',
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
  price: '0.05 USDC',
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

## 🧪 Testing

### Test Your Route
```bash
# Start server
npm run dev:server

# Test with curl
curl http://localhost:5002/my-premium
```

### Test with Client
```bash
# Start client
npm run dev:client

# Add your command to test the route
cdp-wallet> my-command
```

## 🔧 Key Features

- **Express.js Integration**: Fast, unopinionated web framework
- **X402 Middleware**: Automatic payment handling
- **TypeScript Types**: Comprehensive type safety
- **Configuration Management**: Centralized config from root config.yaml
- **Error Handling**: Specific error types and fallback mechanisms
- **AI Service Integration**: Real-time market data and AI analysis
- **Health Checks**: Detailed health monitoring

## 📊 Health Monitoring

```bash
# Basic health check
curl http://localhost:5002/health

# Detailed health check
curl http://localhost:5002/health/detailed
```

## 🔍 Troubleshooting

### Common Issues
1. **TypeScript errors**: Ensure all types are properly defined
2. **Port conflicts**: Check if port 5002 is available
3. **Config issues**: Verify config.yaml exists and is valid
4. **AI service**: Ensure AI server is running on port 8001

### Debug Mode
```bash
# Set debug logging
export LOG_LEVEL=DEBUG
npm run dev:server
```

### Development
```bash
# Type check
npm run type-check

# Lint code
npm run lint

# Build
npm run build
``` 