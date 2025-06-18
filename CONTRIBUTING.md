# Contributing to X402-CDP Integration

This is a Proof of Concept (POC) implementation of the X402 payment protocol with CDP wallet integration. This guide will help you understand the codebase and make changes effectively.

## 🚀 Quick Start

1. **Setup Environment**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd x402-cdp-integration

   # Install dependencies
   npm install

   # Copy environment file
   cp .env.example .env
   ```

2. **Configure Environment**
   Add your CDP API credentials to `.env`:
   ```env
   CDP_API_KEY_ID=your_api_key_id
   CDP_API_KEY_SECRET=your_api_key_secret
   CDP_WALLET_SECRET=your_wallet_secret
   ```

3. **Initialize Wallets**
   ```bash
   npm run setup
   ```
   This will create both client and server wallets automatically.

4. **Start Development**
   ```bash
   # Terminal 1: Start the payment server
   npm run dev:server

   # Terminal 2: Start the interactive CLI
   npm run dev:client
   ```

## 📁 Project Structure

```
src/
├── client/           # CLI client implementation
│   ├── commands/     # CLI commands
│   ├── core/         # Core CLI functionality
│   └── types/        # TypeScript types
├── server/           # Express server implementation
│   ├── routes/       # API endpoints
│   ├── middleware/   # Express middleware
│   └── config/       # Server configuration
└── shared/           # Shared utilities
    ├── config.ts     # Centralized configuration
    ├── errors.ts     # Error handling
    └── utils/        # Shared utilities
```

## 🔧 Key Components

### 1. X402 Payment System
- Located in `src/server/routes/`
- Three tiers: Basic (0.01 USDC), Premium (0.1 USDC), Enterprise (1.0 USDC)
- Each tier has its own route and content generation

### 2. CDP Wallet Integration
- Located in `src/client/core/wallet.ts`
- Handles wallet creation, balance checking, and funding
- Uses CDP SDK for wallet operations

### 3. CLI Interface
- Located in `src/client/core/cli.ts`
- Interactive command-line interface
- Supports all X402 payment tiers

## 💡 Adding New Features

### Adding a New Command
1. Create a new file in `src/client/commands/`
2. Implement the command interface:
   ```typescript
   import type { CLICommand } from '../types/commands';

   export const myCommand: CLICommand = {
     name: 'my-command',
     description: 'My custom command',
     async execute(args: string[], context: CommandContext) {
       // Command implementation
     }
   };
   ```
3. Register the command in `src/client/core/commands.ts`

### Adding a New X402 Route
1. Create a new file in `src/server/routes/`
2. Implement the route handler:
   ```typescript
   import type { RouteDefinition } from './health';

   export const myRoute: RouteDefinition = {
     path: '/my-route',
     method: 'get',
     handler: myHandler,
     requiresPayment: true,
     price: '0.05 USDC'
   };
   ```
3. Add the route to X402 middleware in `src/server/config/x402.ts`

## 🐛 Debugging

### Common Issues
1. **Payment Failures**
   - Check USDC balance: `balance` command
   - Verify wallet connection: `info` command
   - Check server logs for payment errors

2. **Wallet Issues**
   - Run `npm run setup` to recreate wallets
   - Check `.env` configuration
   - Verify CDP API credentials

3. **Server Connection**
   - Ensure server is running: `npm run dev:server`
   - Check port availability
   - Verify network connectivity

### Logging
- Server logs show payment processing and errors
- Client logs show wallet operations and command execution
- Use `-v` flag for verbose logging: `npm run dev:client -- -v`

## 📝 Code Style

- Use TypeScript for type safety
- Follow existing code structure
- Add JSDoc comments for functions
- Keep functions small and focused
- Use the centralized error handling
- Use the configuration system for settings

## 🔐 Security Notes

- Never commit `.env` file
- Keep CDP credentials secure
- Use environment variables for sensitive data
- Validate all user input
- Handle errors gracefully

## 🎯 Best Practices

1. **Error Handling**
   ```typescript
   import { createError } from '../shared/errors';

   try {
     // Your code
   } catch (error) {
     throw createError('PAYMENT', 'PAYMENT_FAILED', { details: error });
   }
   ```

2. **Configuration**
   ```typescript
   import { config } from '../shared/config';

   const { price, endpoint } = config.x402.tiers.basic;
   ```

3. **Logging**
   ```typescript
   import { logger } from '../shared/utils/logger';

   logger.info('Operation started', { details });
   logger.error('Operation failed', { error });
   ```

## 📚 Additional Resources

- [X402 Protocol Documentation](https://x402.org/docs)
- [CDP SDK Documentation](https://docs.coinbase.com/cdp)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) 