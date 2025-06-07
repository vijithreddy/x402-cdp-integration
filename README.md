# X402 Payment System - Interactive Developer Testbed

A professional X402 micropayment system with interactive CLI for testing and development. Features structured logging, real-time payment flows, and comprehensive developer tooling.

## 🚀 **Quick Start**

```bash
# 1. Clone and install
git clone git@github.com:vijithreddy/x402-cdp-integration.git
cd x402-cdp-integration
npm install

# 2. Setup environment (.env file)
cp .env.example .env
# Add your CDP credentials to .env

# 3. One-command setup
npm run setup

# 4. Start testing
npm run dev:server  # Terminal 1
npm run dev:client  # Terminal 2
```

## 📋 **Dependencies**

### Required Dependencies
```json
{
  "@coinbase/cdp-sdk": "^1.12.0",
  "@coinbase/x402": "^0.3.8", 
  "express": "^4.18.0",
  "viem": "^2.30.6",
  "x402-express": "^0.3.4",
  "x402-axios": "^0.3.3",
  "winston": "^3.0.0",
  "axios": "^1.6.0",
  "dotenv": "^16.3.0"
}
```

### Development Dependencies
```json
{
  "@types/express": "^4.17.17",
  "@types/node": "^20.0.0",
  "typescript": "^5.0.0",
  "ts-node": "^10.9.0"
}
```

## 🎮 **Interactive CLI Usage**

### Start the Client
```bash
# Standard mode
npm run dev:client

# Verbose debugging 
npm run dev:client -- --verbose

# Quiet mode (minimal output)
npm run dev:client -- --quiet

# JSON output (for tooling)
npm run dev:client -- --json
```

### Available Commands
Once in the CLI, use these commands:

| Command | Description | Example Output |
|---------|-------------|----------------|
| `test` / `x402` | Test X402 payment flow (0.01 USDC) | Premium content with AI analysis, market data, exclusive features |
| `free` | Test free endpoint for comparison | Limited free tier content to contrast with premium |
| `balance` / `bal` | Check USDC balance | Current balance with caching status |
| `fund [amount]` | Add USDC from faucet | Funding status and new balance |
| `info` / `status` | Show wallet information | Address, balance, session status |
| `refresh` / `reload` | Force refresh from blockchain | Updated balance without cache |
| `help` / `h` | Show all commands | Complete command reference |
| `clear` / `cls` | Clear screen | - |
| `exit` / `quit` / `q` | Exit CLI | Graceful session cleanup |

## 📊 **Logging Output**

### Standard Mode
```
X402 Payment Test
Testing protected endpoint access
=================================
Balance: 2.89 USDC → Sufficient for 0.01 USDC payment ✓
Wallet: 0xA35d0FD4a75b50F2Bc71c50a922C8215b9bBE308

[11:03:34] [PAYMENT_REQUEST] Client: 0xA35d...E308
[11:03:39] [PAYMENT_COMPLETE] 0.01 USDC 0xA35d...E308 → Server (4.4s)

Result: ✅ Payment successful
Transaction: 0x78b289e46a5e04df9da40daf7329915d3c66fcd5e97b539dcb8100985822b963
Updated Balance: 2.88 USDC (-0.01)
──────────────────────────────────────────────────
```

### Verbose Mode (`--verbose`)
```
[DEBUG] Viem account ready
{
  "address": "0xA35d0FD4a75b50F2Bc71c50a922C8215b9bBE308",
  "hasSignTypedData": true
}
[DEBUG] CDP Adapter: Signing EIP-712 typed data for X402...
[DEBUG] Response data: { "success": true, "message": "Payment successful!" }
```

### Server Logging

**Free Content Request:**
```
[REQUEST] GET /free | Type: FREE content request | Client: public
[FREE_CONTENT_ACCESSED] Endpoint: /free | Cost: FREE | Tier: PUBLIC
Free tier request - no payment required
```

**Premium Content Request:**
```
X402 Payment Server - Base Sepolia
Listening: http://localhost:3000
==================================
Server Wallet: 0x9c5F...cA36 | Client Wallet: 0xA35d...E308
──────────────────────────────────────────────────

[REQUEST] GET /protected | Type: PROTECTED content request | Client: Processing...
[PAYMENT_REQUIRED] Client: 0xA35d...E308 | Amount: 0.01 USDC
[PAYMENT_VERIFIED] 0.01 USDC 0xA35d...E308 → 0x9c5F...cA36
[CONTENT_DELIVERED] Client: 0xA35d...E308 | Status: Success
```

## ⚙️ **Environment Setup**

### Prerequisites
- **Node.js**: Version 23+
- **CDP Account**: [Coinbase Developer Platform](https://www.coinbase.com/cloud)

### Environment Variables
Copy the example file and add your CDP credentials:
```bash
cp .env-example .env
# Edit .env file with your CDP credentials:
# CDP_API_KEY_ID=your_api_key_id_here
# CDP_API_KEY_SECRET=your_private_key_content_here  
# CDP_WALLET_SECRET=your_wallet_secret_here
```

## 🏗️ **System Architecture**

### Payment Flow
```
Client CLI → X402 Request → 402 Response → EIP-712 Signing → Payment Verification → Content Access
```

### Logging Levels
- **UI**: Clean user interface messages
- **FLOW**: Payment process steps with timestamps
- **DEBUG**: Technical details (verbose mode only)
- **ERROR**: Failures with context
- **TRANSACTION**: Payment-specific logging with amounts and hashes

### Key Features
- **Interactive CLI**: Real-time command interface
- **Professional Logging**: Structured, configurable output
- **Smart Caching**: Optimized balance management
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error recovery
- **Payment Tracking**: Transaction hashes and timing

## 🔧 **Development Workflow**

1. **Setup**: `npm run setup` (one-time wallet creation)
2. **Server**: `npm run dev:server` (payment endpoints)
3. **Client**: `npm run dev:client` (interactive testing)
4. **Compare**: Use `free` command first to see free tier limitations
5. **Test**: Use `test` command to experience premium content with payment
6. **Monitor**: Watch structured logs comparing free vs paid requests
7. **Debug**: Use `--verbose` flag for detailed output

### Content Comparison
- **Free Tier** (`/free`): Basic data, 15-min delays, limited features
- **Premium Tier** (`/protected`): Real-time AI analysis, market predictions, exclusive insights

## 💳 **Payment Details**

- **Cost**: 0.01 USDC per protected request
- **Network**: Base Sepolia (testnet)
- **Method**: EIP-712 signed authorization
- **Facilitator**: Official Coinbase X402 facilitator

## 🎯 **Premium Content Features**

When you pay for `/protected` endpoint access, you receive:

### 🤖 **AI Analysis**
- Sentiment analysis with confidence scores
- Market trend keywords and insights
- Advanced AI analysis of payment trends

### 📊 **Real-time Market Data** 
- Live price predictions with accuracy metrics
- Trading signals (bullish_momentum, volume_surge)
- 5-point price history with volume data

### ⭐ **Exclusive Content**
- Unique report IDs and access tiers (GOLD_TIER)
- Real-time analytics with AI insights
- Remaining API credits and usage tracking

### 💎 **Premium Features You Get**
- 📊 Real-time market analysis (30-second updates)
- 🤖 AI predictions with 87%+ accuracy  
- 📈 Exclusive trading signals
- 🔮 Predictive models (10M+ data points)
- ⚡ Sub-millisecond API response times

Compare this with the free tier's 15-minute delays and basic features!

## 🛠️ **Troubleshooting**

### Common Issues
| Issue | Solution |
|-------|----------|
| Missing environment variables | Check `.env` file has all CDP credentials |
| X402 payment failed | Ensure balance > 0.01 USDC, use `fund` command |
| Server not responding | Verify `npm run dev:server` is running |
| Balance not updating | Use `refresh` command to clear cache |

### Available Scripts
```bash
# Core commands
npm run setup              # One-time wallet setup
npm run dev:server         # Start X402 payment server  
npm run dev:client         # Interactive CLI client
npm run lint              # Check code quality & JSDoc
npm run lint:fix          # Auto-fix linting issues

# Testing endpoints
curl http://localhost:3000/health     # Server health check (free)
curl http://localhost:3000/free       # Free tier content (no payment)
curl http://localhost:3000/protected  # Premium content (requires payment)
```

### Debug Commands
```bash
# Verbose client logging
npm run dev:client -- --verbose

# Fund wallet if balance low
# In CLI: fund 5

# Compare free vs premium content
# In CLI: free    (see free tier limitations)
# In CLI: test    (pay for premium features)
```

This testbed provides a complete X402 payment system with **professional logging**, **rich premium content**, and **free vs paid comparison** - perfect for developers testing micropayment integrations and understanding the value proposition of paid APIs.

